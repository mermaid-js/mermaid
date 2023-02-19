import express from 'express';
import cors from 'cors';
import { getBuildConfig } from './util.js';
import { context } from 'esbuild';

async function createServer() {
  const app = express();
  const mermaidCtx = await context(
    getBuildConfig({ minify: false, core: false, entryName: 'mermaid' })
  );
  mermaidCtx.watch();
  const externalCtx = await context(
    getBuildConfig({ minify: false, core: false, entryName: 'mermaid-example-diagram' })
  );
  externalCtx.watch();
  app.use(cors());
  app.use(express.static('./packages/mermaid/dist'));
  app.use(express.static('./packages/mermaid-example-diagram/dist'));
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

createServer();
