/* eslint-disable no-console */
import chokidar from 'chokidar';
import cors from 'cors';
import { context } from 'esbuild';
import type { Request, Response } from 'express';
import express from 'express';
import { execSync } from 'child_process';
import { packageOptions } from '../.build/common.js';
import { generateLangium } from '../.build/generateLangium.js';
import { defaultOptions, getBuildConfig } from './util.js';

// Set environment variable to use ANTLR parser
process.env.USE_ANTLR_PARSER = 'true';

const configs = Object.values(packageOptions).map(({ packageName }) =>
  getBuildConfig({
    ...defaultOptions,
    minify: false,
    core: false,
    options: packageOptions[packageName],
  })
);
const mermaidIIFEConfig = getBuildConfig({
  ...defaultOptions,
  minify: false,
  core: false,
  options: packageOptions.mermaid,
  format: 'iife',
});
configs.push(mermaidIIFEConfig);

const contexts = await Promise.all(
  configs.map(async (config) => ({ config, context: await context(config) }))
);

let rebuildCounter = 1;
const rebuildAll = async () => {
  const buildNumber = rebuildCounter++;
  const timeLabel = `Rebuild ${buildNumber} Time (total)`;
  console.time(timeLabel);
  await Promise.all(
    contexts.map(async ({ config, context }) => {
      const buildVariant = `Rebuild ${buildNumber} Time (${Object.keys(config.entryPoints!)[0]} ${config.format})`;
      console.time(buildVariant);
      await context.rebuild();
      console.timeEnd(buildVariant);
    })
  ).catch((e) => console.error(e));
  console.timeEnd(timeLabel);
};

let clients: { id: number; response: Response }[] = [];
function eventsHandler(request: Request, response: Response) {
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

let timeoutID: NodeJS.Timeout | undefined = undefined;

/**
 * Generate ANTLR parser files from grammar files
 */
function generateAntlr() {
  try {
    console.log('🎯 ANTLR: Generating parser files...');
    execSync('tsx scripts/antlr-generate.mts', { stdio: 'inherit' });
    console.log('✅ ANTLR: Parser files generated successfully');
  } catch (error) {
    console.error('❌ ANTLR: Failed to generate parser files:', error);
  }
}

/**
 * Debounce file change events to avoid rebuilding multiple times.
 */
function handleFileChange() {
  if (timeoutID !== undefined) {
    clearTimeout(timeoutID);
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  timeoutID = setTimeout(async () => {
    await rebuildAll();
    sendEventsToAll();
    timeoutID = undefined;
  }, 100);
}

/**
 * Handle ANTLR grammar file changes with debouncing
 */
function handleAntlrFileChange() {
  if (timeoutID !== undefined) {
    clearTimeout(timeoutID);
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  timeoutID = setTimeout(async () => {
    generateAntlr();
    await rebuildAll();
    sendEventsToAll();
    timeoutID = undefined;
  }, 100);
}

function sendEventsToAll() {
  clients.forEach(({ response }) => response.write(`data: ${Date.now()}\n\n`));
}

async function createServer() {
  await generateLangium();
  generateAntlr();
  handleFileChange();
  const app = express();

  // Watch for regular source file changes
  chokidar
    .watch('**/src/**/*.{js,ts,langium,yaml,json}', {
      ignoreInitial: true,
      ignored: [/node_modules/, /dist/, /docs/, /coverage/],
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .on('all', async (event, path) => {
      // Ignore other events.
      if (!['add', 'change'].includes(event)) {
        return;
      }
      console.log(`${path} changed. Rebuilding...`);
      if (path.endsWith('.langium')) {
        await generateLangium();
      }
      handleFileChange();
    });

  // Watch for ANTLR grammar file changes
  chokidar
    .watch('**/src/**/parser/antlr/*.g4', {
      ignoreInitial: true,
      ignored: [/node_modules/, /dist/, /docs/, /coverage/],
    })
    .on('all', (event, path) => {
      // Ignore other events.
      if (!['add', 'change'].includes(event)) {
        return;
      }
      console.log(`🎯 ANTLR grammar file ${path} changed. Regenerating parsers...`);
      handleAntlrFileChange();
    });

  app.use(cors());
  app.get('/events', eventsHandler);
  for (const { packageName } of Object.values(packageOptions)) {
    app.use(express.static(`./packages/${packageName}/dist`));
  }
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(9000, () => {
    console.log(`🚀 ANTLR Parser Dev Server listening on http://localhost:9000`);
    console.log(`🎯 Environment: USE_ANTLR_PARSER=${process.env.USE_ANTLR_PARSER}`);
    console.log(`🔍 Watching: .g4 grammar files for auto-regeneration`);
    console.log(`📁 Generated: ANTLR parser files ready`);
  });
}

void createServer();
