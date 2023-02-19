const esbuild = require('esbuild');
const http = require('http');
const path = require('path');
const { iifeBuild } = require('./util.cjs');

// Start esbuild's server on a random local port
esbuild
  .serve(
    {
      servedir: path.join(__dirname, '..'),
    },
    iifeBuild({ minify: false })
  )
  .then((result) => {
    // The result tells us where esbuild's local server is
    const { host, port } = result;

    // Then start a proxy server on port 3000
    http
      .createServer((req, res) => {
        if (req.url.includes('mermaid.js')) {
          req.url = '/dist/mermaid.js';
        }
        const options = {
          hostname: host,
          port: port,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };

        // Forward each incoming request to esbuild
        const proxyReq = http.request(options, (proxyRes) => {
          // If esbuild returns "not found", send a custom 404 page
          console.error('pp', req.url);
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
      })
      .listen(3000);
  });
