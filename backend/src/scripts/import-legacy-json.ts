import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ensureRuntimeBootstrap } from '../db/bootstrap.js';
import { execute, query } from '../db/mysql.js';
import { createId } from '../utils/ids.js';

const documentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  businessLine: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().default(''),
  analysisResult: z.any().optional(),
  promptModule: z.string().optional(),
  promptVersionId: z.string().optional(),
  uploadTime: z.string().optional(),
});

const feedbackSchema = z.object({
  id: z.string().optional(),
  module: z.string().default('访谈分析'),
  businessLine: z.string().default('超级订阅'),
  type: z.enum(['up', 'down']).default('down'),
  issue: z.string().default('内容有待优化'),
  feedback: z.string().default(''),
  sourceVoice: z.string().default(''),
  aiEvaluation: z.string().default(''),
  aiSuggestion: z.string().default(''),
  createdAt: z.union([z.number(), z.string()]).optional(),
});

const todoSchema = z.object({
  id: z.number().optional(),
  type: z.string().default('产品方案'),
  content: z.string().default(''),
  mentions: z.number().default(1),
  dept: z.string().default('产品部'),
  progressText: z.string().default('待跟进'),
  status: z.string().default('待跟进'),
  sourceModule: z.string().optional(),
  sourceDocumentName: z.string().optional(),
  sourceBusinessLine: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const promptVersionSchema = z.record(z.array(z.object({
  id: z.string(),
  status: z.enum(['草稿', '已发布', '已归档']),
  date: z.string(),
  content: z.string(),
})));

const payloadSchema = z.object({
  documents: z.array(documentSchema).default([]),
  feedbacks: z.array(feedbackSchema).default([]),
  todos: z.array(todoSchema).default([]),
  promptVersionsByModule: promptVersionSchema.default({}),
});

type PromptVersionsByModulePayload = Record<string, Array<{
  id: string;
  status: '草稿' | '已发布' | '已归档';
  date: string;
  content: string;
}>>;

const run = async () => {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('请传入待导入的 JSON 文件路径');
  }

  await ensureRuntimeBootstrap();
  const raw = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf8');
  const payload = payloadSchema.parse(JSON.parse(raw));
  const payloadHash = crypto.createHash('sha256').update(raw).digest('hex');

  const existingBatches = await query<{ id: string }[]>(
    'SELECT id FROM legacy_import_batches WHERE payload_hash = :payloadHash LIMIT 1',
    { payloadHash },
  );
  if (existingBatches.length > 0) {
    console.log('该导入包已处理过，跳过');
    return;
  }

  const adminRows = await query<{ id: string }[]>('SELECT id FROM users WHERE account = :account LIMIT 1', { account: env.ADMIN_ACCOUNT });
  const adminUserId = adminRows[0]?.id;
  if (!adminUserId) {
    throw new Error('未找到管理员账号，无法导入');
  }

  for (const document of payload.documents) {
    const id = document.id || createId();
    await execute(
      `INSERT INTO research_documents
        (id, original_file_name, stored_file_name, file_path, file_ext, file_size_bytes, business_line, subject, extracted_text, analysis_result, prompt_module_code, prompt_version_label, uploaded_by, uploaded_at)
       VALUES
        (:id, :originalFileName, NULL, NULL, :fileExt, 0, :businessLine, :subject, :extractedText, :analysisResult, :promptModuleCode, :promptVersionLabel, :uploadedBy, COALESCE(:uploadedAt, NOW()))
       ON DUPLICATE KEY UPDATE
        subject = VALUES(subject),
        extracted_text = VALUES(extracted_text),
        analysis_result = VALUES(analysis_result),
        prompt_module_code = VALUES(prompt_module_code),
        prompt_version_label = VALUES(prompt_version_label),
        uploaded_at = VALUES(uploaded_at)`,
      {
        id,
        originalFileName: document.name,
        fileExt: document.type || path.extname(document.name).replace('.', '') || 'txt',
        businessLine: document.businessLine || '超级订阅',
        subject: document.subject || '未知对象',
        extractedText: document.content,
        analysisResult: document.analysisResult ? JSON.stringify(document.analysisResult) : null,
        promptModuleCode: document.promptModule || '用户研究',
        promptVersionLabel: document.promptVersionId || null,
        uploadedBy: adminUserId,
        uploadedAt: document.uploadTime || null,
      },
    );
  }

  for (const feedback of payload.feedbacks) {
    await execute(
      `INSERT INTO feedbacks
        (id, module, business_line, type, issue, feedback_text, source_voice, ai_evaluation, ai_suggestion, created_by, created_at)
       VALUES
        (:id, :module, :businessLine, :type, :issue, :feedback, :sourceVoice, :aiEvaluation, :aiSuggestion, :createdBy, COALESCE(:createdAt, NOW()))
       ON DUPLICATE KEY UPDATE
        issue = VALUES(issue),
        feedback_text = VALUES(feedback_text),
        source_voice = VALUES(source_voice),
        ai_evaluation = VALUES(ai_evaluation),
        ai_suggestion = VALUES(ai_suggestion)`,
      {
        id: feedback.id || createId(),
        module: feedback.module,
        businessLine: feedback.businessLine,
        type: feedback.type,
        issue: feedback.issue,
        feedback: feedback.feedback,
        sourceVoice: feedback.sourceVoice,
        aiEvaluation: feedback.aiEvaluation,
        aiSuggestion: feedback.aiSuggestion,
        createdBy: adminUserId,
        createdAt: feedback.createdAt ? new Date(feedback.createdAt) : null,
      },
    );
  }

  for (const todo of payload.todos) {
    await execute(
      `INSERT INTO todos
        (id, type, content, mentions, dept, progress_text, status, source_module, source_document_name_snapshot, source_business_line_snapshot, created_by, updated_by, created_at, updated_at)
       VALUES
        (:id, :type, :content, :mentions, :dept, :progressText, :status, :sourceModule, :sourceDocumentName, :sourceBusinessLine, :createdBy, :updatedBy, COALESCE(:createdAt, NOW()), COALESCE(:updatedAt, NOW()))
       ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        content = VALUES(content),
        mentions = VALUES(mentions),
        dept = VALUES(dept),
        progress_text = VALUES(progress_text),
        status = VALUES(status),
        source_module = VALUES(source_module),
        source_document_name_snapshot = VALUES(source_document_name_snapshot),
        source_business_line_snapshot = VALUES(source_business_line_snapshot),
        updated_at = VALUES(updated_at)`,
      {
        id: todo.id || Number(createId().slice(-12)),
        type: todo.type,
        content: todo.content,
        mentions: todo.mentions,
        dept: todo.dept,
        progressText: todo.progressText,
        status: todo.status,
        sourceModule: todo.sourceModule || null,
        sourceDocumentName: todo.sourceDocumentName || null,
        sourceBusinessLine: todo.sourceBusinessLine || null,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: todo.createdAt || null,
        updatedAt: todo.updatedAt || null,
      },
    );
  }

  for (const [moduleCode, versions] of Object.entries(payload.promptVersionsByModule as PromptVersionsByModulePayload)) {
    for (const version of versions) {
      if (version.status === '已发布') {
        await execute(
          `UPDATE prompt_versions
           SET status = '已归档'
           WHERE module_code = :moduleCode AND status = '已发布'`,
          { moduleCode },
        );
      }

      await execute(
        `INSERT INTO prompt_versions
          (record_id, module_code, version_label, status, content, created_by, published_at)
         VALUES
          (:recordId, :moduleCode, :versionLabel, :status, :content, :createdBy, :publishedAt)
         ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          content = VALUES(content),
          published_at = VALUES(published_at)`,
        {
          recordId: createId(),
          moduleCode,
          versionLabel: version.id,
          status: version.status,
          content: version.content,
          createdBy: adminUserId,
          publishedAt: version.status === '已发布' ? version.date : null,
        },
      );
    }
  }

  await execute(
    `INSERT INTO legacy_import_batches (id, payload_hash, file_name, imported_by, summary)
     VALUES (:id, :payloadHash, :fileName, :importedBy, :summary)`,
    {
      id: createId(),
      payloadHash,
      fileName: path.basename(filePath),
      importedBy: adminUserId,
      summary: JSON.stringify({
        documents: payload.documents.length,
        feedbacks: payload.feedbacks.length,
        todos: payload.todos.length,
        promptModules: Object.keys(payload.promptVersionsByModule).length,
      }),
    },
  );

  console.log('历史数据导入完成');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
