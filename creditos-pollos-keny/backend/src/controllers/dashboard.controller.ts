import { asyncHandler, AppError } from '../lib/errors';
import { DashboardService } from '../services/dashboard.service';
import type { JwtPayload } from '../types';

const requireUser = (req: { usuario?: JwtPayload }): JwtPayload => {
  if (!req.usuario) throw AppError.unauthorized();
  return req.usuario;
};

export class DashboardController {
  static metricas = asyncHandler(async (_req, res) => {
    const metricas = await DashboardService.metricas();
    res.json({ ok: true, metricas });
  });

  static serieMensual = asyncHandler(async (req, res) => {
    const meses = Number((req.query.meses as string) ?? 6);
    const serie = await DashboardService.serieMensual(Number.isFinite(meses) ? Math.min(24, Math.max(1, meses)) : 6);
    res.json({ ok: true, serie });
  });

  static resumen = asyncHandler(async (req, res) => {
    requireUser(req);
    const data = await DashboardService.metricas();
    const [creditos, pagos, morosos, serie] = await Promise.all([
      DashboardService.ultimosCreditos(6),
      DashboardService.ultimosPagos(6),
      DashboardService.morosos(5),
      DashboardService.serieMensual(6),
    ]);
    res.json({ ok: true, metricas: data, creditos, pagos, morosos, serie });
  });

  static morosos = asyncHandler(async (_req, res) => {
    const morosos = await DashboardService.morosos(10);
    res.json({ ok: true, morosos });
  });

  static ultimosCreditos = asyncHandler(async (_req, res) => {
    const creditos = await DashboardService.ultimosCreditos(10);
    res.json({ ok: true, creditos });
  });

  /** Panel del emprendedor: sus créditos y saldos. */
  static miResumen = asyncHandler(async (req, res) => {
    const usuario = requireUser(req);
    if (!usuario.emprendedorId) throw AppError.badRequest('Tu usuario no tiene un emprendedor asociado');
    const resumen = await DashboardService.resumenEmprendedor(usuario.emprendedorId);
    res.json({ ok: true, ...resumen });
  });

  static sincronizarAnalitica = asyncHandler(async (_req, res) => {
    await DashboardService.sincronizarAnalitica();
    res.json({ ok: true, sincronizado: true });
  });
}
