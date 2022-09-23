const esbuild = require('esbuild');
const http = require('http');
const { iifeBuild, esmBuild } = require('./util.cjs');
const express = require('express');

// Start 2 esbuild servers. One for IIFE and one for ESM
// Serve 2 static directories: demo & cypress/platform
// Have 3 entry points:
// mermaid: './src/mermaid',
// e2e: './cypress/platform/viewer.js',
// 'bundle-test': './cypress/platform/bundle-test.js',

const getEntryPointsAndExtensions = (format) => {
  return {
    entryPoints: {
      mermaid: './src/mermaid',
      e2e: './cypress/platform/viewer.js',
      'bundle-test': './cypress/platform/bundle-test.js',
    },
    outExtension: { '.js': format === 'iife' ? '.js' : '.esm.mjs' },
  };
};

const generateHandler = (server) => {
  return (req, res) => {
    const options = {
      hostname: server.host,
      port: server.port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    // Forward each incoming request to esbuild
    const proxyReq = http.request(options, (proxyRes) => {
      // If esbuild returns "not found", send a custom 404 page
      if (proxyRes.statusCode === 404) {
        if (!req.url.endsWith('.html')) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>A custom 404 page</h1>');
          return;
        }
      }
      // Otherwise, forward the response from esbuild to the client
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    // Forward the body of the request to esbuild
    req.pipe(proxyReq, { end: true });
  };
};

(async () => {
  const iifeServer = await esbuild.serve(
    {},
    {
      ...iifeBuild({ minify: false, outfile: undefined, outdir: 'dist' }),
      ...getEntryPointsAndExtensions('iife'),
    }
  );
  const esmServer = await esbuild.serve(
    {},
    {
      ...esmBuild({ minify: false, outfile: undefined, outdir: 'dist' }),
      ...getEntryPointsAndExtensions('esm'),
    }
  );
  const app = express();

  app.use(express.static('demos'));
  app.use(express.static('cypress/platform'));
  app.all('/mermaid.js', generateHandler(iifeServer));
  app.all('/mermaid.esm.mjs', generateHandler(esmServer));

  app.all('/e2e.esm.mjs', generateHandler(esmServer));
  app.all('/bundle-test.esm.mjs', generateHandler(esmServer));
  app.listen(9000, () => {
    console.log(`Listening on http://localhost:9000`);
  });
})();
