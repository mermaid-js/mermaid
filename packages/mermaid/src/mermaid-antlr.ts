
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
