import type { Request } from 'express';
import { execute } from '../db/mysql.js';

export const syncSessionMetadata = async (request: Request) => {
  if (!request.sessionID) {
    return;
  }

  const expires = request.session.cookie.expires ? new Date(request.session.cookie.expires) : null;
  const userId = request.session.user?.id ?? null;

  await execute(
    `INSERT INTO auth_sessions
      (session_id, expires, data, user_id, expires_at, last_activity_at, ip, user_agent)
     VALUES
      (:sessionId, :expiresUnix, '', :userId, :expiresAt, NOW(), :ip, :userAgent)
     ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      expires_at = VALUES(expires_at),
      last_activity_at = VALUES(last_activity_at),
      ip = VALUES(ip),
      user_agent = VALUES(user_agent)`,
    {
      userId,
      expiresAt: expires,
      expiresUnix: expires ? Math.floor(expires.getTime() / 1000) : 0,
      ip: request.ip,
      userAgent: request.headers['user-agent']?.slice(0, 255) ?? null,
      sessionId: request.sessionID,
    },
  );
};
