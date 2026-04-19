import { DEFAULT_MODULE_PROMPTS } from './prompt-defaults';

export const PROMPT_MODULES = ['用户研究', '销转研究', '行业研究', '舆情研究', '员工研究'] as const;
export type PromptModule = typeof PROMPT_MODULES[number];

export const TODO_TYPES = ['产品方案', '市场营销', '设计优化', '车辆交付'] as const;
export const TODO_DEPARTMENTS = ['产品部', '研发部', '市场部', '设计部', '客服部'] as const;
export const TODO_STATUSES = ['待跟进', '跟进中', '已完成', '已暂停', '暂不采纳'] as const;

export type TodoStatus = typeof TODO_STATUSES[number];
export type PromptVersionStatus = '草稿' | '已发布' | '已归档';

export interface TodoItem {
  id: number;
  type: string;
  content: string;
  mentions: number;
  dept: string;
  progressText: string;
  status: TodoStatus;
  sourceModule?: string;
  sourceDocumentName?: string;
  sourceBusinessLine?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromptVersion {
  id: string;
  recordId?: string;
  status: PromptVersionStatus;
  date: string;
  content: string;
}

export type PromptVersionsByModule = Record<PromptModule, PromptVersion[]>;

export const BUSINESS_LINE_OPTIONS = ['超级订阅', '灵活订阅', '其他'] as const;

export const createDefaultPromptVersions = (): PromptVersionsByModule => ({
  用户研究: [
    { id: 'v1.1', status: '已发布', date: '2026-04-10', content: DEFAULT_MODULE_PROMPTS.用户研究 },
    { id: 'v1.0', status: '已归档', date: '2026-03-01', content: '旧的用户研究提示词内容...' },
  ],
  销转研究: [
    { id: 'v1.0', status: '已发布', date: '2026-04-08', content: DEFAULT_MODULE_PROMPTS.销转研究 },
  ],
  行业研究: [
    { id: 'v1.0', status: '已发布', date: '2026-04-08', content: DEFAULT_MODULE_PROMPTS.行业研究 },
  ],
  舆情研究: [
    { id: 'v1.0', status: '已发布', date: '2026-04-08', content: DEFAULT_MODULE_PROMPTS.舆情研究 },
  ],
  员工研究: [
    { id: 'v1.0', status: '已发布', date: '2026-04-08', content: DEFAULT_MODULE_PROMPTS.员工研究 },
  ],
});
