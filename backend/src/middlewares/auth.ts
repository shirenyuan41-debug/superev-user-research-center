import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';
import { syncSessionMetadata } from '../utils/session.js';

const saveSession = (request: Request) => new Promise<void>((resolve, reject) => {
  request.session.save((error) => {
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
});

export const requireAuth = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    if (!request.session.user) {
      throw new HttpError(401, '请先登录');
    }

    const lastActivityAt = request.session.lastActivityAt ?? Date.now();
    if (Date.now() - lastActivityAt > env.SESSION_IDLE_TIMEOUT_MS) {
      request.session.destroy(() => undefined);
      throw new HttpError(401, '登录状态已过期，请重新登录');
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
