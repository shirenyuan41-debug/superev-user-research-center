import { ensureRuntimeBootstrap } from '../db/bootstrap.js';

const run = async () => {
  await ensureRuntimeBootstrap();
  console.log('运行时初始化数据写入完成');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
