import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

type ProviderName = 'gemini' | 'deepseek';

type AnalysisRequestConfig = {
  label: string;
  protocol: string;
  resultInstruction: string;
};

type ProviderExecutionResult = {
  payload: Record<string, unknown>;
  provider: ProviderName;
  model: string;
};

type AnalysisExecutionResult = {
  analysisResult: Record<string, unknown>;
  llmProvider: ProviderName;
  llmModel: string;
};

const DEFAULT_PRIMARY_PROVIDER: ProviderName = env.LLM_PROVIDER === 'deepseek' ? 'deepseek' : 'gemini';

const SUMMARY_OUTPUT_PROTOCOL = `
结果输出要求（重点是“速览”页签）：
1. summary.conclusions 输出 3-5 条核心结论。
2. summary.decisions 输出 3 条最紧急的关键决策建议，每项包含 title、reason、priority。
3. 如果材料不足，请返回当前真正成立的结论和建议数量，不得强凑。
`;

const INSIGHT_OUTPUT_PROTOCOL = `
结果输出要求（重点是“洞察”页签）：
1. 只返回一个 JSON 对象，不要输出 Markdown、代码块或额外解释。
2. insights 数组输出 3-5 条真正成立的业务洞察；如果材料不足，可以少于 3 条。
3. 每条 insight 必须包含 title、tag、user、observation、insight、voc。
4. 如果输入材料不足以支持 3-5 条洞察，请返回 insightNotice。
`;

const JOURNEY_OUTPUT_PROTOCOL = `
结果输出要求（重点是“旅程图”页签）：
1. journey 数组输出当前文档中真实成立的用户决策旅程。
2. 每个 journey item 必须包含 stage、emotion、behavior、quote。
3. 如果材料不足，请通过 journeyNotice 说明不足原因。
`;

const PERSONA_OUTPUT_PROTOCOL = `
结果输出要求（重点是“画像”页签）：
1. persona.spectrum 数组输出 2-3 个最有区分度的用户光谱维度。
2. 每个 spectrum item 必须包含 dimension、left、right、value、leftUsers、rightUsers。
3. 如果材料不足，请通过 personaNotice 说明不足原因。
`;

const PRIMARY_OUTPUT_PROTOCOL = `
结果输出要求（请一次性完成“速览 / 洞察 / 旅程图 / 画像”四个页签）：
1. 只返回一个 JSON 对象，不要输出 Markdown、代码块或额外解释。
2. 顶层必须同时包含 summary、insights、journey、persona。
3. summary.conclusions 输出 3-5 条核心结论；summary.decisions 输出 3 条最紧急的关键决策建议，每项包含 title、reason、priority。
4. insights 数组输出 3-5 条真正成立的业务洞察；每条包含 title、tag、user、observation、insight、voc。材料不足时可以少于 3 条，并通过 insightNotice 说明。
5. journey 数组输出当前文档中真实成立的用户决策旅程；每项包含 stage、emotion、behavior、quote。材料不足时通过 journeyNotice 说明。
6. persona.spectrum 数组输出 2-3 个最有区分度的用户光谱维度；每项包含 dimension、left、right、value、leftUsers、rightUsers。材料不足时通过 personaNotice 说明。
7. 如果材料不足，请返回当前真正成立的内容数量，不得强凑。
`;

const ACTION_OUTPUT_PROTOCOL = `
结果输出要求（重点是“行动建议”页签）：
1. actions.product 输出 priority、action、insightRef、type。
2. actions.marketing 输出 action、current、suggest、insightRef。
3. actions.design 输出 module、problem、load、suggest、insightRef。
4. 如果材料不足，请通过 actionsNotice 说明不足原因。
`;

