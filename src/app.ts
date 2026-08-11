import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/error';
import { logger } from './utils/logger';
import routes from './routes';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Stripe webhook needs raw body — mounted before json middleware in payment routes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Compression + logging ────────────────────────────────────────────────────
app.use(compression());
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trimEnd()) },
    skip: () => env.NODE_ENV === 'test',
  }),
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

// ─── API docs ─────────────────────────────────────────────────────────────────
app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(env.API_PREFIX, routes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
