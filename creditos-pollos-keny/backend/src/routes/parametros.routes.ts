import { Router } from 'express';
import { ParametroController } from '../controllers/parametros.controller';
import { authMiddleware, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, ParametroController.listar);
router.put('/:clave', ...soloAdmin, ParametroController.actualizar);

export default router;