const PRIMARY_ANALYSIS_CONFIG: AnalysisRequestConfig = {
  label: '主分析',
  protocol: `${SUMMARY_OUTPUT_PROTOCOL}\n${INSIGHT_OUTPUT_PROTOCOL}\n${JOURNEY_OUTPUT_PROTOCOL}\n${PERSONA_OUTPUT_PROTOCOL}\n${PRIMARY_OUTPUT_PROTOCOL}`,
  resultInstruction: `
只返回一个 JSON 对象，顶层允许包含：
- summary
- insights
- journey
- persona
- insightNotice
- journeyNotice
- personaNotice

返回格式示例：
{
  "summary": {
    "conclusions": ["..."],
    "decisions": [{ "title": "...", "reason": "...", "priority": "高" }]
  },
  "insights": [
    {
      "title": "...",
      "tag": "...",
      "user": "...",
      "observation": "...",
      "insight": "...",
      "voc": "..."
    }
  ],
  "journey": [
    {
      "stage": "...",
      "emotion": "...",
      "behavior": "...",
      "quote": "..."
    }
  ],
  "persona": {
    "name": "...",
    "spectrum": [
      {
        "dimension": "...",
        "left": "...",
        "right": "...",
        "value": 50,
        "leftUsers": ["..."],
        "rightUsers": ["..."]
      }
    ]
  },
  "insightNotice": "...",
  "journeyNotice": "...",
  "personaNotice": "..."
}
`,
};

const ACTION_ANALYSIS_CONFIG: AnalysisRequestConfig = {
  label: '行动建议',
  protocol: ACTION_OUTPUT_PROTOCOL,
  resultInstruction: `
只返回一个 JSON 对象，顶层只允许包含 actions 和可选的 actionsNotice。
`,
};

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    const errorWithCause = error as Error & { cause?: unknown };
    const causeMessage = errorWithCause.cause instanceof Error
      ? errorWithCause.cause.message
      : typeof errorWithCause.cause === 'string'
        ? errorWithCause.cause
        : typeof (errorWithCause.cause as { message?: unknown } | undefined)?.message === 'string'
          ? String((errorWithCause.cause as { message: string }).message)
          : '';

    if (causeMessage && causeMessage !== error.message) {
      return `${error.message}: ${causeMessage}`;
    }

    return error.message;
  }

  return String(error ?? '');
};

const normalizeJsonText = (value: string) => {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');

  const objectStart = withoutFence.indexOf('{');
  const objectEnd = withoutFence.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return withoutFence.slice(objectStart, objectEnd + 1);
  }

  return withoutFence;
};

const parseStructuredJsonText = (responseText: string, sectionLabel: string) => {
  if (!responseText.trim()) {
    throw new Error(`${sectionLabel}结果为空`);
  }

  return JSON.parse(normalizeJsonText(responseText));
};

const parseSectionPayload = (responseText: string, sectionLabel: string) => {
  const payload = JSON.parse(responseText);
  const messageContent = payload?.choices?.[0]?.message?.content;

  return parseStructuredJsonText(typeof messageContent === 'string' ? messageContent : '', sectionLabel);
};

const normalizeInsights = (result: any) => (
  Array.isArray(result?.insights)
    ? result.insights.map((item: any) => ({
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      tag: typeof item?.tag === 'string' ? item.tag.trim() : '',
      user: typeof item?.user === 'string' ? item.user.trim() : '',
      observation: typeof item?.observation === 'string' ? item.observation.trim() : '',
      insight: typeof item?.insight === 'string' ? item.insight.trim() : '',
      voc: typeof item?.voc === 'string' ? item.voc.trim() : '',
    })).filter((item: any) => item.title || item.observation || item.insight || item.voc)
    : []
);

const buildSystemInstruction = (
  systemPrompt: string,
  section: AnalysisRequestConfig,
  extraContext?: string,
) => `${systemPrompt}\n\n${section.protocol}\n\n${section.resultInstruction}${extraContext ? `\n\n额外上下文：\n${extraContext}` : ''}\n\n输出约束：只返回合法 JSON，不要输出代码块，不要输出额外解释。`;

const getProviderLabel = (provider: ProviderName) => (provider === 'gemini' ? 'Gemini' : 'DeepSeek');

const getProviderConfig = (provider: ProviderName) => {
  if (provider === 'deepseek') {
    return {
      provider,
      label: 'DeepSeek',
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL,
      baseUrl: env.DEEPSEEK_BASE_URL,
    };
  }

  return {
    provider,
    label: 'Gemini',
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    baseUrl: env.GEMINI_BASE_URL,
  };
};

