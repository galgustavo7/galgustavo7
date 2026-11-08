import { formatFechaEs } from '../lib/dates';

const money = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

interface LayoutOptions {
  titulo: string;
  subtitulo?: string;
  gradiente?: string;
  cuerpo: string;
}

function layout({ titulo, subtitulo, gradiente = 'linear-gradient(135deg,#FF6B35 0%,#F7931E 100%)', cuerpo }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Poppins',Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.10);">
          <tr>
            <td style="background:${gradiente};padding:32px 28px;text-align:center;color:#fff;">
              <div style="font-size:26px;font-weight:700;letter-spacing:.3px;">🐔 Créditos Pollos Keny</div>
              <div style="margin-top:8px;font-size:14px;opacity:.92;">${titulo}</div>
              ${subtitulo ? `<div style="margin-top:4px;font-size:13px;opacity:.8;">${subtitulo}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;color:#374151;font-size:15px;line-height:1.6;">${cuerpo}</td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:18px 28px;text-align:center;border-top:1px solid #E5E7EB;color:#9CA3AF;font-size:12px;">
              © ${new Date().getFullYear()} Créditos Pollos Keny — Créditos para emprendedores avícolas y porcícolas.<br />
              Este correo es informativo, por favor no responder a esta dirección.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const boton = (texto: string, url: string, color = '#1E3A8A') => `
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:22px 0 6px;">
    <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;padding:14px 34px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">${texto}</a>
  </td></tr></table>`;

const fila = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:#6B7280;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;">${value}</td></tr>`;

const tabla = (filas: string) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:4px 18px;margin:18px 0;">${filas}</table>`;

export const EmailTemplates = {
  verificacionEmail(nombre: string, link: string, horas = 24): string {
    return layout({
      titulo: 'Confirma tu correo electrónico',
      subtitulo: 'Último paso para activar tu cuenta',
      cuerpo: `
        <p style="margin:0 0 14px;">Hola <strong>${nombre}</strong>, 👋</p>
        <p style="margin:0 0 6px;">Gracias por registrarte en <strong>Pollos Keny</strong>. Para proteger tu cuenta necesitamos confirmar que este correo te pertenece.</p>
        ${boton('✅ Verificar mi correo', link)}
        <p style="margin:16px 0 0;color:#6B7280;font-size:13px;">⏰ El enlace expira en <strong>${horas} horas</strong>. Si no solicitaste esta cuenta puedes ignorar este mensaje.</p>`,
    });
  },

  bienvenida(nombre: string, linkLogin: string): string {
    return layout({
      titulo: '¡Bienvenido a bordo!',
      gradiente: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">Hola <strong>${nombre}</strong>,</p>
        <p style="margin:0 0 10px;">Tu correo quedó verificado y ya puedes solicitar créditos para tus <strong>pollos</strong> o <strong>cerdos</strong>.</p>
        ${tabla(
          fila('Valor por pollo', money(3.2)) +
            fila('Valor por cerdo', money(50)) +
            fila('Tasa de interés', '8%') +
            fila('Plazo estándar', '45 días')
        )}
        ${boton('Ir a mi panel', linkLogin, '#0F766E')}`,
    });
  },

  solicitudRecibida(data: {
    nombre: string;
    tipo: string;
    cantidad: number;
    montoTotal: number;
    tasaInteres: number;
    totalPagar: number;
    fechaVencimiento: string;
  }): string {
    return layout({
      titulo: 'Solicitud de crédito recibida',
      subtitulo: 'Estado: en revisión ⏳',
      cuerpo: `
        <p style="margin:0 0 12px;">Hola <strong>${data.nombre}</strong>,</p>
        <p style="margin:0 0 6px;">Registramos tu solicitud y nuestro equipo la está evaluando.</p>
        ${tabla(
          fila('Tipo', data.tipo === 'POLLOS' ? '🐔 Pollos' : '🐷 Cerdos') +
            fila('Cantidad', `${data.cantidad}`) +
            fila('Monto solicitado', money(data.montoTotal)) +
            fila('Interés', `${data.tasaInteres}%`) +
            fila('Total a pagar', money(data.totalPagar)) +
            fila('Vencimiento', formatFechaEs(data.fechaVencimiento))
        )}
        <p style="margin:0;color:#6B7280;font-size:13px;">Te avisaremos por aquí en cuanto sea aprobada.</p>`,
    });
  },

  creditoAprobado(data: {
    nombre: string;
    facturaNumero: string;
    tipo: string;
    cantidad: number;
    montoTotal: number;
    tasaInteres: number;
    totalPagar: number;
    fechaVencimiento: string;
  }): string {
    return layout({
      titulo: '¡Crédito aprobado!',
      gradiente: 'linear-gradient(135deg,#10B981 0%,#047857 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">Felicidades <strong>${data.nombre}</strong> 🎉</p>
        <p style="margin:0 0 6px;">Tu crédito fue aprobado. Adjunto encontrarás la factura en PDF.</p>
        ${tabla(
          fila('N° Factura', data.facturaNumero) +
            fila('Detalle', `${data.tipo === 'POLLOS' ? '🐔 Pollos' : '🐷 Cerdos'} x ${data.cantidad}`) +
            fila('Monto', money(data.montoTotal)) +
            fila('Interés', `${data.tasaInteres}%`) +
            fila('Total a pagar', money(data.totalPagar)) +
            fila('Vence', formatFechaEs(data.fechaVencimiento))
        )}
        <p style="margin:0;color:#6B7280;font-size:13px;">Puedes abonar en cualquier momento desde tu panel.</p>`,
    });
  },

  creditoRechazado(data: { nombre: string; tipo: string; montoTotal: number; motivo: string }): string {
    return layout({
      titulo: 'Solicitud no aprobada',
      gradiente: 'linear-gradient(135deg,#EF4444 0%,#B91C1C 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">Hola <strong>${data.nombre}</strong>,</p>
        <p style="margin:0 0 10px;">Lamentamos informarte que tu solicitud de ${money(data.montoTotal)} para <strong>${data.tipo.toLowerCase()}</strong> no fue aprobada en esta ocasión.</p>
        ${tabla(fila('Motivo', data.motivo))}
        <p style="margin:0;color:#6B7280;font-size:13px;">Puedes mejorar tu score pagando a tiempo y volver a solicitar más adelante.</p>`,
    });
  },

  pagoRecibido(data: {
    nombre: string;
    monto: number;
    saldoPendiente: number;
    metodoPago: string;
    referencia: string;
    fecha: string;
  }): string {
    return layout({
      titulo: 'Pago registrado',
      gradiente: 'linear-gradient(135deg,#2563EB 0%,#1E3A8A 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">Gracias <strong>${data.nombre}</strong> 💰</p>
        <p style="margin:0 0 6px;">Confirmamos tu abono:</p>
        ${tabla(
          fila('Monto', money(data.monto)) +
            fila('Método', data.metodoPago) +
            fila('Referencia', data.referencia) +
            fila('Fecha', formatFechaEs(data.fecha)) +
            fila('Saldo pendiente', money(data.saldoPendiente))
        )}`,
    });
  },

  creditoPagado(nombre: string, facturaNumero: string): string {
    return layout({
      titulo: 'Crédito saldado',
      gradiente: 'linear-gradient(135deg,#8B5CF6 0%,#5B21B6 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">¡Excelente <strong>${nombre}</strong>! 🏆</p>
        <p style="margin:0;">El crédito de la factura <strong>${facturaNumero}</strong> quedó totalmente pagado. Tu score crediticio subió.</p>`,
    });
  },

  recordatorioVencimiento(data: {
    nombre: string;
    facturaNumero: string;
    saldoPendiente: number;
    fechaVencimiento: string;
    dias: number;
  }): string {
    const urgente = data.dias <= 3;
    return layout({
      titulo: urgente ? '⚠️ Tu crédito vence muy pronto' : 'Recordatorio de pago',
      gradiente: urgente
        ? 'linear-gradient(135deg,#F59E0B 0%,#B45309 100%)'
        : 'linear-gradient(135deg,#0EA5E9 0%,#0369A1 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">Hola <strong>${data.nombre}</strong>,</p>
        <p style="margin:0 0 6px;">Tu crédito vence ${data.dias <= 0 ? 'hoy' : `en ${data.dias} día(s)`}.</p>
        ${tabla(
          fila('Factura', data.facturaNumero) +
            fila('Saldo pendiente', money(data.saldoPendiente)) +
            fila('Vencimiento', formatFechaEs(data.fechaVencimiento))
        )}`,
    });
  },

  recuperacionPassword(nombre: string, link: string, minutos = 60): string {
    return layout({
      titulo: 'Restablecer contraseña',
      gradiente: 'linear-gradient(135deg,#334155 0%,#0F172A 100%)',
      cuerpo: `
        <p style="margin:0 0 12px;">Hola <strong>${nombre}</strong>,</p>
        <p style="margin:0 0 6px;">Recibimos una solicitud para cambiar tu contraseña.</p>
        ${boton('🔐 Crear nueva contraseña', link, '#1E3A8A')}
        <p style="margin:16px 0 0;color:#6B7280;font-size:13px;">El enlace expira en <strong>${minutos} minutos</strong>. Si no fuiste tú, ignora este correo.</p>`,
    });
  },
};
