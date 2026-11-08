import fs from 'node:fs';
import { asyncHandler, AppError } from '../lib/errors';
import { db } from '../db';

/**
 * Bandeja de salida. Permite revisar los correos que la plataforma genera.
 * Cuando no hay SMTP configurado los mensajes quedan marcados como SIMULADO
 * y se pueden visualizar desde el panel.
 */
export class EmailController {
  static listar = asyncHandler(async (req, res) => {
    const limite = Math.min(100, Number(req.query.limite ?? 50));
    const logs = await db.all(
      `SELECT id, destinatario, asunto, tipo, estado, creado_en, preview_path, mensaje_error, credito_id
       FROM email_logs ORDER BY creado_en DESC LIMIT ?`,
      [limite]
    );
    res.json({ ok: true, emails: logs, total: logs.length });
  });

  static preview = asyncHandler(async (req, res) => {
    const log = await db.get<{ preview_path: string | null; asunto: string }>(
      'SELECT preview_path, asunto FROM email_logs WHERE id = ?',
      [req.params.id]
    );

    if (!log) throw AppError.notFound('Correo no encontrado');
    if (!log.preview_path || !fs.existsSync(log.preview_path)) {
      throw AppError.notFound('Este correo no tiene vista previa disponible');
    }

    res.type('html').send(fs.readFileSync(log.preview_path, 'utf8'));
  });
}
