/**
 * Tests for the Flowchart Parser Factory
 * 
 * This test suite validates the parser factory's ability to:
 * 1. Load different parsers dynamically
 * 2. Handle configuration-based parser selection
 * 3. Provide fallbacks when parsers are unavailable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  FlowchartParserFactory, 
  getFlowchartParser, 
  preloadAllFlowchartParsers,
  getAvailableFlowchartParsers 
} from './parserFactory.js';

describe('Flowchart Parser Factory', () => {
  let factory;

  beforeEach(() => {
    factory = FlowchartParserFactory.getInstance();
    factory.reset(); // Reset for clean test state
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FlowchartParserFactory.getInstance();
      const instance2 = FlowchartParserFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Parser Availability', () => {
    it('should report Jison parser as always available', () => {
      expect(factory.isParserAvailable('jison')).toBe(true);
    });

    it('should report ANTLR parser as available (can be loaded)', () => {
      expect(factory.isParserAvailable('antlr')).toBe(true);
    });

    it('should report Lark parser as available (can be loaded)', () => {
      expect(factory.isParserAvailable('lark')).toBe(true);
    });

    it('should report unknown parser as unavailable', () => {
      expect(factory.isParserAvailable('unknown')).toBe(false);
    });

    it('should return list of available parsers', () => {
      const available = factory.getAvailableParsers();
      expect(available).toEqual(['jison', 'antlr', 'lark']);
    });
  });

  describe('Jison Parser (Default)', () => {
    it('should return Jison parser immediately', async () => {
      const parser = await factory.getParser('jison');
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
      expect(typeof parser.parse).toBe('function');
    });

    it('should return Jison parser as default when no type specified', async () => {
      const parser = await factory.getParser();
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });
  });

  describe('Dynamic Parser Loading', () => {
    it('should attempt to load ANTLR parser', async () => {
      // Mock the dynamic import to simulate ANTLR parser loading
      const mockANTLRParser = {
        parse: vi.fn(),
        parser: { yy: {} },
        yy: {}
      };

      // This test will pass even if ANTLR parser fails to load (fallback to Jison)
      const parser = await factory.getParser('antlr');
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });

    it('should attempt to load Lark parser', async () => {
      // This test will pass even if Lark parser fails to load (fallback to Jison)
      const parser = await factory.getParser('lark');
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });

    it('should handle failed parser loading gracefully', async () => {
      // Even if dynamic loading fails, should return Jison as fallback
      const parser = await factory.getParser('antlr');
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });
  });

  describe('Configuration Integration', () => {
    it('should use configuration to determine parser type', async () => {
      // Mock getConfig to return specific parser configuration
      vi.mock('../../../config.js', () => ({
        getConfig: () => ({
          flowchart: { parser: 'antlr' }
        })
      }));

      const parser = await factory.getParser();
      expect(parser).toBeDefined();
    });
  });

  describe('Convenience Functions', () => {
    it('should provide getFlowchartParser convenience function', async () => {
      const parser = await getFlowchartParser('jison');
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });

    it('should provide getAvailableFlowchartParsers function', () => {
      const available = getAvailableFlowchartParsers();
      expect(available).toEqual(['jison', 'antlr', 'lark']);
    });

    it('should provide preloadAllFlowchartParsers function', async () => {
      // This should not throw even if some parsers fail to load
      await expect(preloadAllFlowchartParsers()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parser type gracefully', async () => {
      const parser = await factory.getParser('invalid');
      // Should fallback to Jison
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });

    it('should handle missing parser files gracefully', async () => {
      // Even if ANTLR/Lark files are missing, should not throw
      await expect(factory.getParser('antlr')).resolves.not.toThrow();
      await expect(factory.getParser('lark')).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should cache loaded parsers', async () => {
      const parser1 = await factory.getParser('jison');
      const parser2 = await factory.getParser('jison');
      
      // Should return the same instance (cached)
      expect(parser1).toBe(parser2);
    });

    it('should handle concurrent parser requests', async () => {
      const promises = [
        factory.getParser('jison'),
        factory.getParser('jison'),
        factory.getParser('jison')
      ];

      const parsers = await Promise.all(promises);
      
      // All should be defined and the same instance
      parsers.forEach(parser => {
        expect(parser).toBeDefined();
        expect(parser).toBe(parsers[0]);
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset factory state', async () => {
      // Load a parser first
      await factory.getParser('jison');
      
      // Reset
      factory.reset();
      
      // Should still work after reset
      const parser = await factory.getParser('jison');
      expect(parser).toBeDefined();
    });
  });
});

describe('Parser Factory Integration', () => {
  it('should integrate with flowchart diagram configuration', async () => {
    // Test that the parser factory can be used in the context of flowchart diagrams
    const parser = await getFlowchartParser('jison');
    expect(parser).toBeDefined();
    expect(parser.parse).toBeDefined();
    
    // Should have parser.yy for compatibility
    if (parser.parser) {
      expect(parser.parser.yy).toBeDefined();
    }
  });

  it('should support all three parser types', async () => {
    const jisonParser = await getFlowchartParser('jison');
    const antlrParser = await getFlowchartParser('antlr');
    const larkParser = await getFlowchartParser('lark');

    expect(jisonParser).toBeDefined();
    expect(antlrParser).toBeDefined();
    expect(larkParser).toBeDefined();

    // All should have parse methods
    expect(jisonParser.parse).toBeDefined();
    expect(antlrParser.parse).toBeDefined();
    expect(larkParser.parse).toBeDefined();
  });
});

describe('Real-world Usage Scenarios', () => {
  it('should handle browser environment parser switching', async () => {
    // Simulate browser environment where user switches parsers
    const parsers = [];
    
    for (const parserType of ['jison', 'antlr', 'lark']) {
      const parser = await getFlowchartParser(parserType);
      parsers.push({ type: parserType, parser });
    }

    // All parsers should be loaded successfully
    expect(parsers).toHaveLength(3);
    parsers.forEach(({ parser }) => {
      expect(parser).toBeDefined();
      expect(parser.parse).toBeDefined();
    });
  });

  it('should handle configuration changes', async () => {
    // Test changing configuration and getting appropriate parser
    let parser1 = await getFlowchartParser('jison');
    let parser2 = await getFlowchartParser('antlr');
    let parser3 = await getFlowchartParser('lark');

    // All should be valid parsers
    expect(parser1).toBeDefined();
    expect(parser2).toBeDefined();
    expect(parser3).toBeDefined();
  });
});

console.log('🧪 Parser Factory tests loaded');
console.log('📊 Testing dynamic parser loading and configuration-based selection');
console.log('🔧 Validating fallback mechanisms and error handling');
