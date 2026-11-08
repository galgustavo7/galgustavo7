import { asyncHandler } from '../lib/errors';
import { EmprendedorService, type CrearEmprendedorInput } from '../services/emprendedor.service';

export class EmprendedorController {
  static listar = asyncHandler(async (req, res) => {
    const resultado = await EmprendedorService.listar(req.query as never);
    res.json({ ok: true, emprendedores: resultado, total: resultado.length });
  });

  static obtener = asyncHandler(async (req, res) => {
    const resultado = await EmprendedorService.obtener(req.params.id);
    res.json({ ok: true, emprendedor: resultado });
  });

  static crear = asyncHandler(async (req, res) => {
    const resultado = await EmprendedorService.crear(req.body as CrearEmprendedorInput);
    res.status(201).json({ ok: true, emprendedor: resultado });
  });

  static actualizar = asyncHandler(async (req, res) => {
    const resultado = await EmprendedorService.actualizar(req.params.id, req.body as never);
    res.json({ ok: true, ...resultado });
  });

  static cambiarEstado = asyncHandler(async (req, res) => {
    const { activo } = req.body as { activo: boolean };
    const resultado = await EmprendedorService.cambiarEstado(req.params.id, activo);
    res.json({ ok: true, ...resultado });
  });

  static recalcularScore = asyncHandler(async (req, res) => {
    const resultado = await EmprendedorService.recalcularScore(req.params.id);
    res.json({ ok: true, ...resultado });
  });

  static ranking = asyncHandler(async (_req, res) => {
    const resultado = await EmprendedorService.ranking(5);
    res.json({ ok: true, ranking: resultado });
  });
}
