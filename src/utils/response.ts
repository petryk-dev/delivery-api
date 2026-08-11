import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export type { PaginatedResponse };

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): void {
  const body: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created'): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendPaginated<T>(
  res: Response,
  result: PaginatedResponse<T>,
  message = 'Success',
): void {
  const body: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: result,
    message,
  };
  res.status(200).json(body);
}

export function buildPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
