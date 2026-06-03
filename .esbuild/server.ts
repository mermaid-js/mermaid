import chokidar from 'chokidar';
import cors from 'cors';
import { createHash } from 'crypto';
import { context } from 'esbuild';
import { promises as fs } from 'fs';
import type { Request, Response } from 'express';
import express from 'express';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import { packageOptions } from '../.build/common.js';
import { generateLangium } from '../.build/generateLangium.js';
import { defaultOptions, getBuildConfig } from './util.js';
import { DDLT_SIZE_CAPTURE_VERSION } from '../packages/mermaid/src/rendering-util/layout-algorithms/ddlt/captureContract.js';
import 'dotenv/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Derive a deterministic dev-server port from the worktree root so multiple
// checkouts (git worktrees, sibling clones) can run `pnpm dev` in parallel
// without colliding on port 9000. Override with MERMAID_DEV_PORT.
function resolveDevPort(): number {
  const override = process.env.MERMAID_DEV_PORT;
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed < 65536) {
      return parsed;
    }
    console.warn(`[dev] Ignoring invalid MERMAID_DEV_PORT=${override}`);
  }
  const worktreeRoot = process.cwd();
  // The canonical checkout keeps port 9000 so existing tooling/bookmarks work.
  if (path.basename(worktreeRoot) === 'alana-mermaid') {
    return 9000;
  }
  const hash = createHash('sha1').update(worktreeRoot).digest();
  return 9000 + (hash.readUInt16BE(0) % 100);
}

const devPort = resolveDevPort();

// Print the URL up-front, before the build noise, so the operator knows where
// to point their browser even if they scroll past the later "Listening on…"
// confirmation line.
console.log('');
console.log('================================================================');
console.log(
  `  Dev server starting on http://localhost:${devPort}` +
    `  (worktree: ${path.basename(process.cwd())})`
);
console.log('================================================================');
console.log('');

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

function sendEventsToAll() {
  clients.forEach(({ response }) => response.write(`data: ${Date.now()}\n\n`));
}

interface DevExplorerEntry {
  name: string;
  kind: 'dir' | 'file';
  path: string; // posix-style, relative to root
}

interface DevExplorerCapturedNodeSize {
  id: string;
  width: number;
  height: number;
}

const devExplorerRootAbs = resolve(
  process.cwd(),
  process.env.MERMAID_DEV_EXPLORER_ROOT ?? 'cypress/platform/dev-diagrams'
);

// Starter content written when a new diagram is created from the Dev Explorer.
const DEFAULT_NEW_DIAGRAM = `flowchart TD\n  A[Start] --> B[End]\n`;

function toPosixPath(p: string) {
  return p.split(path.sep).join('/');
}

function hashDdltFixtureSource(source: string) {
  return createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
}

function normalizeCapturedNodeSizes(value: unknown): DevExplorerCapturedNodeSize[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const nodes: DevExplorerCapturedNodeSize[] = [];
  for (const item of value) {
    if (item == null || typeof item !== 'object') {
      return null;
    }
    const candidate = item as Record<string, unknown>;
    const { id, width, height } = candidate;
    if (
      typeof id !== 'string' ||
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return null;
    }
    nodes.push({
      id,
      width,
      height,
    });
  }
  return nodes;
}

function resolveWithinDevExplorerRoot(requestedPath: unknown) {
  const requested = typeof requestedPath === 'string' ? requestedPath : '';
  if (requested.includes('\0')) {
    throw new Error('Invalid path');
  }

  // Normalize slashes and avoid weird absolute-path cases.
  const cleaned = requested.replaceAll('\\', '/').replace(/^\/+/, '');
  const absPath = resolve(devExplorerRootAbs, cleaned);
  const rel = path.relative(devExplorerRootAbs, absPath);

  // Prevent traversal above root.
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path escapes configured root');
  }

  return { absPath, relPath: toPosixPath(rel) };
}

async function createDevExplorerBundle() {
  const devExplorerDir = resolve(__dirname, 'dev-explorer');
  const entryPoint = resolve(devExplorerDir, 'explorer-app.ts');
  const outDir = resolve(devExplorerDir, 'dist');

  try {
    const devExplorerCtx = await context({
      absWorkingDir: process.cwd(),
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      target: 'es2020',
      sourcemap: true,
      outdir: outDir,
      logLevel: 'info',
      plugins: [
        {
          name: 'dev-explorer-reload',
          setup(build) {
            build.onEnd(() => {
              sendEventsToAll();
            });
          },
        },
      ],
    });

    await devExplorerCtx.watch();
    await devExplorerCtx.rebuild();
  } catch (err) {
    console.error(
      [
        'Dev Explorer bundle build failed.',
        'Install dependencies: pnpm add -D lit @shoelace-style/shoelace',
        'Then restart the dev server.',
      ].join('\n')
    );
    console.error(err);
  }
}

