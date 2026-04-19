import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';
import { syncSessionMetadata } from '../utils/session.js';

const DEMO_SESSION_USER = {
  id: 'demo-admin',
  account: env.ADMIN_ACCOUNT,
  name: env.ADMIN_NAME,
  role: env.ADMIN_ROLE,
} as const;

const saveSession = (request: Request) => new Promise<void>((resolve, reject) => {
  request.session.save((error) => {
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
});

export const ensureDemoSessionUser = (request: Request) => {
  if (!request.session.user) {
    request.session.user = { ...DEMO_SESSION_USER };
  }

  if (request.session.lastActivityAt == null) {
    request.session.lastActivityAt = Date.now();
  }
};

export const requireAuth = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    ensureDemoSessionUser(request);

    const lastActivityAt = request.session.lastActivityAt ?? Date.now();
    if (Date.now() - lastActivityAt > env.SESSION_IDLE_TIMEOUT_MS) {
      request.session.lastActivityAt = Date.now();
    }

    request.session.lastActivityAt = Date.now();
    request.session.touch();
    await saveSession(request);
    await syncSessionMetadata(request);
    next();
  } catch (error) {
    next(error);
  }
};
