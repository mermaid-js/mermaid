/**
 * Token extraction utility for Lezer flowchart parser
 * Extracts tokens from Lezer parse trees and maps them to JISON-equivalent tokens
 */

import { Tree, TreeCursor, SyntaxNode } from '@lezer/common';

export interface Token {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface TokenExtractionResult {
  tokens: Token[];
  errors: string[];
}

/**
 * Maps Lezer node names to JISON token types
 * This mapping ensures compatibility between Lezer and JISON tokenization
 */
const LEZER_TO_JISON_TOKEN_MAP: Record<string, string> = {
  // Graph keywords
  'graphKeyword': 'GRAPH',
  'subgraph': 'subgraph',
  'end': 'end',
  
  // Direction
  'direction': 'DIR',
  'directionTB': 'direction_tb',
  'directionBT': 'direction_bt', 
  'directionRL': 'direction_rl',
  'directionLR': 'direction_lr',
  
  // Styling
  'style': 'STYLE',
  'default': 'DEFAULT',
  'linkStyle': 'LINKSTYLE',
  'interpolate': 'INTERPOLATE',
  'classDef': 'CLASSDEF',
  'class': 'CLASS',
  
  // Interactions
  'click': 'CLICK',
  'href': 'HREF',
  'call': 'CALLBACKNAME',
  
  // Link targets
  'linkTarget': 'LINK_TARGET',
  
  // Accessibility
  'accTitle': 'acc_title',
  'accDescr': 'acc_descr',
  
  // Numbers and identifiers
  'num': 'NUM',
  'nodeString': 'NODE_STRING',
  'unicodeText': 'UNICODE_TEXT',
  'linkId': 'LINK_ID',
  
  // Punctuation
  'brkt': 'BRKT',
  'styleSeparator': 'STYLE_SEPARATOR',
  'colon': 'COLON',
  'amp': 'AMP',
  'semi': 'SEMI',
  'comma': 'COMMA',
  'mult': 'MULT',
  'minus': 'MINUS',
  'tagStart': 'TAGSTART',
  'tagEnd': 'TAGEND',
  'up': 'UP',
  'sep': 'SEP',
  'down': 'DOWN',
  'quote': 'QUOTE',
  
  // Shape delimiters
  'ps': 'PS',
  'pe': 'PE',
  'sqs': 'SQS',
  'sqe': 'SQE',
  'diamondStart': 'DIAMOND_START',
  'diamondStop': 'DIAMOND_STOP',
  'pipe': 'PIPE',
  'stadiumStart': 'STADIUMSTART',
  'stadiumEnd': 'STADIUMEND',
  'subroutineStart': 'SUBROUTINESTART',
  'subroutineEnd': 'SUBROUTINEEND',
  'cylinderStart': 'CYLINDERSTART',
  'cylinderEnd': 'CYLINDEREND',
  'doubleCircleStart': 'DOUBLECIRCLESTART',
  'doubleCircleEnd': 'DOUBLECIRCLEEND',
  'ellipseStart': '(-',
  'ellipseEnd': '-)',
  'trapStart': 'TRAPSTART',
  'trapEnd': 'TRAPEND',
  'invTrapStart': 'INVTRAPSTART',
  'invTrapEnd': 'INVTRAPEND',
  'vertexWithPropsStart': 'VERTEX_WITH_PROPS_START',
  
  // Arrows and links
  'arrow': 'LINK',
  'startLink': 'START_LINK',
  'thickArrow': 'LINK',
  'thickStartLink': 'START_LINK',
  'dottedArrow': 'LINK',
  'dottedStartLink': 'START_LINK',
  'invisibleLink': 'LINK',
  
  // Text and strings
  'text': 'TEXT',
  'string': 'STR',
  'mdString': 'MD_STR',
  
  // Shape data
  'shapeDataStart': 'SHAPE_DATA',
  
  // Control
  'newline': 'NEWLINE',
  'space': 'SPACE',
  'eof': 'EOF'
};

/**
 * Extracts tokens from a Lezer parse tree
 */
export class LezerTokenExtractor {
  
