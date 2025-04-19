// Test parsing
import { createMindMapServices } from '../lib/language/mindmap/module.js';
import { parseDocument } from 'langium';

// Create services for handling the language
const services = createMindMapServices();
// Get the service for parsing documents
const documentBuilder = services.MindMap.shared.workspace.DocumentBuilder;

// Sample mindmap text to parse
const text = 'mindmap\nroot\n  child1\n  child2';

// Parse the document
const doc = documentBuilder.buildDocuments([
  {
    uri: 'file:///test.mindmap',
    content: text,
    version: 1,
  },
]);

// Get the parsed document
const result = Array.isArray(doc) ? doc[0] : undefined;
if (result) {
  console.log('AST:', JSON.stringify(result.parseResult.value, null, 2));
  console.log('First node:', JSON.stringify(result.parseResult.value.statements?.[0], null, 2));
}
