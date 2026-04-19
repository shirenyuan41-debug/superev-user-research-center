import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http.js';

export const ADMIN_ROLE = '管理员';

export const RESEARCH_EDITOR_ROLES = [ADMIN_ROLE, '用研角色'] as const;
export const RESEARCH_VIEWER_ROLES = [...RESEARCH_EDITOR_ROLES, '销售角色'] as const;

export const requireRoles = (...roles: readonly string[]) => (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const userRole = request.session.user?.role;

  if (!userRole) {
    next(new HttpError(401, '请先登录'));
    return;
  }

  if (!roles.includes(userRole)) {
    next(new HttpError(403, '当前账号暂无该操作权限'));
    return;
  }

  next();
};
