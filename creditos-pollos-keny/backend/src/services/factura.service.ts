import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { env } from '../config/env';
import { formatFechaEs } from '../lib/dates';
import type { CreditoRow, EmprendedorRow } from '../types';
import { toNumber } from '../types';

export interface FacturaItem {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  total: number;
}

export interface FacturaData {
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  cliente: {
    nombre: string;
    cedula: string;
    telefono: string;
    email: string;
    direccion: string;
  };
  items: FacturaItem[];
  subtotal: number;
  impuestos: number;
  tasaInteres: number;
  total: number;
  tipo: string;
  notas?: string;
}

const money = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export function construirFactura(
  credito: CreditoRow,
  emprendedor: EmprendedorRow,
  numero: string,
  impuestos = 0
): FacturaData {
  const subtotal = toNumber(credito.monto_total);
  const tasaInteres = toNumber(credito.tasa_interes);
  const interes = Number((subtotal * (tasaInteres / 100)).toFixed(2));
  const total = Number((subtotal + interes + impuestos).toFixed(2));

  return {
    numero,
    fechaEmision: new Date().toISOString(),
    fechaVencimiento: credito.fecha_vencimiento,
    cliente: {
      nombre: emprendedor.nombre,
      cedula: emprendedor.cedula,
      telefono: emprendedor.telefono,
      email: emprendedor.email,
      direccion: emprendedor.ubicacion ?? 'No registrada',
    },
    items: [
      {
        descripcion:
          credito.tipo === 'POLLOS'
            ? `Crédito de pollos (${credito.cantidad} unidades)`
            : `Crédito de cerdos (${credito.cantidad} unidades)`,
        cantidad: credito.cantidad,
        precioUnit: toNumber(credito.valor_unitario),
        total: subtotal,
      },
      {
        descripcion: `Interés ${tasaInteres}% sobre el monto financiado`,
        cantidad: 1,
        precioUnit: interes,
        total: interes,
      },
    ],
    subtotal,
    impuestos,
    tasaInteres,
    total,
    tipo: credito.tipo,
    notas: 'Crédito productivo para emprendedores avícolas y porcícolas.',
  };
}

/** Genera el PDF de la factura y lo devuelve como Buffer. */
export function generarPdf(data: FacturaData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const left = 50;
      const right = 545;

      // Franja superior
      doc.rect(0, 0, 595.28, 110).fill('#FF6B35');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22)
        .text('CRÉDITOS POLLOS KENY', left, 34);
      doc.font('Helvetica').fontSize(10).fillColor('#FFF1E7')
        .text('RUC: 1234567890001  •  Av. Principal 123, Barquisimeto, Lara', left, 62)
        .text('contacto@polloskeny.com  •  +58 412-0000000', left, 76);

      // Encabezado de factura
      doc.fillColor('#1E3A8A').fontSize(16).font('Helvetica-Bold')
        .text(`FACTURA N° ${data.numero}`, left, 140, { align: 'right', width: 495 });
      doc.fillColor('#374151').font('Helvetica').fontSize(10)
        .text(`Fecha de emisión: ${formatFechaEs(data.fechaEmision)}`, left, 164, { align: 'right', width: 495 })
        .text(`Vencimiento: ${formatFechaEs(data.fechaVencimiento)}`, left, 178, { align: 'right', width: 495 });

      // Datos del cliente
      doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(12).text('CLIENTE', left, 210);
      doc.rect(left, 228, 495, 78).fillAndStroke('#F9FAFB', '#E5E7EB');
      doc.fillColor('#374151').font('Helvetica').fontSize(10)
        .text(`Nombre: ${data.cliente.nombre}`, left + 12, 240)
        .text(`Cédula/RIF: ${data.cliente.cedula}`, left + 12, 256)
        .text(`Teléfono: ${data.cliente.telefono}`, left + 300, 240)
        .text(`Email: ${data.cliente.email}`, left + 300, 256)
        .text(`Dirección: ${data.cliente.direccion}`, left + 12, 280);

      // Tabla de ítems
      let y = 330;
      doc.rect(left, y, 495, 24).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
        .text('Descripción', left + 10, y + 7)
        .text('Cant.', 330, y + 7, { width: 45, align: 'right' })
        .text('P. Unit.', 380, y + 7, { width: 60, align: 'right' })
        .text('Total', 450, y + 7, { width: 85, align: 'right' });
      y += 24;

      doc.font('Helvetica').fillColor('#374151');
      data.items.forEach((item, index) => {
        if (index % 2 === 1) doc.rect(left, y, 495, 24).fill('#F9FAFB');
        doc.fillColor('#374151')
          .text(item.descripcion, left + 10, y + 7, { width: 300 })
          .text(String(item.cantidad), 330, y + 7, { width: 45, align: 'right' })
          .text(money(item.precioUnit), 380, y + 7, { width: 60, align: 'right' })
          .text(money(item.total), 450, y + 7, { width: 85, align: 'right' });
        y += 24;
      });

      // Totales
      y += 10;
      doc.moveTo(360, y).lineTo(right, y).stroke('#E5E7EB');
      y += 12;
      doc.font('Helvetica').fillColor('#374151')
        .text('Subtotal:', 380, y, { width: 70, align: 'right' })
        .text(money(data.subtotal), 450, y, { width: 85, align: 'right' });
      y += 16;
      doc.text('Impuestos:', 380, y, { width: 70, align: 'right' })
        .text(money(data.impuestos), 450, y, { width: 85, align: 'right' });
      y += 22;
      doc.rect(360, y - 4, 185, 26).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
        .text('TOTAL:', 380, y + 3, { width: 70, align: 'right' })
        .text(money(data.total), 450, y + 3, { width: 85, align: 'right' });

      // Notas y pie
      y += 50;
      if (data.notas) {
        doc.fillColor('#6B7280').font('Helvetica').fontSize(9).text(data.notas, left, y, { width: 350 });
      }
      doc.fillColor('#9CA3AF').fontSize(8)
        .text(
          'Gracias por confiar en Créditos Pollos Keny — Documento generado automáticamente.',
          left,
          760,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/** Genera el PDF y lo persiste en `storage/facturas`. */
export async function generarYGuardarFactura(data: FacturaData): Promise<{ buffer: Buffer; filePath: string; fileName: string }> {
  const buffer = await generarPdf(data);
  fs.mkdirSync(env.storage.facturas, { recursive: true });
  const fileName = `factura-${data.numero}.pdf`;
  const filePath = path.join(env.storage.facturas, fileName);
  fs.writeFileSync(filePath, buffer);
  return { buffer, filePath, fileName };
}
