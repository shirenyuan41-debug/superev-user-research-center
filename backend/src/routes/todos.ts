import { Router } from 'express';
import { z } from 'zod';
import { execute, query } from '../db/mysql.js';
import { requireRoles, RESEARCH_EDITOR_ROLES } from '../middlewares/authorization.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { createTodoId } from '../utils/ids.js';

const router = Router();

const todoSchema = z.object({
  type: z.string().min(1),
  content: z.string().min(1),
  mentions: z.coerce.number().int().positive().default(1),
  dept: z.string().min(1),
  progressText: z.string().min(1),
  status: z.string().min(1).default('待跟进'),
  sourceModule: z.string().optional(),
  sourceDocumentId: z.string().optional(),
  sourceDocumentName: z.string().optional(),
  sourceBusinessLine: z.string().optional(),
});

const serializeTodo = (row: any) => ({
  id: Number(row.id),
  type: row.type,
  content: row.content,
  mentions: row.mentions,
  dept: row.dept,
  progressText: row.progress_text,
  status: row.status,
  sourceModule: row.source_module,
  sourceDocumentId: row.source_document_id,
  sourceDocumentName: row.source_document_name_snapshot,
  sourceBusinessLine: row.source_business_line_snapshot,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.use(requireAuth);

router.get('/', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const rows = await query<any[]>('SELECT * FROM todos ORDER BY created_at DESC');
  response.json({ items: rows.map(serializeTodo) });
}));

router.post('/', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const payload = todoSchema.parse(request.body);
  const id = createTodoId();
  await execute(
    `INSERT INTO todos
      (id, type, content, mentions, dept, progress_text, status, source_module, source_document_id, source_document_name_snapshot, source_business_line_snapshot, created_by, updated_by)
     VALUES
      (:id, :type, :content, :mentions, :dept, :progressText, :status, :sourceModule, :sourceDocumentId, :sourceDocumentName, :sourceBusinessLine, :createdBy, :updatedBy)`,
    {
      id,
      ...payload,
      createdBy: request.session.user!.id,
      updatedBy: request.session.user!.id,
    },
  );

  const rows = await query<any[]>('SELECT * FROM todos WHERE id = :id LIMIT 1', { id });
  response.json({ item: serializeTodo(rows[0]) });
}));

router.patch('/:id', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const payload = todoSchema.partial().parse(request.body);
  await execute(
    `UPDATE todos
     SET type = COALESCE(:type, type),
         content = COALESCE(:content, content),
         mentions = COALESCE(:mentions, mentions),
         dept = COALESCE(:dept, dept),
         progress_text = COALESCE(:progressText, progress_text),
         status = COALESCE(:status, status),
         source_module = COALESCE(:sourceModule, source_module),
         source_document_id = COALESCE(:sourceDocumentId, source_document_id),
         source_document_name_snapshot = COALESCE(:sourceDocumentName, source_document_name_snapshot),
         source_business_line_snapshot = COALESCE(:sourceBusinessLine, source_business_line_snapshot),
         updated_by = :updatedBy
     WHERE id = :id`,
    {
      id: Number(request.params.id),
      ...payload,
      updatedBy: request.session.user!.id,
    },
  );

  const rows = await query<any[]>('SELECT * FROM todos WHERE id = :id LIMIT 1', { id: Number(request.params.id) });
  if (rows.length === 0) {
    throw new HttpError(404, 'Todo 不存在');
  }
  response.json({ item: serializeTodo(rows[0]) });
}));

router.delete('/:id', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  await execute('DELETE FROM todos WHERE id = :id', { id: Number(request.params.id) });
  response.json({ success: true });
}));

export const todosRouter = router;
