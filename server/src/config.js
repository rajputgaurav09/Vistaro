import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'vistaro-super-secure-jwt-key-2026-premium',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'vistaro-cookie-secret-2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  DB_PATH: path.join(__dirname, '..', 'data', 'vistaro_db.json'),
  UPLOADS_DIR: path.join(__dirname, '..', 'uploads'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/vistaro?schema=public'
};
