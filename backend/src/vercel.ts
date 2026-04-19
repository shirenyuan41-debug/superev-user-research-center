import { createApp } from './app.js';

let appPromise: ReturnType<typeof createApp> | null = null;

const getApp = () => {
  if (!appPromise) {
    appPromise = createApp({ routeBasePath: '' });
  }

  return appPromise;
};

const handler = async (request: any, response: any) => {
  const app = await getApp();
  return app(request, response);
};

export default handler;
