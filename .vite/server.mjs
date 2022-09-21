import express from 'express';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  // const vite = await createViteServer({
  //   configFile: './vite.config.cts',
  //   server: { middlewareMode: true },
  //   appType: 'custom', // don't include Vite's default HTML handling middlewares
  // });

  app.use(express.static('dist'));
  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));
  // Use vite's connect instance as middleware
  // app.use(vite.middlewares);

  app.use('*', async (req, res) => {
    // Since `appType` is `'custom'`, should serve response here.
    // Note: if `appType` is `'spa'` or `'mpa'`, Vite includes middlewares to handle
    // HTML requests and 404s so user middlewares should be added
    // before Vite's middlewares to take effect instead
    res.end('Hello world!');
  });

  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
}

createServer();
