import { asyncHandler } from '../lib/errors';
import { getParametros, setParametro } from '../services/parametros.service';

export class ParametroController {
  static listar = asyncHandler(async (_req, res) => {
    const parametros = await getParametros();
    res.json({ ok: true, parametros });
  });

  static actualizar = asyncHandler(async (req, res) => {
    const { valor, descripcion } = req.body as { valor: string; descripcion?: string };
    if (!valor) throw new Error('El valor es obligatorio');
    await setParametro(req.params.clave, String(valor), descripcion);
    res.json({ ok: true, parametros: await getParametros() });
  });
}
