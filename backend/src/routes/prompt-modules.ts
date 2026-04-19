import { Router } from 'express';
import { z } from 'zod';
import { execute, query } from '../db/mysql.js';
import { ADMIN_ROLE, requireRoles } from '../middlewares/authorization.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/http.js';
import { createId } from '../utils/ids.js';

const router = Router();

const createVersionSchema = z.object({
  content: z.string().min(1),
  status: z.enum(['草稿', '已发布', '已归档']).default('草稿'),
});

const toVersionResponse = (row: any) => ({
  recordId: row.record_id,
  id: row.version_label,
  status: row.status,
  date: row.published_at || row.updated_at || row.created_at,
  content: row.content,
});

const getNextVersionLabel = (rows: any[]) => {
  const maxValue = rows.reduce((currentMax, row) => {
    const numericValue = Number.parseFloat(String(row.version_label || '').replace('v', ''));
    return Number.isFinite(numericValue) && numericValue > currentMax ? numericValue : currentMax;
  }, 0);

  return `v${(maxValue + 0.1).toFixed(1)}`;
};

router.use(requireAuth);

router.get('/', requireRoles(ADMIN_ROLE), asyncHandler(async (_request, response) => {
  const rows = await query<any[]>(
    `SELECT m.code, m.name, pv.version_label AS published_version_label
     FROM prompt_modules m
     LEFT JOIN prompt_versions pv
       ON pv.module_code = m.code AND pv.status = '已发布'
     ORDER BY m.code`,
  );
  response.json({ items: rows });
}));

router.get('/:code/versions', requireRoles(ADMIN_ROLE), asyncHandler(async (request, response) => {
  const rows = await query<any[]>(
    `SELECT *
     FROM prompt_versions
     WHERE module_code = :code
     ORDER BY created_at DESC`,
    { code: request.params.code },
  );
  response.json({ items: rows.map(toVersionResponse) });
}));

router.post('/:code/versions', requireRoles(ADMIN_ROLE), asyncHandler(async (request, response) => {
  const payload = createVersionSchema.parse(request.body);
  const existingRows = await query<any[]>(
    'SELECT version_label FROM prompt_versions WHERE module_code = :code ORDER BY created_at DESC',
    { code: request.params.code },
  );

  const recordId = createId();
  const versionLabel = getNextVersionLabel(existingRows);

  if (payload.status === '已发布') {
    await execute(
      `UPDATE prompt_versions SET status = '已归档' WHERE module_code = :code AND status = '已发布'`,
      { code: request.params.code },
    );
  }

  await execute(
    `INSERT INTO prompt_versions
      (record_id, module_code, version_label, status, content, created_by, published_at)
     VALUES
      (:recordId, :moduleCode, :versionLabel, :status, :content, :createdBy, :publishedAt)`,
    {
      recordId,
      moduleCode: request.params.code,
      versionLabel,
      status: payload.status,
      content: payload.content,
      createdBy: request.session.user!.id,
      publishedAt: payload.status === '已发布' ? new Date() : null,
    },
  );

  const rows = await query<any[]>('SELECT * FROM prompt_versions WHERE record_id = :recordId LIMIT 1', { recordId });
  response.json({ item: toVersionResponse(rows[0]) });
}));

export const promptModulesRouter = router;
