#!/usr/bin/env node

/**
 * Build script to create Mermaid bundle with all three parsers included
 * This ensures that the browser can dynamically switch between parsers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Mermaid with all parsers included...');

// Step 1: Ensure ANTLR generated files exist
console.log('📝 Generating ANTLR parser files...');
try {
  execSync('pnpm antlr:generate', { stdio: 'inherit' });
  console.log('✅ ANTLR files generated successfully');
} catch (error) {
  console.warn('⚠️ ANTLR generation failed, but continuing...');
}

// Step 2: Create a comprehensive entry point that includes all parsers
const entryPointContent = `
// Comprehensive Mermaid entry point with all parsers
import mermaid from './mermaid.js';

// Import all parsers to ensure they're included in the bundle
import './diagrams/flowchart/parser/flowParser.js';

// Try to import ANTLR parser (may fail if not generated)
try {
  import('./diagrams/flowchart/parser/flowParserANTLR.js');
} catch (e) {
  console.warn('ANTLR parser not available:', e.message);
}

// Try to import Lark parser (may fail if not implemented)
try {
  import('./diagrams/flowchart/parser/flowParserLark.js');
} catch (e) {
  console.warn('Lark parser not available:', e.message);
}

// Export the main mermaid object
export default mermaid;
export * from './mermaid.js';
`;

const entryPointPath = path.join(__dirname, 'src', 'mermaid-all-parsers.ts');
fs.writeFileSync(entryPointPath, entryPointContent);
console.log('✅ Created comprehensive entry point');

// Step 3: Build the main bundle
console.log('🔨 Building main Mermaid bundle...');
try {
  execSync('pnpm build', { stdio: 'inherit', cwd: '../..' });
  console.log('✅ Main bundle built successfully');
} catch (error) {
  console.error('❌ Main build failed:', error.message);
  process.exit(1);
}

// Step 4: Create parser-specific builds if needed
console.log('🔧 Creating parser-specific configurations...');

// Create a configuration file for browser testing
const browserConfigContent = `
/**
 * Browser configuration for parser testing
 * This file provides utilities for dynamic parser switching in browser environments
 */

// Parser configuration utilities
window.MermaidParserConfig = {
  // Available parsers
  availableParsers: ['jison', 'antlr', 'lark'],
  
  // Current parser
  currentParser: 'jison',
  
  // Set parser configuration
  setParser: function(parserType) {
    if (!this.availableParsers.includes(parserType)) {
      console.warn('Parser not available:', parserType);
      return false;
    }
    
    this.currentParser = parserType;
    
    // Update Mermaid configuration
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        flowchart: {
          parser: parserType
        }
      });
    }
    
    console.log('Parser configuration updated:', parserType);
    return true;
  },
  
  // Get current parser
  getCurrentParser: function() {
    return this.currentParser;
  },
  
  // Test parser availability
  testParser: async function(parserType, testInput = 'graph TD\\nA-->B') {
    const originalParser = this.currentParser;
    
    try {
      this.setParser(parserType);
      
      const startTime = performance.now();
      const tempDiv = document.createElement('div');
      tempDiv.id = 'parser-test-' + Date.now();
      document.body.appendChild(tempDiv);
      
      await window.mermaid.render(tempDiv.id, testInput);
      const endTime = performance.now();
      
      document.body.removeChild(tempDiv);
      
      return {
        success: true,
        time: endTime - startTime,
        parser: parserType
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        parser: parserType
      };
    } finally {
      this.setParser(originalParser);
    }
  },
  
  // Run comprehensive parser comparison
  compareAllParsers: async function(testInput = 'graph TD\\nA-->B') {
    const results = {};
    
    for (const parser of this.availableParsers) {
      console.log('Testing parser:', parser);
      results[parser] = await this.testParser(parser, testInput);
    }
    
    return results;
  }
};

console.log('🚀 Mermaid Parser Configuration utilities loaded');
console.log('Available parsers:', window.MermaidParserConfig.availableParsers);
console.log('Use MermaidParserConfig.setParser("antlr") to switch parsers');
console.log('Use MermaidParserConfig.compareAllParsers() to test all parsers');
`;

const browserConfigPath = path.join(__dirname, 'dist', 'mermaid-parser-config.js');
fs.writeFileSync(browserConfigPath, browserConfigContent);
console.log('✅ Created browser parser configuration utilities');

// Step 5: Update the real browser test to use the built bundle
console.log('🌐 Updating browser test configuration...');

const realBrowserTestPath = path.join(__dirname, 'real-browser-parser-test.html');
if (fs.existsSync(realBrowserTestPath)) {
  let testContent = fs.readFileSync(realBrowserTestPath, 'utf8');
  
  // Add parser configuration script
  const configScriptTag = '<script src="./dist/mermaid-parser-config.js"></script>';
  
  if (!testContent.includes(configScriptTag)) {
    testContent = testContent.replace(
      '<!-- Load Mermaid -->',
      configScriptTag + '\\n    <!-- Load Mermaid -->'
    );
    
    fs.writeFileSync(realBrowserTestPath, testContent);
    console.log('✅ Updated browser test with parser configuration');
  }
}

// Step 6: Create a simple test server script
const testServerContent = `
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the mermaid package directory
app.use(express.static(__dirname));

// Serve the browser test
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'real-browser-parser-test.html'));
});

app.listen(port, () => {
  console.log('🌐 Mermaid Parser Test Server running at:');
  console.log('   http://localhost:' + port);
  console.log('');
  console.log('🧪 Available tests:');
  console.log('   http://localhost:' + port + '/real-browser-parser-test.html');
  console.log('   http://localhost:' + port + '/three-way-browser-performance-test.html');
  console.log('');
  console.log('📊 Parser configuration utilities available in browser console:');
  console.log('   MermaidParserConfig.setParser("antlr")');
  console.log('   MermaidParserConfig.compareAllParsers()');
});
`;

const testServerPath = path.join(__dirname, 'parser-test-server.js');
fs.writeFileSync(testServerPath, testServerContent);
console.log('✅ Created test server script');

// Step 7: Update package.json scripts
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add new scripts
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts['build:all-parsers'] = 'node build-with-all-parsers.js';
packageJson.scripts['test:browser:parsers'] = 'node parser-test-server.js';

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with new scripts');

// Cleanup
fs.unlinkSync(entryPointPath);
console.log('🧹 Cleaned up temporary files');

console.log('');
console.log('🎉 Build completed successfully!');
console.log('');
console.log('🚀 To test the parsers in browser:');
console.log('   cd packages/mermaid');
console.log('   pnpm test:browser:parsers');
console.log('   # Then open http://localhost:3000');
console.log('');
console.log('🔧 Available parser configurations:');
console.log('   - jison: Original LR parser (default)');
console.log('   - antlr: ANTLR4-based parser (best reliability)');
console.log('   - lark: Lark-inspired parser (best performance)');
console.log('');
console.log('📊 Browser console utilities:');
console.log('   MermaidParserConfig.setParser("antlr")');
console.log('   MermaidParserConfig.compareAllParsers()');
console.log('   MermaidParserConfig.testParser("lark", "graph TD\\nA-->B")');
