import crypto from 'node:crypto';
import { db } from '../db';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { addDays, toDateTimeString } from '../lib/dates';
import { EmailTemplates } from './email.templates';
import { enviarEmail } from './email.service';
import { toBool, type UsuarioRow } from '../types';
import { hashToken } from './auth.service';

const HORAS_VALIDEZ = 24;

export const EmailVerificationService = {
  /** Crea el token, lo guarda (hash) y envía el correo de verificación. */
  async enviarVerificacion(
    usuarioId: string,
    email: string,
    nombre: string,
    tipo: 'REGISTRO' | 'REENVIADO' = 'REGISTRO'
  ) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiraEn = addDays(new Date(), HORAS_VALIDEZ / 24);

    await db.run(
      `UPDATE usuarios SET token_verificacion = ?, token_verificacion_expira = ? WHERE id = ?`,
      [hashToken(token), toDateTimeString(expiraEn), usuarioId]
    );

    await db.run(
      `INSERT INTO email_verifications (id, usuario_id, token_hash, tipo, expira_en)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), usuarioId, hashToken(token), tipo, toDateTimeString(expiraEn)]
    );

    const link = `${env.urls.front}/verificar-email?token=${token}&id=${usuarioId}`;

    await enviarEmail({
      to: email,
      subject: '🐔 Confirma tu correo — Pollos Keny',
      html: EmailTemplates.verificacionEmail(nombre, link, HORAS_VALIDEZ),
      tipo: 'VERIFICACION',
    });

    return { enviado: true, expiraEn: toDateTimeString(expiraEn) };
  },

  async verificar(token: string, usuarioId: string) {
    if (!token || !usuarioId) throw AppError.badRequest('Token e identificador son obligatorios');

    const usuario = await db.get<UsuarioRow>(
      `SELECT id, nombre, email, rol, token_verificacion, token_verificacion_expira, email_verificado
       FROM usuarios WHERE id = ?`,
      [usuarioId]
    );
    if (!usuario) throw AppError.notFound('Usuario no encontrado');

    if (toBool(usuario.email_verificado)) {
      return { verificado: true, mensaje: 'Tu correo ya estaba verificado' };
    }

    if (!usuario.token_verificacion || !usuario.token_verificacion_expira) {
      throw AppError.badRequest('No hay una solicitud de verificación activa', 'SIN_TOKEN');
    }

    const expira = new Date(usuario.token_verificacion_expira.replace(' ', 'T') + 'Z').getTime();
    if (expira < Date.now()) {
      throw AppError.badRequest('El enlace expiró, solicita uno nuevo', 'TOKEN_EXPIRADO');
    }

    if (usuario.token_verificacion !== hashToken(token)) {
      throw AppError.badRequest('El enlace de verificación no es válido', 'TOKEN_INVALIDO');
    }

    await db.transaction(async () => {
      await db.run(
        `UPDATE usuarios
         SET email_verificado = 1, token_verificacion = NULL, token_verificacion_expira = NULL
         WHERE id = ?`,
        [usuarioId]
      );
      await db.run(
        `UPDATE email_verifications SET usado = 1 WHERE usuario_id = ? AND usado = 0`,
        [usuarioId]
      );
    });

    await enviarEmail({
      to: usuario.email,
      subject: '✅ Cuenta verificada — Pollos Keny',
      html: EmailTemplates.bienvenida(usuario.nombre, `${env.urls.front}/login`),
      tipo: 'BIENVENIDA',
    });

    return { verificado: true, mensaje: 'Correo verificado correctamente' };
  },

  async reenviar(email: string) {
    const usuario = await db.get<{ id: string; nombre: string; email: string; email_verificado: number }>(
      'SELECT id, nombre, email, email_verificado FROM usuarios WHERE email = ? AND activo = 1',
      [String(email).toLowerCase().trim()]
    );

    if (!usuario) return { enviado: true }; // respuesta neutra
    if (toBool(usuario.email_verificado)) {
      throw AppError.badRequest('Este correo ya se encuentra verificado', 'YA_VERIFICADO');
    }

    return this.enviarVerificacion(usuario.id, usuario.email, usuario.nombre, 'REENVIADO');
  },
};
