import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  const origins =
    env.corsOrigins === '*' || env.corsOrigins.trim() === ''
      ? true
      : env.corsOrigins.split(',').map((o) => o.trim());

  app.use(
    helmet({
      frameguard: false, // permite visualizar la API dentro de un iframe (entornos de demo)
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      nombre: 'API Créditos Pollos Keny 🐔',
      version: '1.0.0',
      endpoints: [
        'GET  /health',
        'GET  /api/health',
        'POST /api/auth/login',
        'POST /api/auth/registro',
        'GET  /api/dashboard/metricas',
        'GET  /api/creditos',
        'GET  /api/emprendedores',
        'GET  /api/crypto/cartera',
      ],
    });
  });

  app.use('/api', routes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
