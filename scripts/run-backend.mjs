import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse as parseEnv } from 'dotenv';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const backendRoot = path.resolve(projectRoot, 'backend');

const loadEnvFiles = () => {
  const merged = {};
  const candidates = [
    path.resolve(projectRoot, '.env'),
    path.resolve(projectRoot, '.env.local'),
    path.resolve(backendRoot, '.env'),
    path.resolve(backendRoot, '.env.local'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    Object.assign(merged, parseEnv(fs.readFileSync(filePath, 'utf8')));
  }

  return merged;
};

const fileEnv = loadEnvFiles();

const getEnv = (...keys) => {
  for (const key of keys) {
    const runtimeValue = process.env[key];
    if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
      return runtimeValue.trim();
    }

    const fileValue = fileEnv[key];
    if (typeof fileValue === 'string' && fileValue.trim()) {
      return fileValue.trim();
    }
  }

  return '';
};

const commonHttpProxyPorts = [7890, 1087, 20171, 6152, 8001, 8889];

const canConnect = (port) => new Promise((resolve) => {
  const socket = net.createConnection({ host: '127.0.0.1', port });
  const finish = (result) => {
    socket.destroy();
    resolve(result);
  };

  socket.setTimeout(300);
  socket.once('connect', () => finish(true));
  socket.once('timeout', () => finish(false));
  socket.once('error', () => finish(false));
});

const detectProxyUrl = async () => {
  for (const port of commonHttpProxyPorts) {
    if (await canConnect(port)) {
      return `http://127.0.0.1:${port}`;
    }
  }

  return '';
};

const appendNodeOption = (existingOptions, option) => {
  if (!existingOptions.trim()) {
    return option;
  }

  return existingOptions.includes(option)
    ? existingOptions
    : `${existingOptions} ${option}`;
};

const buildBackendEnv = async () => {
  const directProxyUrl = getEnv('BACKEND_PROXY_URL');
  const detectedProxyUrl = directProxyUrl || await detectProxyUrl();
  const httpProxy = getEnv('BACKEND_HTTP_PROXY', 'HTTP_PROXY', 'http_proxy') || detectedProxyUrl;
  const httpsProxy = getEnv('BACKEND_HTTPS_PROXY', 'HTTPS_PROXY', 'https_proxy') || httpProxy;
  const allProxy = getEnv('BACKEND_ALL_PROXY', 'ALL_PROXY', 'all_proxy');
  const noProxy = getEnv('BACKEND_NO_PROXY', 'NO_PROXY', 'no_proxy') || '127.0.0.1,localhost';

  const env = {
    ...process.env,
    NODE_OPTIONS: appendNodeOption(process.env.NODE_OPTIONS || '', '--use-env-proxy'),
  };

  if (httpProxy) {
    env.HTTP_PROXY = httpProxy;
    env.http_proxy = httpProxy;
  }

  if (httpsProxy) {
    env.HTTPS_PROXY = httpsProxy;
    env.https_proxy = httpsProxy;
  }

  if (allProxy) {
    env.ALL_PROXY = allProxy;
    env.all_proxy = allProxy;
  }

  env.NO_PROXY = noProxy;
  env.no_proxy = noProxy;

  return {
    env,
    proxySummary: {
      httpProxy,
      httpsProxy,
      allProxy,
      noProxy,
      detectedProxyUrl: directProxyUrl ? '' : detectedProxyUrl,
    },
  };
};

const run = async () => {
  const mode = process.argv[2] || 'dev';
  const { env, proxySummary } = await buildBackendEnv();

  if (mode === 'inspect') {
    console.log(JSON.stringify(proxySummary, null, 2));
    return;
  }

  const command = mode === 'start' ? 'node' : 'tsx';
  const args = mode === 'start' ? ['dist/server.js'] : ['watch', 'src/server.ts'];
  const activeProxy = proxySummary.httpsProxy || proxySummary.httpProxy || proxySummary.allProxy;

  if (activeProxy) {
    const suffix = proxySummary.detectedProxyUrl ? ' (自动探测)' : '';
    console.log(`[backend] 已启用代理 ${activeProxy}${suffix}`);
  } else {
    console.log('[backend] 未发现可用代理，按直连方式启动。可在 .env.local 配置 BACKEND_PROXY_URL。');
  }

  const child = spawn(command, args, {
    cwd: backendRoot,
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
