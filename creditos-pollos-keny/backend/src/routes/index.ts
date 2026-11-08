import { Router } from 'express';
import authRoutes from './auth.routes';
import creditoRoutes from './credito.routes';
import emprendedorRoutes from './emprendedor.routes';
import dashboardRoutes from './dashboard.routes';
import cryptoRoutes from './crypto.routes';
import emailRoutes from './email.routes';
import parametroRoutes from './parametros.routes';
import { env } from '../config/env';
import { emailHabilitado } from '../services/email.service';
import { packageInfo } from '../lib/package-info';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'creditos-pollos-keny-api',
    version: packageInfo.version,
    entorno: env.nodeEnv,
    baseDatos: env.db.dialect,
    postgresHabilitado: env.postgres.enabled,
    smtpConfigurado: emailHabilitado(),
    marca: '🐔 Pollos Keny',
    tiempo: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/creditos', creditoRoutes);
router.use('/emprendedores', emprendedorRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/crypto', cryptoRoutes);
router.use('/emails', emailRoutes);
router.use('/parametros', parametroRoutes);

export default router;
