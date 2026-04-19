import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { execute, query } from '../db/mysql.js';
import { requireRoles, RESEARCH_EDITOR_ROLES, RESEARCH_VIEWER_ROLES } from '../middlewares/authorization.js';
import { requireAuth } from '../middlewares/auth.js';
import { analyzeInterviewDocument } from '../services/analysis.js';
import { parseDocumentFile } from '../services/document-parser.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { createId } from '../utils/ids.js';
import { redactSensitiveText } from '../utils/redaction.js';

const router = Router();

const decodeMultipartFilename = (value: string) => {
  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  const looksMojibake = /[ÃÂÆÐÑØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(value);
  const decodedHasReadableChars = /[\u4e00-\u9fffA-Za-z0-9]/.test(decoded);

  return looksMojibake && decodedHasReadableChars ? decoded : value;
};

const diskStorage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    const now = new Date();
    const relativeDir = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    const fullDir = path.join(env.STORAGE_ABS_ROOT, relativeDir);
    void fs.mkdir(fullDir, { recursive: true })
      .then(() => callback(null, fullDir))
      .catch((error: Error) => callback(error, fullDir));
  },
  filename: (_request, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

const upload = multer({
  storage: env.DOCUMENT_STORAGE_MODE === 'local' ? diskStorage : multer.memoryStorage(),
  limits: {
    fileSize: env.DOCUMENT_MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (ext !== 'docx' && ext !== 'txt') {
      callback(new HttpError(400, '当前真实分析暂只支持 docx 和 txt。pdf、png、jpg 等文件请先转成可复制文本后再上传。'));
      return;
    }
    callback(null, true);
  },
});

const documentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  businessLine: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
});

const serializeDocument = (row: any) => ({
  id: row.id,
  name: row.original_file_name,
  type: row.file_ext,
  businessLine: row.business_line,
  subject: row.subject,
  uploadTime: row.uploaded_at,
  promptModule: row.prompt_module_code,
  promptVersionId: row.prompt_version_label || '未记录',
  promptVersionRecordId: row.prompt_version_id,
  content: row.extracted_text,
  analysisResult: row.analysis_result ? (typeof row.analysis_result === 'string' ? JSON.parse(row.analysis_result) : row.analysis_result) : null,
  fileSizeBytes: row.file_size_bytes,
  llmProvider: row.llm_provider,
  llmModel: row.llm_model,
});

router.use(requireAuth);

router.get('/', requireRoles(...RESEARCH_VIEWER_ROLES), asyncHandler(async (request, response) => {
  const businessLine = typeof request.query.businessLine === 'string' ? request.query.businessLine : '';
  const queryText = typeof request.query.query === 'string' ? request.query.query.trim() : '';

  const rows = await query<any[]>(
    `SELECT *
     FROM research_documents
     WHERE (:businessLine = '' OR business_line = :businessLine)
       AND (:queryText = '' OR original_file_name LIKE CONCAT('%', :queryText, '%'))
     ORDER BY uploaded_at DESC`,
    { businessLine, queryText },
  );

  response.json({ items: rows.map(serializeDocument) });
}));

router.get('/:id', requireRoles(...RESEARCH_VIEWER_ROLES), asyncHandler(async (request, response) => {
  const rows = await query<any[]>('SELECT * FROM research_documents WHERE id = :id LIMIT 1', { id: request.params.id });
  if (rows.length === 0) {
    throw new HttpError(404, '文档不存在');
  }
  response.json({ item: serializeDocument(rows[0]) });
}));