  /**
   * Extract tokens from a Lezer parse tree
   * @param tree The Lezer parse tree
   * @param input The original input string
   * @returns Token extraction result
   */
  extractTokens(tree: Tree, input: string): TokenExtractionResult {
    const tokens: Token[] = [];
    const errors: string[] = [];
    
    try {
      this.walkTree(tree.cursor(), input, tokens, errors);
    } catch (error) {
      errors.push(`Token extraction error: ${error.message}`);
    }
    
    return { tokens, errors };
  }
  
  /**
   * Walk the parse tree and extract tokens
   */
  private walkTree(cursor: TreeCursor, input: string, tokens: Token[], errors: string[]): void {
    do {
      const node = cursor.node;
      const nodeName = node.name;
      
      // Skip the root Flowchart node and structural nodes
      if (nodeName === 'Flowchart' || this.isStructuralNode(nodeName)) {
        // Continue to children
        if (cursor.firstChild()) {
          this.walkTree(cursor, input, tokens, errors);
          cursor.parent();
        }
        continue;
      }
      
      // Extract token for leaf nodes or nodes with direct text content
      if (this.shouldExtractToken(node, cursor)) {
        const token = this.createToken(node, input, nodeName);
        if (token) {
          tokens.push(token);
        } else {
          errors.push(`Failed to create token for node: ${nodeName} at ${node.from}-${node.to}`);
        }
      }
      
      // Recurse into children for non-leaf nodes
      if (cursor.firstChild()) {
        this.walkTree(cursor, input, tokens, errors);
        cursor.parent();
      }
      
    } while (cursor.nextSibling());
  }
  
  /**
   * Check if this is a structural node that shouldn't generate tokens
   */
  private isStructuralNode(nodeName: string): boolean {
    const structuralNodes = [
      'GraphStatement',
      'DirectionStatement', 
      'NodeStatement',
      'LinkStatement',
      'StyleStatement',
      'ClassDefStatement',
      'ClassStatement',
      'ClickStatement',
      'SubgraphStatement',
      'AccessibilityStatement',
      'ShapeContent',
      'StyleContent'
    ];
    return structuralNodes.includes(nodeName);
  }
  
  /**
   * Check if we should extract a token for this node
   */
  private shouldExtractToken(node: SyntaxNode, cursor: TreeCursor): boolean {
    // Extract tokens for terminal nodes (no children) or specific token nodes
    return !cursor.firstChild() || this.isTokenNode(node.name);
  }
  
  /**
   * Check if this node represents a token
   */
  private isTokenNode(nodeName: string): boolean {
    return LEZER_TO_JISON_TOKEN_MAP.hasOwnProperty(nodeName);
  }
  
  /**
   * Create a token from a parse tree node
   */
  private createToken(node: SyntaxNode, input: string, nodeName: string): Token | null {
    const jisonType = LEZER_TO_JISON_TOKEN_MAP[nodeName];
    if (!jisonType) {
      // For unmapped nodes, use the node name as type
      return {
        type: nodeName,
        value: input.slice(node.from, node.to),
        start: node.from,
        end: node.to
      };
    }
    
    return {
      type: jisonType,
      value: input.slice(node.from, node.to),
      start: node.from,
      end: node.to
    };
  }
  
  /**
   * Get a summary of token types extracted
   */
  getTokenSummary(tokens: Token[]): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const token of tokens) {
      summary[token.type] = (summary[token.type] || 0) + 1;
    }
    return summary;
  }
  
  /**
   * Filter tokens by type
   */
  filterTokensByType(tokens: Token[], types: string[]): Token[] {
    return tokens.filter(token => types.includes(token.type));
  }
  
  /**
   * Get tokens in a specific range
   */
  getTokensInRange(tokens: Token[], start: number, end: number): Token[] {
    return tokens.filter(token => 
      token.start >= start && token.end <= end
    );
  }
}
