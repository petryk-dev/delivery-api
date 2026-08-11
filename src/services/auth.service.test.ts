import bcrypt from 'bcryptjs';
import { RegisterDto } from '../validators/auth.validator';
import { generateTokenPair, hashToken } from '../utils/token';

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('../jobs/queues', () => ({
  emailQueue: { add: jest.fn() },
  orderStatusQueue: { add: jest.fn() },
}));

import { prisma } from '../config/database';
import * as authService from './auth.service';

const mockUser = prisma.user as unknown as {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

const registerDto: RegisterDto = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Password1',
  role: 'CUSTOMER',
};

describe('auth.service', () => {
  describe('register', () => {
    it('creates the user with a bcrypt password hash, not the raw password', async () => {
      mockUser.findUnique.mockResolvedValueOnce(null);
      mockUser.create.mockResolvedValueOnce({ id: 'u1', email: registerDto.email, role: 'CUSTOMER', name: registerDto.name });
      mockUser.update.mockResolvedValue({});

      await authService.register(registerDto);

      const createArgs = mockUser.create.mock.calls[0][0];
      expect(createArgs.data.passwordHash).not.toBe(registerDto.password);
      expect(await bcrypt.compare(registerDto.password, createArgs.data.passwordHash)).toBe(true);
    });

    it('rejects registration with an email already in use', async () => {
      mockUser.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(authService.register(registerDto)).rejects.toMatchObject({ status: 409 });
      expect(mockUser.create).not.toHaveBeenCalled();
    });

    it('stores only a hash of the refresh token, never the raw value', async () => {
      mockUser.findUnique.mockResolvedValueOnce(null);
      mockUser.create.mockResolvedValueOnce({ id: 'u2', email: registerDto.email, role: 'CUSTOMER', name: registerDto.name });
      mockUser.update.mockResolvedValue({});

      const tokens = await authService.register(registerDto);

      const sessionUpdate = mockUser.update.mock.calls.find((c) => 'refreshTokenHash' in c[0].data);
      expect(sessionUpdate?.[0].data.refreshTokenHash).toBe(hashToken(tokens.refreshToken));
      expect(sessionUpdate?.[0].data.refreshTokenHash).not.toBe(tokens.refreshToken);
    });

    it('stores a hashed, time-limited email verification token', async () => {
      mockUser.findUnique.mockResolvedValueOnce(null);
      mockUser.create.mockResolvedValueOnce({ id: 'u3', email: registerDto.email, role: 'CUSTOMER', name: registerDto.name });
      mockUser.update.mockResolvedValue({});

      await authService.register(registerDto);

      const createArgs = mockUser.create.mock.calls[0][0];
      expect(createArgs.data.verificationTokenHash).toEqual(expect.any(String));
      expect(createArgs.data.verificationTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('login', () => {
    it('returns a token pair for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Password1', 12);
      mockUser.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@example.com', role: 'CUSTOMER', passwordHash });
      mockUser.update.mockResolvedValueOnce({});

      const tokens = await authService.login({ email: 'a@example.com', password: 'Password1' });

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
    });

    it('rejects an unknown email with 401', async () => {
      mockUser.findUnique.mockResolvedValueOnce(null);

      await expect(authService.login({ email: 'nobody@example.com', password: 'Password1' })).rejects.toMatchObject({
        status: 401,
      });
    });

    it('rejects an incorrect password with 401', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword1', 12);
      mockUser.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@example.com', role: 'CUSTOMER', passwordHash });

      await expect(authService.login({ email: 'a@example.com', password: 'WrongPassword1' })).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe('refreshTokens', () => {
    it('rotates the token pair and persists a hash of the new refresh token', async () => {
      const issued = generateTokenPair('u1', 'CUSTOMER');
      mockUser.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'CUSTOMER', refreshTokenHash: hashToken(issued.refreshToken) });
      mockUser.update.mockResolvedValueOnce({});

      const rotated = await authService.refreshTokens(issued.refreshToken);

      expect(rotated.accessToken).toEqual(expect.any(String));
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { refreshTokenHash: hashToken(rotated.refreshToken) },
      });
    });

    it('rejects and revokes the session when the token does not match the stored hash', async () => {
      const issued = generateTokenPair('u1', 'CUSTOMER');
      mockUser.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'CUSTOMER', refreshTokenHash: hashToken('a-different-token') });
      mockUser.update.mockResolvedValueOnce({});

      await expect(authService.refreshTokens(issued.refreshToken)).rejects.toMatchObject({ status: 401 });
      expect(mockUser.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { refreshTokenHash: null } });
    });

    it('rejects a structurally invalid token before touching the database', async () => {
      await expect(authService.refreshTokens('not-a-real-jwt')).rejects.toMatchObject({ status: 401 });
      expect(mockUser.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('marks the user verified and clears the token when it matches and has not expired', async () => {
      mockUser.findUnique.mockResolvedValueOnce({ id: 'u1', verificationTokenExpiresAt: new Date(Date.now() + 60_000) });
      mockUser.update.mockResolvedValueOnce({});

      await authService.verifyEmail('raw-token');

      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isVerified: true, verificationTokenHash: null, verificationTokenExpiresAt: null },
      });
    });

    it('rejects an unknown or already-consumed token with 400', async () => {
      mockUser.findUnique.mockResolvedValueOnce(null);

      await expect(authService.verifyEmail('bad-token')).rejects.toMatchObject({ status: 400 });
    });

    it('rejects an expired token with 400', async () => {
      mockUser.findUnique.mockResolvedValueOnce({ id: 'u1', verificationTokenExpiresAt: new Date(Date.now() - 1000) });

      await expect(authService.verifyEmail('expired-token')).rejects.toMatchObject({ status: 400 });
    });
  });
});
