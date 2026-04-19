import React from 'react';
import { Button, Card } from '@/components/ui';

const LEGACY_KEYS = {
  documents: 'superev_documents',
  feedbacks: 'superev_feedbacks',
  todos: 'superev_todos',
  promptVersionsByModule: 'superev_prompt_versions_by_module',
} as const;

const readJson = (key: string) => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const LegacyExport = () => {
  const handleExport = () => {
    const payload = {
      documents: readJson(LEGACY_KEYS.documents),
      feedbacks: readJson(LEGACY_KEYS.feedbacks),
      todos: readJson(LEGACY_KEYS.todos),
      promptVersionsByModule: readJson(LEGACY_KEYS.promptVersionsByModule),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `superev-legacy-export-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-xl w-full p-8 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">旧数据导出</h1>
        <p className="text-sm text-slate-600 leading-6">
          这个页面只用于迁移旧版 `localStorage` 数据。点击导出后，会生成包含文档、反馈、Todo 和提示词版本的 JSON 文件，
          后续可用 `backend` 里的导入脚本写入 MySQL。
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          访问方式：开发环境打开 `?page=legacy-export`。
        </div>
        <Button onClick={handleExport}>导出旧数据 JSON</Button>
      </Card>
    </div>
  );
};
