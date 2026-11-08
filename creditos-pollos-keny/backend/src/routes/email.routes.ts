import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', ...soloAdmin, EmailController.listar);
router.get('/:id/preview', ...soloAdmin, EmailController.preview);

export default router;
