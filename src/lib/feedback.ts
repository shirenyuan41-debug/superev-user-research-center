const FEEDBACK_STOP_WORDS = [
  '请输入',
  '具体评价',
  '修改建议',
  '然后',
  '已经',
  '如果',
  '但是',
  '因为',
  '所以',
  '还是',
  '这个',
  '那个',
  '我们',
  '你们',
  '他们',
  '自己',
  '没有',
  '可以',
  '需要',
  '觉得',
  '感觉',
  '一下',
  '什么',
  '怎么',
  '不是',
  '就是',
  '以及',
  '内容',
  '结果',
  '分析',
  '评价',
  '建议',
  '页面',
  '留言',
  '点击',
  '对应',
  '次数',
  '里面',
  '这里',
  '那里',
  '的话',
  '然后',
  '一个',
  '一些',
  '很多',
  '有点',
  '还是',
  '比较',
  '希望',
  '问题',
  '需要',
  '觉得',
  '感觉',
  '用户',
  'AI',
];

const FEEDBACK_STOP_WORDS_SET = new Set(FEEDBACK_STOP_WORDS);

const stripMarkdown = (text: string) => (
  text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const summarizeFeedbackFocus = (feedbackText: string) => {
  const focus: string[] = [];

  if (/泛|空|虚|笼统|废话|不具体/.test(feedbackText)) {
    focus.push('结果表述偏泛，缺少具体场景');
  }

  if (/业务|超级订阅|灵活订阅|场景|特性/.test(feedbackText)) {
    focus.push('内容没有贴住真实业务语境');
  }

  if (/建议|行动|话术|沟通|跟进/.test(feedbackText)) {
    focus.push('建议不够落地，缺少可执行动作');
  }

  if (/不准|错误|偏差|不对|不准确/.test(feedbackText)) {
    focus.push('用户认为分析判断存在偏差');
  }

  if (/缺少|没有|遗漏|漏掉/.test(feedbackText)) {
    focus.push('关键信息有遗漏');
  }

  return Array.from(new Set(focus));
};

export const buildAiEvaluationSummary = (feedbackText: string, type: 'up' | 'down') => {
  const text = feedbackText.trim();

  if (!text) {
    return type === 'up'
      ? '用户给出了正向反馈，但没有补充具体认可点。'
      : '用户给出了点踩反馈，但没有补充具体原因。';
  }

  if (type === 'up') {
    return `用户整体认可当前结果，核心反馈是：“${text}”`;
  }

  const focus = summarizeFeedbackFocus(text);
  if (focus.length > 0) {
    return `用户主要在反馈：${focus.slice(0, 2).join('；')}。原声为：“${text}”`;
  }

  return `用户表达了明确的不满意，原声为：“${text}”`;
};

export const buildAiSuggestionFromFeedback = (feedbackText: string, type: 'up' | 'down') => {
  const text = feedbackText.trim();
  const causes: string[] = [];
  const solutions: string[] = [];

  const formatStructuredSuggestion = (causeList: string[], solutionList: string[]) => (
    [
      '1、可能导致这个问题的原因',
      ...causeList.map((item) => `- ${item}`),
      '',
      '2、原因对应的解决方案',
      ...solutionList.map((item) => `- ${item}`),
    ].join('\n')
  );

  if (!text) {
    return type === 'up'
      ? formatStructuredSuggestion(
        ['当前是正向反馈，没有识别到明确的问题信号。'],
        ['保持当前输出方式，并继续补充更具体的正向样本，方便沉淀有效经验。'],
      )
      : formatStructuredSuggestion(
        ['用户给了点踩，但没有补充具体问题，导致真实症结还不够清晰。'],
        ['引导用户补充哪一段不准、缺了什么、希望如何修改，便于后续定向优化。'],
      );
  }

  if (type === 'up') {
    return formatStructuredSuggestion(
      ['这是一条正向反馈，说明当前输出方式整体被认可，没有明显质量问题。'],
      ['将这条反馈沉淀为优质样本，保留当前结构，并记录用户认可的表达方式。'],
    );
  }

  if (/泛|空|虚|笼统|废话|不具体/.test(text)) {
    causes.push('输出停留在泛化判断，没有落到具体业务场景、证据或动作。');
    solutions.push('把输出改成“具体业务场景 + 用户原话 + 明确动作”的结构，避免只停留在泛化判断。');
  }

  if (/业务|超级订阅|灵活订阅|场景|特性/.test(text)) {
    causes.push('内容没有贴住真实业务语境，用户看不到和业务线强相关的表达。');
    solutions.push('在生成内容时强制带入对应业务线语境，避免脱离“超级订阅/灵活订阅”等真实场景。');
  }

  if (/建议|行动|话术|沟通|跟进/.test(text)) {
    causes.push('建议不够落地，缺少可直接执行的动作、话术或跟进方案。');
    solutions.push('把建议细化为“触发场景、推荐动作、可直接复用的话术/方案”，提高可执行性。');
  }

  if (/不准|错误|偏差|不对|不准确/.test(text)) {
    causes.push('分析判断和用户感知存在偏差，结论依据没有被清楚展示出来。');
    solutions.push('为每条结论补充对应依据，减少判断跳步，让用户能看出结论从哪句话得出。');
  }

  if (/缺少|没有|遗漏|漏掉/.test(text)) {
    causes.push('关键信息在提炼过程中被遗漏，导致结果覆盖不完整。');
    solutions.push('增加遗漏检查，确保用户明确提到的关键信息不会在摘要阶段被漏掉。');
  }

  if (causes.length === 0) {
    causes.push('反馈原声里没有完全点明问题类型，系统还需要先做更细的归因拆解。');
  }

  if (solutions.length === 0) {
    solutions.push('先按这条原声拆出“问题点、缺失点、期待改法”三部分，再针对性优化输出。');
  }

  return formatStructuredSuggestion(
    Array.from(new Set(causes)).slice(0, 2),
    Array.from(new Set(solutions)).slice(0, 2),
  );
};

export const inferFeedbackIssue = (feedbackText: string, type: 'up' | 'down') => {
  if (type === 'up') {
    return '质量认可';
  }

  if (/泛|空|笼统|废话|不具体/.test(feedbackText)) {
    return '过于泛化';
  }

  if (/业务|场景|特性/.test(feedbackText)) {
    return '业务贴合度不足';
  }

  if (/建议|行动|话术|沟通|跟进/.test(feedbackText)) {
    return '行动建议不具体';
  }

  if (/不准|错误|偏差|不对|不准确/.test(feedbackText)) {
    return '分析不准确';
  }

  return '内容有待优化';
};

export const getFeedbackVoice = (feedback: any) => (
  String(feedback?.sourceVoice || feedback?.feedback || '').trim()
);

export const getFeedbackAiEvaluation = (feedback: any) => (
  getFeedbackVoice(feedback)
    ? buildAiEvaluationSummary(getFeedbackVoice(feedback), feedback?.type === 'up' ? 'up' : 'down')
    : String(feedback?.aiEvaluation || feedback?.analysisSummary || '').trim()
);

export const getFeedbackAiSuggestion = (feedback: any) => (
  getFeedbackVoice(feedback)
    ? buildAiSuggestionFromFeedback(getFeedbackVoice(feedback), feedback?.type === 'up' ? 'up' : 'down')
    : String(feedback?.aiSuggestion || feedback?.suggestion || '').trim()
);

export const parseFeedbackTimestamp = (feedback: any) => {
  if (typeof feedback?.createdAt === 'number' && Number.isFinite(feedback.createdAt)) {
    return feedback.createdAt;
  }

  if (typeof feedback?.updatedAt === 'number' && Number.isFinite(feedback.updatedAt)) {
    return feedback.updatedAt;
  }

  if (typeof feedback?.timestamp === 'number' && Number.isFinite(feedback.timestamp)) {
    return feedback.timestamp;
  }

  if (typeof feedback?.timestamp === 'string' && feedback.timestamp.trim()) {
    const parsedTimestamp = Date.parse(feedback.timestamp);
    if (Number.isFinite(parsedTimestamp)) {
      return parsedTimestamp;
    }
  }

  return Number.NEGATIVE_INFINITY;
};

const tokenizeFeedbackText = (text: string): string[] => {
  if (!text.trim()) {
    return [];
  }

  let normalizedText = stripMarkdown(text)
    .replace(/[“”"'`]/g, ' ')
    .replace(/[，。！？；：、,.!?;:()[\]{}<>《》【】\n\r\t]/g, ' ');

  FEEDBACK_STOP_WORDS.forEach((word) => {
    normalizedText = normalizedText.replace(new RegExp(word, 'g'), ' ');
  });

  const matchedTokens: string[] = normalizedText.match(/超级订阅|灵活订阅|[A-Za-z][A-Za-z0-9-]{1,}|[\u4e00-\u9fa5]{2,8}/g) || [];

  return matchedTokens.filter((token) => {
    const value = token.trim();
    return value.length >= 2 && !FEEDBACK_STOP_WORDS_SET.has(value);
  });
};

export const extractFeedbackKeywords = (feedbacks: any[], limit = 5) => {
  const tokenCounts = new Map<string, number>();

  feedbacks.forEach((feedback) => {
    tokenizeFeedbackText(getFeedbackVoice(feedback)).forEach((token) => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });
  });

  return Array.from(tokenCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].length - right[0].length)
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
};
