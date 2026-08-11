import bcrypt from 'bcryptjs';
import createError from 'http-errors';
import { prisma } from '../config/database';
import { generateTokenPair, verifyRefreshToken, hashToken, generateRawToken } from '../utils/token';
import { TokenPair } from '../types';
import { RegisterDto, LoginDto } from '../validators/auth.validator';
import { emailQueue } from '../jobs/queues';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function register(dto: RegisterDto): Promise<TokenPair> {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw createError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const verificationToken = generateRawToken();

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
      verificationTokenHash: hashToken(verificationToken),
      verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const tokens = generateTokenPair(user.id, user.role);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashToken(tokens.refreshToken) },
  });

  await emailQueue.add('welcome', { userId: user.id, email: user.email, name: user.name });
  await emailQueue.add('verification', {
    email: user.email,
    name: user.name,
    token: verificationToken,
  });

  return tokens;
}

export async function login(dto: LoginDto): Promise<TokenPair> {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw createError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw createError(401, 'Invalid credentials');

  const tokens = generateTokenPair(user.id, user.role);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashToken(tokens.refreshToken) },
  });

  return tokens;
}

export async function logout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}

export async function refreshTokens(token: string): Promise<TokenPair> {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw createError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) {
    // Presented token doesn't match the one on file — either it's stale or it's been
    // stolen and already rotated. Either way, kill the stored session so a leaked
    // token can't be replayed again.
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
    }
    throw createError(401, 'Invalid or reused refresh token');
  }

  const tokens = generateTokenPair(user.id, user.role);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashToken(tokens.refreshToken) },
  });

  return tokens;
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { verificationTokenHash: hashToken(token) },
  });

  if (!user || !user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
    throw createError(400, 'Invalid or expired verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    },
  });
}
