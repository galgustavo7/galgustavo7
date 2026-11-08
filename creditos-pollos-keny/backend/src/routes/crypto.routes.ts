import { Router } from 'express';
import { CryptoController } from '../controllers/crypto.controller';
import { authMiddleware, soloAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { actualizarCryptoSchema, cryptoSchema } from '../validators/schemas';

const router = Router();

router.get('/precios', authMiddleware, CryptoController.precios);
router.get('/cartera', authMiddleware, CryptoController.cartera);

router.post('/', ...soloAdmin, validate(cryptoSchema), CryptoController.agregar);
router.patch('/:id', ...soloAdmin, validate(actualizarCryptoSchema), CryptoController.actualizar);
router.delete('/:id', ...soloAdmin, CryptoController.eliminar);

export default router;
