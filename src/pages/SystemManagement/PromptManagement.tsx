import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Save, Send, RotateCcw, AlertCircle, X } from 'lucide-react';
import { globalStore, PROMPT_MODULES, type PromptModule, type PromptVersion } from '@/lib/store';

export const PromptManagement = () => {
  const [activeModule, setActiveModule] = useState<PromptModule>('用户研究');
  const [versions, setVersions] = useState<PromptVersion[]>(() => globalStore.getPromptVersions('用户研究'));
  const [activeVersionId, setActiveVersionId] = useState(() => globalStore.getPublishedPromptVersion('用户研究')?.id ?? globalStore.getPromptVersions('用户研究')[0]?.id ?? '');
  const [editorContent, setEditorContent] = useState(() => globalStore.getPublishedPrompt('用户研究'));
  const [isPublishedNoticeVisible, setIsPublishedNoticeVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeVersion = useMemo(
    () => versions.find((version) => version.id === activeVersionId) ?? versions[0],
    [activeVersionId, versions],
  );

  useEffect(() => {
    const syncFromStore = () => {
      const moduleVersions = globalStore.getPromptVersions(activeModule);
      const currentPublishedVersion = globalStore.getPublishedPromptVersion(activeModule);
      setVersions(moduleVersions);
      setActiveVersionId((currentVersionId) => {
        if (moduleVersions.some((version) => version.id === currentVersionId)) {
          return currentVersionId;
        }
        return currentPublishedVersion?.id ?? moduleVersions[0]?.id ?? '';
      });
    };

    syncFromStore();
    const unsubscribe = globalStore.subscribe(syncFromStore);
    return unsubscribe;
  }, [activeModule]);

  useEffect(() => {
    setEditorContent(activeVersion?.content ?? '');
  }, [activeVersionId, activeVersion?.content]);

  const handleSaveDraft = async () => {
    setIsSaving(true);

    try {
      if (activeVersion?.status === '草稿' && activeVersion.recordId) {
        await globalStore.updatePromptVersion(activeModule, activeVersion.recordId, editorContent);
      } else {
        await globalStore.createPromptVersion(activeModule, editorContent, '草稿');
      }

      setActiveVersionId(globalStore.getPromptVersions(activeModule)[0]?.id ?? '');
      alert(`${activeModule} 提示词草稿已保存`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);

    try {
      if (activeVersion?.status === '草稿' && activeVersion.recordId) {
        await globalStore.publishPromptVersion(activeModule, activeVersion.recordId, editorContent);
      } else {
        await globalStore.publishPromptVersion(activeModule, undefined, editorContent);
      }

      setActiveVersionId(globalStore.getPromptVersions(activeModule)[0]?.id ?? '');
      alert(`${activeModule} 新版本已发布，后续分析会自动使用该版本提示词。`);
    } finally {
      setIsSaving(false);
    }
  };

  const isEditingDraft = activeVersion?.status === '草稿' || activeVersion?.content !== editorContent;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      <Card className="w-64 shrink-0 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">核心模块</h2>
        </div>
        <div className="p-2 space-y-1">
          {PROMPT_MODULES.map((module) => (
            <button
              key={module}
              onClick={() => setActiveModule(module)}
              className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeModule === module
                  ? 'bg-slate-100 text-[#00A854]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {module}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-900 text-lg">{activeModule} 提示词</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">版本历史:</span>
              <select
                className="h-8 rounded border border-slate-200 text-sm px-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#00A854]"
                value={activeVersionId}
                onChange={(event) => setActiveVersionId(event.target.value)}
              >
                {versions.map((version) => (
                  <option key={`${version.id}-${version.recordId || 'local'}`} value={version.id}>
                    {version.id} - {version.status} ({version.date})
                  </option>
                ))}
              </select>
              {activeVersion?.status === '已发布' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">使用中</Badge>}
              {activeVersion?.status === '草稿' && <Badge variant="outline" className="text-xs">草稿</Badge>}
              {activeVersion?.status === '已归档' && <Badge variant="default" className="text-xs">已归档</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 h-9" onClick={() => { void handleSaveDraft(); }} disabled={isSaving}>
              <Save className="w-4 h-4" />
              保存草稿
            </Button>
            <Button className="gap-2 h-9" onClick={() => { void handlePublish(); }} disabled={isSaving}>
              <Send className="w-4 h-4" />
              发布新版本
            </Button>
          </div>
        </div>

        <div className="flex-1 flex relative min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 p-6 flex flex-col">
            {activeVersion?.status !== '草稿' && isPublishedNoticeVisible && (
              <div className="mb-4 shrink-0 rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div className="flex-1 text-sm text-blue-800">
                    您正在查看<strong>{activeVersion?.status}</strong>版本。修改内容后保存或发布，将自动创建新版本，不会覆盖历史记录。
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
                    onClick={() => setIsPublishedNoticeVisible(false)}
                    aria-label="关闭提示"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <textarea
              className="w-full flex-1 min-h-0 resize-none overflow-y-auto font-mono text-sm leading-relaxed p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A854]/20 focus:border-[#00A854]"
              value={editorContent}
              onChange={(event) => setEditorContent(event.target.value)}
              placeholder="在此输入系统级 Prompt..."
            />
          </div>

          <div className="hidden lg:block w-80 min-h-0 border-l border-slate-100 bg-slate-50/50 p-6 overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              版本变更点
            </h3>
            <div className="space-y-4">
              {versions.slice(0, 2).map((version, index) => (
                <div
                  key={`${version.id}-${version.recordId || 'local'}`}
                  className={`relative pl-4 border-l-2 ${index === 0 ? 'border-[#00A854]' : 'border-slate-200'}`}
                >
                  <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${index === 0 ? 'bg-[#00A854]' : 'bg-slate-300'}`} />
                  <div className="text-sm font-medium text-slate-900">
                    {version.id} {version.status === '已发布' ? '(发布版)' : version.status === '草稿' ? '(草稿)' : '(历史)'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {version.status === '已发布' ? '当前页面正在被下游分析流程使用。' : '该版本保留为历史参考，不会直接参与分析。'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">{version.date} by 施任远</div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-slate-900 mb-4">关联影响分析</h3>
              <div className="bg-white border border-slate-200 rounded p-3 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>当前生效模块</span>
                  <span className="font-medium text-slate-900">{activeModule}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Token 消耗估算</span>
                  <span className="font-medium text-slate-900">中等 (≈3K tokens)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>影响下游模块</span>
                  <span className="text-[#00A854]">{activeModule === '用户研究' ? '访谈分析, 完整报告' : '待接入'}</span>
                </div>
              </div>
            </div>
            {isEditingDraft && (
              <div className="mt-4 text-xs text-amber-600">
                当前编辑内容尚未保存，切换模块或版本前建议先保存草稿。
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
