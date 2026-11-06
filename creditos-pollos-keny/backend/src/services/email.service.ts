import fs from 'node:fs';
import path from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';
import { db, getAnalytics } from '../db';
import { env, smtpConfigured } from '../config/env';
import { logger } from '../lib/logger';
import { randomUUID } from 'node:crypto';

export type EstadoEmail = 'ENVIADO' | 'SIMULADO' | 'ERROR';

export interface AdjuntoEmail {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EnviarEmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: AdjuntoEmail[];
  tipo?: string;
  creditoId?: string | null;
  emprendedorId?: string | null;
}

export interface EnviarEmailResult {
  estado: EstadoEmail;
  messageId?: string;
  previewPath?: string;
  error?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

const slug = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

/** Guarda el HTML en disco para poder revisarlo sin servidor SMTP (modo demo). */
function guardarPreview(asunto: string, html: string): string | undefined {
  try {
    fs.mkdirSync(env.storage.emails, { recursive: true });
    const nombre = `${Date.now()}-${slug(asunto) || 'email'}.html`;
    const filePath = path.join(env.storage.emails, nombre);
    fs.writeFileSync(filePath, html, 'utf8');
    return filePath;
  } catch (error) {
    logger.warn('No se pudo guardar el preview del email', (error as Error).message);
    return undefined;
  }
}

async function registrarLog(input: EnviarEmailInput, result: EnviarEmailResult): Promise<void> {
  const id = randomUUID();
  try {
    await db.run(
      `INSERT INTO email_logs (id, destinatario, asunto, tipo, estado, credito_id, emprendedor_id, mensaje_error, preview_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.to,
        input.subject,
        input.tipo ?? 'GENERAL',
        result.estado,
        input.creditoId ?? null,
        input.emprendedorId ?? null,
        result.error ?? null,
        result.previewPath ?? null,
      ]
    );
  } catch (error) {
    logger.warn('No se pudo registrar el log de email', (error as Error).message);
  }

  const analytics = getAnalytics();
  if (analytics) {
    await analytics
      .run(
        `INSERT INTO email_logs (destinatario, asunto, tipo, estado, credito_id, emprendedor_id, mensaje_error)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.to,
          input.subject,
          input.tipo ?? 'GENERAL',
          result.estado,
          input.creditoId ?? null,
          input.emprendedorId ?? null,
          result.error ?? null,
        ]
      )
      .catch(() => undefined);
  }
}

/**
 * Envía un correo. Si no hay SMTP configurado lo guarda en `storage/emails`
 * (modo simulado) para que el flujo completo funcione sin credenciales.
 */
export async function enviarEmail(input: EnviarEmailInput): Promise<EnviarEmailResult> {
  let result: EnviarEmailResult;

  if (!smtpConfigured) {
    const previewPath = guardarPreview(input.subject, input.html);
    result = { estado: 'SIMULADO', previewPath };
    logger.info(`📧 [simulado] "${input.subject}" → ${input.to} (${previewPath})`);
  } else {
    try {
      const info = await getTransporter().sendMail({
        from: env.smtp.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      result = { estado: 'ENVIADO', messageId: info.messageId };
      logger.info(`📧 Email enviado a ${input.to}: ${info.messageId}`);
    } catch (error) {
      const message = (error as Error).message;
      logger.error(`Error enviando email a ${input.to}: ${message}`);
      result = { estado: 'ERROR', error: message, previewPath: guardarPreview(input.subject, input.html) };
    }
  }

  await registrarLog(input, result);
  return result;
}

export function emailHabilitado(): boolean {
  return smtpConfigured;
}
