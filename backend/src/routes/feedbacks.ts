import { Router } from 'express';
import { z } from 'zod';
import { execute, query } from '../db/mysql.js';
import { requireRoles, RESEARCH_EDITOR_ROLES } from '../middlewares/authorization.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { createId } from '../utils/ids.js';

const router = Router();

const feedbackSchema = z.object({
  module: z.string().min(1),
  businessLine: z.string().min(1),
  type: z.enum(['up', 'down']),
  issue: z.string().min(1),
  feedback: z.string().min(0).default(''),
  sourceVoice: z.string().min(0).default(''),
  aiEvaluation: z.string().min(1),
  aiSuggestion: z.string().min(1),
  sourceDocumentId: z.string().optional(),
});

const serializeFeedback = (row: any) => ({
  id: row.id,
  module: row.module,
  businessLine: row.business_line,
  type: row.type,
  issue: row.issue,
  feedback: row.feedback_text,
  sourceVoice: row.source_voice,
  aiEvaluation: row.ai_evaluation,
  analysisSummary: row.ai_evaluation,
  suggestion: row.ai_suggestion,
  aiSuggestion: row.ai_suggestion,
  sourceDocumentId: row.source_document_id,
  timestamp: row.created_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.use(requireAuth);

router.get('/', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const rows = await query<any[]>('SELECT * FROM feedbacks ORDER BY created_at DESC');
  response.json({ items: rows.map(serializeFeedback) });
}));

router.post('/', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const payload = feedbackSchema.parse(request.body);
  const id = createId();
  await execute(
    `INSERT INTO feedbacks
      (id, module, business_line, type, issue, feedback_text, source_voice, ai_evaluation, ai_suggestion, source_document_id, created_by)
     VALUES
      (:id, :module, :businessLine, :type, :issue, :feedback, :sourceVoice, :aiEvaluation, :aiSuggestion, :sourceDocumentId, :createdBy)`,
    {
      id,
      ...payload,
      createdBy: request.session.user!.id,
    },
  );

  const rows = await query<any[]>('SELECT * FROM feedbacks WHERE id = :id LIMIT 1', { id });
  response.json({ item: serializeFeedback(rows[0]) });
}));

router.patch('/:id', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const payload = feedbackSchema.partial().parse(request.body);
  await execute(
    `UPDATE feedbacks
     SET module = COALESCE(:module, module),
         business_line = COALESCE(:businessLine, business_line),
         type = COALESCE(:type, type),
         issue = COALESCE(:issue, issue),
         feedback_text = COALESCE(:feedback, feedback_text),
         source_voice = COALESCE(:sourceVoice, source_voice),
         ai_evaluation = COALESCE(:aiEvaluation, ai_evaluation),
         ai_suggestion = COALESCE(:aiSuggestion, ai_suggestion),
         source_document_id = COALESCE(:sourceDocumentId, source_document_id)
     WHERE id = :id`,
    {
      id: request.params.id,
      ...payload,
    },
  );

  const rows = await query<any[]>('SELECT * FROM feedbacks WHERE id = :id LIMIT 1', { id: request.params.id });
  if (rows.length === 0) {
    throw new HttpError(404, '反馈不存在');
  }
  response.json({ item: serializeFeedback(rows[0]) });
}));

export const feedbacksRouter = router;
