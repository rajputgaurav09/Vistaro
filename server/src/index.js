import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { db } from './db/database.js';

import authRoutes from './routes/auth.js';
import opportunityRoutes from './routes/opportunities.js';
import vendorRoutes from './routes/vendors.js';
import proposalRoutes from './routes/proposals.js';
import readinessRoutes from './routes/readiness.js';
import enquiryRoutes from './routes/enquiries.js';
import serviceRoutes from './routes/services.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';
import assistantRoutes from './routes/assistant.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security & Parsing Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cookieParser(CONFIG.COOKIE_SECRET));
app.use(cors({
  origin: true, // Echo origin to allow development and credentials
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiter (300 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP address, please try again later.' }
});
app.use('/api', apiLimiter);

// Static uploads serving
app.use('/uploads', express.static(CONFIG.UPLOADS_DIR));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vistaro Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mounted Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/opportunities', opportunityRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/readiness', readinessRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/admin', adminRoutes);

// Serve built React SPA if available
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred',
    timestamp: new Date().toISOString()
  });
});

// Auto-start server only when executed directly (not when imported in tests)
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/index.js')) {
  app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 Vistaro Server running on http://localhost:${CONFIG.PORT}`);
    console.log(`📦 Database loaded with ${db.get('opportunities').length} opportunities & ${db.get('vendor_profiles').length} vendor profiles`);
    console.log(`===============================================`);
  });
}

export default app;
