import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { addDays, toDateTimeString } from '../lib/dates';
import { EmailTemplates } from './email.templates';
import { enviarEmail } from './email.service';
import { EmailVerificationService } from './email-verification.service';
import { toBool, type JwtPayload, type Rol, type UsuarioRow } from '../types';

const BCRYPT_ROUNDS = 10;
const REFRESH_DAYS = 7;

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export function generarAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);
}

export function generarRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

function perfilPublico(usuario: UsuarioRow) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    avatar: usuario.avatar_url,
    emprendedorId: usuario.emprendedor_id,
    emailVerificado: toBool(usuario.email_verificado),
    ultimoAcceso: usuario.ultimo_acceso,
    fechaCreacion: usuario.fecha_creacion,
  };
}

export interface LoginMeta {
  ip?: string;
  dispositivo?: string;
}

export const AuthService = {
  async login(email: string, password: string, meta: LoginMeta = {}) {
    const usuario = await db.get<UsuarioRow>(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [String(email).toLowerCase().trim()]
    );

    if (!usuario) throw AppError.unauthorized('Credenciales inválidas', 'CREDENCIALES_INVALIDAS');

    const passwordOk = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordOk) throw AppError.unauthorized('Credenciales inválidas', 'CREDENCIALES_INVALIDAS');

    if (usuario.rol === 'EMPRENDEDOR' && !toBool(usuario.email_verificado)) {
      throw AppError.forbidden('Debes verificar tu correo antes de ingresar', 'EMAIL_NO_VERIFICADO');
    }

    const payload: JwtPayload = {
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      emprendedorId: usuario.emprendedor_id,
    };

    const accessToken = generarAccessToken(payload);
    const refreshToken = generarRefreshToken(usuario.id);

    await db.run(
      `INSERT INTO sesiones (id, usuario_id, token_hash, dispositivo, ip, expira_en)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        usuario.id,
        hashToken(refreshToken),
        meta.dispositivo ?? null,
        meta.ip ?? null,
        toDateTimeString(addDays(new Date(), REFRESH_DAYS)),
      ]
    );

    await db.run('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?', [toDateTimeString(), usuario.id]);

    return { accessToken, refreshToken, usuario: perfilPublico(usuario) };
  },

  async registrarEmprendedor(data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    cedula: string;
    ubicacion?: string;
    actividad?: string;
  }) {
    const email = String(data.email).toLowerCase().trim();

    const existente = await db.get<{ id: string }>('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente) throw AppError.conflict('El correo ya está registrado', 'EMAIL_DUPLICADO');

    const cedulaExistente = await db.get<{ id: string }>(
      'SELECT id FROM emprendedores WHERE cedula = ?',
      [data.cedula]
    );
    if (cedulaExistente) throw AppError.conflict('La cédula ya está registrada', 'CEDULA_DUPLICADA');

    const emprendedorId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const actividad = (data.actividad ?? 'AVICOLA').toUpperCase();

    await db.transaction(async () => {
      await db.run(
        `INSERT INTO emprendedores (id, nombre, cedula, telefono, email, ubicacion, actividad, score_crediticio)
         VALUES (?, ?, ?, ?, ?, ?, ?, 500)`,
        [emprendedorId, data.nombre.trim(), data.cedula, data.telefono ?? '', email, data.ubicacion ?? null, actividad]
      );
      await db.run(
        `INSERT INTO usuarios (id, emprendedor_id, nombre, email, telefono, password_hash, rol)
         VALUES (?, ?, ?, ?, ?, ?, 'EMPRENDEDOR')`,
        [usuarioId, emprendedorId, data.nombre.trim(), email, data.telefono ?? null, passwordHash]
      );
    });

    await EmailVerificationService.enviarVerificacion(usuarioId, email, data.nombre.trim(), 'REGISTRO').catch(
      (error) => {
        // El registro no debe fallar si el correo no sale
        console.error('No se pudo enviar el correo de verificación:', (error as Error).message);
      }
    );

    return {
      id: usuarioId,
      emprendedorId,
      email,
      mensaje: 'Registro exitoso. Revisa tu correo para verificar la cuenta.',
    };
  },

  async refresh(refreshToken: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { userId: string };
    } catch {
      throw AppError.unauthorized('Sesión expirada, vuelve a ingresar', 'REFRESH_INVALIDO');
    }

    const sesion = await db.get<{ id: string; revocada: number | boolean; expira_en: string }>(
      `SELECT id, revocada, expira_en FROM sesiones
       WHERE usuario_id = ? AND token_hash = ? ORDER BY creada_en DESC LIMIT 1`,
      [decoded.userId, hashToken(refreshToken)]
    );

    if (!sesion || toBool(sesion.revocada)) {
      throw AppError.unauthorized('Sesión inválida', 'REFRESH_INVALIDO');
    }
    if (new Date(sesion.expira_en.replace(' ', 'T') + 'Z').getTime() < Date.now()) {
      throw AppError.unauthorized('Sesión expirada', 'REFRESH_INVALIDO');
    }

    const usuario = await db.get<UsuarioRow>('SELECT * FROM usuarios WHERE id = ? AND activo = 1', [
      decoded.userId,
    ]);
    if (!usuario) throw AppError.unauthorized('Usuario no disponible', 'USUARIO_INACTIVO');

    return {
      accessToken: generarAccessToken({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        emprendedorId: usuario.emprendedor_id,
      }),
    };
  },

  async logout(refreshToken?: string, userId?: string) {
    if (!refreshToken) return { cerrado: true };
    await db.run('UPDATE sesiones SET revocada = 1 WHERE token_hash = ?', [hashToken(refreshToken)]);
    if (userId) {
      await db.run('UPDATE sesiones SET revocada = 1 WHERE usuario_id = ?', [userId]);
    }
    return { cerrado: true };
  },

  async perfil(userId: string) {
    const usuario = await db.get<UsuarioRow>('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (!usuario) throw AppError.notFound('Usuario no encontrado');

    const perfil: Record<string, unknown> = { ...perfilPublico(usuario) };

    if (usuario.emprendedor_id) {
      const emprendedor = await db.get<{
        score_crediticio: number;
        actividad: string;
        ubicacion: string | null;
        cedula: string;
      }>(
        'SELECT score_crediticio, actividad, ubicacion, cedula FROM emprendedores WHERE id = ?',
        [usuario.emprendedor_id]
      );
      perfil.emprendedor = emprendedor ?? null;
    }

    return perfil;
  },

  async solicitarRecuperacion(email: string) {
    const usuario = await db.get<{ id: string; nombre: string }>(
      'SELECT id, nombre FROM usuarios WHERE email = ? AND activo = 1',
      [String(email).toLowerCase().trim()]
    );

    // Respuesta neutra para no revelar qué correos existen
    if (!usuario) return { enviado: true };

    const token = crypto.randomBytes(32).toString('hex');
    await db.run(
      `INSERT INTO password_resets (id, usuario_id, token_hash, expira_en)
       VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), usuario.id, hashToken(token), toDateTimeString(addDays(new Date(), 1 / 24))]
    );

    const link = `${env.urls.front}/reset-password?token=${token}&id=${usuario.id}`;
    await enviarEmail({
      to: String(email).toLowerCase().trim(),
      subject: '🔐 Recuperar contraseña — Pollos Keny',
      html: EmailTemplates.recuperacionPassword(usuario.nombre, link, 60),
      tipo: 'RECUPERACION',
    });

    return { enviado: true };
  },

  async restablecerPassword(usuarioId: string, token: string, password: string) {
    const reset = await db.get<{ id: string; token_hash: string; expira_en: string; usado: number | boolean }>(
      `SELECT id, token_hash, expira_en, usado FROM password_resets
       WHERE usuario_id = ? AND usado = 0 ORDER BY creado_en DESC LIMIT 1`,
      [usuarioId]
    );

    if (!reset) throw AppError.badRequest('Solicitud de recuperación no encontrada');
    if (toBool(reset.usado)) throw AppError.badRequest('Esta solicitud ya fue utilizada');

    const expira = new Date(reset.expira_en.replace(' ', 'T') + 'Z').getTime();
    if (expira < Date.now()) throw AppError.badRequest('El enlace expiró, solicita uno nuevo');

    const tokenOk =
      reset.token_hash === hashToken(token) ||
      (await bcrypt.compare(token, reset.token_hash).catch(() => false));
    if (!tokenOk) throw AppError.badRequest('Token inválido');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.transaction(async () => {
      await db.run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, usuarioId]);
      await db.run('UPDATE password_resets SET usado = 1 WHERE id = ?', [reset.id]);
      await db.run('UPDATE sesiones SET revocada = 1 WHERE usuario_id = ?', [usuarioId]);
    });

    return { actualizado: true };
  },

  async cambiarPassword(userId: string, passwordActual: string, passwordNueva: string) {
    const usuario = await db.get<UsuarioRow>('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (!usuario) throw AppError.notFound('Usuario no encontrado');

    const ok = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!ok) throw AppError.badRequest('La contraseña actual no es correcta');

    const passwordHash = await bcrypt.hash(passwordNueva, BCRYPT_ROUNDS);
    await db.run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    return { actualizado: true };
  },

  async listarUsuarios(filtros: { rol?: Rol; q?: string } = {}) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filtros.rol) {
      where.push('rol = ?');
      params.push(filtros.rol);
    }
    if (filtros.q) {
      where.push('(nombre LIKE ? OR email LIKE ?)');
      params.push(`%${filtros.q}%`, `%${filtros.q}%`);
    }

    const sql = `SELECT id, nombre, email, telefono, rol, activo, email_verificado, ultimo_acceso, fecha_creacion, emprendedor_id
                 FROM usuarios ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY fecha_creacion DESC LIMIT 200`;

    return db.all(sql, params);
  },
};
