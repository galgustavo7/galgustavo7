import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Solicitud inválida', details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'No autenticado', code = 'NO_AUTENTICADO') {
    return new AppError(message, 401, code);
  }
  static forbidden(message = 'No tienes permisos para esta acción', code = 'SIN_PERMISOS') {
    return new AppError(message, 403, code);
  }
  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404, 'NO_ENCONTRADO');
  }
  static conflict(message = 'Conflicto de datos', code = 'CONFLICTO') {
    return new AppError(message, 409, code);
  }
}

/** Envuelve controladores async para que los errores lleguen al middleware de errores. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
