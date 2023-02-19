import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import { getBuildConfig } from './util.js';
import { context } from 'esbuild';

async function createServer() {
  const app = express();
  const config = getBuildConfig({ minify: false, core: false, entryName: 'mermaid' });
  const ctx = await context(config);
  ctx.watch();
  let { host, port } = await ctx.serve({ servedir: './dist' });
  app.use(cors());
  app.use(express.static('./packages/mermaid/dist'));
  app.use(express.static('./packages/mermaid-example-diagram/dist'));
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));
  app.use('/', proxy(`http://${host}:${port}`));

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

createServer();
