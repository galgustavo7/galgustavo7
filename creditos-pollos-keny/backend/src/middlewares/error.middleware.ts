import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404, 'RUTA_NO_ENCONTRADA'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let codigo = 'ERROR_INTERNO';
  let mensaje = 'Ocurrió un error inesperado';
  let detalles: unknown;

  if (err instanceof AppError) {
    status = err.statusCode;
    codigo = err.code;
    mensaje = err.message;
    detalles = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    codigo = 'VALIDACION';
    mensaje = 'Datos inválidos';
    detalles = err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
  } else if (err instanceof Error) {
    mensaje = err.message;
    // Errores de restricciones SQL
    if (/UNIQUE|Duplicate entry|constraint/i.test(err.message)) {
      status = 409;
      codigo = 'DUPLICADO';
      mensaje = 'El registro ya existe (correo, cédula o número duplicado)';
    }
  }

  if (status >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}]`, err);
  } else if (process.env.NODE_ENV !== 'test') {
    logger.warn(`[${req.method} ${req.originalUrl}] ${codigo}: ${mensaje}`);
  }

  res.status(status).json({
    ok: false,
    error: { codigo, mensaje, detalles },
  });
}

/** Limitador de peticiones en memoria (login, registro, recuperación). */
const intentos = new Map<string, { conteo: number; reinicia: number }>();

export function rateLimit(limite = 10, ventanaMs = 15 * 60 * 1000) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clave = `${req.ip ?? 'desconocida'}:${req.path}`;
    const ahora = Date.now();
    const actual = intentos.get(clave);

    if (!actual || actual.reinicia < ahora) {
      intentos.set(clave, { conteo: 1, reinicia: ahora + ventanaMs });
      return next();
    }

    if (actual.conteo >= limite) {
      const minutos = Math.ceil((actual.reinicia - ahora) / 60000);
      return next(
        AppError.badRequest(`Demasiados intentos. Vuelve a intentarlo en ${minutos} minuto(s).`)
      );
    }

    actual.conteo += 1;
    next();
  };
}
