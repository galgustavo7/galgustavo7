import { Router } from 'express';
import { CreditoController } from '../controllers/credito.controller';
import { authMiddleware, requiereEmailVerificado, requireRole, soloAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  cancelarCreditoSchema,
  listarCreditosSchema,
  pagoSchema,
  rechazarCreditoSchema,
  solicitudCreditoSchema,
} from '../validators/schemas';

const router = Router();

router.get('/', authMiddleware, validate(listarCreditosSchema, 'query'), CreditoController.listar);
router.get('/estados', authMiddleware, CreditoController.estados);
router.get('/mis-creditos', authMiddleware, requireRole('EMPRENDEDOR'), CreditoController.listar);

router.post(
  '/solicitar',
  authMiddleware,
  requiereEmailVerificado,
  validate(solicitudCreditoSchema),
  CreditoController.solicitar
);

router.get('/:id', authMiddleware, CreditoController.obtener);
router.post('/:id/aprobar', ...soloAdmin, CreditoController.aprobar);
router.post('/:id/rechazar', ...soloAdmin, validate(rechazarCreditoSchema), CreditoController.rechazar);
router.post('/:id/entregar', ...soloAdmin, CreditoController.entregar);
router.post('/:id/cancelar', ...soloAdmin, validate(cancelarCreditoSchema), CreditoController.cancelar);
router.post('/:id/pagos', authMiddleware, validate(pagoSchema), CreditoController.registrarPago);
router.get('/:id/pagos', authMiddleware, CreditoController.pagos);
router.get('/:id/factura', authMiddleware, CreditoController.factura);

export default router;
