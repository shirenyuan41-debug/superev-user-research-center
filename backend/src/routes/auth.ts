import bcrypt from 'bcryptjs';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { query, execute } from '../db/mysql.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { syncSessionMetadata } from '../utils/session.js';

type UserRow = {
  id: string;
  account: string;
  name: string;
  password_hash: string;
  role: string;
  status: string;
  last_login_at: string | null;
};

const router = Router();

const loginSchema = z.object({
  account: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
});

const saveSession = (request: Request) => new Promise<void>((resolve, reject) => {
  request.session.save((error: unknown) => {
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
});

router.post('/login', asyncHandler(async (request, response) => {
  const payload = loginSchema.parse(request.body);
  const users = await query<UserRow[]>(
    `SELECT id, account, name, password_hash, role, status, last_login_at
     FROM users
     WHERE account = :account
     LIMIT 1`,
    { account: payload.account },
  );

  const user = users[0];
  if (!user || user.status !== '正常') {
    throw new HttpError(401, '账号或密码错误');
  }

  const passwordMatched = await bcrypt.compare(payload.password, user.password_hash);
  if (!passwordMatched) {
    throw new HttpError(401, '账号或密码错误');
  }

  await new Promise<void>((resolve, reject) => request.session.regenerate((error) => error ? reject(error) : resolve()));
  request.session.user = {
    id: user.id,
    account: user.account,
    name: user.name,
    role: user.role,
  };
  request.session.lastActivityAt = Date.now();

  await saveSession(request);
  await execute('UPDATE users SET last_login_at = NOW() WHERE id = :id', { id: user.id });
  await syncSessionMetadata(request);

  response.json({
    user: {
      id: user.id,
      account: user.account,
      name: user.name,
      role: user.role,
      lastLoginAt: user.last_login_at,
    },
  });
}));

router.get('/me', asyncHandler(async (request, response) => {
  if (!request.session.user) {
    throw new HttpError(401, '未登录');
  }

  request.session.lastActivityAt = Date.now();
  await saveSession(request);
  await syncSessionMetadata(request);

  response.json({
    user: {
      ...request.session.user,
      lastActivityAt: request.session.lastActivityAt,
    },
  });
}));

router.post('/logout', asyncHandler(async (request, response) => {
  const sessionId = request.sessionID;
  await new Promise<void>((resolve, reject) => request.session.destroy((error) => error ? reject(error) : resolve()));
  if (sessionId) {
    await execute('DELETE FROM auth_sessions WHERE session_id = :sessionId', { sessionId });
  }
  response.json({ success: true });
}));

export const authRouter = router;
