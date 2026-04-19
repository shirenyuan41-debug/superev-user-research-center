const escapeTableCell = (value: unknown) => String(value ?? '')
  .replace(/\|/g, '\\|')
  .replace(/\n/g, '<br />')
  .trim();

const keywordStopWords = new Set([
  '我们', '你们', '他们', '自己', '这个', '那个', '一个', '不是', '就是', '因为', '所以', '如果', '还是', '然后',
  '已经', '可以', '需要', '没有', '什么', '怎么', '一下', '时候', '感觉', '觉得', '进行', '以及', '用户', '访谈者',
  '说话人', '超级电动', '超级订阅', '灵活订阅', '内容', '问题', '建议', '分析', '结果',
]);

const extractTopKeywords = (result: any, sourceText?: string) => {
  const fallbackText = [
    ...(result?.summary?.conclusions || []),
    ...(result?.insights || []).flatMap((item: any) => [item.observation || '', item.insight || '', item.voc || '']),
    ...(result?.journey || []).flatMap((item: any) => [item.behavior || '', item.quote || '']),
  ].join(' ');

  const text = sourceText || fallbackText;
  const tokens: string[] = text.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z][A-Za-z0-9-]{2,}/g) || [];
  const counts = new Map<string, number>();

  tokens.forEach((token) => {
    const normalized = token.trim();
    if (!normalized || keywordStopWords.has(normalized)) {
      return;
    }
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20);
};

export const buildSpectrumTrack = (value: number) => {
  const trackLength = 24;
  const clampedValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 50;
  const markerIndex = Math.round((clampedValue / 100) * trackLength);
  return Array.from({ length: trackLength + 1 }, (_, index) => index === markerIndex ? '●' : '—').join('');
};

export const buildEmotionHeatmapRows = (normalizedResult: any) => {
  const sourceRows = normalizedResult.journey.length > 0
    ? normalizedResult.journey.map((item: any) => ({
      topic: item.stage || '访谈阶段',
      emotion: item.emotion || '',
      text: `${item.behavior || ''} ${item.quote || ''}`.trim(),
    }))
    : normalizedResult.insights.map((insight: any) => ({
      topic: insight.title || '核心洞察',
      emotion: '',
      text: `${insight.observation || ''} ${insight.voc || ''}`.trim(),
    }));

  if (sourceRows.length === 0) {
    return ['暂无足够材料生成情感分布热力图'];
  }

  return sourceRows.slice(0, 5).map((row: any) => {
    const text = `${row.emotion} ${row.text}`;
    const isNegative = /😡|😤|😒|焦虑|卡住|不满|问题|风险|抱怨|负/.test(text);
    const isPositive = /😊|🙂|满意|认可|喜欢|顺畅|正/.test(text);
    const positive = isPositive ? '████' : '█';
    const negative = isNegative ? '█████' : '█';
    const neutral = !isNegative && !isPositive ? '████' : '██';
    const dominant = isNegative ? '😤 负向为主' : isPositive ? '😊 正向为主' : '😐 中性为主';
    return `${row.topic.padEnd(14, ' ')} ${positive}  ${neutral}  ${negative}   ${dominant}`;
  });
};

