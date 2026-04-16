import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import pipelineRoutes from './routes/pipelines';
import leadRoutes from './routes/leads';
import taskRoutes from './routes/tasks';
import documentRoutes from './routes/documents';
import contractRoutes from './routes/contracts';
import paymentRoutes from './routes/payments';
import orgRoutes from './routes/organisations';
import userRoutes from './routes/users';
import taskTemplateRoutes from './routes/taskTemplates';
import contractTemplateRoutes from './routes/contractTemplates';
import webhookRoutes from './routes/webhooks';
import signRoutes from './routes/sign';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, cb) => {
    const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Allow requests with no origin (e.g. Postman) and matching origin, plus /api/sign is public
    if (!origin || origin === allowed) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/leads', taskRoutes);
app.use('/api/leads', documentRoutes);
app.use('/api/leads', contractRoutes);
app.use('/api/leads', paymentRoutes);
app.use('/api/organisations', orgRoutes);
app.use('/api/users', userRoutes);
app.use('/api/task-templates', taskTemplateRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/sign', signRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CRM Backend running on http://localhost:${PORT}`);
});

export default app;
