# Vercel 安全部署说明

本文档针对当前仓库的实际架构：

- 前端：`React + Vite`
- 后端：`Express + MySQL + 本地文件存储`
- 模型调用：由后端发起

## 结论

当前项目的模型 API Key 不应该部署在前端，也不应该放到 Vercel 的前端项目环境变量里。

正确做法是：

- 前端项目只使用 `VITE_*`
- 模型 Key、数据库密码、会话密钥只放在后端运行环境
- 前端只通过后端 API 间接调用模型

## 推荐部署方式

### 推荐方案

- 前端部署到 Vercel
- 后端部署到支持常驻 Node 服务和持久磁盘的环境
- MySQL 独立部署
- 前端通过 HTTPS 调后端 API

### 当前仓库已经支持的同域方案

当前仓库已经自带：

- `vercel.json`
- `api/index.js`
- `backend/src/vercel.ts`

如果把当前仓库作为纯前端项目部署到 Vercel：

- 前端页面地址会是：`https://your-project.vercel.app`
- 正式后端 API 地址应该是：`https://api.your-domain.com/api`

例如：

```bash
https://api.your-domain.com/api/health
https://api.your-domain.com/api/auth/login
```

这种情况下：

- 前端必须配置 `VITE_API_BASE_URL=https://api.your-domain.com`
- 前端会请求独立后端域名，而不是同域 `/api/...`
- 后端需要把前端正式域名加入 `FRONTEND_ORIGINS`

适合当前项目的后端运行环境：

- 云服务器
- 容器服务
- Render
- Railway
- 腾讯云 CVM / Lighthouse / TKE

### 为什么不建议直接把当前后端原样放到 Vercel

当前后端依赖：

- `express-session`
- `express-mysql-session`
- 本地文件落盘到 `backend/storage/source-documents/`
- 常驻 Node 进程

这类能力更适合常驻服务，不适合直接按“纯静态前端 + 无状态函数”思路上线。

如果一定要把后端也放到 Vercel，需要先重构：

- 本地文件存储改成对象存储
- 会话逻辑改成适配无状态运行
- 上传和路由改成 Serverless 兼容方式

## Vercel 前端项目里应该放什么

只放非敏感前端变量，例如：

```bash
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_ENV=production
```

不要放这些敏感变量：

```bash
GEMINI_API_KEY
GOOGLE_API_KEY
DEEPSEEK_API_KEY
LLM_API_KEY
MYSQL_PASSWORD
SESSION_SECRET
ADMIN_PASSWORD
```

## 敏感信息应该放在哪里

只放在后端运行环境：

```bash
SESSION_SECRET=...

MYSQL_HOST=...
MYSQL_PORT=...
MYSQL_DATABASE=...
MYSQL_USER=...
MYSQL_PASSWORD=...

GEMINI_API_KEY=...
GOOGLE_API_KEY=...
DEEPSEEK_API_KEY=...
```

如果为了兼容旧配置，仍保留 `LLM_API_KEY / LLM_MODEL / LLM_BASE_URL`：

- 它们只会被后端当作 `DeepSeek` 的兼容别名
- 不再承担 Gemini 配置职责

原则很简单：

- 模型 Key 只在后端读
- 数据库凭据只在后端读
- 会话密钥只在后端读

## 当前仓库已经做的防护

### 1. 前端环境变量白名单已收紧

当前 `vite.config.ts` 只允许 `VITE_*` 注入前端。

这意味着：

- 即使本地存在 `DEEPSEEK_API_KEY`
- 即使本地存在 `GEMINI_API_KEY`
- 即使本地存在 `LLM_API_KEY`
- 只要前缀不是 `VITE_`

它们都不会被 Vite 自动注入前端。

### 2. 前端代码当前不直接读取模型 Key

前端只读取：

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`
- `DEV`

模型调用走后端 API，不走浏览器直连。

### 3. `.env` 文件默认被 Git 忽略

仓库里的 `.env*` 默认不应提交到 GitHub。

但注意：

- 如果之前手动强制提交过
- 或者密钥曾经进入过历史提交

仍然算泄露，需要轮换。

## GitHub + Vercel 发布前检查清单

每次发布前请检查：

1. GitHub 仓库里没有提交 `.env`、`.env.local`、`backend/.env`
2. Vercel 前端项目里没有配置任何模型 Key、数据库密码、会话密钥
3. 前端变量只保留 `VITE_*`
4. 后端部署环境单独维护模型 Key 和数据库连接
5. MySQL 只对后端来源 IP / VPC 放行
6. 后端接口启用 HTTPS
7. 浏览器 Network 面板里看不到模型供应商地址和 Bearer Token
8. 前端构建产物里搜索不到真实 key

## 推荐发布流程

### 方案 A：前端 Vercel，后端独立主机

1. 前端项目部署到 Vercel
2. 在前端项目中配置：

```bash
VITE_API_BASE_URL=https://api.your-domain.com
```

3. 后端部署到常驻 Node 环境
4. 后端配置真实：
   - MySQL
   - `SESSION_SECRET`
   - 模型 API Key
5. 用 Nginx / Caddy / 云负载均衡给后端挂 HTTPS 域名

这是当前项目最贴近现状、改动最小的安全方案。

### 方案 A-1：当前仓库直接走 Vercel 同域

如果你不拆域，直接按当前仓库结构部署到 Vercel：

1. 前端和 `api/index.js` 一起部署到同一个 Vercel 项目
2. 前端项目中不设置 `VITE_API_BASE_URL`
3. 前端正式调用地址默认就是同域 `/api`
4. 对外正式 API 地址就是：

```bash
https://your-project.vercel.app/api
```

### 方案 B：前端公开，后端限制来源

适合内部演示或半开放环境：

- 前端继续放在 Vercel
- 后端只开放给公司内网、VPN 或白名单 IP
- 模型 Key 仍只在后端

## 如果怀疑 Key 已暴露

立刻做这几件事：

1. 轮换 `GEMINI_API_KEY / DEEPSEEK_API_KEY`
2. 修改后端环境变量并重启后端
3. 检查 GitHub 提交历史是否出现明文
4. 检查 Vercel 前端项目环境变量是否误配了敏感值
5. 重新构建前端并搜索产物，确认不再包含可疑字符串

## 当前项目最终建议

对这个仓库，最稳妥的上线方式是：

- `Vercel` 只托管前端
- 后端单独部署
- 模型 Key 永远只放后端
- 不要把任何模型 Key 配进 Vercel 前端项目

这样能最大程度避免浏览器端泄露模型凭据。
