import { Router } from 'express';
import { z } from 'zod';
import { execute, query } from '../db/mysql.js';
import { ADMIN_ROLE, requireRoles } from '../middlewares/authorization.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

const updateVersionSchema = z.object({
  content: z.string().min(1),
});

const toVersionResponse = (row: any) => ({
  recordId: row.record_id,
  id: row.version_label,
  status: row.status,
  date: row.published_at || row.updated_at || row.created_at,
  content: row.content,
});

router.use(requireAuth);

router.patch('/:recordId', requireRoles(ADMIN_ROLE), asyncHandler(async (request, response) => {
  const payload = updateVersionSchema.parse(request.body);
  await execute(
    `UPDATE prompt_versions
     SET content = :content
     WHERE record_id = :recordId`,
    {
      recordId: request.params.recordId,
      content: payload.content,
    },
  );

  const rows = await query<any[]>('SELECT * FROM prompt_versions WHERE record_id = :recordId LIMIT 1', { recordId: request.params.recordId });
  if (rows.length === 0) {
    throw new HttpError(404, '提示词版本不存在');
  }
  response.json({ item: toVersionResponse(rows[0]) });
}));

router.post('/:recordId/publish', requireRoles(ADMIN_ROLE), asyncHandler(async (request, response) => {
  const rows = await query<any[]>('SELECT * FROM prompt_versions WHERE record_id = :recordId LIMIT 1', { recordId: request.params.recordId });
  if (rows.length === 0) {
    throw new HttpError(404, '提示词版本不存在');
  }

  const version = rows[0];
  await execute(
    `UPDATE prompt_versions
     SET status = '已归档'
     WHERE module_code = :moduleCode AND status = '已发布'`,
    { moduleCode: version.module_code },
  );

  await execute(
    `UPDATE prompt_versions
     SET status = '已发布', published_at = NOW()
     WHERE record_id = :recordId`,
    { recordId: request.params.recordId },
  );

  const refreshedRows = await query<any[]>('SELECT * FROM prompt_versions WHERE record_id = :recordId LIMIT 1', { recordId: request.params.recordId });
  response.json({ item: toVersionResponse(refreshedRows[0]) });
}));

export const promptVersionsRouter = router;
