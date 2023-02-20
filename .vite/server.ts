import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: true },
    appType: 'custom', // don't include Vite's default HTML handling middleware
  });

  app.use(cors());
  app.use(express.static('./packages/mermaid/dist'));
  // app.use(express.static('./packages/mermaid-example-diagram/dist'));
  app.use(express.static('./packages/mermaid-example-diagram/dist'));
  app.use(vite.middlewares);
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

createServer();
