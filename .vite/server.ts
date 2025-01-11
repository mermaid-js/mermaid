import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { packageOptions } from '../.build/common.js';

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    configFile: './vite.config.ts',
    mode: 'production',
    server: { middlewareMode: true },
    appType: 'custom', // don't include Vite's default HTML handling middleware
  });

  app.use(cors());
  for (const { packageName } of Object.values(packageOptions)) {
    app.use(express.static(`./packages/${packageName}/dist`));
  }
  app.use(vite.middlewares);
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(9000, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on http://localhost:9000`);
  });
}

void createServer();
