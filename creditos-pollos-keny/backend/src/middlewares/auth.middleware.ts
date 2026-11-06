import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { db } from '../db';
import { toBool, type JwtPayload, type Rol } from '../types';

function extraerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const queryToken = req.query?.token;
  if (typeof queryToken === 'string') return queryToken;
  return null;
}

/** Autenticación obligatoria. */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = extraerToken(req);
  if (!token) return next(AppError.unauthorized('Token no proporcionado', 'TOKEN_REQUERIDO'));

  try {
    req.usuario = jwt.verify(token, env.jwt.secret) as JwtPayload;
    next();
  } catch (error) {
    const expirado = (error as Error).name === 'TokenExpiredError';
    next(
      AppError.unauthorized(
        expirado ? 'Tu sesión expiró' : 'Token inválido',
        expirado ? 'TOKEN_EXPIRADO' : 'TOKEN_INVALIDO'
      )
    );
  }
}

/** Autenticación opcional (no falla si no hay token). */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extraerToken(req);
  if (!token) return next();
  try {
    req.usuario = jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch {
    req.usuario = undefined;
  }
  next();
}

export const requireRole =
  (...roles: Rol[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) return next(AppError.unauthorized());
    if (!roles.includes(req.usuario.rol)) {
      return next(AppError.forbidden('No tienes permisos para realizar esta acción'));
    }
    next();
  };

export const soloAdmin = [authMiddleware, requireRole('SUPER_ADMIN', 'ADMIN')];
export const soloSuperAdmin = [authMiddleware, requireRole('SUPER_ADMIN')];

/** Exige correo verificado (solo aplica a emprendedores). */
export function requiereEmailVerificado(req: Request, _res: Response, next: NextFunction): void {
  if (!req.usuario) return next(AppError.unauthorized());
  if (req.usuario.rol !== 'EMPRENDEDOR') return next();

  db.get<{ email_verificado: number }>('SELECT email_verificado FROM usuarios WHERE id = ?', [
    req.usuario.userId,
  ])
    .then((usuario) => {
      if (!usuario) return next(AppError.notFound('Usuario no encontrado'));
      if (!toBool(usuario.email_verificado)) {
        return next(
          AppError.forbidden('Debes verificar tu correo antes de continuar', 'EMAIL_NO_VERIFICADO')
        );
      }
      next();
    })
    .catch(next);
}
