import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { env } from './server/config/env.ts';
import { connectDatabase } from './server/db/connection.ts';
import academicRoutes from './server/routes/academicRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import analyticsRoutes from './server/routes/analyticsRoutes.ts';
import authRoutes from './server/routes/authRoutes.ts';
import campusLeadRoutes from './server/routes/campusLeadRoutes.ts';
import contactRoutes from './server/routes/contactRoutes.ts';
import contributorRoutes from './server/routes/contributorRoutes.ts';
import mockTestRoutes from './server/routes/mockTestRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import packageRoutes from './server/routes/packageRoutes.ts';
import pyqRoutes from './server/routes/pyqRoutes.ts';
import questionRoutes from './server/routes/questionRoutes.ts';
import reviewerRoutes from './server/routes/reviewerRoutes.ts';
import solutionRoutes from './server/routes/solutionRoutes.ts';
import { seedDatabaseIfEmpty } from './server/seed/seedData.ts';

async function bootstrap() {
  await connectDatabase();
  await seedDatabaseIfEmpty();

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/uploads', express.static(env.UPLOAD_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'UNIHUB API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/academic', academicRoutes);
  app.use('/api/pyqs', pyqRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/mock-tests', mockTestRoutes);
  app.use('/api/solutions', solutionRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/contributor', contributorRoutes);
  app.use('/api/campus-lead', campusLeadRoutes);
  app.use('/api/reviewer', reviewerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/contact', contactRoutes);

  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`UNIHUB full-stack server listening on http://0.0.0.0:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start UNIHUB server:', err);
  process.exit(1);
});
