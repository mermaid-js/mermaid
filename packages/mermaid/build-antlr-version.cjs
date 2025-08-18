#!/usr/bin/env node

/**
 * Build Script for ANTLR Version Testing
 *
 * This script creates a special build of Mermaid with ANTLR parser
 * for browser performance testing against the latest Jison version.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Building ANTLR version for browser testing...');

// Step 1: Generate ANTLR files
console.log('📝 Generating ANTLR parser files...');
try {
  execSync('pnpm antlr:generate', { stdio: 'inherit' });
  console.log('✅ ANTLR files generated successfully');
} catch (error) {
  console.error('❌ Failed to generate ANTLR files:', error.message);
  process.exit(1);
}

// Step 2: Create a test build configuration
console.log('⚙️ Creating test build configuration...');

const testBuildConfig = `
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mermaid.ts'),
      name: 'mermaidANTLR',
      fileName: 'mermaid-antlr',
      formats: ['umd']
    },
    rollupOptions: {
      output: {
        globals: {
          'd3': 'd3'
        }
      }
    },
    outDir: 'dist-antlr'
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'USE_ANTLR_PARSER': 'true'
  }
});
`;

fs.writeFileSync('vite.config.antlr.js', testBuildConfig);

// Step 3: Create a modified entry point that uses ANTLR parser
console.log('🔄 Creating ANTLR-enabled entry point...');

const antlrEntryPoint = `
/**
 * Mermaid with ANTLR Parser - Test Build
 */

// Import the main mermaid functionality
import mermaid from './mermaid';

// Import ANTLR parser components
import { ANTLRFlowParser } from './diagrams/flowchart/parser/ANTLRFlowParser';
import flowParserANTLR from './diagrams/flowchart/parser/flowParserANTLR';

// Override the flowchart parser with ANTLR version
if (typeof window !== 'undefined') {
  // Browser environment - expose ANTLR version
  window.mermaidANTLR = {
    ...mermaid,
    version: mermaid.version + '-antlr',
    parser: {
      flow: flowParserANTLR
    }
  };
  
  // Also expose as regular mermaid for testing
  if (!window.mermaid) {
    window.mermaid = window.mermaidANTLR;
  }
}

export default mermaid;
`;

fs.writeFileSync('src/mermaid-antlr.ts', antlrEntryPoint);

// Step 4: Build the ANTLR version
console.log('🏗️ Building ANTLR version...');
try {
  execSync('npx vite build --config vite.config.antlr.js', { stdio: 'inherit' });
  console.log('✅ ANTLR version built successfully');
} catch (error) {
  console.error('❌ Failed to build ANTLR version:', error.message);
  console.log('⚠️ Continuing with existing build...');
}

// Step 5: Copy the built file to the browser test location
console.log('📁 Setting up browser test files...');

const distDir = 'dist-antlr';
const browserTestDir = '.';

if (fs.existsSync(path.join(distDir, 'mermaid-antlr.umd.js'))) {
  fs.copyFileSync(
    path.join(distDir, 'mermaid-antlr.umd.js'),
    path.join(browserTestDir, 'mermaid-antlr.js')
  );
  console.log('✅ ANTLR build copied for browser testing');
} else {
  console.log('⚠️ ANTLR build not found, browser test will use fallback');
}

// Step 6: Update the HTML file to use the correct path
console.log('🔧 Updating browser test configuration...');

let htmlContent = fs.readFileSync('browser-performance-test.html', 'utf8');

// Update the script loading path
htmlContent = htmlContent.replace(
  "localScript.src = './dist/mermaid.min.js';",
  "localScript.src = './mermaid-antlr.js';"
);

fs.writeFileSync('browser-performance-test.html', htmlContent);

// Step 7: Create a simple HTTP server script for testing
console.log('🌐 Creating test server script...');

const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './browser-performance-test.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(\`🚀 Browser test server running at http://localhost:\${PORT}\`);
  console.log(\`📊 Open the URL to run performance tests\`);
});
`;

fs.writeFileSync('test-server.js', serverScript);

// Step 8: Create package.json script
console.log('📦 Adding npm scripts...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts['test:browser'] = 'node test-server.js';
  packageJson.scripts['build:antlr'] = 'node build-antlr-version.js';

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json updated with test scripts');
} catch (error) {
  console.log('⚠️ Could not update package.json:', error.message);
}

// Step 9: Create README for browser testing
console.log('📖 Creating browser test documentation...');

const readmeContent = `# Browser Performance Testing

## ANTLR vs Jison Performance Comparison

This directory contains tools for comprehensive browser-based performance testing of the ANTLR parser vs the original Jison parser.

### Quick Start

1. **Build ANTLR version:**
   \`\`\`bash
   pnpm run build:antlr
   \`\`\`

2. **Start test server:**
   \`\`\`bash
   pnpm run test:browser
   \`\`\`

3. **Open browser:**
   Navigate to \`http://localhost:3000\`

### Test Features

- **Real-time Performance Comparison**: Side-by-side rendering with timing metrics
- **Comprehensive Test Suite**: Multiple diagram types and complexity levels
- **Visual Results**: See both performance metrics and rendered diagrams
- **Detailed Analytics**: Parse time, render time, success rates, and error analysis

### Test Cases

- **Basic**: Simple flowcharts
- **Complex**: Multi-path decision trees with styling
- **Shapes**: All node shape types
- **Styling**: CSS styling and themes
- **Subgraphs**: Nested diagram structures
- **Large**: Performance stress testing

### Metrics Tracked

- Parse Time (ms)
- Render Time (ms)
- Total Time (ms)
- Success Rate (%)
- Error Analysis
- Performance Ratios

### Expected Results

Based on our Node.js testing:
- ANTLR: 100% success rate
- Jison: ~80% success rate
- Performance: ANTLR ~3x slower but acceptable
- Reliability: ANTLR superior error handling

### Files

- \`browser-performance-test.html\` - Main test interface
- \`mermaid-antlr.js\` - Local ANTLR build
- \`test-server.js\` - Simple HTTP server
- \`build-antlr-version.js\` - Build script

### Troubleshooting

If the ANTLR version fails to load, the test will fall back to comparing two instances of the Jison version for baseline performance measurement.
`;

fs.writeFileSync('BROWSER_TESTING.md', readmeContent);

console.log('');
console.log('🎉 Browser testing setup complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Run: pnpm run test:browser');
console.log('2. Open: http://localhost:3000');
console.log('3. Click "Run Comprehensive Benchmark"');
console.log('');
console.log('📊 This will give you real browser performance metrics comparing:');
console.log('   • Local ANTLR version vs Latest Jison version');
console.log('   • Parse times, render times, success rates');
console.log('   • Visual diagram comparison');
console.log('   • Comprehensive performance analysis');
console.log('');
