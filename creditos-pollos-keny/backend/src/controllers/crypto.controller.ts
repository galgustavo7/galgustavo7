import { asyncHandler } from '../lib/errors';
import { CryptoService } from '../services/crypto.service';

export class CryptoController {
  static cartera = asyncHandler(async (_req, res) => {
    const cartera = await CryptoService.cartera();
    res.json({ ok: true, ...cartera });
  });

  static precios = asyncHandler(async (_req, res) => {
    const { precios, fuente, actualizadoEn } = await CryptoService.precios();
    res.json({ ok: true, precios, fuente, actualizadoEn });
  });

  static agregar = asyncHandler(async (req, res) => {
    const activo = await CryptoService.agregar(req.body as never);
    res.status(201).json({ ok: true, activo });
  });

  static actualizar = asyncHandler(async (req, res) => {
    const resultado = await CryptoService.actualizar(req.params.id, req.body as never);
    res.json({ ok: true, ...resultado });
  });

  static eliminar = asyncHandler(async (req, res) => {
    const resultado = await CryptoService.eliminar(req.params.id);
    res.json({ ok: true, ...resultado });
  });
}
