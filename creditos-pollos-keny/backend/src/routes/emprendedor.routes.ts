import { Router } from 'express';
import { EmprendedorController } from '../controllers/emprendedor.controller';
import { authMiddleware, requireRole, soloAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { actualizarEmprendedorSchema, emprendedorSchema, estadoEmprendedorSchema } from '../validators/schemas';

const router = Router();

router.get('/', authMiddleware, EmprendedorController.listar);
router.get('/ranking', authMiddleware, EmprendedorController.ranking);
router.get('/:id', authMiddleware, EmprendedorController.obtener);

router.post('/', ...soloAdmin, validate(emprendedorSchema), EmprendedorController.crear);
router.patch('/:id', ...soloAdmin, validate(actualizarEmprendedorSchema), EmprendedorController.actualizar);
router.patch('/:id/estado', ...soloAdmin, validate(estadoEmprendedorSchema), EmprendedorController.cambiarEstado);
router.post('/:id/recalcular-score', ...soloAdmin, EmprendedorController.recalcularScore);

/** Un emprendedor solo puede ver su propio detalle. */
router.get('/:id/mi-perfil', authMiddleware, requireRole('EMPRENDEDOR'), EmprendedorController.obtener);

export default router;
