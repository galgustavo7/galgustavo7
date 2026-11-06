import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/error.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  cambiarPasswordSchema,
  loginSchema,
  recuperacionSchema,
  reenviarSchema,
  registroSchema,
  resetPasswordSchema,
  verificacionSchema,
} from '../validators/schemas';

const router = Router();

router.post('/login', rateLimit(15), validate(loginSchema), AuthController.login);
router.post('/registro', rateLimit(8), validate(registroSchema), AuthController.registrar);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

router.post('/verificar-email', validate(verificacionSchema), AuthController.verificarEmail);
router.post('/reenviar-verificacion', rateLimit(5), validate(reenviarSchema), AuthController.reenviarVerificacion);

router.post('/recuperar', rateLimit(5), validate(recuperacionSchema), AuthController.solicitarRecuperacion);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.restablecerPassword);
router.post('/cambiar-password', authMiddleware, validate(cambiarPasswordSchema), AuthController.cambiarPassword);

export default router;
