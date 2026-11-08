import fs from 'node:fs';
import { asyncHandler, AppError } from '../lib/errors';
import { CreditoService } from '../services/credito.service';
import type { EstadoCredito, JwtPayload, MetodoPago, TipoCredito } from '../types';

const requireUser = (req: { usuario?: JwtPayload }): JwtPayload => {
  if (!req.usuario) throw AppError.unauthorized();
  return req.usuario;
};

export class CreditoController {
  static listar = asyncHandler(async (req, res) => {
    const viewer = requireUser(req);
    const resultado = await CreditoService.listar(req.query as never, viewer);
    res.json({ ok: true, ...resultado });
  });

  static obtener = asyncHandler(async (req, res) => {
    const viewer = requireUser(req);
    const credito = await CreditoService.obtener(req.params.id, viewer);
    res.json({ ok: true, credito });
  });

  static solicitar = asyncHandler(async (req, res) => {
    const usuario = requireUser(req);
    const { tipo, cantidad } = req.body as { tipo: TipoCredito; cantidad: number };
    const emprendedorId =
      usuario.rol === 'EMPRENDEDOR' && usuario.emprendedorId
        ? usuario.emprendedorId
        : String((req.body as { emprendedorId?: string }).emprendedorId ?? usuario.emprendedorId ?? '');

    if (!emprendedorId) throw AppError.badRequest('No se pudo determinar el emprendedor');

    const resultado = await CreditoService.solicitar(emprendedorId, { tipo, cantidad });
    res.status(201).json({ ok: true, credito: resultado });
  });

  static aprobar = asyncHandler(async (req, res) => {
    const usuario = requireUser(req);
    const resultado = await CreditoService.aprobar(req.params.id, usuario.userId);
    res.json({ ok: true, credito: resultado });
  });

  static rechazar = asyncHandler(async (req, res) => {
    const usuario = requireUser(req);
    const { motivo } = req.body as { motivo: string };
    const resultado = await CreditoService.rechazar(req.params.id, motivo, usuario.userId);
    res.json({ ok: true, credito: resultado });
  });

  static entregar = asyncHandler(async (req, res) => {
    requireUser(req);
    const resultado = await CreditoService.entregar(req.params.id);
    res.json({ ok: true, credito: resultado });
  });

  static cancelar = asyncHandler(async (req, res) => {
    requireUser(req);
    const { motivo } = req.body as { motivo?: string };
    const resultado = await CreditoService.cancelar(req.params.id, motivo ?? 'Cancelado');
    res.json({ ok: true, credito: resultado });
  });

  static registrarPago = asyncHandler(async (req, res) => {
    const usuario = requireUser(req);
    const { monto, metodoPago, referencia, nota } = req.body as {
      monto: number;
      metodoPago: MetodoPago;
      referencia?: string;
      nota?: string;
    };
    const resultado = await CreditoService.registrarPago(req.params.id, { monto, metodoPago, referencia, nota }, usuario);
    res.status(201).json({ ok: true, ...resultado });
  });

  static pagos = asyncHandler(async (req, res) => {
    const viewer = requireUser(req);
    const pagos = await CreditoService.pagos(req.params.id, viewer);
    res.json({ ok: true, pagos });
  });

  static factura = asyncHandler(async (req, res) => {
    const viewer = requireUser(req);
    const factura = await CreditoService.factura(req.params.id, viewer);

    if (!factura.filePath || !fs.existsSync(factura.filePath)) {
      throw AppError.notFound('El archivo de la factura no está disponible');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${factura.fileName}"`);
    fs.createReadStream(factura.filePath).pipe(res);
  });

  static estados = asyncHandler(async (_req, res) => {
    const estados: EstadoCredito[] = [
      'SOLICITADO',
      'APROBADO',
      'ENTREGADO',
      'PAGADO',
      'MORA',
      'RECHAZADO',
      'CANCELADO',
    ];
    res.json({ ok: true, estados });
  });
}
