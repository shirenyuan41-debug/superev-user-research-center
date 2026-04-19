# SUPEREV 用研中心流程图

这份流程图基于当前仓库真实实现整理，不按早期原型推演。

当前需要特别注意：

- 真实分析链路目前只接入`用户研究`
- 真实上传与分析目前只支持 `docx` 和 `txt`
- `销转研究 / 舆情研究 / 行业研究 / 员工研究 / 数据中心 / 首页` 仍以高保真原型或结果消费页为主

## 1. 项目总体运行流程

```mermaid
flowchart LR
  U["用户"] --> FE["前端 React 应用"]
  START["后端启动"] --> BOOT["ensureRuntimeBootstrap<br/>初始化存储目录 / 管理员 / 默认 Prompt"]

  subgraph Frontend["浏览器端"]
    FE --> APP["App 启动"]
    APP --> AUTH_CHECK["请求 /api/auth/me<br/>恢复登录状态"]
    AUTH_CHECK --> STORE["globalStore.loadAll()<br/>并行加载文档 / Todo / 反馈 / Prompt 版本"]
    STORE --> PAGES["页面模块<br/>访谈分析 / 用户画像 / Todo 管理 / 提示词管理"]
  end

  subgraph Backend["Express 后端"]
    API["/api"]
    AUTH["authRouter"]
    DOC["documentsRouter"]
    TODO["todosRouter"]
    FB["feedbacksRouter"]
    PROMPT["promptModulesRouter<br/>promptVersionsRouter"]
  end

  subgraph Data["数据与外部能力"]
    MYSQL["MySQL<br/>users / auth_sessions / research_documents / feedbacks / todos / prompt_versions"]
    FILES["本地文件存储<br/>backend/storage/source-documents/YYYY/MM"]
    LLM["LLM Provider<br/>Gemini<br/>失败时回退 DeepSeek"]
  end

  FE --> API
  API --> AUTH
  API --> DOC
  API --> TODO
  API --> FB
  API --> PROMPT

  BOOT --> MYSQL
  BOOT --> FILES
  AUTH --> MYSQL
  DOC --> MYSQL
  TODO --> MYSQL
  FB --> MYSQL
  PROMPT --> MYSQL
  DOC --> FILES
  DOC --> LLM
```

## 2. 用户研究主闭环

```mermaid
flowchart TD
  A["用户登录"] --> B["前端恢复会话并加载全量数据"]
  B --> C["进入访谈分析页"]
  C --> D["上传 docx / txt 文档"]
  D --> E["后端保存原文件到本地存储"]
  E --> F["解析文本<br/>docx 用 mammoth<br/>txt 直接读取"]
  F --> G["写入 research_documents"]
  G --> H["用户触发分析"]
  H --> I["读取当前模块已发布 Prompt"]
  I --> J["主分析<br/>一次生成 summary / insights / journey / persona"]
  J --> K["行动建议分析<br/>基于洞察生成 actions"]
  K --> L["写回 research_documents.analysis_result<br/>并记录 Prompt 版本 / 模型信息"]
  L --> M["前端展示结果<br/>速览 / 洞察 / 旅程图 / 画像 / 行动建议 / 完整报告"]
  M --> N["提交赞踩反馈"]
  M --> O["把行动建议转成 Todo"]
  N --> P["写入 feedbacks"]
  O --> Q["写入 todos"]
  P --> R["提示词管理页迭代 Prompt 草稿或发布新版本"]
  Q --> R
  R --> S["后续新文档分析自动使用最新已发布版本"]
```

## 3. 分析服务内部流程

```mermaid
flowchart TD
  A["documents/:id/analyze"] --> B["查询文档内容"]
  B --> C["查询当前模块最新已发布 Prompt"]
  C --> D["进入 analyzeInterviewDocument()"]
  D --> E["选择主 Provider<br/>默认 Gemini"]
  E --> F["执行主分析"]
  F --> G{"Gemini 主分析是否成功"}
  G -- "是" --> H["提取 insights"]
  G -- "否" --> I["立即用 DeepSeek 重试主分析"]
  I --> J{"DeepSeek 主分析是否成功"}
  J -- "是" --> H
  J -- "否" --> M["返回组合失败信息"]
  H --> K["基于洞察执行第二次模型调用<br/>生成 actions"]
  K --> L{"当前本次分析 Provider"}
  L -- "Gemini" --> N["先用 Gemini 生成 actions"]
  N --> O{"Gemini actions 是否成功"}
  O -- "是" --> P["合并结果并返回 analysisResult"]
  O -- "否" --> Q["立即用 DeepSeek 重试 actions"]
  L -- "DeepSeek" --> Q
  Q --> R{"DeepSeek actions 是否成功"}
  R -- "是" --> P
  R -- "否" --> M
  P --> S["保存实际 llm_provider / llm_model / analyzed_at"]
```

## 4. 图中对应的核心代码

- 前端入口：[src/App.tsx](/Users/shirenyuan/Desktop/AI编程/superev用研中心/src/App.tsx)
- 前端数据层：[src/lib/store.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/src/lib/store.ts)
- 前端 API 封装：[src/lib/api.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/src/lib/api.ts)
- 访谈分析页：[src/pages/InterviewAnalysis.tsx](/Users/shirenyuan/Desktop/AI编程/superev用研中心/src/pages/InterviewAnalysis.tsx)
- 用户画像页：[src/pages/UserPersona.tsx](/Users/shirenyuan/Desktop/AI编程/superev用研中心/src/pages/UserPersona.tsx)
- Prompt 管理页：[src/pages/SystemManagement/PromptManagement.tsx](/Users/shirenyuan/Desktop/AI编程/superev用研中心/src/pages/SystemManagement/PromptManagement.tsx)
- 后端入口：[backend/src/app.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/app.ts)
- 文档路由：[backend/src/routes/documents.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/routes/documents.ts)
- 分析服务：[backend/src/services/analysis.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/services/analysis.ts)
- 文档解析：[backend/src/services/document-parser.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/services/document-parser.ts)
- 反馈路由：[backend/src/routes/feedbacks.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/routes/feedbacks.ts)
- Todo 路由：[backend/src/routes/todos.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/routes/todos.ts)
- Prompt 路由：[backend/src/routes/prompt-modules.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/routes/prompt-modules.ts)、[backend/src/routes/prompt-versions.ts](/Users/shirenyuan/Desktop/AI编程/superev用研中心/backend/src/routes/prompt-versions.ts)
