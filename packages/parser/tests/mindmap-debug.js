// Debug file to print the structure of a parsed mindmap
import { mindMapParse } from './test-util.js';

const result = mindMapParse('mindmap\nroot\n  child1\n  child2');

console.log('Parser result:', result.value);
console.log('Statement structure:', JSON.stringify(result.value?.statements[0], null, 2));
