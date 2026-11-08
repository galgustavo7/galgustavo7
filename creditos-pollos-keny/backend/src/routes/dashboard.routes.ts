import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, requireRole, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/metricas', authMiddleware, DashboardController.metricas);
router.get('/serie-mensual', authMiddleware, DashboardController.serieMensual);
router.get('/resumen', ...soloAdmin, DashboardController.resumen);
router.get('/morosos', ...soloAdmin, DashboardController.morosos);
router.get('/creditos-recientes', ...soloAdmin, DashboardController.ultimosCreditos);
router.get('/mi-resumen', authMiddleware, requireRole('EMPRENDEDOR'), DashboardController.miResumen);
router.post('/sincronizar', ...soloAdmin, DashboardController.sincronizarAnalitica);

export default router;
