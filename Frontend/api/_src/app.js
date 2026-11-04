import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import casesRoutes from './routes/cases.routes.js';
import examinationsRoutes from './routes/examinations.routes.js';
import decisionsRoutes from './routes/decisions.routes.js';
import auditRoutes from './routes/audit.routes.js';
import documentsRoutes from './routes/documents.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

const isProd = process.env.NODE_ENV === 'production';

// Trust reverse proxy (Render, Vercel, Nginx) for secure cookies and accurate IPs
app.set('trust proxy', 1);

// ── CORS ────────────────────────────────────────────────────────────────────
const rawClientUrl = process.env.CLIENT_URL || '';
const allowedOrigins = rawClientUrl
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        !isProd ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'E-Disiplin ASN API berjalan.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/employees',    employeesRoutes);
app.use('/api/attendance',   attendanceRoutes);
app.use('/api/reports',      reportsRoutes);
app.use('/api/cases',        casesRoutes);
app.use('/api/examinations', examinationsRoutes);
app.use('/api/decisions',    decisionsRoutes);
app.use('/api/audit-logs',   auditRoutes);
app.use('/api/documents',    documentsRoutes);

// ── Serve React frontend (PRODUCTION if dist exists, otherwise API status) ──
const distPath = path.resolve(__dirname, '../../dist');
const hasFrontendBuild = fs.existsSync(path.join(distPath, 'index.html'));

if (isProd && hasFrontendBuild) {
  // Static files dengan cache headers
  app.use(
    express.static(distPath, {
      maxAge: '1y',        // cache asset JS/CSS 1 tahun (mereka punya hash di nama file)
      etag: true,
      index: false,        // jangan serve index.html otomatis — biarkan catch-all di bawah
    })
  );

  // Catch-all: semua route non-API → index.html (React Router SPA)
  app.get('(.*)', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Root endpoint for standalone API deployment
  app.get('/', (req, res) => {
    res.json({
      name: 'E-Disiplin ASN Backend API',
      status: 'online',
      environment: process.env.NODE_ENV || 'development',
      health: '/api/health',
    });
  });
}

// ── 404 + error handler ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;