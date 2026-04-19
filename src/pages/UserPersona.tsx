import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Tabs } from '@/components/ui';
import { Download, BookmarkPlus, Database, Smile, Meh, Frown, X, ChevronDown, Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/DatePickerRange';
import { globalStore } from '@/lib/store';

type DateRange = {
  from: Date | null;
  to: Date | null;
};

type ResearchDocument = {
  id: string;
  name: string;
  businessLine?: string;
  subject?: string;
  uploadTime?: string;
  promptModule?: string;
  promptVersionId?: string;
  content?: string;
  analysisResult?: any;
};

const parseDocumentDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const normalizedValue = value
    .replace(/年|\/|\./g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedDate = new Date(normalizedValue);

  return Number.isNaN(normalizedDate.getTime()) ? null : normalizedDate;
};

const isWithinSelectedRange = (date: Date | null, range: DateRange) => {
  if (!range.from && !range.to) {
    return true;
  }

  if (!date) {
    return false;
  }

  const time = date.getTime();
  const fromTime = range.from ? new Date(range.from).setHours(0, 0, 0, 0) : null;
  const toTime = range.to ? new Date(range.to).setHours(23, 59, 59, 999) : null;

  if (fromTime !== null && time < fromTime) {
    return false;
  }

  if (toTime !== null && time > toTime) {
    return false;
  }

  return true;
};

const uniq = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const getDocumentSubject = (document: ResearchDocument) => (
  document.subject ||
  document.analysisResult?.persona?.name ||
  document.name.replace(/\.[^.]+$/, '') ||
  '未命名对象'
);

const getDocumentCustomerName = (document: ResearchDocument) => {
  const normalizedName = document.name.replace(/\.[^.]+$/, '').trim();
  const [, ...segments] = normalizedName.split(/\s*[-－—–]\s*/);

  if (segments.length === 0) {
    return '';
  }

  return segments
    .join('-')
    .replace(/[_\s]*(深度访谈|访谈记录|访谈纪要|访谈|逐字稿|转写稿|录音转写|记录).*$/u, '')
    .replace(/[_\s]+/g, ' ')
    .trim();
};

const isStableFact = (value?: string) => {
  if (!value) {
    return false;
  }

  const normalizedValue = value.replace(/\s+/g, ' ').trim();
  if (!normalizedValue) {
    return false;
  }

  return !/^(未识别|未知|待识别|未标注|信息不足|暂无|当前材料不足)/.test(normalizedValue);
};

const getDocumentDemographicFacts = (document: ResearchDocument) => (
  Object.entries(document.analysisResult?.persona?.demographics || {})
    .map(([key, value]) => `${key}：${String(value).trim()}`)
    .filter(isStableFact)
);

const getDocumentFactHighlights = (document: ResearchDocument, limit = 4) => {
  const summaryFacts = (document.analysisResult?.summary?.conclusions || [])
    .map((item: string) => item?.trim())
    .filter(isStableFact);
  const insightFacts = (document.analysisResult?.insights || [])
    .flatMap((insight: any) => [insight.observation || '', insight.voc || ''])
    .map((item: string) => item?.trim())
    .filter(isStableFact);
  const journeyFacts = (document.analysisResult?.journey || [])
    .flatMap((item: any) => [item.behavior || '', item.quote || ''])
    .map((item: string) => item?.trim())
    .filter(isStableFact);

  return uniq([
    ...getDocumentDemographicFacts(document),
    ...summaryFacts,
    ...insightFacts,
    ...journeyFacts,
  ]).slice(0, limit);
};

const getDocumentFactTags = (document: ResearchDocument, limit = 4) => {
  const demographicTags = Object.values(document.analysisResult?.persona?.demographics || {})
    .map((value) => String(value).trim())
    .filter(isStableFact);
  const insightTags = (document.analysisResult?.insights || [])
    .map((insight: any) => insight.tag || '')
    .map((item: string) => item.trim())
    .filter(isStableFact);

  return uniq([...demographicTags, ...insightTags]).slice(0, limit);
};

const getEmotionIcon = (emotion?: string) => {
  if (!emotion) {
    return Meh;
  }

  if (/😡|😤|😒|☹|🙁/.test(emotion)) {
    return Frown;
  }

  if (/😊|🙂|😄|😁/.test(emotion)) {
    return Smile;
  }

  return Meh;
};

const extractTopTerms = (texts: string[], limit = 3) => {
  const counts = new Map<string, number>();
  const stopWords = new Set([
    '我们', '你们', '他们', '自己', '这个', '那个', '一个', '不是', '就是', '因为', '所以', '如果', '还是', '然后',
    '已经', '可以', '需要', '没有', '什么', '怎么', '一下', '时候', '感觉', '觉得', '进行', '以及', '用户', '访谈者',
    '说话人', '超级电动', '超级订阅', '灵活订阅',
  ]);

  texts.join(' ')
    .match(/[\u4e00-\u9fa5]{2,}|[A-Za-z][A-Za-z0-9-]{2,}/g)
    ?.forEach((term) => {
      const normalizedTerm = term.trim();
      if (!normalizedTerm || stopWords.has(normalizedTerm)) {
        return;
      }
      counts.set(normalizedTerm, (counts.get(normalizedTerm) || 0) + 1);
    });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
};

const buildLatestFirst = (documents: ResearchDocument[]) => [...documents].sort((left, right) => {
  const leftTime = parseDocumentDate(left.uploadTime)?.getTime() || 0;
  const rightTime = parseDocumentDate(right.uploadTime)?.getTime() || 0;
  return rightTime - leftTime;
});

const BUSINESS_LINE_OPTIONS = ['超级订阅', '灵活订阅', '其他'];

export const UserPersona = () => {
  const [viewMode, setViewMode] = useState('单体画像');
  const [documents, setDocuments] = useState<ResearchDocument[]>(globalStore.documents);
  const [businessLine, setBusinessLine] = useState('');
  const [timeRange, setTimeRange] = useState<DateRange>({ from: null, to: null });
  const [subjectQuery, setSubjectQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isBLOpen, setIsBLOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(() => {
      setDocuments([...globalStore.documents]);
    });
    return unsubscribe;
  }, []);

  const analyzedDocuments = useMemo(() => buildLatestFirst(
    documents.filter((document) => document.analysisResult && (!document.promptModule || document.promptModule === '用户研究')),
  ), [documents]);

  const availableSubjectDocuments = useMemo(
    () => analyzedDocuments.filter((document) => !businessLine || document.businessLine === businessLine),
    [analyzedDocuments, businessLine],
  );
  const availableSubjects = useMemo(
    () => uniq(availableSubjectDocuments.map(getDocumentCustomerName)),
    [availableSubjectDocuments],
  );
  const filteredSubjects = useMemo(
    () => availableSubjects.filter((subject) => subject.toLowerCase().includes(subjectQuery.toLowerCase())),
    [availableSubjects, subjectQuery],
  );

  const filteredDocuments = useMemo(() => analyzedDocuments.filter((document) => {
    const subject = getDocumentCustomerName(document);
    const businessLineMatched = !businessLine || document.businessLine === businessLine;
    const subjectMatched = selectedSubjects.length === 0 || selectedSubjects.includes(subject);
    const timeMatched = isWithinSelectedRange(parseDocumentDate(document.uploadTime), timeRange);

    return businessLineMatched && subjectMatched && timeMatched;
  }), [analyzedDocuments, businessLine, selectedSubjects, timeRange]);

  const activeSingleDocument = useMemo(() => filteredDocuments[0] || null, [filteredDocuments]);

  const aggregatePromptVersions = useMemo(
    () => uniq(filteredDocuments.map((document) => document.promptVersionId ? `用户研究 ${document.promptVersionId}` : '')),
    [filteredDocuments],
  );

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((item) => item !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  useEffect(() => {
    setSelectedSubjects((currentSubjects) => currentSubjects.filter((subject) => availableSubjects.includes(subject)));
  }, [availableSubjects]);

  useEffect(() => {
    setViewMode(selectedSubjects.length > 1 ? '聚合画像' : '单体画像');
  }, [selectedSubjects.length]);

  const handleExportPDF = () => {
    const exportLines = viewMode === '单体画像' && activeSingleDocument
      ? [
        `画像名称：${getDocumentSubject(activeSingleDocument)}`,
        `业务线：${activeSingleDocument.businessLine || '未标注'}`,
        `提示词版本：${activeSingleDocument.promptVersionId ? `用户研究 ${activeSingleDocument.promptVersionId}` : '未记录'}`,
        `核心结论：${(activeSingleDocument.analysisResult?.summary?.conclusions || []).join('；') || '暂无'}`,
      ]
      : [
        `画像名称：${businessLine || '全部业务线'}聚合画像`,
        `样本数：${filteredDocuments.length}`,
        `来源版本：${aggregatePromptVersions.join('、') || '未记录'}`,
      ];

    const blob = new Blob([exportLines.join('\n')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewMode}分析报告_${new Date().getTime()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const singlePersonaData = useMemo(() => {
    if (!activeSingleDocument?.analysisResult) {
      return null;
    }

    const analysisResult = activeSingleDocument.analysisResult;
    const persona = analysisResult.persona || {};
    const insights = Array.isArray(analysisResult.insights) ? analysisResult.insights : [];
    const actions = analysisResult.actions || {};
    const customerName = getDocumentCustomerName(activeSingleDocument) || getDocumentSubject(activeSingleDocument);
    const demographics = getDocumentDemographicFacts(activeSingleDocument);
    const transcriptFacts = getDocumentFactHighlights(activeSingleDocument, 4);
    const factTags = getDocumentFactTags(activeSingleDocument, 4);

    const needTexts = analysisResult.summary?.conclusions?.slice(0, 3) || [];
    const blockerTexts = uniq(insights.map((insight: any) => insight.insight || insight.observation || '')).slice(0, 3);
    const followupTexts = uniq([
      ...(actions.product || []).map((action: any) => action.action || ''),
      ...(actions.marketing || []).map((action: any) => action.action || action.suggest || ''),
      ...(actions.design || []).map((action: any) => action.suggest || ''),
    ]).slice(0, 3);

    return {
      title: customerName,
      subtitle: demographics.length > 0 ? demographics.slice(0, 2).join(' · ') : (transcriptFacts[0] || '逐字稿中暂未提取到稳定事实'),
      tags: factTags,
      factHighlights: transcriptFacts.length > 0 ? transcriptFacts : ['逐字稿中暂未提取到可稳定确认的事实。'],
      sourceLabel: activeSingleDocument.promptVersionId ? `用户研究 ${activeSingleDocument.promptVersionId}` : '用户研究 历史版本未记录',
      sourceDocName: activeSingleDocument.name,
      journeyStages: (analysisResult.journey || []).map((item: any) => ({
        name: item.stage || '待补充阶段',
        icon: getEmotionIcon(item.emotion),
        desc: item.behavior || '待补充描述',
        quote: item.quote || '暂无用户原话',
      })),
      jtbd: analysisResult.summary?.conclusions?.[0] || insights[0]?.insight || '当前材料不足，暂无法稳定提炼 JTBD。',
      keyNeeds: needTexts.length > 0 ? needTexts : ['当前材料不足，暂无法稳定提炼关键需求。'],
      blockers: blockerTexts.length > 0 ? blockerTexts : ['当前材料不足，暂无法稳定提炼主要阻碍。'],
      followups: followupTexts.length > 0 ? followupTexts : ['当前材料不足，暂无法稳定生成跟进建议。'],
      highFreqTerms: extractTopTerms([
        ...(insights.map((insight: any) => insight.voc || '')),
        activeSingleDocument.content || '',
      ]),
    };
  }, [activeSingleDocument]);

  const aggregatePersonaData = useMemo(() => {
    if (filteredDocuments.length === 0) {
      return null;
    }

    const conclusions = filteredDocuments.flatMap((document) => document.analysisResult?.summary?.conclusions || []);
    const insights = filteredDocuments.flatMap((document) => document.analysisResult?.insights || []);
    const actions = filteredDocuments.flatMap((document) => [
      ...(document.analysisResult?.actions?.product || []).map((action: any) => action.action || ''),
      ...(document.analysisResult?.actions?.marketing || []).map((action: any) => action.action || action.suggest || ''),
      ...(document.analysisResult?.actions?.design || []).map((action: any) => action.suggest || ''),
    ]);
    const factTags = uniq(filteredDocuments.flatMap((document) => getDocumentFactTags(document, 2))).slice(0, 4);
    const factHighlights = uniq(filteredDocuments.flatMap((document) => getDocumentFactHighlights(document, 2))).slice(0, 4);
    const topWords = extractTopTerms([
      ...insights.map((insight: any) => insight.voc || ''),
      ...filteredDocuments.map((document) => document.content || ''),
    ], 6);

    return {
      title: selectedSubjects.length === 1 ? `${selectedSubjects[0]} 聚合画像` : `${businessLine || '全部业务线'}聚合画像`,
      subtitle: selectedSubjects.length === 1
        ? (factHighlights[0] || `覆盖 ${filteredDocuments.length} 份逐字稿`)
        : `样本量: ${filteredDocuments.length} 份访谈 · 覆盖 ${uniq(filteredDocuments.map(getDocumentSubject)).length} 位受访对象`,
      tags: factTags,
      factHighlights: factHighlights.length > 0 ? factHighlights : ['当前筛选逐字稿中暂未提取到可稳定确认的事实。'],
      sourceLabel: aggregatePromptVersions.join('、') || '用户研究 历史版本未记录',
      sourceDocName: filteredDocuments.length > 1 ? `${filteredDocuments.length} 份访谈聚合` : filteredDocuments[0].name,
      jtbd: conclusions[0] || insights[0]?.insight || '当前材料不足，暂无法稳定提炼聚合 JTBD。',
      keyNeeds: uniq(conclusions).slice(0, 3).length > 0 ? uniq(conclusions).slice(0, 3) : ['当前材料不足，暂无法稳定提炼关键需求。'],
      blockers: uniq(insights.map((insight: any) => insight.insight || insight.observation || '')).slice(0, 3).length > 0
        ? uniq(insights.map((insight: any) => insight.insight || insight.observation || '')).slice(0, 3)
        : ['当前材料不足，暂无法稳定提炼主要阻碍。'],
      followups: uniq(actions).slice(0, 3).length > 0 ? uniq(actions).slice(0, 3) : ['当前材料不足，暂无法稳定生成跟进建议。'],
      highFreqTerms: topWords,
    };
  }, [aggregatePromptVersions, businessLine, filteredDocuments, selectedSubjects]);

  const activePersona = viewMode === '单体画像' ? singlePersonaData : aggregatePersonaData;

  const emptyState = (
    <Card className="p-10 text-center">
      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-slate-900 mb-2">用户画像还没有接到可用样本</h3>
      <p className="text-sm text-slate-500">
        请先到“用户研究 &gt; 访谈分析”完成至少一份真实分析。用户画像页现在只展示来自用户研究提示词分析结果的数据，不再使用静态样例。
      </p>
    </Card>
  );

  if (analyzedDocuments.length === 0) {
    return <div className="space-y-6">{emptyState}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-wrap gap-4 items-end">
        <div className="w-48 relative group">
          <label className="block text-xs font-medium text-slate-500 mb-1">业务线</label>
          <div
            className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
            onClick={() => setIsBLOpen(!isBLOpen)}
          >
            <span className={!businessLine ? 'text-slate-400' : 'text-slate-700 font-medium'}>
              {businessLine || '全部'}
            </span>
            <div className="flex items-center">
              {businessLine && (
                <button
                  className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                  onClick={(event) => {
                    event.stopPropagation();
                    setBusinessLine('');
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isBLOpen ? 'rotate-180' : '')} />
            </div>
          </div>
          {isBLOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsBLOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                {['全部', ...BUSINESS_LINE_OPTIONS].map((option) => (
                  <div
                    key={option}
                    className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                    onClick={() => {
                      setBusinessLine(option === '全部' ? '' : option);
                      setIsBLOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-64 relative group">
          <label className="block text-xs font-medium text-slate-500 mb-1">受访对象</label>
          <div className="relative">
            <div
              className="w-full min-h-9 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm flex flex-wrap gap-1 cursor-pointer items-center min-h-[36px] justify-between hover:border-[#00A854] transition-all"
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
            >
              <div className="flex flex-wrap gap-1 items-center">
                {selectedSubjects.length === 0 && <span className="text-slate-400">请选择或搜索...</span>}
                {selectedSubjects.map((subject) => (
                  <span key={subject} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    {subject}
                    <X className="w-3 h-3 hover:text-red-500 ml-1" onClick={(event) => { event.stopPropagation(); handleToggleSubject(subject); }} />
                  </span>
                ))}
              </div>
              <div className="flex items-center">
                {selectedSubjects.length > 0 && (
                  <button
                    className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedSubjects([]);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', isSubjectDropdownOpen ? 'rotate-180' : '')} />
              </div>
            </div>
            {isSubjectDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSubjectDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 p-2">
                  <input
                    type="text"
                    className="w-full h-8 px-2 mb-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#00A854]"
                    placeholder="输入过滤词..."
                    value={subjectQuery}
                    onChange={(event) => setSubjectQuery(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredSubjects.map((subject) => (
                      <label key={subject} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject)}
                          onChange={() => handleToggleSubject(subject)}
                          className="rounded border-slate-300 text-[#00A854]"
                        />
                        {subject}
                      </label>
                    ))}
                    {filteredSubjects.length === 0 && <div className="text-xs text-slate-400 text-center py-2">无匹配结果</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-64 relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">时间范围</label>
          <DateRangePicker value={timeRange} onChange={setTimeRange} />
        </div>

        <div className="flex gap-2">
          <Button className="h-9" onClick={() => setIsSubjectDropdownOpen(false)}>确认</Button>
        </div>

        <div className="flex-1" />
        <Tabs tabs={['单体画像', '聚合画像']} activeTab={viewMode} onChange={setViewMode} />
      </Card>

      {filteredDocuments.length === 0 && (
        <Card className="p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-2">当前筛选条件下没有可展示画像</h3>
          <p className="text-sm text-slate-500">
            这表示当前业务线、时间范围或受访对象筛选下，没有找到通过“用户研究”提示词分析生成的有效结果。
          </p>
        </Card>
      )}

      {filteredDocuments.length > 0 && (
        <>
          <Card className="p-4 border-green-100 bg-green-50/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-green-700 mb-1">数据来源说明</div>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00A854]" />
                  当前页面展示的是“访谈分析”真实分析结果，不再使用静态样例
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  来源版本：{activePersona?.sourceLabel || '未记录'} · 来源文档：{activePersona?.sourceDocName || '未记录'}
                </div>
              </div>
              {viewMode === '单体画像' && selectedSubjects.length > 1 && (
                <Badge variant="warning">当前为单体画像，已优先展示最近一份匹配访谈</Badge>
              )}
            </div>
          </Card>

          {viewMode === '单体画像' && singlePersonaData?.journeyStages?.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-6">用户决策旅程图</h3>
              <div className="w-full">
                <div className="relative mb-6">
                  <div className="absolute top-5 left-[108px] right-2 h-0.5 bg-slate-200 z-0" />
                  <div
                    className="grid gap-3 items-start relative z-10"
                    style={{ gridTemplateColumns: `96px repeat(${singlePersonaData.journeyStages.length}, minmax(0, 1fr))` }}
                  >
                    <div />
                    {singlePersonaData.journeyStages.map((stage: any, index: number) => (
                      <div key={index} className="flex flex-col items-center text-center px-1">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-[#00A854] flex items-center justify-center mb-3 shadow-sm">
                          <stage.icon className="w-5 h-5 text-[#00A854]" />
                        </div>
                        <div className="font-medium text-sm text-slate-900 leading-snug">{stage.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="grid gap-3 items-stretch"
                  style={{ gridTemplateColumns: `96px repeat(${singlePersonaData.journeyStages.length}, minmax(0, 1fr))` }}
                >
                  <div className="flex items-center justify-end pr-2 text-sm font-semibold text-slate-500">
                    用户心路
                  </div>
                  {singlePersonaData.journeyStages.map((stage: any, index: number) => (
                    <div key={`desc-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-left text-xs leading-relaxed text-slate-600 h-full">
                      {stage.desc}
                    </div>
                  ))}

                  <div className="flex items-center justify-end pr-2 text-sm font-semibold text-slate-500">
                    用户VOC
                  </div>
                  {singlePersonaData.journeyStages.map((stage: any, index: number) => (
                    <div key={`quote-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-left text-[11px] leading-relaxed text-slate-600 italic h-full">
                      {stage.quote}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activePersona && (
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-1 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-24 min-h-24 rounded-2xl border border-green-100 bg-green-50/80 p-3 shrink-0">
                    <div className="text-[10px] font-medium text-green-700 mb-2">逐字稿事实</div>
                    <div className="space-y-1.5">
                      {activePersona.factHighlights.slice(0, 2).map((fact: string) => (
                        <div key={fact} className="text-[11px] leading-snug text-slate-700 max-h-10 overflow-hidden">
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{activePersona.title}</h2>
                    <div className="text-sm text-slate-500">{activePersona.subtitle}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-2">逐字稿事实标签</div>
                    <div className="flex flex-wrap gap-2">
                      {activePersona.tags.length > 0 ? activePersona.tags.map((tag: string) => (
                        <Badge key={tag}>{tag}</Badge>
                      )) : <span className="text-xs text-slate-400">当前暂无稳定事实标签</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-2">逐字稿事实列表</div>
                    <div className="space-y-2">
                      {activePersona.factHighlights.map((fact: string) => (
                        <div key={fact} className="text-xs leading-relaxed text-slate-600 bg-slate-50 rounded-lg border border-slate-100 px-3 py-2">
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>

                  {viewMode === '聚合画像' && (
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-2">高频原生词</div>
                      <div className="flex flex-wrap gap-2">
                        {activePersona.highFreqTerms.length > 0 ? activePersona.highFreqTerms.map(([term, count]: [string, number]) => (
                          <span key={term} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                            "{term}" ({count}次)
                          </span>
                        )) : <span className="text-xs text-slate-400">当前暂无稳定高频词</span>}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="col-span-2 p-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-[#00A854] rounded-full" />
                        JTBD (待办任务)
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{activePersona.jtbd}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                        关键需求
                      </h4>
                      <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                        {activePersona.keyNeeds.map((item: string) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-red-500 rounded-full" />
                        主要阻碍
                      </h4>
                      <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                        {activePersona.blockers.map((item: string) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
                        跟进建议
                      </h4>
                      <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                        {activePersona.followups.map((item: string) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="gap-2"><BookmarkPlus className="w-4 h-4" /> 保存画像</Button>
            <Button variant="outline" className="gap-2"><Database className="w-4 h-4" /> 加入数据中心</Button>
            <Button className="gap-2" onClick={handleExportPDF}><Download className="w-4 h-4" /> 导出画像卡</Button>
          </div>
        </>
      )}
    </div>
  );
};
