import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Tabs } from '@/components/ui';
import { Upload, FileText, ThumbsUp, ThumbsDown, MessageSquarePlus, BookmarkPlus, Download, ChevronDown, Loader2, Plus, CheckCircle2, Zap, X } from 'lucide-react';
import { buildSpectrumTrack, normalizeAnalysisResult } from '@/lib/gemini';
import { buildAiEvaluationSummary, buildAiSuggestionFromFeedback, inferFeedbackIssue } from '@/lib/feedback';
import { ApiError, buildApiUrl, getConfiguredApiBaseUrl } from '@/lib/api';
import { globalStore, TODO_DEPARTMENTS, TODO_TYPES } from '@/lib/store';
import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TODO_TYPE_TO_DEFAULT_DEPT: Record<string, string> = {
  产品方案: '产品部',
  市场营销: '市场部',
  设计优化: '设计部',
  车辆交付: '客服部',
};

type TodoSuggestionOption = {
  key: string;
  todoType: string;
  dept: string;
  content: string;
  hint: string;
};

type UnifiedActionRow = {
  key: string;
  todoType: string;
  dept: string;
  suggestionType: string;
  problemDescription: string;
  userVoice: string;
  actionDirection: string;
  insightRef: string;
};

const getCleanText = (value: unknown, fallback: string) => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const getInsightContextByRef = (result: any, insightRef: unknown) => {
  const insights = Array.isArray(result?.insights) ? result.insights : [];
  const matched = String(insightRef ?? '').match(/洞察#\s*(\d+)/);

  if (!matched) {
    return null;
  }

  const index = Number(matched[1]) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= insights.length) {
    return null;
  }

  return insights[index];
};

const normalizeSuggestionTypeLabel = (value: unknown, fallback: string) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }

  const normalized = text
    .toLowerCase()
    .replace(/[\/_|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const mapping: Record<string, string> = {
    'new feature': '新功能',
    'feature enhancement': '功能增强',
    'enhancement': '功能增强',
    'bug fix': '问题修复',
    'ux optimization': '体验优化',
    'ui optimization': '界面优化',
    'process optimization': '流程优化',
    'copy optimization': '文案优化',
    'content strategy': '内容策略',
    'messaging optimization': '话术优化',
    'operation optimization': '运营优化',
    'design optimization': '设计优化',
    'product strategy': '产品策略',
    'pricing strategy': '定价策略',
    'business expansion': '业务拓展',
    'market expansion': '市场拓展',
    'channel expansion': '渠道拓展',
    'service upgrade': '服务升级',
    'service optimization': '服务优化',
    'retention strategy': '留存策略',
    'retention program': '留存计划',
    'retention plan': '留存计划',
    'user education': '用户教育',
    'local service': '本地服务',
    'partnership': '合作拓展',
    'partnership expansion': '合作拓展',
    'product expansion': '产品拓展',
    'partnership product expansion': '合作/产品拓展',
    'business growth': '业务增长',
    'experience improvement': '体验改进',
  };

  if (mapping[normalized]) {
    return mapping[normalized];
  }

  const has = (...keywords: string[]) => keywords.every((keyword) => normalized.includes(keyword));

  if (has('partnership', 'product', 'expansion')) {
    return '合作/产品拓展';
  }
  if (has('retention')) {
    return '留存计划';
  }
  if (has('business', 'expansion')) {
    return '业务拓展';
  }
  if (has('product', 'expansion')) {
    return '产品拓展';
  }
  if (has('partnership', 'expansion') || has('partnership')) {
    return '合作拓展';
  }
  if (has('market', 'expansion')) {
    return '市场拓展';
  }
  if (has('channel', 'expansion')) {
    return '渠道拓展';
  }
  if (has('service', 'upgrade')) {
    return '服务升级';
  }
  if (has('service', 'optimization')) {
    return '服务优化';
  }
  if (has('pricing')) {
    return '定价策略';
  }
  if (has('education')) {
    return '用户教育';
  }

  return text;
};

const normalizePriorityLabel = (value: unknown, fallback: string) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }

  const normalized = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const mapping: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
    urgent: '高',
    immediate: '高',
    critical: '高',
    normal: '中',
    moderate: '中',
    planned: '低',
    backlog: '低',
  };

  return mapping[normalized] || text;
};

const normalizeLoadLabel = (value: unknown, fallback: string) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }

  const normalized = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const mapping: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
    heavy: '高',
    moderate: '中',
    light: '低',
  };

  return mapping[normalized] || text;
};

const inferMarketingSuggestionType = (item: any) => {
  const actionText = String(item?.action || '').trim();

  if (/话术/.test(actionText)) {
    return '话术优化';
  }
  if (/内容|投放|传播|宣传/.test(actionText)) {
    return '内容策略';
  }
  if (/运营/.test(actionText)) {
    return '运营优化';
  }

  return '市场营销';
};

const inferDesignSuggestionType = (item: any) => {
  const combinedText = `${String(item?.module || '')} ${String(item?.problem || '')} ${String(item?.suggest || '')}`;

  if (/流程|步骤|路径/.test(combinedText)) {
    return '流程优化';
  }
  if (/文案|提示|说明/.test(combinedText)) {
    return '文案优化';
  }

  return '设计优化';
};

const buildUnifiedActionRows = (result: any): UnifiedActionRow[] => {
  const productActions = Array.isArray(result?.actions?.product) ? result.actions.product : [];
  const marketingActions = Array.isArray(result?.actions?.marketing) ? result.actions.marketing : [];
  const designActions = Array.isArray(result?.actions?.design) ? result.actions.design : [];

  return [
    ...productActions.map((item: any, index: number) => {
      const insight = getInsightContextByRef(result, item?.insightRef);

      return {
        key: `product-${index}`,
        todoType: '产品方案',
        dept: '产品部',
        suggestionType: normalizeSuggestionTypeLabel(item?.type, '产品方案'),
        problemDescription: getCleanText(insight?.observation || insight?.insight, '未补充问题描述'),
        userVoice: getCleanText(insight?.voc, '未补充用户原生词汇'),
        actionDirection: getCleanText(item?.action || item?.suggest, '暂无行动项'),
        insightRef: getCleanText(item?.insightRef, '未标注'),
      };
    }),
    ...marketingActions.map((item: any, index: number) => {
      const insight = getInsightContextByRef(result, item?.insightRef);

      return {
        key: `marketing-${index}`,
        todoType: '市场营销',
        dept: '市场部',
        suggestionType: inferMarketingSuggestionType(item),
        problemDescription: getCleanText(insight?.observation || insight?.insight || item?.action, '未补充问题描述'),
        userVoice: getCleanText(item?.current || insight?.voc, '未补充用户原生词汇'),
        actionDirection: getCleanText(item?.suggest || item?.action, '暂无行动项'),
        insightRef: getCleanText(item?.insightRef, '未标注'),
      };
    }),
    ...designActions.map((item: any, index: number) => {
      const insight = getInsightContextByRef(result, item?.insightRef);

      return {
        key: `design-${index}`,
        todoType: '设计优化',
        dept: '设计部',
        suggestionType: inferDesignSuggestionType(item),
        problemDescription: getCleanText(item?.problem || insight?.observation || item?.module, '未补充问题描述'),
        userVoice: getCleanText(insight?.voc, '未补充用户原生词汇'),
        actionDirection: getCleanText(item?.suggest || item?.module, '暂无行动项'),
        insightRef: getCleanText(item?.insightRef, '未标注'),
      };
    }),
  ];
};

