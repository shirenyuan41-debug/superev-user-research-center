import { createApp } from './app.js';
import { env } from './config/env.js';

const run = async () => {
  const app = await createApp();
  app.listen(env.PORT, () => {
    console.log(`SUPEREV backend listening on http://127.0.0.1:${env.PORT}`);
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