router.post('/upload', requireRoles(...RESEARCH_EDITOR_ROLES), upload.single('file'), asyncHandler(async (request, response) => {
  if (!request.file) {
    throw new HttpError(400, '请先上传文档');
  }

  const originalFileName = decodeMultipartFilename(request.file.originalname);
  const businessLine = typeof request.body.businessLine === 'string' && request.body.businessLine.trim()
    ? request.body.businessLine.trim()
    : '超级订阅';
  const promptModuleCode = typeof request.body.promptModule === 'string' && request.body.promptModule.trim()
    ? request.body.promptModule.trim()
    : '用户研究';
  const subject = typeof request.body.subject === 'string' && request.body.subject.trim()
    ? request.body.subject.trim()
    : '未知对象';
  const fileExt = path.extname(originalFileName).toLowerCase().replace('.', '');
  const rawExtractedText = await parseDocumentFile({
    buffer: request.file.buffer,
    filePath: request.file.path,
  }, fileExt);
  const redactedDocument = redactSensitiveText(rawExtractedText);
  const extractedText = redactedDocument.text;

  const existingRows = await query<any[]>(
    `SELECT id, file_path FROM research_documents
     WHERE business_line = :businessLine AND original_file_name = :originalFileName
     LIMIT 1`,
    {
      businessLine,
      originalFileName,
    },
  );

  const storedFileName = env.DOCUMENT_STORAGE_MODE === 'local' ? request.file.filename : null;
  const relativePath = env.DOCUMENT_STORAGE_MODE === 'local' && request.file.path
    ? path.relative(env.PROJECT_ROOT, request.file.path)
    : null;

  let documentId = createId();
  if (existingRows.length > 0) {
    documentId = existingRows[0].id;
    if (existingRows[0].file_path && existingRows[0].file_path !== relativePath) {
      await fs.rm(path.resolve(env.PROJECT_ROOT, existingRows[0].file_path), { force: true });
    }

    await execute(
      `UPDATE research_documents
       SET stored_file_name = :storedFileName,
           file_path = :filePath,
           file_ext = :fileExt,
           file_size_bytes = :fileSizeBytes,
           subject = :subject,
           extracted_text = :extractedText,
           analysis_result = NULL,
           prompt_module_code = :promptModuleCode,
           prompt_version_id = NULL,
           prompt_version_label = NULL,
           llm_provider = NULL,
           llm_model = NULL,
           uploaded_by = :uploadedBy,
           uploaded_at = NOW(),
           analyzed_at = NULL
       WHERE id = :id`,
      {
        id: documentId,
        storedFileName,
        filePath: relativePath,
        fileExt,
        fileSizeBytes: request.file.size,
        subject,
        extractedText,
        promptModuleCode,
        uploadedBy: request.session.user!.id,
      },
    );
  } else {
    await execute(
      `INSERT INTO research_documents
        (id, original_file_name, stored_file_name, file_path, file_ext, file_size_bytes, business_line, subject, extracted_text, prompt_module_code, uploaded_by, uploaded_at)
       VALUES
        (:id, :originalFileName, :storedFileName, :filePath, :fileExt, :fileSizeBytes, :businessLine, :subject, :extractedText, :promptModuleCode, :uploadedBy, NOW())`,
      {
        id: documentId,
        originalFileName,
        storedFileName,
        filePath: relativePath,
        fileExt,
        fileSizeBytes: request.file.size,
        businessLine,
        subject,
        extractedText,
        promptModuleCode,
        uploadedBy: request.session.user!.id,
      },
    );
  }

  const rows = await query<any[]>('SELECT * FROM research_documents WHERE id = :id LIMIT 1', { id: documentId });
  response.json({ item: serializeDocument(rows[0]) });
}));

router.patch('/:id', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const payload = documentUpdateSchema.parse(request.body);
  await execute(
    `UPDATE research_documents
     SET original_file_name = COALESCE(:name, original_file_name),
         file_ext = COALESCE(:fileExt, file_ext),
         business_line = COALESCE(:businessLine, business_line),
         subject = COALESCE(:subject, subject)
     WHERE id = :id`,
    {
      id: request.params.id,
      name: payload.name ?? null,
      fileExt: payload.type ?? null,
      businessLine: payload.businessLine ?? null,
      subject: payload.subject ?? null,
    },
  );

  const rows = await query<any[]>('SELECT * FROM research_documents WHERE id = :id LIMIT 1', { id: request.params.id });
  if (rows.length === 0) {
    throw new HttpError(404, '文档不存在');
  }
  response.json({ item: serializeDocument(rows[0]) });
}));

router.delete('/:id', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const rows = await query<any[]>('SELECT file_path FROM research_documents WHERE id = :id LIMIT 1', { id: request.params.id });
  if (rows.length === 0) {
    throw new HttpError(404, '文档不存在');
  }
  await execute('DELETE FROM research_documents WHERE id = :id', { id: request.params.id });
  if (rows[0].file_path) {
    await fs.rm(path.resolve(env.PROJECT_ROOT, rows[0].file_path), { force: true });
  }
  response.json({ success: true });
}));

router.post('/:id/analyze', requireRoles(...RESEARCH_EDITOR_ROLES), asyncHandler(async (request, response) => {
  const documentRows = await query<any[]>(
    `SELECT * FROM research_documents WHERE id = :id LIMIT 1`,
    { id: request.params.id },
  );

  if (documentRows.length === 0) {
    throw new HttpError(404, '文档不存在');
  }

  const document = documentRows[0];
  const promptRows = await query<any[]>(
    `SELECT record_id, version_label, content
     FROM prompt_versions
     WHERE module_code = :moduleCode AND status = '已发布'
     ORDER BY created_at DESC
     LIMIT 1`,
    { moduleCode: document.prompt_module_code || '用户研究' },
  );

  if (promptRows.length === 0) {
    throw new HttpError(400, '当前模块没有已发布的提示词版本');
  }

  const promptVersion = promptRows[0];
  const {
    analysisResult,
    llmProvider,
    llmModel,
  } = await analyzeInterviewDocument(document.extracted_text, promptVersion.content);
  const personaName = (analysisResult as any)?.persona?.name;
  const nextSubject = typeof personaName === 'string' && personaName.trim()
    ? personaName.trim()
    : document.subject;

  await execute(
    `UPDATE research_documents
     SET analysis_result = :analysisResult,
         subject = :subject,
         prompt_version_id = :promptVersionId,
         prompt_version_label = :promptVersionLabel,
         llm_provider = :llmProvider,
         llm_model = :llmModel,
         analyzed_at = NOW()
     WHERE id = :id`,
    {
      id: request.params.id,
      analysisResult: JSON.stringify(analysisResult),
      subject: nextSubject,
      promptVersionId: promptVersion.record_id,
      promptVersionLabel: promptVersion.version_label,
      llmProvider,
      llmModel,
    },
  );

  const rows = await query<any[]>('SELECT * FROM research_documents WHERE id = :id LIMIT 1', { id: request.params.id });
  response.json({ item: serializeDocument(rows[0]) });
}));

export const documentsRouter = router;
