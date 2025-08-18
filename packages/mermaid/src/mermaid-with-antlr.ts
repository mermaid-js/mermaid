/**
 * Mermaid with ANTLR Parser - Bundle Size Test Build
 * 
 * This is a modified entry point that uses the ANTLR parser instead of Jison
 * for bundle size comparison testing.
 */

// Import the main mermaid functionality
import mermaid from './mermaid';

// Import ANTLR parser components
import flowParserANTLR from './diagrams/flowchart/parser/flowParserANTLR';

// Override the flowchart parser with ANTLR version
// This simulates what the final integration would look like
if (typeof window !== 'undefined') {
  // Browser environment - expose ANTLR version
  (window as any).mermaidANTLR = {
    ...mermaid,
    version: mermaid.version + '-antlr',
    parser: {
      flow: flowParserANTLR
    }
  };
  
  // Also expose as regular mermaid for testing
  if (!(window as any).mermaid) {
    (window as any).mermaid = (window as any).mermaidANTLR;
  }
}

export default mermaid;
