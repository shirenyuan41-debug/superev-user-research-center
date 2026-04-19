import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import { ulid } from 'ulid';
import { env } from '../config/env.js';
import { DEFAULT_MODULE_PROMPTS } from '../constants/prompt-defaults.js';
import { query, execute } from './mysql.js';

const MODULE_LABELS = [
  { code: '用户研究', name: '用户研究' },
  { code: '销转研究', name: '销转研究' },
  { code: '行业研究', name: '行业研究' },
  { code: '舆情研究', name: '舆情研究' },
  { code: '员工研究', name: '员工研究' },
] as const;

const DEFAULT_PROMPT_VERSIONS = [
  { moduleCode: '用户研究', versionLabel: 'v1.1', status: '已发布', publishedAt: '2026-04-10 00:00:00', content: DEFAULT_MODULE_PROMPTS.用户研究 },
  { moduleCode: '用户研究', versionLabel: 'v1.0', status: '已归档', publishedAt: null, content: '旧的用户研究提示词内容...' },
  { moduleCode: '销转研究', versionLabel: 'v1.0', status: '已发布', publishedAt: '2026-04-08 00:00:00', content: DEFAULT_MODULE_PROMPTS.销转研究 },
  { moduleCode: '行业研究', versionLabel: 'v1.0', status: '已发布', publishedAt: '2026-04-08 00:00:00', content: DEFAULT_MODULE_PROMPTS.行业研究 },
  { moduleCode: '舆情研究', versionLabel: 'v1.0', status: '已发布', publishedAt: '2026-04-08 00:00:00', content: DEFAULT_MODULE_PROMPTS.舆情研究 },
  { moduleCode: '员工研究', versionLabel: 'v1.0', status: '已发布', publishedAt: '2026-04-08 00:00:00', content: DEFAULT_MODULE_PROMPTS.员工研究 },
] as const;

export const ensureStorageRoot = async () => {
  await fs.mkdir(env.STORAGE_ABS_ROOT, { recursive: true });
};

export const ensureSeedUser = async () => {
  const existingUsers = await query<{ id: string }[]>(
    'SELECT id FROM users WHERE account = :account LIMIT 1',
    { account: env.ADMIN_ACCOUNT },
  );

  if (existingUsers.length > 0) {
    return existingUsers[0].id;
  }

  const id = ulid();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await execute(
    `INSERT INTO users (id, account, name, password_hash, role, status)
     VALUES (:id, :account, :name, :passwordHash, :role, '正常')`,
    {
      id,
      account: env.ADMIN_ACCOUNT,
      name: env.ADMIN_NAME,
      passwordHash,
      role: env.ADMIN_ROLE,
    },
  );

  return id;
};

export const ensurePromptSeedData = async (adminUserId: string) => {
  for (const module of MODULE_LABELS) {
    await execute(
      `INSERT INTO prompt_modules (code, name)
       VALUES (:code, :name)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      module,
    );
  }

  for (const version of DEFAULT_PROMPT_VERSIONS) {
    const existing = await query<{ record_id: string }[]>(
      `SELECT record_id FROM prompt_versions
       WHERE module_code = :moduleCode AND version_label = :versionLabel
       LIMIT 1`,
      version,
    );

    if (existing.length > 0) {
      continue;
    }

    await execute(
      `INSERT INTO prompt_versions
        (record_id, module_code, version_label, status, content, created_by, published_at)
       VALUES
        (:recordId, :moduleCode, :versionLabel, :status, :content, :createdBy, :publishedAt)`,
      {
        recordId: ulid(),
        moduleCode: version.moduleCode,
        versionLabel: version.versionLabel,
        status: version.status,
        content: version.content,
        createdBy: adminUserId,
        publishedAt: version.publishedAt,
      },
    );
  }
};

export const ensureRuntimeBootstrap = async () => {
  await ensureStorageRoot();
  const adminUserId = await ensureSeedUser();
  await ensurePromptSeedData(adminUserId);
};
