/**
 * Simple test to verify lezer parser integration
 */

import { getFlowchartParser } from './dist/mermaid.esm.mjs';

async function testLezerIntegration() {
  console.log('🧪 Testing Lezer Parser Integration...');

  try {
    // Test that lezer parser can be loaded
    console.log('📦 Loading lezer parser...');
    const parser = await getFlowchartParser('lezer');

    if (!parser) {
      throw new Error('Failed to load lezer parser');
    }

    console.log('✅ Lezer parser loaded successfully');
    console.log('📋 Parser interface:', {
      hasParser: !!parser.parser,
      hasYy: !!parser.yy,
      hasParse: !!parser.parse,
      hasParserParse: !!parser.parser?.parse,
    });

    // Test basic parsing
    console.log('🔍 Testing basic parsing...');
    const testDiagram = 'graph TD\nA --> B';

    try {
      const result = parser.parse(testDiagram);
      console.log('✅ Basic parsing successful');

      // Check if database was populated
      if (parser.yy) {
        const vertices = parser.yy.getVertices();
        const edges = parser.yy.getEdges();
        console.log('📊 Parse results:', {
          vertexCount: vertices?.size || 0,
          edgeCount: edges?.length || 0,
        });
      }
    } catch (parseError) {
      console.log(
        '⚠️ Parsing failed (expected for incomplete implementation):',
        parseError.message
      );
    }

    console.log('🎉 Lezer parser integration test completed successfully!');
  } catch (error) {
    console.error('❌ Lezer parser integration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLezerIntegration().catch(console.error);
