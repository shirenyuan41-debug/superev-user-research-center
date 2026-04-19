import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnvFile } from 'dotenv';
import { z } from 'zod';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const projectRoot = path.resolve(backendRoot, '..');
const backendEnvPath = path.resolve(backendRoot, '.env');
const backendEnvLocalPath = path.resolve(backendRoot, '.env.local');

loadEnvFile({ path: backendEnvPath });
loadEnvFile({ path: backendEnvLocalPath, override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  SESSION_SECRET: z.string().min(8),
  SESSION_COOKIE_NAME: z.string().default('superev_sid'),
  SESSION_IDLE_TIMEOUT_HOURS: z.coerce.number().int().positive().default(12),
  FRONTEND_ORIGIN: z.string().default('http://127.0.0.1:3000'),
  FRONTEND_ORIGINS: z.string().optional(),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false', 'auto']).optional(),

  MYSQL_HOST: z.string(),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().default('superev_research_center'),
  MYSQL_USER: z.string(),
  MYSQL_PASSWORD: z.string(),
  MYSQL_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),

  MYSQL_INIT_HOST: z.string().optional(),
  MYSQL_INIT_PORT: z.coerce.number().int().positive().optional(),
  MYSQL_INIT_ROOT_USER: z.string().optional(),
  MYSQL_INIT_ROOT_PASSWORD: z.string().optional(),
  MYSQL_INIT_DATABASE: z.string().default('superev_research_center'),
  MYSQL_INIT_APP_USER: z.string().default('superev_app'),
  MYSQL_INIT_APP_PASSWORD: z.string().optional(),

  ADMIN_ACCOUNT: z.string().default('admin@superev.com'),
  ADMIN_NAME: z.string().default('系统管理员'),
  ADMIN_PASSWORD: z.string().min(6),
  ADMIN_ROLE: z.string().default('管理员'),

  LLM_PROVIDER: z.string().default('gemini'),
  LLM_BASE_URL: z.string().default(''),
  LLM_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default(''),
  GEMINI_BASE_URL: z.string().default('https://generativelanguage.googleapis.com'),
  GEMINI_API_KEY: z.string().default(''),
  GOOGLE_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  DEEPSEEK_BASE_URL: z.string().default('https://api.deepseek.com'),
  DEEPSEEK_API_KEY: z.string().default(''),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  STORAGE_ROOT: z.string().default('./storage/source-documents'),
  DOCUMENT_STORAGE_MODE: z.enum(['local', 'memory']).optional(),
  DOCUMENT_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.parse(process.env);
const explicitProvider = parsed.LLM_PROVIDER.trim().toLowerCase();
const resolvedLlmProvider = explicitProvider === 'deepseek' ? 'deepseek' : 'gemini';
const resolvedGeminiApiKey = parsed.GEMINI_API_KEY || parsed.GOOGLE_API_KEY;
const resolvedDeepSeekApiKey = parsed.DEEPSEEK_API_KEY || parsed.LLM_API_KEY;
const resolvedDeepSeekBaseUrl = parsed.DEEPSEEK_BASE_URL || parsed.LLM_BASE_URL || 'https://api.deepseek.com';
const resolvedDeepSeekModel = parsed.DEEPSEEK_MODEL || parsed.LLM_MODEL || 'deepseek-chat';
const resolvedAllowedOrigins = Array.from(new Set(
  [
    parsed.FRONTEND_ORIGIN,
    ...(parsed.FRONTEND_ORIGINS || '').split(','),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean),
));
const resolvedSameSite = parsed.SESSION_COOKIE_SAME_SITE || (parsed.NODE_ENV === 'production' ? 'none' : 'lax');
const resolvedCookieSecure = parsed.SESSION_COOKIE_SECURE || (parsed.NODE_ENV === 'production' ? 'auto' : 'false');
const resolvedStorageMode = parsed.DOCUMENT_STORAGE_MODE || (parsed.NODE_ENV === 'production' ? 'memory' : 'local');
const resolvedSessionCookieSecure: true | false | 'auto' = resolvedCookieSecure === 'auto'
  ? 'auto'
  : resolvedCookieSecure === 'true';

export const env = {
  ...parsed,
  LLM_PROVIDER: resolvedLlmProvider,
  GEMINI_API_KEY: resolvedGeminiApiKey,
  GEMINI_MODEL: parsed.GEMINI_MODEL || 'gemini-2.5-flash',
  GEMINI_BASE_URL: parsed.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com',
  DEEPSEEK_API_KEY: resolvedDeepSeekApiKey,
  DEEPSEEK_MODEL: resolvedDeepSeekModel,
  DEEPSEEK_BASE_URL: resolvedDeepSeekBaseUrl,
  BACKEND_ROOT: backendRoot,
  PROJECT_ROOT: projectRoot,
  PRIMARY_FRONTEND_ORIGIN: resolvedAllowedOrigins[0] || '',
  ALLOWED_ORIGINS: resolvedAllowedOrigins,
  SESSION_COOKIE_SAME_SITE: resolvedSameSite,
  SESSION_COOKIE_SECURE: resolvedSessionCookieSecure,
  SESSION_IDLE_TIMEOUT_MS: parsed.SESSION_IDLE_TIMEOUT_HOURS * 60 * 60 * 1000,
  STORAGE_ABS_ROOT: path.resolve(backendRoot, parsed.STORAGE_ROOT),
  DOCUMENT_STORAGE_MODE: resolvedStorageMode,
  DOCUMENT_MAX_FILE_SIZE_BYTES: parsed.DOCUMENT_MAX_FILE_SIZE_MB * 1024 * 1024,
};
