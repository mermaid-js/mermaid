import express from 'express';
import { build, createServer as createViteServer } from 'vite';
// import { getBuildConfig } from './build';

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: true },
    appType: 'custom', // don't include Vite's default HTML handling middlewares
  });

  app.use(express.static('dist'));
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));
  app.use(vite.middlewares);

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

// build(getBuildConfig({ minify: false, watch: true }));
createServer();
