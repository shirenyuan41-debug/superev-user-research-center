import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { env } from './config/env.js';
import { SESSION_TABLE_NAME } from './constants/schema.js';
import { ensureRuntimeBootstrap } from './db/bootstrap.js';
import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { feedbacksRouter } from './routes/feedbacks.js';
import { promptModulesRouter } from './routes/prompt-modules.js';
import { promptVersionsRouter } from './routes/prompt-versions.js';
import { todosRouter } from './routes/todos.js';
import { HttpError } from './utils/http.js';

type CreateAppOptions = {
  routeBasePath?: string;
};

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const createApp = async (options: CreateAppOptions = {}) => {
  await ensureRuntimeBootstrap();

  const app = express();
  const routeBasePath = options.routeBasePath === '/' ? '' : (options.routeBasePath || '/api').replace(/\/$/, '');
  const MySQLStore = MySQLStoreFactory(session);
  const sessionStore = new MySQLStore({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: env.SESSION_IDLE_TIMEOUT_MS,
    createDatabaseTable: false,
    schema: {
      tableName: SESSION_TABLE_NAME,
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data',
      },
    },
  });

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((request, response, next) => {
    const requestOrigin = request.headers.origin;
    const isAllowedOrigin = typeof requestOrigin === 'string' && env.ALLOWED_ORIGINS.includes(requestOrigin);

    response.header('Vary', 'Origin');
    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Allow-Headers', 'Content-Type');
    response.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');

    if (isAllowedOrigin && requestOrigin) {
      response.header('Access-Control-Allow-Origin', requestOrigin);
    }

    if (request.method === 'OPTIONS') {
      if (requestOrigin && !isAllowedOrigin) {
        response.status(403).json({ message: '当前来源不允许访问接口' });
        return;
      }
      response.status(204).end();
      return;
    }
    next();
  });

  app.use((request, _response, next) => {
    if (!UNSAFE_METHODS.has(request.method)) {
      next();
      return;
    }

    const requestOrigin = request.headers.origin;
    if (!requestOrigin) {
      next();
      return;
    }

    if (!env.ALLOWED_ORIGINS.includes(requestOrigin)) {
      next(new HttpError(403, '当前来源不允许执行此操作'));
      return;
    }

    next();
  });

  app.use(session({
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: env.SESSION_COOKIE_SECURE !== false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: env.SESSION_COOKIE_SAME_SITE,
      secure: env.SESSION_COOKIE_SECURE,
      maxAge: env.SESSION_IDLE_TIMEOUT_MS,
    },
  }));

  const withBasePath = (path: string) => `${routeBasePath}${path}` || '/';
  const apiRouteAliases = routeBasePath ? [routeBasePath] : ['', '/api'];

  app.get(withBasePath('/health'), (_request, response) => {
    response.json({ ok: true });
  });
  if (!routeBasePath) {
    app.get('/api/health', (_request, response) => {
      response.json({ ok: true });
    });
  }

  apiRouteAliases.forEach((basePath) => {
    app.use(`${basePath}/auth`, authRouter);
    app.use(`${basePath}/documents`, documentsRouter);
    app.use(`${basePath}/todos`, todosRouter);
    app.use(`${basePath}/feedbacks`, feedbacksRouter);
    app.use(`${basePath}/prompt-modules`, promptModulesRouter);
    app.use(`${basePath}/prompt-versions`, promptVersionsRouter);
  });

  app.use((error: any, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const status = typeof error?.status === 'number' ? error.status : 500;
    response.status(status).json({
      message: error?.message || '服务器异常',
      details: error?.details,
    });
  });

  return app;
};