export const normalizeAnalysisResult = (
  result: any,
  options?: { sourceContent?: string },
) => {
  const normalizedResult = {
    summary: {
      conclusions: Array.isArray(result?.summary?.conclusions)
        ? result.summary.conclusions.map((item: any) => typeof item === 'string' ? item.trim() : '').filter(Boolean)
        : [],
      decisions: Array.isArray(result?.summary?.decisions)
        ? result.summary.decisions
          .map((item: any) => ({
            title: typeof item?.title === 'string' ? item.title.trim() : '',
            reason: typeof item?.reason === 'string' ? item.reason.trim() : '',
            priority: typeof item?.priority === 'string' ? item.priority.trim() : '',
          }))
          .filter((item: any) => item.title || item.reason || item.priority)
        : [],
    },
    insights: Array.isArray(result?.insights)
      ? result.insights
        .map((insight: any) => ({
          title: typeof insight?.title === 'string' ? insight.title.trim() : '',
          tag: typeof insight?.tag === 'string' ? insight.tag.trim() : '',
          user: typeof insight?.user === 'string' ? insight.user.trim() : '',
          observation: typeof insight?.observation === 'string' ? insight.observation.trim() : '',
          insight: typeof insight?.insight === 'string' ? insight.insight.trim() : '',
          voc: typeof insight?.voc === 'string' ? insight.voc.trim() : '',
          matrixZone: typeof insight?.matrixZone === 'string' ? insight.matrixZone.trim() : '',
        }))
        .filter((insight: any) => insight.title || insight.observation || insight.insight || insight.voc)
      : [],
    persona: {
      name: result?.persona?.name || '未识别受访对象',
      demographics: result?.persona?.demographics && typeof result.persona.demographics === 'object' ? result.persona.demographics : {},
      spectrum: Array.isArray(result?.persona?.spectrum)
        ? result.persona.spectrum
          .map((item: any) => ({
            dimension: typeof item?.dimension === 'string' ? item.dimension.trim() : '',
            left: typeof item?.left === 'string' ? item.left.trim() : '',
            right: typeof item?.right === 'string' ? item.right.trim() : '',
            value: typeof item?.value === 'number' ? item.value : 50,
            leftUsers: Array.isArray(item?.leftUsers) ? item.leftUsers.map((value: any) => String(value).trim()).filter(Boolean) : [],
            rightUsers: Array.isArray(item?.rightUsers) ? item.rightUsers.map((value: any) => String(value).trim()).filter(Boolean) : [],
          }))
          .filter((item: any) => item.dimension || item.left || item.right)
        : [],
    },
    actions: {
      product: Array.isArray(result?.actions?.product)
        ? result.actions.product
          .map((item: any) => ({
            priority: typeof item?.priority === 'string' ? item.priority.trim() : '',
            action: typeof item?.action === 'string' ? item.action.trim() : '',
            insightRef: typeof item?.insightRef === 'string' ? item.insightRef.trim() : '',
            type: typeof item?.type === 'string' ? item.type.trim() : '',
          }))
          .filter((item: any) => item.priority || item.action || item.insightRef || item.type)
        : [],
      marketing: Array.isArray(result?.actions?.marketing)
        ? result.actions.marketing
          .map((item: any) => ({
            action: typeof item?.action === 'string' ? item.action.trim() : '',
            current: typeof item?.current === 'string' ? item.current.trim() : '',
            suggest: typeof item?.suggest === 'string' ? item.suggest.trim() : '',
            insightRef: typeof item?.insightRef === 'string' ? item.insightRef.trim() : '',
          }))
          .filter((item: any) => item.action || item.current || item.suggest || item.insightRef)
        : [],
      design: Array.isArray(result?.actions?.design)
        ? result.actions.design
          .map((item: any) => ({
            module: typeof item?.module === 'string' ? item.module.trim() : '',
            problem: typeof item?.problem === 'string' ? item.problem.trim() : '',
            load: typeof item?.load === 'string' ? item.load.trim() : '',
            suggest: typeof item?.suggest === 'string' ? item.suggest.trim() : '',
            insightRef: typeof item?.insightRef === 'string' ? item.insightRef.trim() : '',
          }))
          .filter((item: any) => item.module || item.problem || item.load || item.suggest || item.insightRef)
        : [],
    },
    journey: Array.isArray(result?.journey)
      ? result.journey
        .map((item: any) => ({
          stage: typeof item?.stage === 'string' ? item.stage.trim() : '',
          emotion: typeof item?.emotion === 'string' ? item.emotion.trim() : '',
          behavior: typeof item?.behavior === 'string' ? item.behavior.trim() : '',
          quote: typeof item?.quote === 'string' ? item.quote.trim() : '',
        }))
        .filter((item: any) => item.stage || item.emotion || item.behavior || item.quote)
      : [],
    insightNotice: typeof result?.insightNotice === 'string' ? result.insightNotice.trim() : '',
    journeyNotice: typeof result?.journeyNotice === 'string' ? result.journeyNotice.trim() : '',
    personaNotice: typeof result?.personaNotice === 'string' ? result.personaNotice.trim() : '',
    actionsNotice: typeof result?.actionsNotice === 'string' ? result.actionsNotice.trim() : '',
    keywordRows: Array.isArray(result?.keywordRows)
      ? result.keywordRows
        .map((item: any) => Array.isArray(item) && item.length >= 2 ? [String(item[0]).trim(), Number(item[1])] : null)
        .filter((item: any) => item && item[0] && Number.isFinite(item[1]))
      : [],
    emotionHeatmapRows: Array.isArray(result?.emotionHeatmapRows)
      ? result.emotionHeatmapRows.map((item: any) => typeof item === 'string' ? item.trim() : '').filter(Boolean)
      : [],
  };

  const keywordRows = normalizedResult.keywordRows.length > 0
    ? normalizedResult.keywordRows
    : extractTopKeywords(normalizedResult, options?.sourceContent).slice(0, 10);

  const emotionHeatmapRows = normalizedResult.emotionHeatmapRows.length > 0
    ? normalizedResult.emotionHeatmapRows
    : buildEmotionHeatmapRows(normalizedResult);

  return {
    ...normalizedResult,
    keywordRows,
    emotionHeatmapRows,
    fullReportMarkdown: typeof result?.fullReportMarkdown === 'string' ? result.fullReportMarkdown.trim() : '',
  };
};

export const buildCodingTagRows = (normalizedResult: any) => {
  const groupedTags = new Map<string, { count: number; sample: string }>();
  normalizedResult.insights.forEach((insight: any) => {
    const tag = insight.tag || '【未标注】';
    const existing = groupedTags.get(tag);
    groupedTags.set(tag, {
      count: existing ? existing.count + 1 : 1,
      sample: existing?.sample || insight.voc || insight.observation || '暂无代表性原话',
    });
  });

  if (groupedTags.size === 0) {
    return ['| 【信息不足】 | 0条 | "当前材料不足，暂无法完成编码标签汇总" |'];
  }

  return Array.from(groupedTags.entries()).map(([tag, value]) => (
    `| ${escapeTableCell(tag)} | ${value.count}条 | "${escapeTableCell(value.sample)}" |`
  ));
};
