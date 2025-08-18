import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
