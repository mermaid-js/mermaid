import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { getBuildConfig } from './util.js';
import { context } from 'esbuild';
import chokidar from 'chokidar';

const mermaidCtx = await context(
  getBuildConfig({ minify: false, core: false, entryName: 'mermaid' })
);
const mermaidIIFECtx = await context(
  getBuildConfig({ minify: false, core: false, entryName: 'mermaid', format: 'iife' })
);
const externalCtx = await context(
  getBuildConfig({ minify: false, core: false, entryName: 'mermaid-example-diagram' })
);
const zenumlCtx = await context(
  getBuildConfig({ minify: false, core: false, entryName: 'mermaid-zenuml' })
);
const contexts = [mermaidCtx, mermaidIIFECtx, externalCtx, zenumlCtx];

const rebuildAll = async () => {
  await Promise.all(contexts.map((ctx) => ctx.rebuild()));
};

let clients: { id: number; response: Response }[] = [];
function eventsHandler(request: Request, response: Response, next: NextFunction) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  response.writeHead(200, headers);
  const clientId = Date.now();
  clients.push({
    id: clientId,
    response,
  });
  request.on('close', () => {
    clients = clients.filter((client) => client.id !== clientId);
  });
}

let timeoutId: NodeJS.Timeout | undefined = undefined;

/**
 * Debounce file change events to avoid rebuilding multiple times.
 */
function handleFileChange() {
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(async () => {
    const time = Date.now();
    await rebuildAll();
    sendEventsToAll();
    console.log('Rebuild & Refresh complete in' + (Date.now() - time) + 'ms');
    timeoutId = undefined;
  }, 100);
}

function sendEventsToAll() {
  clients.forEach(({ response }) => response.write(`data: ${Date.now()}\n\n`));
}

async function createServer() {
  const app = express();
  chokidar
    .watch('**/src/**/*.{js,ts,yaml,json}', {
      ignoreInitial: true,
      ignored: [/node_modules/, /dist/, /docs/, /coverage/],
    })
    .on('all', async (event, path) => {
      // Ignore other events.
      if (!['add', 'change'].includes(event)) {
        return;
      }
      console.log(`${path} changed. Rebuilding...`);
      handleFileChange();
    });

  app.use(cors());
  app.get('/events', eventsHandler);
  app.use(express.static('./packages/mermaid/dist'));
  app.use(express.static('./packages/mermaid-zenuml/dist'));
  app.use(express.static('./packages/mermaid-example-diagram/dist'));
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

createServer();
