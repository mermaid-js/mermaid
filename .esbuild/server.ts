import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { getBuildConfig, defaultOptions } from './util.js';
import { context } from 'esbuild';
import chokidar from 'chokidar';
import { generateLangium } from '../.build/generateLangium.js';
import { packageOptions } from '../.build/common.js';

const configs = Object.values(packageOptions).map(({ packageName }) =>
  getBuildConfig({ ...defaultOptions, minify: false, core: false, entryName: packageName })
);
const mermaidIIFEConfig = getBuildConfig({
  ...defaultOptions,
  minify: false,
  core: false,
  entryName: 'mermaid',
  format: 'iife',
});
configs.push(mermaidIIFEConfig);

const contexts = await Promise.all(configs.map((config) => context(config)));

const rebuildAll = async () => {
  console.time('Rebuild time');
  await Promise.all(contexts.map((ctx) => ctx.rebuild())).catch((e) => console.error(e));
  console.timeEnd('Rebuild time');
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
    await rebuildAll();
    sendEventsToAll();
    timeoutId = undefined;
  }, 100);
}

function sendEventsToAll() {
  clients.forEach(({ response }) => response.write(`data: ${Date.now()}\n\n`));
}

async function createServer() {
  await generateLangium();
  handleFileChange();
  const app = express();
  chokidar
    .watch('**/src/**/*.{js,ts,langium,yaml,json}', {
      ignoreInitial: true,
      ignored: [/node_modules/, /dist/, /docs/, /coverage/],
    })
    .on('all', async (event, path) => {
      // Ignore other events.
      if (!['add', 'change'].includes(event)) {
        return;
      }
      if (/\.langium$/.test(path)) {
        await generateLangium();
      }
      console.log(`${path} changed. Rebuilding...`);
      handleFileChange();
    });

  app.use(cors());
  app.get('/events', eventsHandler);
  for (const { packageName } of Object.values(packageOptions)) {
    app.use(express.static(`./packages/${packageName}/dist`));
  }
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

createServer();
