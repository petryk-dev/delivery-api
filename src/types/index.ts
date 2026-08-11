import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

export { Role, OrderStatus, PaymentStatus };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
