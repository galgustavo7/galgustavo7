import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../lib/errors';

type Fuente = 'body' | 'query' | 'params';

/** Valida la entrada con Zod y sustituye req[fuente] por el valor parseado. */
export function validate(schema: ZodSchema, fuente: Fuente = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[fuente]);

    if (!result.success) {
      const detalles = result.error.issues.map((issue) => ({
        campo: issue.path.join('.') || 'general',
        mensaje: issue.message,
      }));
      return next(AppError.badRequest('Datos inválidos', detalles));
    }

    (req as unknown as Record<string, unknown>)[fuente] = result.data;
    next();
  };
}