const runAnalysisWithProvider = async (
  provider: ProviderName,
  section: AnalysisRequestConfig,
  systemPrompt: string,
  requestUserContent: string,
  extraContext?: string,
): Promise<ProviderExecutionResult> => {
  const config = getProviderConfig(provider);
  if (!config.apiKey) {
    throw new Error(`${config.label} API Key 未配置`);
  }

  const systemInstruction = buildSystemInstruction(systemPrompt, section, extraContext);

  if (provider === 'gemini') {
    const client = new GoogleGenAI({ apiKey: config.apiKey });
    const response = await client.models.generateContent({
      model: config.model,
      contents: requestUserContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    return {
      payload: parseStructuredJsonText(response.text ?? '', section.label),
      provider,
      model: config.model,
    };
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemInstruction,
        },
        {
          role: 'user',
          content: requestUserContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(responseText || `DeepSeek request failed with status ${response.status}`);
  }

  return {
    payload: parseSectionPayload(responseText, section.label),
    provider,
    model: config.model,
  };
};

const executeSection = async (
  provider: ProviderName,
  section: AnalysisRequestConfig,
  systemPrompt: string,
  requestUserContent: string,
  extraContext?: string,
): Promise<ProviderExecutionResult> => {
  if (provider === 'deepseek') {
    try {
      return await runAnalysisWithProvider('deepseek', section, systemPrompt, requestUserContent, extraContext);
    } catch (error) {
      throw new Error(`DeepSeek 分析失败：${getErrorText(error)}`);
    }
  }

  try {
    return await runAnalysisWithProvider('gemini', section, systemPrompt, requestUserContent, extraContext);
  } catch (geminiError) {
    try {
      return await runAnalysisWithProvider('deepseek', section, systemPrompt, requestUserContent, extraContext);
    } catch (deepseekError) {
      throw new Error(
        `Gemini 失败后已自动尝试 DeepSeek，仍未成功。Gemini：${getErrorText(geminiError)}；DeepSeek：${getErrorText(deepseekError)}`,
      );
    }
  }
};

export const analyzeInterviewDocument = async (
  content: string,
  systemPrompt: string,
): Promise<AnalysisExecutionResult> => {
  const userContent = `以下是需要分析的访谈材料，请严格按照系统指令完成分析，并且只返回一个 JSON 对象，不要输出代码块或额外说明。\n\n${content}`;
  const mergedResult: Record<string, unknown> = {};
  let activeProvider: ProviderName = DEFAULT_PRIMARY_PROVIDER;
  let activeModel = getProviderConfig(activeProvider).model;

  const primaryResult = await executeSection(
    activeProvider,
    PRIMARY_ANALYSIS_CONFIG,
    systemPrompt,
    userContent,
  );
  Object.assign(mergedResult, primaryResult.payload);
  activeProvider = primaryResult.provider;
  activeModel = primaryResult.model;

  const insights = normalizeInsights(mergedResult);
  const insightContext = insights.length > 0
    ? insights.map((item: any, index: number) => (
      `洞察#${index + 1}：
标题：${item.title || '未命名洞察'}
标签：${item.tag || '未标注'}
来源用户：${item.user || '未标注'}
观察现象：${item.observation || '暂无'}
深度洞察：${item.insight || '暂无'}
原声重现：${item.voc || '暂无'}`
    )).join('\n\n')
    : '当前未提炼出稳定洞察，请仅输出能成立的行动建议，并明确不足原因。';
  const actionUserContent = `以下是已经提炼完成的业务洞察，请严格基于这些洞察生成行动建议，并且只返回一个 JSON 对象，不要输出代码块或额外说明。\n\n${insightContext}`;

  const actionResult = await executeSection(
    activeProvider,
    ACTION_ANALYSIS_CONFIG,
    systemPrompt,
    actionUserContent,
    '请直接基于这些洞察输出行动建议，并在 insightRef 中引用对应的“洞察#N”。',
  );
  Object.assign(mergedResult, actionResult.payload);
  activeProvider = actionResult.provider;
  activeModel = actionResult.model;

  return {
    analysisResult: mergedResult,
    llmProvider: activeProvider,
    llmModel: activeModel,
  };
};