const buildTodoSuggestionOptions = (rows: UnifiedActionRow[]): TodoSuggestionOption[] => {
  return rows.map((row) => ({
    key: row.key,
    todoType: row.todoType,
    dept: row.dept,
    content: row.actionDirection,
    hint: [row.suggestionType, row.insightRef].filter(Boolean).join(' · '),
  }));
};

const getDefaultTodoSuggestion = (rows: UnifiedActionRow[]) => {
  const options = buildTodoSuggestionOptions(rows);
  return options.find((option) => option.todoType === '产品方案') || options[0] || null;
};

export const InterviewAnalysis = () => {
  const [activeTab, setActiveTab] = useState('速览');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [todoContent, setTodoContent] = useState('');
  const [businessLine, setBusinessLine] = useState('超级订阅');
  const [todoType, setTodoType] = useState('产品方案');
  const [todoDept, setTodoDept] = useState('产品部');
  const [todoMentions, setTodoMentions] = useState(1);
  const [todoProgressText, setTodoProgressText] = useState('待确认跟进');
  const [selectedTodoSuggestionKey, setSelectedTodoSuggestionKey] = useState('');
  const [isBLOpen, setIsBLOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activePromptVersionLabel, setActivePromptVersionLabel] = useState(() => {
    const promptVersion = globalStore.getPublishedPromptVersion('用户研究');
    return promptVersion ? `用户研究 ${promptVersion.id}` : '用户研究 默认版本';
  });
  const [documents, setDocuments] = useState(globalStore.documents);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentFeedbackId, setCurrentFeedbackId] = useState<string | null>(null);
  const [hasPendingFeedbackChanges, setHasPendingFeedbackChanges] = useState(false);

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(() => {
      setDocuments([...globalStore.documents]);
    });
    return unsubscribe;
  }, []);

  const unifiedActionRows = buildUnifiedActionRows(analysisResult);
  const todoSuggestionOptions = buildTodoSuggestionOptions(unifiedActionRows);
  const filteredTodoSuggestionOptions = todoSuggestionOptions.filter((option) => option.todoType === todoType);
  const selectedTodoSuggestion = todoSuggestionOptions.find((option) => option.key === selectedTodoSuggestionKey) || null;
  const actionTableSections = [
    {
      key: '产品方案',
      title: '1、给产品方案的建议',
      description: '重点回答：用户需要什么样的产品方案。',
      emptyText: '当前文档尚未形成稳定的产品方案建议。',
      rows: unifiedActionRows.filter((row) => row.todoType === '产品方案'),
    },
    {
      key: '市场营销',
      title: '2、给市场 / 运营的建议',
      description: '重点回答：用户使用的原生词汇是什么？销售话术如何调整以击中用户的真实焦虑？',
      emptyText: '当前文档尚未形成稳定的市场 / 运营建议。',
      rows: unifiedActionRows.filter((row) => row.todoType === '市场营销'),
    },
    {
      key: '设计优化',
      title: '3、给产品 / 设计的建议',
      description: '重点回答：哪些界面的认知负荷过高？交互流程需要如何重构？',
      emptyText: '当前文档尚未形成稳定的产品 / 设计建议。',
      rows: unifiedActionRows.filter((row) => row.todoType === '设计优化'),
    },
  ];

  const loadDocument = (doc: any) => {
    const normalizedResult = doc.analysisResult ? normalizeAnalysisResult(doc.analysisResult, {
      sourceContent: doc.content,
    }) : null;
    const defaultTodoSuggestion = getDefaultTodoSuggestion(buildUnifiedActionRows(normalizedResult));

    setUploadedFileName(doc.name);
    setUploadedFile(null);
    setSelectedDocumentId(doc.id);
    setBusinessLine(doc.businessLine);
    setAnalysisError('');
    setIsPreparingFile(false);
    setFeedback(null);
    setFeedbackText('');
    setCurrentFeedbackId(null);
    setHasPendingFeedbackChanges(false);
    setAnalysisResult(normalizedResult);
    setTodoContent(defaultTodoSuggestion?.content || '');
    setTodoType(defaultTodoSuggestion?.todoType || '产品方案');
    setTodoDept(defaultTodoSuggestion?.dept || '产品部');
    setTodoMentions(1);
    setTodoProgressText('待确认跟进');
    setSelectedTodoSuggestionKey(defaultTodoSuggestion?.key || '');
    setActivePromptVersionLabel(doc.promptVersionId ? `用户研究 ${doc.promptVersionId}` : '用户研究 历史版本未记录');
    setActiveTab(doc.analysisResult ? '完整报告' : '速览');
  };

  const upsertFeedbackRecord = async (type: 'up' | 'down', nextFeedbackText = feedbackText) => {
    if (!analysisResult) {
      return;
    }

    const normalizedFeedbackText = nextFeedbackText.trim();
    const aiEvaluation = buildAiEvaluationSummary(normalizedFeedbackText, type);
    const aiSuggestion = buildAiSuggestionFromFeedback(normalizedFeedbackText, type);
    const now = Date.now();
    const payload = {
      module: '访谈分析',
      type,
      issue: inferFeedbackIssue(normalizedFeedbackText, type),
      feedback: normalizedFeedbackText,
      sourceVoice: normalizedFeedbackText,
      aiEvaluation,
      analysisSummary: aiEvaluation,
      suggestion: aiSuggestion,
      aiSuggestion,
      sourceDocumentId: selectedDocumentId || undefined,
      timestamp: new Date(now).toISOString(),
      updatedAt: now,
      businessLine,
    };

    if (currentFeedbackId) {
      await globalStore.updateFeedback(currentFeedbackId, payload);
      return;
    }

    const createdFeedback = await globalStore.addFeedback({
      createdAt: now,
      ...payload,
    });
    setCurrentFeedbackId(createdFeedback.id);
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    setHasPendingFeedbackChanges(true);
  };

  const handleFeedbackTextChange = (value: string) => {
    setFeedbackText(value);
    setHasPendingFeedbackChanges(true);
  };

  const handleConfirmFeedback = async () => {
    if (!analysisResult) {
      return;
    }

    if (!feedback) {
      alert('请先选择赞或踩，再确认同步');
      return;
    }

    await upsertFeedbackRecord(feedback, feedbackText);
    setHasPendingFeedbackChanges(false);
    alert('评价已同步到使用反馈');
  };

  const buildCompleteReportMarkdown = (currentAnalysisResult = analysisResult) => {
    if (!currentAnalysisResult) {
      return '# 完整报告\n\n暂无可展示的完整报告内容。';
    }

    const escapeCell = (value: unknown) => String(value ?? '')
      .replace(/\|/g, '\\|')
      .replace(/\n/g, '<br />')
      .trim();

    const buildRow = (cells: unknown[]) => `| ${cells.map(escapeCell).join(' | ')} |`;

    const conclusions = currentAnalysisResult.summary?.conclusions || [];
    const decisions = currentAnalysisResult.summary?.decisions || [];
    const journey = currentAnalysisResult.journey || [];
    const insights = currentAnalysisResult.insights || [];
    const spectrum = currentAnalysisResult.persona?.spectrum || [];
    const keywordRows = currentAnalysisResult.keywordRows || [];
    const heatmapRows = currentAnalysisResult.emotionHeatmapRows || [];
    const productActions = currentAnalysisResult.actions?.product || [];
    const marketingActions = currentAnalysisResult.actions?.marketing || [];
    const designActions = currentAnalysisResult.actions?.design || [];

    const lines = [
      '# 完整报告',
      '',
      '## 第一节：访谈摘要',
      '',
      '### 1. 核心结论',
      ...(conclusions.length > 0
        ? conclusions.map((item: string) => `- ${item}`)
        : ['- 当前文档尚未形成稳定的核心结论。']),
      '',
      '### 2. 关键决策建议',
      ...(decisions.length > 0
        ? decisions.slice(0, 3).flatMap((item: any, index: number) => ([
          `#### 【决策建议 #${index + 1}】`,
          `- 调整方向：${item.title || '未标注'}`,
          `- 触发原因：${item.reason || '未标注'}`,
          `- 紧迫程度：${normalizePriorityLabel(item.priority, '未标注')}`,
          '',
        ])).slice(0, -1)
        : ['- 当前文档尚未形成稳定的关键决策建议。']),
      '',
      '## 第二节：用户旅程',
      ...(currentAnalysisResult.journeyNotice ? ['', `> ${currentAnalysisResult.journeyNotice}`] : []),
      '',
      ...(journey.length > 0 ? [
        buildRow(['维度', ...journey.map((_: any, index: number) => `阶段${index + 1}`)]),
        buildRow(['---', ...journey.map(() => '---')]),
        buildRow(['阶段', ...journey.map((item: any) => `[${item.stage || '未命名阶段'}]`)]),
        buildRow(['情绪', ...journey.map((item: any) => item.emotion || '😐')]),
        buildRow(['描述', ...journey.map((item: any) => item.behavior ? `"${item.behavior}"` : '暂无阶段描述')]),
        buildRow(['用户原话', ...journey.map((item: any) => item.quote || '暂无可引用原话')]),
      ] : ['当前文档尚未提炼出可成立的用户旅程。']),
      '',
      '## 第三节：核心洞察与故事',
      ...(currentAnalysisResult.insightNotice ? ['', `> ${currentAnalysisResult.insightNotice}`] : []),
      '',
      ...(insights.length > 0
        ? insights.flatMap((item: any, index: number) => ([
          `### 【洞察 #${index + 1}】${item.title || '未命名洞察'}`,
          `- 标签：${item.tag || '未标注'}`,
          `- 来源用户：${item.user || '未标注'}`,
          '- O · 观察现象',
          `  ${item.observation || '暂无稳定观察现象'}`,
          '- I · 深度洞察',
          `  ${item.insight || '暂无可成立的深度洞察'}`,
          '- V · 原声重现（VoC）',
          `  ${item.voc || '“暂无可直接引用的用户原话”'}`,
          `  —— ${item.user || '用户未标注'}，标签【${item.tag || '未标注'}】`,
          '',
        ])).slice(0, -1)
        : ['当前文档尚未提炼出可成立的洞察。']),
      '',
      '## 第四节：行为画像与心智模型',
      ...(currentAnalysisResult.personaNotice ? ['', `> ${currentAnalysisResult.personaNotice}`] : []),
      '',
      '### A. 用户光谱',
      ...(spectrum.length > 0
        ? spectrum.slice(0, 3).flatMap((item: any, index: number) => ([
          `#### ${item.dimension || `维度 ${index + 1}`}`,
          `[${item.left || '左侧偏好'}] ${buildSpectrumTrack(item.value)} [${item.right || '右侧偏好'}]`,
          `偏左用户：${item.leftUsers?.length > 0 ? item.leftUsers.join('、') : '暂无明确分布'}`,
          `偏右用户：${item.rightUsers?.length > 0 ? item.rightUsers.join('、') : '暂无明确分布'}`,
          '',
        ])).slice(0, -1)
        : ['当前文档尚未提炼出足够清晰的用户光谱维度。']),
      '',
      '### B. 关键词词云（文本版）',
      ...(keywordRows.length > 0
        ? [
          '【高频词汇 Top 10】',
          keywordRows.map(([keyword, count]: [string, number], index: number) => `#${index + 1} ${keyword}（出现${count}次）`).join('  '),
        ]
        : ['当前文档暂无足够文本内容生成高频词汇。']),
      '',
      '### C. 情感分布热力图（文本版）',
      '```text',
      '话题模块          正向  中性  负向   主导情绪',
      ...heatmapRows,
      '```',
      '',
      '## 第五节：机会点与行动建议',
      ...(currentAnalysisResult.actionsNotice ? ['', `> ${currentAnalysisResult.actionsNotice}`] : []),
      '',
      '### 1、给产品方案的建议',
      ...(productActions.length > 0 ? [
        buildRow(['优先级', '行动项', '触发洞察', '建议类型']),
        buildRow(['---', '---', '---', '---']),
        ...productActions.map((item: any) => buildRow([
          item.priority || '待定',
          item.action || '暂无行动项',
          item.insightRef || '未标注',
          normalizeSuggestionTypeLabel(item.type, '未标注'),
        ])),
      ] : ['当前文档尚未形成稳定的产品方案建议。']),
      '',
      '### 2、给市场 / 运营的建议',
      ...(marketingActions.length > 0 ? [
        buildRow(['行动项', '用户原生词汇', '建议调整方向', '触发洞察']),
        buildRow(['---', '---', '---', '---']),
        ...marketingActions.map((item: any) => buildRow([
          item.action || '待定',
          item.current || '暂无原生词汇',
          item.suggest || '暂无调整方向',
          item.insightRef || '未标注',
        ])),
      ] : ['当前文档尚未形成稳定的市场 / 运营建议。']),
      '',
      '### 3、给产品/设计的建议',
      ...(designActions.length > 0 ? [
        buildRow(['界面 / 流程', '问题描述', '认知负荷评级', '重构建议', '触发洞察']),
        buildRow(['---', '---', '---', '---', '---']),
        ...designActions.map((item: any) => buildRow([
          item.module || '未标注',
          item.problem || '暂无问题描述',
          normalizeLoadLabel(item.load, '未标注'),
          item.suggest || '暂无重构建议',
          item.insightRef || '未标注',
        ])),
      ] : ['当前文档尚未形成稳定的产品 / 设计建议。']),
    ];

    return lines.join('\n');
  };

  const handleExportDoc = () => {
    const reportText = buildCompleteReportMarkdown();
    const content = `SUPEREV 用户调研分析洞察报告\n\n${reportText}`;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分析报告_${new Date().getTime()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenTodo = () => {
    setIsTodoModalOpen(true);
  };

  const handleTodoTypeChange = (nextType: string) => {
    setTodoType(nextType);
    setTodoDept(TODO_TYPE_TO_DEFAULT_DEPT[nextType] || '产品部');

    const nextOptions = todoSuggestionOptions.filter((option) => option.todoType === nextType);
    const matchedCurrentOption = nextOptions.find((option) => option.content === todoContent);

    if (matchedCurrentOption) {
      setSelectedTodoSuggestionKey(matchedCurrentOption.key);
      return;
    }

    if (nextOptions.length > 0) {
      setSelectedTodoSuggestionKey(nextOptions[0].key);
      setTodoContent(nextOptions[0].content);
      return;
    }

    setSelectedTodoSuggestionKey('');
  };

  const handleTodoSuggestionChange = (key: string) => {
    setSelectedTodoSuggestionKey(key);

    if (!key) {
      return;
    }

    const selectedOption = todoSuggestionOptions.find((option) => option.key === key);
    if (!selectedOption) {
      return;
    }

    setTodoType(selectedOption.todoType);
    setTodoDept(selectedOption.dept);
    setTodoContent(selectedOption.content);
  };

  const handleSaveTodo = async () => {
    const trimmedTodoContent = todoContent.trim();

    if (!trimmedTodoContent) {
      alert('请先填写 Todo 内容');
      return;
    }

    const now = new Date().toISOString();

    await globalStore.addTodo({
      type: todoType || '产品方案',
      content: trimmedTodoContent,
      mentions: todoMentions,
      dept: todoDept || '产品部',
      progressText: todoProgressText.trim() || '待确认跟进',
      status: '待跟进',
      sourceModule: '访谈分析',
      sourceDocumentId: selectedDocumentId || undefined,
      sourceDocumentName: uploadedFileName || undefined,
      sourceBusinessLine: businessLine || undefined,
      createdAt: now,
      updatedAt: now,
    });
    setIsTodoModalOpen(false);
    alert('已成功加入 ToDo 管理！');
  };

  const resetCurrentSelection = () => {
    setUploadedFileName('');
    setUploadedFile(null);
    setSelectedDocumentId(null);
    setAnalysisResult(null);
    setAnalysisError('');
    setIsPreparingFile(false);
    setFeedback(null);
    setFeedbackText('');
    setCurrentFeedbackId(null);
    setHasPendingFeedbackChanges(false);
    setTodoContent('');
    setTodoType('产品方案');
    setTodoDept('产品部');
    setTodoMentions(1);
    setTodoProgressText('待确认跟进');
    setSelectedTodoSuggestionKey('');
  };

  const processSelectedFile = async (file: File) => {
    setAnalysisResult(null);
    setAnalysisError('');
    setFeedback(null);
    setFeedbackText('');
    setCurrentFeedbackId(null);
    setHasPendingFeedbackChanges(false);
    setTodoContent('');
    setTodoType('产品方案');
    setTodoDept('产品部');
    setTodoMentions(1);
    setTodoProgressText('待确认跟进');
    setSelectedTodoSuggestionKey('');
    setUploadedFileName(file.name);
    setUploadedFile(file);
    setSelectedDocumentId(null);
    setIsPreparingFile(true);

    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = new Set(['docx', 'txt']);

    if (!extension || !supportedExtensions.has(extension)) {
      setAnalysisError('当前真实分析暂只支持 docx 和 txt。pdf、png、jpg 等文件请先转成可复制文本后再上传。');
      setUploadedFile(null);
      setIsPreparingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsPreparingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAnalysisErrorMessage = (error: unknown, documentId?: string) => {
    const configuredApiBaseUrl = getConfiguredApiBaseUrl();
    const analyzeApiUrl = documentId
      ? buildApiUrl(`/api/documents/${documentId}/analyze`)
      : buildApiUrl('/api/documents/<document-id>/analyze');

    if (error instanceof Error) {
      if (!import.meta.env.DEV && error instanceof ApiError && error.status === 404) {
        if (!configuredApiBaseUrl) {
          return `分析生成当前请求的是 ${analyzeApiUrl}。由于 VITE_API_BASE_URL 为空，前端会默认回退到当前 Vercel 域名下的 /api，所以返回 NOT_FOUND。请在 Vercel 配置 VITE_API_BASE_URL 为正式后端域名，例如 https://api.your-domain.com。`;
        }

        return `分析生成当前请求的是 ${analyzeApiUrl}，但服务返回了 404。请确认 VITE_API_BASE_URL 指向的后端域名正确，并且后端已暴露 POST /api/documents/:id/analyze。`;
      }

      if (error.message === 'LLM_API_KEY_MISSING') {
        return '当前后端未配置可用的大模型 API Key，系统无法生成真实分析结果。请先在 backend/.env 中补齐 Gemini 或 DeepSeek 的服务端配置后再重试。';
      }

      const normalizedMessage = error.message.trim();
      if (
        /Gemini 失败后已自动尝试 DeepSeek，仍未成功/.test(normalizedMessage) ||
        /^DeepSeek 分析失败：/.test(normalizedMessage)
      ) {
        return normalizedMessage;
      }

      const maybeJsonMessage = normalizedMessage.replace(/^分析生成失败：\s*/, '');

      try {
        const parsed = JSON.parse(maybeJsonMessage);
        const providerMessage = parsed?.error?.message;
        const providerCode = parsed?.error?.code;
        const providerStatus = parsed?.error?.status;

        if (providerCode === 429 || providerStatus === 'RESOURCE_EXHAUSTED') {
          return 'Gemini 当前配额已耗尽或请求过于频繁。系统已自动尝试短暂重试一次；如果仍失败，请稍后再试，或检查 API Key / 套餐。';
        }

        if (typeof providerMessage === 'string' && providerMessage.trim()) {
          return `分析生成失败：${providerMessage.trim()}`;
        }
      } catch {
        // Keep the original error message when it is not JSON.
      }

      if (
        /RESOURCE_EXHAUSTED/i.test(normalizedMessage) ||
        /quota exceeded/i.test(normalizedMessage) ||
        /insufficient[_\s-]*balance/i.test(normalizedMessage) ||
        /"code"\s*:\s*429/.test(normalizedMessage)
      ) {
        return 'Gemini 当前配额已耗尽或请求过于频繁。系统已自动尝试短暂重试一次；如果仍失败，请稍后再试，或检查 API Key / 套餐。';
      }

      if (
        /currently experiencing high demand/i.test(normalizedMessage) ||
        /Gemini 当前处于访问高峰/i.test(normalizedMessage)
      ) {
        return 'Gemini 当前处于访问高峰，系统将自动尝试 DeepSeek；如果仍失败，请稍后再试。';
      }

      if (
        /UND_ERR_CONNECT_TIMEOUT/i.test(normalizedMessage) ||
        /Connect Timeout Error/i.test(normalizedMessage) ||
        /ENOTFOUND/i.test(normalizedMessage) ||
        /getaddrinfo/i.test(normalizedMessage) ||
        /fetch failed/i.test(normalizedMessage)
      ) {
        if (!import.meta.env.DEV) {
          if (!configuredApiBaseUrl) {
            return `分析生成缺少 VITE_API_BASE_URL，接口会默认请求 ${analyzeApiUrl}。请在 Vercel 配置正式后端地址，例如 https://api.your-domain.com。`;
          }

          return `分析生成当前请求的是 ${analyzeApiUrl}，但该地址不可访问。请检查 VITE_API_BASE_URL 是否填写了正确的正式后端域名，并确认后端已允许当前前端域名跨域访问。`;
        }

        return 'Gemini 当前网络连接失败或超时，请检查服务端所在机器到 Google Gemini API 的网络连通性后再重试。';
      }

      if (normalizedMessage) {
        return `分析生成失败：${normalizedMessage}`;
      }
    }

    return '分析生成失败，请检查提示词版本、网络环境以及 Gemini / DeepSeek 配置后重试。';
  };

  const startAnalysis = async () => {
    if (isPreparingFile) {
      alert('文档还在准备中，请稍候再开始分析');
      return;
    }

    if (!uploadedFile && !selectedDocumentId) {
      alert('请先上传文档或选择历史文档');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    let analysisDocumentId = selectedDocumentId || '';

    try {
      const document = uploadedFile
        ? await globalStore.uploadDocument(uploadedFile, businessLine, '用户研究')
        : documents.find((item) => item.id === selectedDocumentId);

      if (!document?.id) {
        throw new Error('文档上传失败，请重试');
      }

      analysisDocumentId = document.id;
      const analyzedDocument = await globalStore.analyzeDocument(document.id);
      const result = analyzedDocument.analysisResult ? normalizeAnalysisResult(analyzedDocument.analysisResult, {
        sourceContent: analyzedDocument.content,
      }) : null;

      if (!result) {
        throw new Error('分析结果为空');
      }

      const defaultTodoSuggestion = getDefaultTodoSuggestion(buildUnifiedActionRows(result));
      setSelectedDocumentId(analyzedDocument.id);
      setUploadedFile(null);
      setUploadedFileName(analyzedDocument.name);
      setAnalysisResult(result);
      setFeedback(null);
      setFeedbackText('');
      setCurrentFeedbackId(null);
      setHasPendingFeedbackChanges(false);
      setTodoContent(defaultTodoSuggestion?.content || '');
      setTodoType(defaultTodoSuggestion?.todoType || '产品方案');
      setTodoDept(defaultTodoSuggestion?.dept || '产品部');
      setTodoMentions(1);
      setTodoProgressText('待确认跟进');
      setSelectedTodoSuggestionKey(defaultTodoSuggestion?.key || '');
      setActivePromptVersionLabel(analyzedDocument.promptVersionId ? `用户研究 ${analyzedDocument.promptVersionId}` : '用户研究 历史版本未记录');

      setActiveTab('完整报告');
    } catch (error) {
      console.error(error);
      setAnalysisResult(null);
      const errorMessage = getAnalysisErrorMessage(error, analysisDocumentId);
      setAnalysisError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    void processSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file || isAnalyzing) {
      return;
    }

    void processSelectedFile(file);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Input */}
        <Card className="w-72 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 font-medium text-sm flex justify-between items-center bg-slate-50 rounded-t-lg">
            数据输入
            <div className="flex gap-2">
              <button 
                className="text-slate-400 hover:text-[#00A854] transition-colors p-1" 
                title="清除当前选择"
                onClick={resetCurrentSelection}
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-5">
            <div className="relative group">
              <label className="block text-xs font-medium text-slate-500 mb-1">业务线</label>
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsBLOpen(!isBLOpen)}
              >
                <span className={!businessLine ? 'text-slate-400' : 'text-slate-700 font-medium'}>
                  {businessLine || '选择业务线'}
                </span>
                <div className="flex items-center">
                  {businessLine && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBusinessLine('');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isBLOpen ? "rotate-180" : "")} />
                </div>
              </div>
              {isBLOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsBLOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                    {['超级订阅', '灵活订阅', '其他'].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-normal"
                        onClick={() => {
                          setBusinessLine(opt);
                          setIsBLOpen(false);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-5 text-center transition-colors relative group',
                isAnalyzing || isPreparingFile
                  ? 'border-[#00A854] bg-green-50/50'
                  : isDragging
                    ? 'border-[#00A854] bg-green-50/30'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-[#00A854]',
              )}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isAnalyzing) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
            >
              {!isAnalyzing && <input 
                type="file" 
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept=".docx,.txt"
                title="支持单个拖入或点击上传文档"
                onChange={handleFileUpload}
              />}
              
              {isAnalyzing || isPreparingFile ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="w-8 h-8 text-[#00A854] animate-spin mb-3" />
                  <div className="text-sm font-medium text-[#00A854]">{isPreparingFile ? '文档读取中...' : 'AI深度分析中...'}</div>
                  <div className="text-xs text-slate-400 mt-1">{isPreparingFile ? '正在提取文档内容，请稍候开始分析' : `正在应用 ${activePromptVersionLabel} 的提示词规则`}</div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3 group-hover:text-[#00A854] transition-colors" />
                  <div className="text-sm font-medium text-slate-700 mb-1">点击或拖拽选择文档</div>
                  <div className="text-[10px] text-slate-400">当前真实分析支持 docx、txt</div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2">当前操作文档</div>
              {uploadedFileName ? (
                <div className="p-2 bg-green-50 rounded border border-green-200 text-xs flex items-center justify-between shadow-sm">
                  <span className="truncate flex-1 font-semibold text-[#00A854]">{uploadedFileName}</span>
                  {isAnalyzing ? (
                     <span className="text-orange-500 flex items-center gap-1 shrink-0 ml-2 animate-pulse font-medium"><Loader2 className="w-3 h-3 animate-spin"/> 分析中</span>
                  ) : isPreparingFile ? (
                     <span className="text-blue-500 flex items-center gap-1 shrink-0 ml-2 font-medium"><Loader2 className="w-3 h-3 animate-spin"/> 读取中</span>
                  ) : analysisResult ? (
                     <span className="text-green-600 shrink-0 ml-2 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 已解析</span>
                  ) : (
                     <span className="text-slate-500 shrink-0 ml-2">待分析</span>
                  )}
                </div>
              ) : (
                 <div className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">暂无活动文档</div>
              )}

              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[10px] text-slate-500">当前生效提示词版本</div>
                <div className="mt-1 text-xs font-medium text-slate-700">{activePromptVersionLabel}</div>
              </div>

              {analysisError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {analysisError}
                </div>
              )}
              
              <Button 
                className="w-full mt-4" 
                onClick={startAnalysis}
                disabled={(!uploadedFile && !selectedDocumentId) || isAnalyzing || isPreparingFile}
              >
                {isPreparingFile ? '准备文档中...' : isAnalyzing ? '分析中...' : '开始分析'}
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-medium text-slate-500">业务线历史 ({documents.filter(d => d.businessLine === businessLine).length})</div>
                <button className="text-[10px] text-[#00A854] hover:underline" onClick={() => setActiveTab('完整报告')}>查看完整报告</button>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {documents.filter(d => d.businessLine === businessLine).map((doc) => (
                  <button 
                    key={doc.id} 
                    onClick={() => loadDocument(doc)}
                    className={cn(
                      "w-full text-left p-2 rounded-md border text-[11px] flex items-center gap-2 transition-all group",
                      uploadedFileName === doc.name ? "bg-green-50 border-[#00A854] text-[#00A854] shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-[#00A854] hover:bg-slate-50"
                    )}
                  >
                    <FileText className={cn("w-3.5 h-3.5 shrink-0", uploadedFileName === doc.name ? "text-[#00A854]" : "text-slate-400 group-hover:text-[#00A854]")} />
                    <div className="truncate flex-1">
                      <div className="font-medium truncate">{doc.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{doc.uploadTime}</div>
                    </div>
                    {doc.analysisResult && <Zap className="w-3 h-3 text-orange-400 shrink-0" />}
                  </button>
                ))}
                {documents.filter(d => d.businessLine === businessLine).length === 0 && (
                  <div className="text-[10px] text-slate-400 text-center py-4 italic bg-slate-50/50 rounded border border-dashed border-slate-200">
                    该业务线下暂无历史文档
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Middle: Analysis */}
        <Card className="flex-1 flex flex-col min-w-0">
          <div className="px-2 pt-2 border-b border-slate-100">
            <Tabs 
              tabs={['速览', '旅程图', '洞察', '画像', '行动建议', '完整报告']} 
              activeTab={activeTab === '证据链' ? '速览' : activeTab} 
              onChange={setActiveTab} 
            />
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {!analysisResult && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-slate-100 shadow-sm border-dashed">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <div className="text-sm">
                  {analysisError
                    ? analysisError
                    : uploadedFileName
                      ? isPreparingFile
                        ? '文档内容读取完成后即可开始分析'
                        : '请点击左下角“开始分析”生成报告'
                      : '等上传文档...'}
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-10 h-10 text-[#00A854] animate-spin" />
                 <div className="text-slate-500 text-sm animate-pulse">大模型正在结合 {activePromptVersionLabel} 进行原子拆解与深度推理...</div>
              </div>
            ) : activeTab === '速览' ? (
              <div className="max-w-4xl mx-auto mt-4 space-y-5">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">1、核心结论</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      用 3-5 条高度浓缩、行动导向强的结论概括当前逐字稿中的最大发现、机会点或危机。
                    </p>
                  </div>
                  <div className="space-y-3 px-6 py-5">
                    {(analysisResult?.summary?.conclusions?.length || 0) > 0 ? (
                      analysisResult.summary.conclusions.map((text: string, index: number) => (
                        <div key={`summary-conclusion-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                              {index + 1}
                            </div>
                            <p className="text-sm font-medium leading-7 text-slate-800">{text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm leading-6 text-slate-500">
                        当前文档尚未形成稳定的核心结论。
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">2、关键决策建议</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      基于逐字稿洞察，明确指出产品路线图或商业策略当前最紧急需要做出的调整。
                    </p>
                  </div>
                  <div className="space-y-4 px-6 py-5">
                    {(analysisResult?.summary?.decisions?.length || 0) > 0 ? (
                      analysisResult.summary.decisions.map((item: any, index: number) => (
                        <div key={`summary-decision-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-sm font-bold text-slate-900">{`【决策建议 #${index + 1}】`}</div>
                          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                            <div>
                              <span className="font-semibold text-slate-900">调整方向：</span>
                              {item.title || '未标注'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">触发原因：</span>
                              {item.reason || '未标注'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">紧迫程度：</span>
                              {normalizePriorityLabel(item.priority, '未标注')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm leading-6 text-slate-500">
                        当前文档尚未形成稳定的关键决策建议。
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : activeTab === '洞察' ? (
              <div className="max-w-4xl mx-auto mt-4 space-y-5">
                {((analysisResult?.insightNotice || '').trim() || ((analysisResult?.insights?.length || 0) > 0 && (analysisResult?.insights?.length || 0) < 3
                  ? `当前仅形成 ${analysisResult?.insights?.length || 0} 条成立洞察，输入材料不足以支持更多高置信度判断，因此未强行补足到 3-5 条。`
                  : '')) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
                    {(analysisResult?.insightNotice || '').trim() || `当前仅形成 ${analysisResult?.insights?.length || 0} 条成立洞察，输入材料不足以支持更多高置信度判断，因此未强行补足到 3-5 条。`}
                  </div>
                )}

                {(analysisResult?.insights?.length || 0) > 0 ? (
                  analysisResult.insights.map((insight: any, i: number) => (
                    <Card key={`${insight.title || 'insight'}-${i}`} className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-6 py-5">
                        <h3 className="text-lg font-bold text-slate-900">
                          {`【洞察 #${i + 1}】${insight.title || '未命名洞察'}`}
                        </h3>
                        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800">标签：</span>
                            {insight.tag || '未标注'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">来源用户：</span>
                            {insight.user || '未标注'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 px-6 py-5">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-sm font-semibold text-slate-900">O · 观察现象</div>
                          <p className="mt-2 text-sm leading-7 text-slate-700">
                            {insight.observation || '暂无稳定观察现象'}
                          </p>
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
                          <div className="text-sm font-semibold text-blue-900">I · 深度洞察</div>
                          <p className="mt-2 text-sm leading-7 text-blue-900">
                            {insight.insight || '暂无可成立的深度洞察'}
                          </p>
                        </div>

                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">
                          <div className="text-sm font-semibold text-green-900">V · 原声重现（VoC）</div>
                          <div className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-800">
                            {insight.voc || '“暂无可直接引用的用户原话”'}
                          </div>
                          <div className="mt-3 text-xs text-slate-500">
                            {`—— ${insight.user || '用户未标注'}，标签【${insight.tag || '未标注'}】`}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm leading-6 text-slate-500 shadow-sm">
                    当前文档尚未提炼出可成立的洞察。请检查输入材料是否足够，或重新点击“开始分析”生成结果。
                  </div>
                )}
              </div>
            ) : activeTab === '旅程图' ? (
              <div className="max-w-4xl mx-auto mt-4 space-y-5">
                {((analysisResult?.journeyNotice || '').trim() || ((analysisResult?.journey?.length || 0) > 0 && (analysisResult?.journey?.length || 0) < 3
                  ? `当前仅形成 ${analysisResult?.journey?.length || 0} 个成立阶段，输入材料不足以支撑更完整的用户旅程，因此未强行补足。`
                  : '')) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
                    {(analysisResult?.journeyNotice || '').trim() || `当前仅形成 ${analysisResult?.journey?.length || 0} 个成立阶段，输入材料不足以支撑更完整的用户旅程，因此未强行补足。`}
                  </div>
                )}

                {(analysisResult?.journey?.length || 0) > 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="overflow-x-auto">
                      {(() => {
                        const journeyItems = analysisResult.journey;
                        const cardMinWidth = 260;
                        const gridTemplateColumns = `120px repeat(${journeyItems.length}, minmax(${cardMinWidth}px, 1fr))`;
                        const minWidth = `${120 + journeyItems.length * cardMinWidth + journeyItems.length * 16}px`;

                        return (
                          <div className="space-y-4" style={{ minWidth }}>
                            <div className="grid gap-4" style={{ gridTemplateColumns }}>
                              <div className="rounded-lg bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-900">阶段</div>
                              {journeyItems.map((item: any, index: number) => (
                                <div key={`journey-stage-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-5 text-base font-semibold leading-7 text-slate-900">
                                  {`[${item.stage || '未命名阶段'}]`}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-4" style={{ gridTemplateColumns }}>
                              <div className="rounded-lg bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-900">情绪</div>
                              {journeyItems.map((item: any, index: number) => (
                                <div key={`journey-emotion-${index}`} className="flex min-h-[88px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-5 text-sm leading-7 text-slate-800">
                                  {item.emotion || '😐'}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-4" style={{ gridTemplateColumns }}>
                              <div className="rounded-lg bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-900">描述</div>
                              {journeyItems.map((item: any, index: number) => (
                                <div key={`journey-behavior-${index}`} className="min-h-[132px] rounded-lg border border-slate-200 bg-white px-5 py-5 text-sm leading-7 text-slate-800">
                                  {item.behavior ? `"${item.behavior}"` : '暂无阶段描述'}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-4" style={{ gridTemplateColumns }}>
                              <div className="rounded-lg bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-900">用户原话</div>
                              {journeyItems.map((item: any, index: number) => (
                                <div key={`journey-quote-${index}`} className="min-h-[152px] rounded-lg border border-slate-200 bg-white px-5 py-5 text-sm leading-7 text-slate-700">
                                  {item.quote || '暂无可引用原话'}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm leading-6 text-slate-500 shadow-sm">
                    当前文档尚未提炼出可成立的用户旅程。请检查输入材料是否足够，或重新点击“开始分析”生成结果。
                  </div>
                )}
              </div>
            ) : activeTab === '画像' ? (
              <div className="max-w-4xl mx-auto mt-4 space-y-5">
                {((analysisResult?.personaNotice || '').trim() || ((analysisResult?.persona?.spectrum?.length || 0) > 0 && (analysisResult?.persona?.spectrum?.length || 0) < 2
                  ? `当前仅形成 ${analysisResult?.persona?.spectrum?.length || 0} 个高区分度画像维度，输入材料不足以支持更多可靠判断，因此未强行补足。`
                  : '')) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
                    {(analysisResult?.personaNotice || '').trim() || `当前仅形成 ${analysisResult?.persona?.spectrum?.length || 0} 个高区分度画像维度，输入材料不足以支持更多可靠判断，因此未强行补足。`}
                  </div>
                )}

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">A. 用户光谱</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      展示当前文档中最有区分度的 2-3 个维度，使用文本滑动条表达用户在关键维度上的分布。
                    </p>
                  </div>
                  <div className="space-y-5 px-6 py-5">
                    {(analysisResult?.persona?.spectrum?.length || 0) > 0 ? (
                      analysisResult.persona.spectrum.slice(0, 3).map((item: any, index: number) => (
                        <div key={`${item.dimension || 'spectrum'}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-sm font-semibold text-slate-900">{item.dimension || `维度 ${index + 1}`}</div>
                          <div className="mt-3 whitespace-pre-wrap font-mono text-sm leading-7 text-slate-700">
                            {`[${item.left || '左侧偏好'}] ${buildSpectrumTrack(item.value)} [${item.right || '右侧偏好'}]`}
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-800">偏左用户：</span>
                              {item.leftUsers?.length > 0 ? item.leftUsers.join('，') : '暂无明确分布'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">偏右用户：</span>
                              {item.rightUsers?.length > 0 ? item.rightUsers.join('，') : '暂无明确分布'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm leading-6 text-slate-500">
                        当前文档尚未提炼出足够清晰的用户光谱维度。
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">B. 关键词词云（文本版）</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      基于当前逐字稿与分析结果，按频次排序列出高频词汇 Top 10。
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    {(analysisResult?.keywordRows?.length || 0) > 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="text-sm font-semibold text-slate-900">【高频词汇 Top 10】</div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-sm leading-6 text-slate-700">
                          {analysisResult.keywordRows.slice(0, 10).map(([keyword, count]: [string, number], index: number) => (
                            <span key={`${keyword}-${index}`}>{`#${index + 1} ${keyword}（出现${count}次）`}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm leading-6 text-slate-500">
                        当前文档暂无足够文本内容生成高频词汇。
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">C. 情感分布热力图（文本版）</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      基于当前访谈阶段或话题模块，汇总正向、中性、负向和主导情绪分布。
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm leading-7 text-slate-700">
                      <div>{'话题模块          正向  中性  负向   主导情绪'}</div>
                      {(analysisResult?.emotionHeatmapRows || []).map((row: string, index: number) => (
                        <div key={`heatmap-row-${index}`} className="whitespace-pre-wrap">
                          {row}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ) : activeTab === '行动建议' ? (
              <div className="max-w-4xl mx-auto mt-4 space-y-5">
                {((analysisResult?.actionsNotice || '').trim()) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
                    {(analysisResult?.actionsNotice || '').trim()}
                  </div>
                )}

                {actionTableSections.map((section) => (
                  <Card key={section.key} className="border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                      <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {section.description}
                      </p>
                    </div>
                    <div className="px-6 py-5">
                      {section.rows.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-[1180px] table-fixed text-left text-sm">
                            <colgroup>
                              <col className="w-[180px]" />
                              <col className="w-[280px]" />
                              <col className="w-[220px]" />
                              <col className="w-[320px]" />
                              <col className="w-[140px]" />
                            </colgroup>
                            <thead className="bg-slate-50 text-slate-700">
                              <tr>
                                <th className="px-4 py-3 font-semibold whitespace-normal align-top">建议类型</th>
                                <th className="px-4 py-3 font-semibold whitespace-normal align-top">问题描述</th>
                                <th className="px-4 py-3 font-semibold whitespace-normal align-top">用户原生词汇</th>
                                <th className="px-4 py-3 font-semibold whitespace-normal align-top">建议调整方向/行动项</th>
                                <th className="px-4 py-3 font-semibold whitespace-normal align-top">触发洞察</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {section.rows.map((row) => (
                                <tr key={row.key}>
                                  <td className="px-4 py-3 align-top font-medium text-slate-800 whitespace-normal break-words">{row.suggestionType}</td>
                                  <td className="px-4 py-3 align-top text-slate-700 whitespace-normal break-words">{row.problemDescription}</td>
                                  <td className="px-4 py-3 align-top text-slate-700 whitespace-normal break-words">{row.userVoice}</td>
                                  <td className="px-4 py-3 align-top text-slate-700 whitespace-normal break-words">{row.actionDirection}</td>
                                  <td className="px-4 py-3 align-top text-slate-600 whitespace-normal break-words">{row.insightRef}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm leading-6 text-slate-500">
                          {section.emptyText}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : activeTab === '完整报告' ? (
              <div className="max-w-4xl mx-auto mt-4 space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white px-8 py-8 shadow-sm">
                  <div className="report-markdown text-sm text-slate-800">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {buildCompleteReportMarkdown()}
                    </Markdown>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={activeTab}
                className="max-w-4xl mx-auto mt-4 min-h-[420px] rounded border border-slate-200 bg-white shadow-sm"
              />
            )}
          </div>
        </Card>

        {/* Right: Feedback */}
        <Card className="w-64 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 font-medium text-sm">操作与反馈</div>
          <div className="p-4 space-y-6">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-3">AI 分析质量评价</div>
              <div className="flex gap-2 mb-3">
                <Button 
                  variant={feedback === 'up' ? 'primary' : 'outline'} 
                  className="flex-1 gap-2 whitespace-nowrap"
                  onClick={() => handleFeedback('up')}
                  disabled={!analysisResult}
                >
                  <ThumbsUp className="w-4 h-4" /> 赞
                </Button>
                <Button 
                  variant={feedback === 'down' ? 'danger' : 'outline'} 
                  className="flex-1 gap-2 whitespace-nowrap"
                  onClick={() => handleFeedback('down')}
                  disabled={!analysisResult}
                >
                  <ThumbsDown className="w-4 h-4" /> 踩
                </Button>
              </div>
              <textarea 
                className="w-full h-20 rounded-md border border-slate-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A854] disabled:opacity-50 resize-none overflow-y-auto"
                placeholder="请输入具体评价或修改建议..."
                disabled={!analysisResult}
                value={feedbackText}
                onChange={(e) => handleFeedbackTextChange(e.target.value)}
              />
              <div className="mt-3 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleConfirmFeedback}
                  disabled={!analysisResult || !feedback || !hasPendingFeedbackChanges}
                >
                  确认并同步
                </Button>
                <div className="text-[11px] leading-5 text-slate-400">
                  只有点击确认后，当前评价才会同步到“使用反馈”页面。
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleOpenTodo} disabled={!analysisResult}>
                  <MessageSquarePlus className="w-4 h-4 text-slate-400" />
                  加入 Todo
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" disabled={!analysisResult}>
                  <BookmarkPlus className="w-4 h-4 text-slate-400" />
                  <span>加入画像库 <span className="text-[10px] text-slate-400 font-normal ml-0.5">(敬请期待V2)</span></span>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleExportDoc} disabled={!analysisResult}>
                  <Download className="w-4 h-4 text-slate-400" />
                  导出报告
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {isTodoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center">
          <Card className="w-[480px] p-6 shadow-xl">
             <h2 className="text-lg font-bold text-slate-900 mb-4">加入 ToDo 管理</h2>
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">建议类型</label>
                   <select
                     value={todoType}
                     onChange={(e) => handleTodoTypeChange(e.target.value)}
                     className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                   >
                     {TODO_TYPES.map((option) => (
                       <option key={option} value={option}>{option}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">关联部门</label>
                   <select
                     value={todoDept}
                     onChange={(e) => setTodoDept(e.target.value)}
                     className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                   >
                     {TODO_DEPARTMENTS.map((option) => (
                       <option key={option} value={option}>{option}</option>
                     ))}
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">ToDo候选项</label>
                 <select
                   value={selectedTodoSuggestionKey}
                   onChange={(e) => handleTodoSuggestionChange(e.target.value)}
                   className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                 >
                   <option value="">手动输入 / 保留当前内容</option>
                   {filteredTodoSuggestionOptions.map((option) => (
                     <option key={option.key} value={option.key}>
                       {option.content}
                     </option>
                   ))}
                 </select>
                 <div className="mt-1 text-xs text-slate-500">
                   {filteredTodoSuggestionOptions.length > 0
                     ? `当前类型下共有 ${filteredTodoSuggestionOptions.length} 条 ToDo候选项可选`
                     : '当前建议类型下暂无 ToDo候选项，可直接手动填写'}
                 </div>
                 {selectedTodoSuggestion?.hint && (
                   <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                     {selectedTodoSuggestion.hint}
                   </div>
                 )}
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">建议内容</label>
                 <textarea
                   value={todoContent}
                   onChange={(e) => {
                     setTodoContent(e.target.value);
                     setSelectedTodoSuggestionKey('');
                   }}
                   className="w-full h-24 rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854] resize-none"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">提及人数</label>
                   <input
                     type="number"
                     min="1"
                     value={todoMentions}
                     onChange={(e) => setTodoMentions(Math.max(1, Number(e.target.value) || 1))}
                     className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">当前状态</label>
                   <div className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 flex items-center">
                     待跟进
                   </div>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">当前进度说明</label>
                 <textarea
                   value={todoProgressText}
                   onChange={(e) => setTodoProgressText(e.target.value)}
                   className="w-full h-20 rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854] resize-none"
                   placeholder="例如：待产品评审 / 待分派负责人"
                 />
               </div>
               <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                 来源：访谈分析
                 {uploadedFileName ? ` · ${uploadedFileName}` : ''}
                 {businessLine ? ` · ${businessLine}` : ''}
               </div>
             </div>
             <div className="flex justify-end gap-3 mt-4">
               <Button variant="outline" onClick={() => setIsTodoModalOpen(false)}>取消</Button>
               <Button onClick={handleSaveTodo} disabled={!todoContent.trim()}>确认加入</Button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};
