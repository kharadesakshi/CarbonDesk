import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import participantRoutes from './routes/participant.routes';
import documentRoutes from './routes/document.routes';
import gisRoutes from './routes/gis.routes';
import dashboardRoutes from './routes/dashboard.routes';
import mrvRoutes from './routes/mrv.routes';
import { errorHandler, notFound, AppError } from './middleware/errorHandler';
import { getEnvConfig } from './utils/env';
import { CacheService } from './services/cache/CacheService';

const app = express();
const envConfig = getEnvConfig();

// ─── Cache Initialization ────────────────────────────────────────────────────
CacheService.startCleanup();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: envConfig.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
const apiRouter = express.Router();

// Auth
apiRouter.use('/auth', authRoutes);

// Projects
apiRouter.use('/projects', projectRoutes);

// Project-scoped participants and documents
apiRouter.use('/projects/:projectId/participants', participantRoutes);
apiRouter.use('/projects/:projectId/gis', gisRoutes);

// Global participant routes (for updates by ID)
apiRouter.use('/participants', participantRoutes);

// Documents
apiRouter.use('/documents', documentRoutes);

// Dashboard
apiRouter.use('/dashboard', dashboardRoutes);

// MRV Module
apiRouter.use('/', mrvRoutes);

app.use('/api', apiRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