async function createServer() {
  await generateLangium();
  handleFileChange();
  const app = express();
  chokidar
    .watch('**/src/**/*.{js,ts,g4,langium,yaml,json}', {
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

  // Rebuild the dev-explorer client bundle on changes (and emit SSE so the browser reloads).
  await createDevExplorerBundle();

  // Emit SSE when Dev Explorer static assets change (e.g. public/styles.css),
  // otherwise CSS-only changes can look "ignored" unless the user manually refreshes.
  chokidar
    .watch(['.esbuild/dev-explorer/public/**/*'], {
      ignoreInitial: true,
      ignored: [/node_modules/, /dist/, /docs/, /coverage/],
    })
    .on('all', (event, changedPath) => {
      if (!['add', 'change', 'unlink'].includes(event)) {
        return;
      }
      console.log(`[dev-explorer] ${event}: ${changedPath}`);
      sendEventsToAll();
    });

  // Emit SSE when .mmd files inside the configured explorer root change.
  chokidar
    .watch('**/*.mmd', {
      cwd: devExplorerRootAbs,
      ignoreInitial: true,
    })
    .on('all', (event, changedPath) => {
      if (!['add', 'change', 'unlink'].includes(event)) {
        return;
      }
      console.log(`[dev-explorer] ${event}: ${changedPath}`);
      sendEventsToAll();
    });

  app.use(cors());
  app.get('/events', eventsHandler);

  // --- Dev Explorer API + UI -------------------------------------------------
  const devExplorerDir = resolve(__dirname, 'dev-explorer');
  const devExplorerPublicDir = resolve(devExplorerDir, 'public');
  const devExplorerDistDir = resolve(devExplorerDir, 'dist');

  // Shoelace assets (theme css + icons). Safe: only mounted in dev server.
  app.use(
    '/dev/vendor/shoelace',
    express.static(resolve(process.cwd(), 'node_modules/@shoelace-style/shoelace/dist'))
  );

  app.get('/dev/api/files', async (req, res) => {
    try {
      const { absPath, relPath } = resolveWithinDevExplorerRoot(req.query.path);
      const stats = await fs.stat(absPath);
      if (!stats.isDirectory()) {
        res.status(400).json({ error: 'Not a directory' });
        return;
      }

      const dirEntries = await fs.readdir(absPath, { withFileTypes: true });
      const entries = dirEntries
        .filter((d) => d.isDirectory() || (d.isFile() && d.name.endsWith('.mmd')))
        .map<DevExplorerEntry>((d) => ({
          name: d.name,
          kind: d.isDirectory() ? 'dir' : 'file',
          path: toPosixPath(path.join(relPath, d.name)),
        }))
        .sort((a, b) => {
          if (a.kind !== b.kind) {
            return a.kind === 'dir' ? -1 : 1;
          }
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });

      res.json({
        root: toPosixPath(path.relative(process.cwd(), devExplorerRootAbs)),
        path: relPath === '' ? '' : relPath,
        entries,
      });
    } catch (_e) {
      res.status(400).json({ error: 'Invalid path' });
    }
  });

  app.get('/dev/api/file', async (req, res) => {
    try {
      const { absPath, relPath } = resolveWithinDevExplorerRoot(req.query.path);
      if (!absPath.endsWith('.mmd')) {
        res.status(400).send('Only .mmd files are allowed');
        return;
      }
      const stats = await fs.stat(absPath);
      if (!stats.isFile()) {
        res.status(400).send('Not a file');
        return;
      }
      const content = await fs.readFile(absPath, 'utf-8');
      res.type('text/plain').send(content);
      // Optional: include relPath for debugging.
      void relPath;
    } catch (_e) {
      res.status(400).send('Invalid path');
    }
  });

  app.post('/dev/api/file', express.text({ type: '*/*', limit: '1mb' }), async (req, res) => {
    try {
      const { absPath, relPath } = resolveWithinDevExplorerRoot(req.query.path);
      if (!absPath.endsWith('.mmd')) {
        res.status(400).json({ error: 'Only .mmd files are allowed' });
        return;
      }

      // Refuse to overwrite an existing file.
      try {
        await fs.access(absPath);
        res.status(409).json({ error: 'File already exists' });
        return;
      } catch {
        // ENOENT is expected — the file should not exist yet.
      }

      const content =
        typeof req.body === 'string' && req.body.length > 0 ? req.body : DEFAULT_NEW_DIAGRAM;
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      // 'wx' fails if the file appears between the access() check and now.
      await fs.writeFile(absPath, content, { encoding: 'utf-8', flag: 'wx' });
      res.status(201).json({
        path: relPath,
        bytes: Buffer.byteLength(content, 'utf-8'),
      });
    } catch (e) {
      if ((e as NodeJS.ErrnoException)?.code === 'EEXIST') {
        res.status(409).json({ error: 'File already exists' });
        return;
      }
      res.status(400).json({ error: 'Invalid path' });
    }
  });

  app.put('/dev/api/file', express.text({ type: '*/*', limit: '1mb' }), async (req, res) => {
    try {
      const { absPath, relPath } = resolveWithinDevExplorerRoot(req.query.path);
      if (!absPath.endsWith('.mmd')) {
        res.status(400).json({ error: 'Only .mmd files are allowed' });
        return;
      }
      const stats = await fs.stat(absPath);
      if (!stats.isFile()) {
        res.status(400).json({ error: 'Not a file' });
        return;
      }
      if (typeof req.body !== 'string') {
        res.status(400).json({ error: 'Expected text/plain request body' });
        return;
      }

      await fs.writeFile(absPath, req.body, 'utf-8');
      res.json({
        path: relPath,
        bytes: Buffer.byteLength(req.body, 'utf-8'),
      });
    } catch (_e) {
      res.status(400).json({ error: 'Invalid path' });
    }
  });

  app.post('/dev/api/sizes', express.json({ limit: '1mb' }), async (req, res) => {
    try {
      const body = req.body as Record<string, unknown> | undefined;
      const { absPath, relPath } = resolveWithinDevExplorerRoot(body?.path);
      if (!absPath.endsWith('.mmd')) {
        res.status(400).json({ error: 'Only .mmd files are allowed' });
        return;
      }

      const stats = await fs.stat(absPath);
      if (!stats.isFile()) {
        res.status(400).json({ error: 'Not a file' });
        return;
      }

      const nodes = normalizeCapturedNodeSizes(body?.nodes);
      if (!nodes || nodes.length === 0) {
        res.status(400).json({ error: 'Expected a non-empty nodes array' });
        return;
      }

      const mmdSource = await fs.readFile(absPath, 'utf-8');
      const sizesPath = absPath.replace(/\.mmd$/, '.sizes.json');
      const sizesRelPath = relPath.replace(/\.mmd$/, '.sizes.json');
      const capturedFrom =
        typeof body?.capturedFrom === 'string' ? body.capturedFrom : `dev-explorer ${relPath}`;
      const fixture = {
        nodes,
        metadata: {
          captureVersion: DDLT_SIZE_CAPTURE_VERSION,
          sourceSha256: hashDdltFixtureSource(mmdSource),
          capturedAt: new Date().toISOString(),
          capturedFrom,
        },
      };

      await fs.writeFile(sizesPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf-8');
      res.json({
        path: sizesRelPath,
        nodes: nodes.length,
      });
    } catch (_e) {
      res.status(400).json({ error: 'Invalid sizes payload' });
    }
  });

  // Static assets for the dev-explorer UI.
  app.use('/dev/assets', express.static(devExplorerDistDir));
  // Serve `/dev/` (and `/dev`) from public/, including index.html.
  app.use(
    '/dev',
    express.static(devExplorerPublicDir, {
      index: ['index.html'],
    })
  );
  // Also expose dev-explorer public assets (libavoid.wasm, etc.) at root
  // so demo pages under /cypress/platform/ and /demos/ can resolve a
  // bare "libavoid.wasm" without going through the /dev/ namespace.
  // index:false so this doesn't shadow the cypress/demos default index.
  app.use(express.static(devExplorerPublicDir, { index: false }));

  for (const { packageName } of Object.values(packageOptions)) {
    app.use(express.static(`./packages/${packageName}/dist`));
  }
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(devPort, () => {
    console.log(
      `Listening on http://localhost:${devPort} (worktree: ${path.basename(process.cwd())})`
    );
  });
}

void createServer();
