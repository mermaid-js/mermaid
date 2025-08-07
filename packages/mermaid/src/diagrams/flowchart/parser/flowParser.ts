// Lezer-based flowchart parser
import { parser as lezerParser } from './flow.grammar.js';
import type { FlowDB } from '../flowDb.js';
import type { FlowVertexTypeParam } from '../types.js';
import { log } from '../../../logger.js';

/**
 * Process text and determine if it's markdown, string, or regular text
 * @param text - The raw text (may contain quotes and backticks)
 * @returns Object with processed text and labelType
 */
function processNodeText(text: string): { text: string; type: 'text' | 'markdown' | 'string' } {
  let processedText = text;
  let wasQuoted = false;

  // Remove outer quotes if present
  if (processedText.startsWith('"') && processedText.endsWith('"') && processedText.length > 2) {
    processedText = processedText.slice(1, -1);
    wasQuoted = true;
  }

  // Check if text is surrounded by backticks (markdown)
  if (processedText.startsWith('`') && processedText.endsWith('`') && processedText.length > 2) {
    // Strip backticks and mark as markdown
    return {
      text: processedText.slice(1, -1),
      type: 'markdown',
    };
  }

  // If it was quoted but not markdown, it's a string
  if (wasQuoted) {
    return {
      text: processedText,
      type: 'string',
    };
  }

  // Regular text
  return {
    text: processedText,
    type: 'text',
  };
}

/**
 * Map shape types to valid FlowVertexTypeParam values
 */
function mapShapeType(shapeType: string | undefined): FlowVertexTypeParam {
  if (!shapeType) {
    return undefined;
  }

  // Map common shape types to FlowVertexTypeParam
  const shapeMap: Record<string, FlowVertexTypeParam> = {
    rect: 'rect',
    square: 'square',
    circle: 'circle',
    ellipse: 'ellipse',
    stadium: 'stadium',
    subroutine: 'subroutine',
    cylinder: 'cylinder',
    round: 'round',
    diamond: 'diamond',
    hexagon: 'hexagon',
    odd: 'odd',
    trapezoid: 'trapezoid',
    inv_trapezoid: 'inv_trapezoid',
    lean_right: 'lean_right',
    lean_left: 'lean_left',
    doublecircle: 'doublecircle',
  };

  return shapeMap[shapeType] || 'rect'; // Default to 'rect' for unknown types
}

/**
 * Lezer-based flowchart parser that maintains compatibility with JISON interface
 */
class LezerFlowParser {
  public yy: FlowDB | undefined;
  private lastReferencedNodeId: string | null = null;

  constructor() {
    this.yy = undefined;
  }

  /**
   * Parse flowchart source code using Lezer parser
   * @param src - The flowchart source code
   * @returns Parse result (for compatibility)
   */
  parse(src: string): unknown {
    console.log('UIO DEBUG: Our custom parser is being called with:', src);
    if (!this.yy) {
      throw new Error('Parser database (yy) not initialized. Call parser.yy = new FlowDB() first.');
    }

    try {
      // Preprocess source (same as JISON version)
      const newSrc = src.replace(/}\s*\n/g, '}\n');

      log.debug('UIO Parsing flowchart with Lezer:', newSrc);

      // Parse with Lezer
      const tree = lezerParser.parse(newSrc);

      log.debug('UIO Lezer parse tree:', tree.toString());

      // Process the parse tree and populate FlowDB
      this.processParseTree(tree, newSrc);

      return {}; // Return empty object for compatibility
    } catch (error) {
      log.error('UIO Flowchart parsing error:', error);
      throw error;
    }
  }

  /**
   * Process the Lezer parse tree and populate FlowDB
   * @param tree - The Lezer parse tree
   * @param source - The original source code
   */
  private processParseTree(tree: any, source: string): void {
    log.debug('UIO Processing parse tree...');

    // First pass: collect all tokens in order
    const tokens = this.collectTokens(tree, source);
    console.log('UIO DEBUG: Collected tokens:', tokens);
    log.debug('UIO Collected tokens:', tokens);

    // Second pass: parse the token sequence
    this.parseTokenSequence(tokens);
  }

  /**
   * Collect all tokens from the parse tree in order
   * @param tree - The Lezer parse tree
   * @param source - The original source code
   */
  private collectTokens(
    tree: any,
    source: string
  ): { type: string; value: string; from: number; to: number }[] {
    const tokens: { type: string; value: string; from: number; to: number }[] = [];
    const cursor = tree.cursor();

    const collectFromNode = (cursor: any) => {
      const nodeName = cursor.node.name;
      const nodeText = source.slice(cursor.from, cursor.to);

      // Skip whitespace and comments
      if (nodeName === 'space' || nodeName === 'Comment' || nodeName === 'newline') {
        return;
      }

      // If this is a leaf node (terminal), add it as a token
      if (!cursor.firstChild()) {
        tokens.push({
          type: nodeName,
          value: nodeText,
          from: cursor.from,
          to: cursor.to,
        });
        return;
      }

      // If this is a non-terminal with children, process children
      do {
        collectFromNode(cursor);
      } while (cursor.nextSibling());
      cursor.parent();
    };

    collectFromNode(cursor);

    // Sort tokens by position to ensure correct order
    tokens.sort((a, b) => a.from - b.from);

    return tokens;
  }

  /**
   * Parse a sequence of tokens and populate FlowDB
   * @param tokens - Array of tokens in order
   */
  private parseTokenSequence(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): void {
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      console.log(`UIO DEBUG: Processing token ${i}: ${token.type} = "${token.value}"`);
      log.debug(`UIO Processing token ${i}: ${token.type} = "${token.value}"`);

      switch (token.type) {
        case 'GraphKeyword':
          i = this.parseGraphStatement(tokens, i);
          break;
        case 'SUBGRAPH':
          i = this.parseSubgraphStatement(tokens, i);
          break;
        case 'Identifier':
        case 'NODE_STRING':
          i = this.parseStatement(tokens, i);
          break;
        case 'SquareStart':
        case 'RoundStart':
        case 'DiamondStart':
        case 'CircleStart':
        case 'DoubleCircleStart':
        case 'StadiumStart':
        case 'SubroutineStart':
        case 'CylinderStart':
        case 'HexagonStart':
        case 'RectStart':
          // Handle orphaned shape tokens (shape tokens without preceding node ID)
          i = this.parseStatement(tokens, i);
          break;
        case 'CLICK':
          i = this.parseClickStatement(tokens, i);
          break;
        case 'LINK':
        case 'Arrow':
          // Handle continuation edges that start with LINK/Arrow tokens (e.g., "-- text --> C")
          // These are edges that continue from the last referenced node
          i = this.parseContinuationEdgeStatement(tokens, i);
          break;
        case 'End':
          // Skip standalone 'end' tokens (shouldn't happen but just in case)
          i++;
          break;
        case 'At':
        case 'Hyphen':
        case 'TagEnd':
          // Skip these tokens when they appear standalone
          i++;
          break;
        default:
          i++; // Skip unknown tokens
          break;
      }
    }
  }

  /**
   * Parse a graph statement (graph TD, flowchart LR, etc.)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseGraphStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;
    const graphToken = tokens[i];

    log.debug(`UIO Parsing graph statement starting with: ${graphToken.value}`);

    i++; // Skip graph keyword

    // Look for direction (could be Direction token or special characters)
    if (i < tokens.length) {
      const token = tokens[i];
      let direction = '';

      if (token.type === 'Direction') {
        direction = token.value;
        i++;
      } else if (token.type === 'TagEnd' && token.value === '>') {
        // Handle '>' as LR direction
        direction = 'LR';
        i++;
      } else if (token.value === '<' || token.value === '^' || token.value === 'v') {
        // Handle special direction characters
        switch (token.value) {
          case '<':
            direction = 'RL';
            break;
          case '^':
            direction = 'BT';
            break;
          case 'v':
            direction = 'TB';
            break;
        }
        i++;
      }

      if (direction && this.yy) {
        log.debug(`UIO Setting direction: ${direction}`);
        this.yy.setDirection(direction);
      }
    }

    return i;
  }

  /**
   * Parse a statement (could be node, edge, etc.)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    const i = startIndex;

    // Look ahead to determine what kind of statement this is
    const lookahead = this.lookAhead(tokens, i, 10);
    console.log(
      `UIO DEBUG: parseStatement called at token ${i}: ${tokens[i]?.type}:${tokens[i]?.value}`
    );
    console.log(
      `UIO DEBUG: parseStatement lookahead:`,
      lookahead.slice(0, 5).map((t) => `${t.type}:${t.value}`)
    );
    log.debug(
      `UIO Parsing statement, lookahead:`,
      lookahead.map((t) => `${t.type}:${t.value}`)
    );

    // Check if this is a direction statement (direction BT)
    if (
      lookahead.length >= 2 &&
      lookahead[0].value === 'direction' &&
      lookahead[1].type === 'Direction'
    ) {
      console.log(`UIO DEBUG: Taking direction statement path`);
      return this.parseDirectionStatement(tokens, i);
    }

    // Check if this is a click statement (click A callback)
    if (lookahead.length >= 3 && lookahead[0].value === 'click') {
      console.log(`UIO DEBUG: Taking click statement path`);
      return this.parseClickStatement(tokens, i);
    }

    // Check if this is an edge with ID (A e1@--> B pattern or A e1@x-- text --x B pattern)
    const extendedLookahead = this.lookAhead(tokens, i, 10);
    log.debug(
      `UIO Edge ID detection: lookahead = ${extendedLookahead
        .slice(0, 5)
        .map((t) => `${t.type}:${t.value}`)
        .join(', ')}`
    );
    if (
      extendedLookahead.length >= 4 &&
      (extendedLookahead[0].type === 'Identifier' || extendedLookahead[0].type === 'NODE_STRING') &&
      (extendedLookahead[1].type === 'Identifier' || extendedLookahead[1].type === 'NODE_STRING') &&
      extendedLookahead[2].type === 'At'
    ) {
      console.log(`UIO DEBUG: Edge ID detection: matched basic pattern`);
      log.debug(`UIO Edge ID detection: matched basic pattern`);
      // Check for simple arrow pattern: A e1@--> B
      if (extendedLookahead[3].type === 'Arrow') {
        console.log(`UIO DEBUG: Edge ID detection: matched simple arrow pattern`);
        log.debug(`UIO Edge ID detection: matched simple arrow pattern`);
        return this.parseEdgeWithIdStatement(tokens, i);
      }
      // Check for double-ended arrow pattern: A e1@x-- text --x B
      if (
        extendedLookahead.length >= 8 &&
        (extendedLookahead[3].type === 'Identifier' ||
          extendedLookahead[3].type === 'NODE_STRING') &&
        extendedLookahead[3].value.length === 1 &&
        ['x', 'o'].includes(extendedLookahead[3].value) &&
        extendedLookahead[4].type === 'Arrow' &&
        // Accept any token type for text (Identifier, GraphKeyword, Direction, etc.)
        extendedLookahead[5].value &&
        extendedLookahead[5].value.length > 0 &&
        extendedLookahead[6].type === 'Arrow' &&
        extendedLookahead[7].type === 'Identifier'
      ) {
        return this.parseEdgeWithIdDoubleArrowStatement(tokens, i);
      }
      // Check for dotted double-ended arrow pattern: A e1@x-. text .-x B
      if (
        extendedLookahead.length >= 10 &&
        extendedLookahead[3].type === 'Identifier' &&
        extendedLookahead[3].value.length === 1 &&
        ['x', 'o'].includes(extendedLookahead[3].value) &&
        extendedLookahead[4].type === 'Arrow' &&
        // Accept any token type for text (Identifier, GraphKeyword, Direction, etc.)
        extendedLookahead[5].value &&
        extendedLookahead[5].value.length > 0 &&
        extendedLookahead[6].type === '⚠' &&
        extendedLookahead[6].value === '.' &&
        extendedLookahead[7].type === 'Hyphen' &&
        extendedLookahead[8].type === 'Identifier' &&
        extendedLookahead[8].value.length === 1 &&
        ['x', 'o'].includes(extendedLookahead[8].value) &&
        extendedLookahead[9].type === 'Identifier'
      ) {
        return this.parseEdgeWithIdDottedDoubleArrowStatement(tokens, i);
      }
    }

    // Check for double-ended arrow patterns: A x-- text --x B
    const doubleArrowLookahead = this.lookAhead(tokens, i, 8);
    log.debug(
      `UIO Checking double-ended arrow pattern. Lookahead: ${doubleArrowLookahead.map((t) => `${t.type}:${t.value}`).join(', ')}`
    );
    if (
      doubleArrowLookahead.length >= 6 &&
      doubleArrowLookahead[0].type === 'Identifier' &&
      doubleArrowLookahead[1].type === 'Identifier' &&
      doubleArrowLookahead[1].value.length === 1 &&
      ['x', 'o'].includes(doubleArrowLookahead[1].value) &&
      doubleArrowLookahead[2].type === 'Arrow' &&
      // Accept any token type for text (Identifier, GraphKeyword, Direction, etc.)
      doubleArrowLookahead[3].value &&
      doubleArrowLookahead[3].value.length > 0 &&
      doubleArrowLookahead[4].type === 'Arrow' &&
      doubleArrowLookahead[5].type === 'Identifier'
    ) {
      log.debug(
        `UIO Detected double-ended arrow pattern: ${doubleArrowLookahead.map((t) => t.value).join(' ')}`
      );
      return this.parseDoubleEndedArrowStatement(tokens, i);
    }
    // Check for dotted double-ended arrow patterns: A x-. text .-x B
    if (
      doubleArrowLookahead.length >= 8 &&
      doubleArrowLookahead[0].type === 'Identifier' &&
      doubleArrowLookahead[1].type === 'Identifier' &&
      doubleArrowLookahead[1].value.length === 1 &&
      ['x', 'o'].includes(doubleArrowLookahead[1].value) &&
      doubleArrowLookahead[2].type === 'Arrow' &&
      // Accept any token type for text (Identifier, GraphKeyword, Direction, etc.)
      doubleArrowLookahead[3].value &&
      doubleArrowLookahead[3].value.length > 0 &&
      doubleArrowLookahead[4].type === '⚠' &&
      doubleArrowLookahead[4].value === '.' &&
      doubleArrowLookahead[5].type === 'Hyphen' &&
      doubleArrowLookahead[6].type === 'Identifier' &&
      doubleArrowLookahead[6].value.length === 1 &&
      ['x', 'o'].includes(doubleArrowLookahead[6].value) &&
      doubleArrowLookahead[7].type === 'Identifier'
    ) {
      log.debug(
        `UIO Detected dotted double-ended arrow pattern: ${doubleArrowLookahead.map((t) => t.value).join(' ')}`
      );
      return this.parseDottedDoubleEndedArrowStatement(tokens, i);
    }

    // Check if this is an edge (A --> B pattern or A(text) --> B pattern)
    // Check for orphaned shape tokens (shape tokens without preceding node ID) FIRST
    // This happens when an edge creates a target node but leaves the shape tokens for later processing
    if (lookahead.length >= 3 && this.isShapeStart(lookahead[0].type)) {
      console.log(`UIO DEBUG: Taking orphaned shape statement path (shape without node ID)`);
      return this.parseOrphanedShapeStatement(tokens, i);
    }

    // Look for LINK or Arrow token anywhere in the lookahead (not just position 1)
    const hasEdgeToken = lookahead.some((token) => token.type === 'Arrow' || token.type === 'LINK');
    if (lookahead.length >= 3 && hasEdgeToken) {
      console.log(`UIO DEBUG: Taking edge statement path (found edge token in lookahead)`);
      return this.parseEdgeStatement(tokens, i);
    }

    // Otherwise, treat as a single node
    console.log(`UIO DEBUG: Taking node statement path (single node)`);
    return this.parseNodeStatement(tokens, i);
  }

  /**
   * Look ahead in the token stream
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @param count - Number of tokens to look ahead
   * @returns Array of tokens
   */
  private lookAhead(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number,
    count: number
  ): { type: string; value: string; from: number; to: number }[] {
    const result = [];
    for (let i = 0; i < count && startIndex + i < tokens.length; i++) {
      result.push(tokens[startIndex + i]);
    }
    return result;
  }

  /**
   * Parse continuation edge statement (edge that starts with LINK/Arrow token)
   * This handles edges like "-- text --> C" that continue from the last referenced node
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseContinuationEdgeStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    const i = startIndex;

    if (!this.lastReferencedNodeId) {
      console.log(
        `UIO DEBUG: parseContinuationEdgeStatement: No lastReferencedNodeId available, skipping`
      );
      return i + 1; // Skip the LINK/Arrow token
    }

    const sourceId = this.lastReferencedNodeId;
    console.log(`UIO DEBUG: parseContinuationEdgeStatement: Creating edge from ${sourceId}`);

    // Parse the edge using the existing parseEdgePattern logic, but with a virtual source node token
    // Create a virtual token array that starts with the source node ID
    const virtualTokens = [
      { type: 'NODE_STRING', value: sourceId, from: tokens[i].from, to: tokens[i].from },
      ...tokens.slice(i),
    ];

    // Parse the edge pattern directly without creating source vertex (it already exists)
    const edgeInfo = this.parseEdgePattern(virtualTokens, 1); // Start at index 1 (skip virtual source node)
    if (!edgeInfo) {
      console.log(`UIO DEBUG: parseContinuationEdgeStatement: no edge pattern found`);
      return i + 1;
    }

    // Create the edge and target vertex (but not source vertex)
    if (this.yy) {
      // Check if target node is followed by a shape delimiter
      const adjustedIndex = i + (edgeInfo.nextIndex - 1);
      const isTargetShaped =
        adjustedIndex < tokens.length && this.isShapeStart(tokens[adjustedIndex].type);
      console.log(
        `UIO DEBUG: parseContinuationEdgeStatement: targetId=${edgeInfo.targetId}, isTargetShaped=${isTargetShaped}`
      );

      if (!isTargetShaped) {
        // Create target vertex only if it's not going to be shaped
        this.yy.addVertex(
          edgeInfo.targetId,
          { text: edgeInfo.targetId, type: 'text' },
          undefined,
          [],
          [],
          '',
          {},
          undefined
        );
      } else {
        // Target is shaped - track it for orphaned shape processing
        this.lastReferencedNodeId = edgeInfo.targetId;
      }

      // Process edge text for markdown, but check if it came from a STR token
      let processedEdgeText = processNodeText(edgeInfo.text);

      // Check if the edge text came from a STR token (quoted string)
      // Look for STR token in the original tokens that matches the edge text
      for (let j = i; j < Math.min(i + 5, tokens.length); j++) {
        if (tokens[j].type === 'STR') {
          const strValue = tokens[j].value;
          const cleanedStr = strValue.replace(/^"(.*)"$/, '$1');
          if (cleanedStr === edgeInfo.text) {
            // This text came from a STR token, so it should be type 'string'
            processedEdgeText = { text: cleanedStr, type: 'string' };
            break;
          }
        }
      }

      // Create the edge
      console.log(
        `UIO DEBUG: Creating continuation edge: ${sourceId} ----> ${edgeInfo.targetId} (text: "${edgeInfo.text}", type: ${edgeInfo.type}, stroke: ${edgeInfo.stroke})`
      );
      this.yy.addSingleLink(sourceId, edgeInfo.targetId, {
        text: { text: processedEdgeText.text, type: processedEdgeText.type },
        type: edgeInfo.type,
        stroke: edgeInfo.stroke,
        length: edgeInfo.length,
      });
    }

    // Adjust the return index to account for the virtual token
    return i + (edgeInfo.nextIndex - 1);
  }

  /**
   * Parse orphaned shape tokens (shape tokens without preceding node ID)
   * This happens when an edge creates a target node but leaves the shape tokens for later processing
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseOrphanedShapeStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    const i = startIndex;

    if (!this.lastReferencedNodeId) {
      console.log(
        `UIO DEBUG: parseOrphanedShapeStatement: No lastReferencedNodeId available, skipping`
      );
      return i + 1; // Skip the shape token
    }

    const nodeId = this.lastReferencedNodeId;
    console.log(`UIO DEBUG: parseOrphanedShapeStatement: Applying shape to node ${nodeId}`);

    // Parse the shape using the existing parseShapedNode logic, but with a virtual node token
    // Create a virtual token array that starts with the node ID
    const virtualTokens = [
      { type: 'NODE_STRING', value: nodeId, from: tokens[i].from, to: tokens[i].from },
      ...tokens.slice(i),
    ];

    // Parse as a shaped node starting from the virtual node token
    const nextIndex = this.parseShapedNode(virtualTokens, 0);

    // Adjust the return index to account for the virtual token
    return i + (nextIndex - 1);
  }

  /**
   * Parse a node statement (single node like "A" or shaped node like "A[Square]")
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseNodeStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;
    const nodeToken = tokens[i];

    // Handle both 'Identifier' and 'NODE_STRING' token types
    if (nodeToken.type === 'Identifier' || nodeToken.type === 'NODE_STRING') {
      const nodeId = nodeToken.value;
      log.debug(`UIO Creating node: ${nodeId}`);

      // Look ahead to see if this is a shaped node
      const lookahead = this.lookAhead(tokens, i, 4);

      // Check for shape patterns: A[text], A(text), A{text}, etc.
      if (lookahead.length >= 3 && this.isShapeStart(lookahead[1].type)) {
        console.log(`UIO DEBUG: Detected shaped node: ${nodeId} with shape ${lookahead[1].type}`);
        return this.parseShapedNode(tokens, i);
      }

      if (this.yy) {
        // Create a simple node with default properties
        this.yy.addVertex(
          nodeId, // id
          { text: nodeId, type: 'text' }, // textObj
          undefined, // type
          [], // style
          [], // classes
          '', // dir
          {}, // props
          undefined // metadata
        );
      }
      i++;
    }

    return i;
  }

  /**
   * Check if a token type represents a shape start delimiter
   * @param tokenType - The token type to check
   * @returns True if it's a shape start delimiter
   */
  private isShapeStart(tokenType: string): boolean {
    const shapeStarts = [
      'SquareStart', // [
      'ParenStart', // (
      'DiamondStart', // {
      'DoubleCircleStart', // (((
      'SubroutineStart', // [[
      'CylinderStart', // [(
      'StadiumStart', // ([
      'TrapStart', // [/
      'InvTrapStart', // [\
      'TagEnd', // > (for odd shapes)
    ];
    return shapeStarts.includes(tokenType);
  }

  /**
   * Parse a shaped node like A[Square], B(Round), C{Diamond}
   * @param tokens - Array of tokens
   * @param startIndex - Starting index (should be at the node ID)
   * @returns Next index to process
   */
  private parseShapedNode(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Get node ID
    const nodeId = tokens[i].value;
    i++; // Move to shape start

    // Get shape start delimiter
    const shapeStart = tokens[i];
    let actualShapeType = shapeStart.type;
    i++; // Move to shape text

    // Special handling for odd shapes that start with TagEnd (>text])
    if (actualShapeType === 'TagEnd') {
      actualShapeType = 'OddStart'; // Convert TagEnd to OddStart for consistency
    }

    // Special handling for parentheses-based shapes
    if (shapeStart.type === 'ParenStart' && i < tokens.length) {
      // Check for double parentheses: ((text)) -> circle
      if (tokens[i].type === 'ParenStart') {
        actualShapeType = 'CircleStart'; // Use CircleStart for double parens
        i++; // Skip the second ParenStart
      }
      // Check for ellipse: (-text-) -> ellipse
      else if (tokens[i].type === 'Hyphen') {
        actualShapeType = 'EllipseStart';
        i++; // Skip the first hyphen
      }
      // Otherwise it's a regular round shape: (text) -> round
    }

    // Special handling for diamond-based shapes
    if (
      shapeStart.type === 'DiamondStart' &&
      i < tokens.length && // Check for double braces: {{text}} -> hexagon
      tokens[i].type === 'DiamondStart'
    ) {
      actualShapeType = 'HexagonStart'; // Use HexagonStart for double braces
      i++; // Skip the second DiamondStart
    }
    // Otherwise it's a regular diamond shape: {text} -> diamond

    // Special handling for square-based shapes
    if (
      shapeStart.type === 'SquareStart' &&
      i < tokens.length && // Check for rect with borders: [|borders:lt|text] -> rect
      tokens[i].type === 'PIPE'
    ) {
      actualShapeType = 'RectStart'; // Use RectStart for pipe-delimited borders
      // Don't skip the pipe - we need to process the borders content
    }
    // Otherwise it's a regular square shape: [text] -> square

    // DoubleCircleStart from lexer (((text))) stays as is -> doublecircle

    // Collect shape text (might be multiple tokens)
    let shapeText = '';
    const shapeEndType = this.getShapeEndType(actualShapeType);
    console.log(`UIO DEBUG: Looking for shape end type: ${shapeEndType}`);

    // Define all possible end tokens for each shape type
    const possibleEndTokens = this.getPossibleEndTokens(actualShapeType);

    // Special handling for rect shapes with borders
    if (actualShapeType === 'RectStart') {
      // Skip the first pipe (already processed during shape detection)
      if (i < tokens.length && tokens[i].type === 'PIPE') {
        i++; // Skip the first pipe
      }
      // Skip all tokens until we find the second pipe
      while (i < tokens.length && tokens[i].type !== 'PIPE') {
        i++; // Skip borders specification tokens
      }
      if (i < tokens.length && tokens[i].type === 'PIPE') {
        i++; // Skip the second pipe
      }
    }

    // Collect all tokens until we find any valid shape end delimiter
    while (i < tokens.length && !possibleEndTokens.includes(tokens[i].type)) {
      // For ellipse shapes, stop when we encounter the closing hyphen
      if (actualShapeType === 'EllipseStart' && tokens[i].type === 'Hyphen') {
        break; // This is the closing hyphen, don't include it in the text
      }

      // Check for HTML tag pattern: < + tag_name + >
      if (
        tokens[i].type === '⚠' &&
        tokens[i].value === '<' &&
        i + 2 < tokens.length &&
        !possibleEndTokens.includes(tokens[i + 1].type)
      ) {
        const tagNameToken = tokens[i + 1];
        const closeToken = tokens[i + 2];

        if (
          tagNameToken.type === 'NODE_STRING' &&
          (closeToken.type === 'TagEnd' || (closeToken.type === '⚠' && closeToken.value === '>'))
        ) {
          // Preserve original spacing before HTML tag
          if (shapeText && i > startIndex + 1) {
            const prevToken = tokens[i - 1];
            const currentToken = tokens[i];
            const gap = currentToken.from - prevToken.to;

            if (gap > 0) {
              // Preserve original spacing (gap represents number of spaces)
              shapeText += ' '.repeat(gap);
            } else if (
              this.shouldAddSpaceBetweenTokens(shapeText, `<${tagNameToken.value}>`, '⚠')
            ) {
              // Fall back to smart spacing if no gap
              shapeText += ' ';
            }
          }
          // Reconstruct as HTML tag without spaces: <tagname>
          shapeText += `<${tagNameToken.value}>`;
          i += 3; // Skip the <, tag name, and > tokens
          continue;
        }
      }

      // Preserve original spacing by checking token position gaps
      if (shapeText && i > startIndex + 1) {
        const prevToken = tokens[i - 1];
        const currentToken = tokens[i];
        const gap = currentToken.from - prevToken.to;

        if (gap > 0) {
          // Preserve original spacing (gap represents number of spaces)
          shapeText += ' '.repeat(gap);
        } else if (this.shouldAddSpaceBetweenTokens(shapeText, tokens[i].value, tokens[i].type)) {
          // Fall back to smart spacing if no gap
          shapeText += ' ';
        }
      }
      shapeText += tokens[i].value;
      i++;
    }

    // Special handling for ellipse end: need to skip the final hyphen
    if (
      actualShapeType === 'EllipseStart' && // Skip the final hyphen before the closing parenthesis
      i < tokens.length &&
      tokens[i].type === 'Hyphen'
    ) {
      i++;
    }

    // Capture the actual end token for shape mapping
    let actualEndToken = '';
    if (i < tokens.length) {
      actualEndToken = tokens[i].type;
    }

    // Skip the shape end delimiter
    if (i < tokens.length && tokens[i].type === shapeEndType) {
      i++;
    }

    // For circle (double parens), skip the second closing parenthesis
    if (actualShapeType === 'CircleStart' && i < tokens.length && tokens[i].type === 'ParenEnd') {
      i++;
    }

    // For hexagon (double braces), skip the second closing brace
    if (
      actualShapeType === 'HexagonStart' &&
      i < tokens.length &&
      tokens[i].type === 'DiamondEnd'
    ) {
      i++;
    }

    console.log(
      `UIO DEBUG: Parsed shaped node: ${nodeId} with text "${shapeText}" and shape ${actualShapeType}`
    );

    if (this.yy) {
      // Map shape type to node type using both start and end tokens
      const nodeType = this.mapShapeToNodeType(actualShapeType, actualEndToken);

      // Process the text to handle markdown
      const processedText = processNodeText(shapeText || nodeId);

      // Create the shaped node
      this.yy.addVertex(
        nodeId, // id
        { text: processedText.text, type: processedText.type }, // textObj - processed text with correct type
        mapShapeType(nodeType), // type - the shape type (mapped to valid FlowVertexTypeParam)
        [], // style
        [], // classes
        '', // dir
        {}, // props
        undefined // metadata
      );
    }

    return i;
  }

  /**
   * Get theRecord<string, string>ter type for a shape start type
   * @param shapeStartType - The shape start token type
   * @returns The corresponding end token type
   */
  private getShapeEndType(shapeStartType: string): string {
    const shapeMap: Record<string, string> = {
      SquareStart: 'SquareEnd', // [ -> ]
      RectStart: 'SquareEnd', // [| -> ] (rect with borders)
      OddStart: 'SquareEnd', // > -> ] (odd shape)
      ParenStart: 'ParenEnd', // ( -> )
      DiamondStart: 'DiamondEnd', // { -> }
      HexagonStart: 'DiamondEnd', // {{ -> } (we handle the second } separately)
      DoubleCircleStart: 'DoubleCircleEnd', // ((( -> ))) (lexer tokens)
      CircleStart: 'ParenEnd', // (( -> ) (we handle the second ) separately)
      EllipseStart: 'ParenEnd', // (- -> ) (we handle the - separately)
      SubroutineStart: 'SubroutineEnd', // [[ -> ]]
      CylinderStart: 'CylinderEnd', // [( -> )]
      StadiumStart: 'StadiumEnd', // ([ -> ])
      TrapStart: 'TrapEnd', // [/ -> /]
      InvTrapStart: 'InvTrapEnd', // [\ -> \]
    };
    return shapeMap[shapeStartType] || 'SquareEnd'; // Default fallback
  }

  private getPossibleEndTokens(shapeStartType: string): string[] {
    const possibleEnds: Record<string, string[]> = {
      SquareStart: ['SquareEnd'], // [ -> ]
      RectStart: ['SquareEnd'], // [| -> ]
      OddStart: ['SquareEnd'], // > -> ]
      ParenStart: ['ParenEnd'], // ( -> )
      DiamondStart: ['DiamondEnd'], // { -> }
      HexagonStart: ['DiamondEnd'], // {{ -> }
      DoubleCircleStart: ['DoubleCircleEnd'], // ((( -> )))
      CircleStart: ['ParenEnd'], // (( -> )
      EllipseStart: ['ParenEnd'], // (- -> )
      SubroutineStart: ['SubroutineEnd'], // [[ -> ]]
      CylinderStart: ['CylinderEnd'], // [( -> )]
      StadiumStart: ['StadiumEnd'], // ([ -> ])
      TrapStart: ['TrapEnd', 'InvTrapEnd'], // [/ -> /] or [/ -> \]
      InvTrapStart: ['InvTrapEnd', 'TrapEnd'], // [\ -> \] or [\ -> /]
    };
    return possibleEnds[shapeStartType] || ['SquareEnd']; // Default fallback
  }

  /**
   * Map Record<string, string>lowDB node type
   * @param shapeStartType - The shape start token type
   * @returns The corresponding FlowDB node type
   */
  private mapShapeToNodeType(shapeStartType: string, shapeEndType?: string): string | undefined {
    // Handle combinations of start and end tokens for complex shapes
    const combinationKey = `${shapeStartType}+${shapeEndType}`;

    // First check for specific start+end combinations
    const combinationMap: Record<string, string> = {
      'TrapStart+TrapEnd': 'lean_right', // [/text/] -> lean_right
      'TrapStart+InvTrapEnd': 'trapezoid', // [/text\] -> trapezoid
      'InvTrapStart+InvTrapEnd': 'lean_left', // [\text\] -> lean_left
      'InvTrapStart+TrapEnd': 'inv_trapezoid', // [\text/] -> inv_trapezoid
    };

    if (combinationMap[combinationKey]) {
      return combinationMap[combinationKey];
    }

    // Fallback to simple start token mapping
    const typeMap: Record<string, string> = {
      SquareStart: 'square', // [text] -> square
      RectStart: 'rect', // [|borders:lt|text] -> rect (parser detected)
      OddStart: 'odd', // >text] -> odd (parser detected)
      ParenStart: 'round', // (text) -> round
      DiamondStart: 'diamond', // {text} -> diamond
      HexagonStart: 'hexagon', // {{text}} -> hexagon (parser detected)
      DoubleCircleStart: 'doublecircle', // (((text))) -> doublecircle (lexer tokens)
      CircleStart: 'circle', // ((text)) -> circle (parser detected)
      EllipseStart: 'ellipse', // (-text-) -> ellipse
      SubroutineStart: 'subroutine', // [[text]] -> subroutine
      CylinderStart: 'cylinder', // [(text)] -> cylinder
      StadiumStart: 'stadium', // ([text]) -> stadium
      TrapStart: 'trapezoid', // [/text\] -> trapezoid (fallback)
      InvTrapStart: 'inv_trapezoid', // [\text/] -> inv_trapezoid (fallback)
      TagEnd: 'odd', // >text] -> odd (legacy fallback)
    };
    return typeMap[shapeStartType];
  }

  private shouldAddSpaceBetweenTokens(
    currentText: string,
    nextTokenValue: string,
    nextTokenType: string
  ): boolean {
    // PRIORITY 1: Check hyphen logic first (before other token type checks)
    const lastChar = currentText.charAt(currentText.length - 1);

    // Don't add space after hyphen if next token starts with a letter/number
    if (lastChar === '-' && nextTokenValue.length > 0) {
      const firstChar = nextTokenValue.charAt(0);
      if (/[\dA-Za-zÄÅÖäåö]/.test(firstChar)) {
        return false;
      }
    }

    // PRIORITY 2: Special handling for ⚠ tokens - check their content
    if (nextTokenType === '⚠') {
      // Don't add space before punctuation sequences that should be concatenated
      const noConcatChars = ',.?!+*'; // Basic punctuation that should be concatenated
      if (nextTokenValue.length > 0 && noConcatChars.includes(nextTokenValue.charAt(0))) {
        return false;
      }

      // Special case for colon-backslash combinations (file paths like c:\windows)
      if (nextTokenValue === ':\\') {
        return false;
      }

      // Add space for other ⚠ tokens (like /, \, `, etc.)
      return true;
    }

    // Don't add space before specific tokens that should be concatenated
    const noSpaceTokens = ['PIPE'];
    if (noSpaceTokens.includes(nextTokenType)) {
      return false;
    }

    // Special handling for Hyphen tokens - don't add space in compound words
    if (nextTokenType === 'Hyphen') {
      // Don't add space before hyphen if current text ends with a letter/number
      const lastChar = currentText.charAt(currentText.length - 1);
      if (/[\dA-Za-zÄÅÖäåö]/.test(lastChar)) {
        return false;
      }
    }

    // Don't add space after specific punctuation characters that should be concatenated
    const noSpaceAfterChars = ',.?!+*'; // Basic punctuation that should be concatenated
    if (noSpaceAfterChars.includes(lastChar)) {
      return false;
    }

    // Special case: don't add space after backslash if it's part of a colon-backslash sequence (c:\windows)
    if (
      lastChar === '\\' &&
      currentText.length >= 2 &&
      currentText.charAt(currentText.length - 2) === ':'
    ) {
      return false;
    }

    // Don't add space before specific punctuation characters that should be concatenated
    const firstChar = nextTokenValue.charAt(0);
    const noSpaceBeforeChars = ',.?!+*'; // Only chars that should be concatenated
    if (noSpaceBeforeChars.includes(firstChar)) {
      return false;
    }

    // Add space for normal word separation
    return true;
  }

  /**
   * Parse an edge statement with ID (A e1@--> B)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseEdgeWithIdStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    console.log(`UIO DEBUG: parseEdgeWithIdStatement called at index ${startIndex}`);
    let i = startIndex;

    // Get source node
    const sourceId = tokens[i].value;
    console.log(`UIO DEBUG: parseEdgeWithIdStatement: sourceId = ${sourceId}`);
    i++; // Skip source node

    // Get edge ID
    const edgeId = tokens[i].value;
    console.log(`UIO DEBUG: parseEdgeWithIdStatement: edgeId = ${edgeId}`);
    i++; // Skip edge ID

    // Skip '@' symbol
    console.log(`UIO DEBUG: parseEdgeWithIdStatement: skipping @ symbol`);
    i++; // Skip '@'

    // Parse the arrow and target - use existing parseComplexArrowPattern
    console.log(
      `UIO DEBUG: parseEdgeWithIdStatement: parsing arrow from position ${i}, tokens: ${tokens
        .slice(i, i + 3)
        .map((t) => `${t.type}:${t.value}`)
        .join(', ')}`
    );
    const arrowResult = this.parseComplexArrowPattern(tokens, i);
    console.log(
      `UIO DEBUG: parseEdgeWithIdStatement: arrowResult = ${arrowResult ? JSON.stringify(arrowResult) : 'null'}`
    );
    if (!arrowResult) {
      console.log(`UIO DEBUG: parseEdgeWithIdStatement: no arrow result, skipping`);
      return i + 1;
    }

    const { targetId, text, type, stroke, length, nextIndex } = arrowResult;
    i = nextIndex;

    console.log(`UIO DEBUG: Creating edge with ID: ${sourceId} --[${edgeId}]--> ${targetId}`);
    log.debug(`UIO Creating edge with ID: ${sourceId} --[${edgeId}]--> ${targetId}`);

    if (this.yy) {
      // Create source vertex
      this.yy.addVertex(
        sourceId,
        { text: sourceId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );

      // Check if target node is followed by a shape delimiter
      // If so, don't create it here - let the main parser handle it as a shaped node
      const isTargetShaped = i < tokens.length && this.isShapeStart(tokens[i].type);
      console.log(
        `UIO DEBUG: parseEdgeWithIdStatement: targetId=${targetId}, nextToken=${tokens[i]?.type}:${tokens[i]?.value}, isTargetShaped=${isTargetShaped}`
      );

      if (!isTargetShaped) {
        // Create simple target vertex only if it's not going to be a shaped node
        this.yy.addVertex(
          targetId,
          { text: targetId, type: 'text' },
          undefined,
          [],
          [],
          '',
          {},
          undefined
        );
      }

      // Process edge text for markdown
      const processedEdgeText = processNodeText(text);

      // Create edge with ID using correct signature
      this.yy.addSingleLink(
        sourceId,
        targetId,
        {
          text: { text: processedEdgeText.text, type: processedEdgeText.type },
          type: type,
          stroke: stroke,
          length: length,
        },
        edgeId
      );
    }

    return i;
  }

  /**
   * Parse an edge with ID and double-ended arrow (A e1@x-- text --x B)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseEdgeWithIdDoubleArrowStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Get source node
    const sourceId = tokens[i].value;
    i++; // Skip source

    // Get edge ID
    const edgeId = tokens[i].value;
    i++; // Skip edge ID

    // Skip '@' symbol
    i++; // Skip '@'

    // Get arrow head (x, o)
    const arrowHead = tokens[i].value;
    i++; // Skip arrow head

    // Get first arrow part (--, ==, etc.)
    const firstArrow = tokens[i].value;
    i++; // Skip first arrow

    // Get text
    const text = tokens[i].value;
    i++; // Skip text

    // Get second arrow part (--x, ==o, etc.)
    const secondArrow = tokens[i].value;
    i++; // Skip second arrow

    // Get target node
    const targetId = tokens[i].value;
    i++; // Skip target

    // Construct the full arrow pattern
    const fullArrow = arrowHead + firstArrow + text + secondArrow;

    // Determine arrow properties
    const type = this.getArrowType(fullArrow);
    const stroke = this.getArrowStroke(fullArrow);
    const length = this.getArrowLength(fullArrow);

    log.debug(`UIO Creating double-ended edge with ID: ${sourceId} --[${edgeId}]--> ${targetId}`);

    if (this.yy) {
      // Add vertices
      this.yy.addVertex(
        sourceId,
        { text: sourceId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );
      this.yy.addVertex(
        targetId,
        { text: targetId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );

      // Process edge text for markdown
      const processedEdgeText = processNodeText(text);

      // Add edge with ID
      this.yy.addSingleLink(
        sourceId,
        targetId,
        {
          text: { text: processedEdgeText.text, type: processedEdgeText.type },
          type: type,
          stroke: stroke,
          length: length,
        },
        edgeId
      );
    }

    return i;
  }

  /**
   * Parse an edge with ID and dotted double-ended arrow (A e1@x-. text .-x B)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseEdgeWithIdDottedDoubleArrowStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Get source node
    const sourceId = tokens[i].value;
    i++; // Skip source

    // Get edge ID
    const edgeId = tokens[i].value;
    i++; // Skip edge ID

    // Skip '@' symbol
    i++; // Skip '@'

    // Get arrow head (x, o)
    const arrowHead = tokens[i].value;
    i++; // Skip arrow head

    // Get first arrow part (-., ==, etc.)
    const firstArrow = tokens[i].value;
    i++; // Skip first arrow

    // Get text
    const text = tokens[i].value;
    i++; // Skip text

    // Get dot (.)
    const dot = tokens[i].value;
    i++; // Skip dot

    // Get dash (-)
    const dash = tokens[i].value;
    i++; // Skip dash

    // Get second arrow head (x, o)
    const secondArrowHead = tokens[i].value;
    i++; // Skip second arrow head

    // Get target node
    const targetId = tokens[i].value;
    i++; // Skip target

    // Construct the full arrow pattern
    const fullArrow = arrowHead + firstArrow + text + dot + dash + secondArrowHead;

    // Determine arrow properties
    const type = this.getArrowType(fullArrow);
    const stroke = this.getArrowStroke(fullArrow);
    const length = this.getArrowLength(fullArrow);

    log.debug(
      `UIO Creating dotted double-ended edge with ID: ${sourceId} --[${edgeId}]--> ${targetId}`
    );

    if (this.yy) {
      // Add vertices
      this.yy.addVertex(
        sourceId,
        { text: sourceId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );
      this.yy.addVertex(
        targetId,
        { text: targetId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );

      // Process edge text for markdown
      const processedEdgeText = processNodeText(text);

      // Add edge with ID
      this.yy.addSingleLink(
        sourceId,
        targetId,
        {
          text: { text: processedEdgeText.text, type: processedEdgeText.type },
          type: type,
          stroke: stroke,
          length: length,
        },
        edgeId
      );
    }

    return i;
  }

  /**
   * Parse a double-ended arrow statement (A x-- text --x B)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseDoubleEndedArrowStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Get source node
    const sourceId = tokens[i].value;
    i++; // Skip source

    // Get arrow head (x, o)
    const arrowHead = tokens[i].value;
    i++; // Skip arrow head

    // Get first arrow part (--, ==, etc.)
    const firstArrow = tokens[i].value;
    i++; // Skip first arrow

    // Get text
    const text = tokens[i].value;
    i++; // Skip text

    // Get second arrow part (--x, ==o, etc.)
    const secondArrow = tokens[i].value;
    i++; // Skip second arrow

    // Get target node
    const targetId = tokens[i].value;
    i++; // Skip target

    // Construct the full arrow pattern
    const fullArrow = arrowHead + firstArrow + text + secondArrow;

    // Determine arrow properties
    const type = this.getArrowType(fullArrow);
    const stroke = this.getArrowStroke(fullArrow);
    const length = this.getArrowLength(fullArrow);

    if (this.yy) {
      // Add vertices
      this.yy.addVertex(
        sourceId,
        { text: sourceId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );
      this.yy.addVertex(
        targetId,
        { text: targetId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );

      // Process edge text for markdown
      const processedEdgeText = processNodeText(text);

      // Add edge
      this.yy.addSingleLink(sourceId, targetId, {
        text: { text: processedEdgeText.text, type: processedEdgeText.type },
        type: type,
        stroke: stroke,
        length: length,
      });
    }

    log.debug(`UIO Added double-ended arrow edge: ${sourceId} ${fullArrow} ${targetId}`);

    return i;
  }

  /**
   * Parse a dotted double-ended arrow statement (A x-. text .-x B)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseDottedDoubleEndedArrowStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Get source node
    const sourceId = tokens[i].value;
    i++; // Skip source

    // Get arrow head (x, o)
    const arrowHead = tokens[i].value;
    i++; // Skip arrow head

    // Get first arrow part (-., ==, etc.)
    const firstArrow = tokens[i].value;
    i++; // Skip first arrow

    // Get text
    const text = tokens[i].value;
    i++; // Skip text

    // Get dot (.)
    const dot = tokens[i].value;
    i++; // Skip dot

    // Get dash (-)
    const dash = tokens[i].value;
    i++; // Skip dash

    // Get second arrow head (x, o)
    const secondArrowHead = tokens[i].value;
    i++; // Skip second arrow head

    // Get target node
    const targetId = tokens[i].value;
    i++; // Skip target

    // Construct the full arrow pattern
    const fullArrow = arrowHead + firstArrow + text + dot + dash + secondArrowHead;

    // Determine arrow properties
    const type = this.getArrowType(fullArrow);
    const stroke = this.getArrowStroke(fullArrow);
    const length = this.getArrowLength(fullArrow);

    log.debug(`UIO Creating dotted double-ended edge: ${sourceId} --> ${targetId}`);

    if (this.yy) {
      // Add vertices
      this.yy.addVertex(
        sourceId,
        { text: sourceId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );
      this.yy.addVertex(
        targetId,
        { text: targetId, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );

      // Process edge text for markdown
      const processedEdgeText = processNodeText(text);

      // Add edge
      this.yy.addSingleLink(sourceId, targetId, {
        text: { text: processedEdgeText.text, type: processedEdgeText.type },
        type: type,
        stroke: stroke,
        length: length,
      });
    }

    return i;
  }

  /**
   * Parse an edge statement (A --> B, A<-- text -->B, etc.)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseEdgeStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Parse source node (could be simple A or shaped A(text))
    const sourceToken = tokens[i];
    if (sourceToken.type !== 'Identifier' && sourceToken.type !== 'NODE_STRING') {
      return i + 1; // Skip if not identifier or node string
    }
    const sourceId = sourceToken.value;
    i++;

    // Check if this is a shaped source node (A[text], A(text), etc.)
    if (i < tokens.length && this.isShapeStart(tokens[i].type)) {
      console.log(`UIO DEBUG: parseEdgeStatement: parsing shaped source node ${sourceId}`);
      // Parse the shaped node, but start from the node ID token
      i = this.parseShapedNode(tokens, startIndex);
    } else {
      // Create simple source node
      if (this.yy) {
        this.yy.addVertex(
          sourceId,
          { text: sourceId, type: 'text' },
          undefined, // type
          [], // style
          [], // classes
          '', // dir
          {}, // props
          undefined // metadata
        );
      }
    }

    // Look for edge pattern - could be simple (A --> B) or complex (A<-- text -->B)
    console.log(
      `UIO DEBUG: parseEdgeStatement calling parseEdgePattern at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
    );
    const edgeInfo = this.parseEdgePattern(tokens, i);
    if (!edgeInfo) {
      console.log(`UIO DEBUG: parseEdgePattern returned null`);
      return i + 1; // Skip if no valid edge pattern found
    }

    i = edgeInfo.nextIndex;

    console.log(
      `UIO DEBUG: Creating edge: ${sourceId} ${edgeInfo.arrow} ${edgeInfo.targetId} (text: "${edgeInfo.text}", type: ${edgeInfo.type}, stroke: ${edgeInfo.stroke})`
    );

    if (this.yy) {
      // Check if target node is followed by a shape delimiter
      // If so, don't create it here - let the main parser handle it as a shaped node
      const isTargetShaped = i < tokens.length && this.isShapeStart(tokens[i].type);
      console.log(
        `UIO DEBUG: parseEdgeStatement: targetId=${edgeInfo.targetId}, nextToken=${tokens[i]?.type}:${tokens[i]?.value}, isTargetShaped=${isTargetShaped}`
      );

      if (!isTargetShaped) {
        // Create target node if it doesn't exist or hasn't been properly configured
        // Check if vertex already exists and has custom text/type (indicating it was parsed as a shaped vertex)
        const existingVertices = this.yy.getVertices();
        const existingVertex = existingVertices.get(edgeInfo.targetId);
        const hasCustomProperties =
          existingVertex &&
          (existingVertex.text !== edgeInfo.targetId || existingVertex.type !== undefined);

        if (!hasCustomProperties) {
          this.yy.addVertex(
            edgeInfo.targetId,
            { text: edgeInfo.targetId, type: 'text' },
            undefined, // type
            [], // style
            [], // classes
            '', // dir
            {}, // props
            undefined // metadata
          );
        }
      } else {
        // Target is shaped - track it for orphaned shape processing
        this.lastReferencedNodeId = edgeInfo.targetId;
        console.log(
          `UIO DEBUG: Tracking lastReferencedNodeId = ${this.lastReferencedNodeId} for orphaned shape processing`
        );
      }

      // Process edge text for markdown
      const processedEdgeText = processNodeText(edgeInfo.text);

      // Create the edge with proper properties using addSingleLink
      this.yy.addSingleLink(sourceId, edgeInfo.targetId, {
        text: { text: processedEdgeText.text, type: processedEdgeText.type },
        type: edgeInfo.type,
        stroke: edgeInfo.stroke,
        length: edgeInfo.length,
      });
    }

    return i;
  }

  /**
   * Parse edge pattern and extract arrow info
   * @param tokens - Array of tokens
   * @param startIndex - Starting index (after source node)
   * @returns Edge information or null if no valid pattern
   */
  private parseEdgePattern(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): {
    arrow: string;
    targetId: string;
    text: string;
    type: string;
    stroke: string;
    length: number;
    nextIndex: number;
  } | null {
    let i = startIndex;
    console.log(
      `UIO DEBUG: parseEdgePattern called at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
    );

    // Look for arrow token (Arrow or LINK)
    if (i >= tokens.length || (tokens[i].type !== 'Arrow' && tokens[i].type !== 'LINK')) {
      console.log(`UIO DEBUG: parseEdgePattern: No arrow/link token found at index ${i}`);
      return null;
    }

    const firstArrow = tokens[i].value;
    i++;

    // Check if this is a simple arrow (A --> B) or complex (A<-- text -->B)
    console.log(
      `UIO DEBUG: parseEdgePattern: firstArrow="${firstArrow}", isCompleteArrow=${this.isCompleteArrow(firstArrow)}`
    );
    if (this.isCompleteArrow(firstArrow)) {
      // Check for pipe-delimited text pattern: A---|text|B
      console.log(
        `UIO DEBUG: parseEdgePattern: Checking for pipe at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
      );
      if (i < tokens.length && tokens[i].type === 'PIPE') {
        console.log(`UIO DEBUG: parseEdgePattern: Found pipe, calling parsePipeDelimitedText`);
        return this.parsePipeDelimitedText(tokens, startIndex, firstArrow);
      }

      // Simple arrow pattern: A --> B (but B might be a shaped vertex like B(text))
      if (
        i >= tokens.length ||
        (tokens[i].type !== 'Identifier' &&
          tokens[i].type !== 'NODE_STRING' &&
          tokens[i].type !== 'DIR')
      ) {
        return null;
      }

      let targetId = tokens[i].value;
      i++;

      // Handle compound node IDs: if current token is DIR and next is NODE_STRING, combine them
      if (tokens[i - 1].type === 'DIR' && i < tokens.length && tokens[i].type === 'NODE_STRING') {
        targetId += tokens[i].value; // Combine DIR + NODE_STRING (e.g., 'v' + 'a' = 'va')
        i++;
      }

      // Handle compound node IDs with hyphen: NODE_STRING + Hyphen (e.g., 'odd' + '-' = 'odd-')
      if (i < tokens.length && tokens[i].type === 'Hyphen') {
        targetId += tokens[i].value; // Combine NODE_STRING + Hyphen (e.g., 'odd' + '-' = 'odd-')
        i++;
      }

      // Check if the target is a shaped vertex (e.g., B(text), B[text], etc.)
      if (i < tokens.length && this.isShapeStart(tokens[i].type)) {
        // For compound node IDs (DIR + NODE_STRING), we need to handle this specially
        // Check if we combined tokens earlier (targetId contains both DIR and NODE_STRING values)
        const isCompoundId = targetId.length > 1 && tokens[i - 1].value !== targetId;

        if (isCompoundId) {
          // We have a compound ID like 'va' from 'v' + 'a'
          // We need to create a temporary token structure for parseShapedNode
          const originalToken = tokens[i - 1]; // The NODE_STRING token
          tokens[i - 1] = { ...originalToken, value: targetId }; // Replace with combined 'va'

          const shapeResult = this.parseShapedNode(tokens, i - 1); // Start from the combined ID token
          if (shapeResult !== null) {
            i = shapeResult; // Update index to after the shaped vertex
          }

          // Restore the original token
          tokens[i - 1] = originalToken;
        } else {
          // Regular shaped vertex parsing
          const shapeResult = this.parseShapedNode(tokens, i - 1); // Start from the target ID token
          if (shapeResult !== null) {
            i = shapeResult; // Update index to after the shaped vertex
          }
        }
      }

      return {
        arrow: firstArrow,
        targetId,
        text: '',
        type: this.getArrowType(firstArrow),
        stroke: this.getArrowStroke(firstArrow),
        length: this.getArrowLength(firstArrow),
        nextIndex: i,
      };
    } else {
      // Complex arrow pattern: A<-- text -->B
      return this.parseComplexArrowPattern(tokens, startIndex);
    }
  }

  /**
   * Check if arrow is complete (not part of a complex pattern)
   */
  private isCompleteArrow(arrow: string): boolean {
    // Check if arrow ends with a valid arrow head or is a complete pattern
    const arrowHeads = ['>', 'x', 'o'];
    const lastChar = arrow.charAt(arrow.length - 1);

    // If it ends with an arrow head, it's complete
    if (arrowHeads.includes(lastChar)) {
      return true;
    }

    // Check for open-ended arrows (no arrow head)
    // Match patterns like ---, ----, ===, ====, -.-., -.-.-, etc.
    const openArrowPatterns = [
      /^-{3,}$/, // Three or more dashes: ---, ----, -----, etc.
      /^={3,}$/, // Three or more equals: ===, ====, =====, etc.
      /^-?\.+-?$/, // Dotted patterns: -.-., -..-., -...-., etc. (matches JISON: \-?\.+\-)
    ];

    if (openArrowPatterns.some((pattern) => pattern.test(arrow))) {
      return true;
    }

    // Check for double-ended arrows
    if (arrow.includes('<') && arrow.includes('>')) {
      return true;
    }

    return false;
  }

  /**
   * Get arrow type from arrow string
   */
  private getArrowType(arrow: string): string {
    // Check for double-ended arrows (bidirectional)
    // Pattern: starts and ends with same arrow head type
    const startsWithArrowHead = /^[<ox]/.exec(arrow);
    const endsWithArrowHead = /[>ox]$/.exec(arrow);

    if (startsWithArrowHead && endsWithArrowHead) {
      const startChar = startsWithArrowHead[0];
      const endChar = endsWithArrowHead[0];

      // Convert < to > for comparison
      const normalizedStart = startChar === '<' ? '>' : startChar;
      const normalizedEnd = endChar;

      if (normalizedStart === normalizedEnd) {
        // Double-ended arrows with same head type
        if (normalizedEnd === 'x') {
          return 'double_arrow_cross';
        } else if (normalizedEnd === 'o') {
          return 'double_arrow_circle';
        } else {
          return 'double_arrow_point';
        }
      }
    }

    // Traditional double-ended arrows with < and >
    if (arrow.includes('<') && arrow.includes('>')) {
      if (arrow.includes('x')) {
        return 'double_arrow_cross';
      } else if (arrow.includes('o')) {
        return 'double_arrow_circle';
      } else {
        return 'double_arrow_point';
      }
    }

    // Single-ended arrows
    if (arrow.endsWith('x')) {
      return 'arrow_cross';
    } else if (arrow.endsWith('o')) {
      return 'arrow_circle';
    } else if (arrow.endsWith('>')) {
      return 'arrow_point';
    } else {
      // Open-ended arrows (no arrowhead)
      return 'arrow_open';
    }
  }

  /**
   * Get arrow stroke from arrow string
   */
  private getArrowStroke(arrow: string): string {
    if (arrow.includes('=')) {
      return 'thick';
    } else if (arrow.includes('.')) {
      return 'dotted';
    }
    return 'normal';
  }

  /**
   * Get arrow length from arrow string
   */
  private getArrowLength(arrow: string): number {
    // For simple arrows like ---, ===, count extra connectors
    if (!arrow.includes('.')) {
      // Check if this is a single-ended or double-ended arrow
      const hasLeftArrow = /^[<ox]/.test(arrow);
      const hasRightArrow = /[>ox]$/.test(arrow);
      const isDoubleEnded = hasLeftArrow && hasRightArrow;

      // Remove arrow heads and count the remaining connector characters
      let connector = arrow;

      // Remove left arrow heads
      connector = connector.replace(/^[<ox]/, '');

      // Remove right arrow heads
      connector = connector.replace(/[>ox]$/, '');

      // Count the connector characters (-, =)
      const matches = connector.match(/[=-]/g);
      const totalConnectors = matches ? matches.length : 0;

      // Determine subtraction based on arrow type:
      // - Double-ended arrows (e.g., <--->) → subtract 2 (one for each arrow head)
      // - Single-ended arrows (e.g., --->) → subtract 1 (for the single arrow head)
      // - Open-ended arrows (e.g., ---) → subtract 2 (base minimum like original JISON)
      let subtraction: number;
      if (isDoubleEnded) {
        subtraction = 2; // Double-ended: both arrow heads
      } else if (hasLeftArrow || hasRightArrow) {
        subtraction = 1; // Single-ended: one arrow head
      } else {
        subtraction = 2; // Open-ended: use original JISON logic (subtract 2)
      }

      return Math.max(1, totalConnectors - subtraction);
    }

    // For dotted arrows, the length is determined by the number of dots
    // Pattern: -.-  = length 1, -..- = length 2, -...- = length 3, etc.
    // Extract the dot sequence and count the dots
    const dotMatches = arrow.match(/\.+/g);
    if (dotMatches && dotMatches.length > 0) {
      // Count total dots in the first (and usually only) dot group
      const totalDots = dotMatches[0].length;
      return totalDots;
    }

    return 1;
  }

  /**
   * Parse pipe-delimited text pattern (A---|text|B)
   */
  private parsePipeDelimitedText(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number,
    arrow: string
  ): {
    arrow: string;
    targetId: string;
    text: string;
    type: string;
    stroke: string;
    length: number;
    nextIndex: number;
  } | null {
    console.log(`UIO DEBUG: parsePipeDelimitedText called with arrow: ${arrow}`);
    let i = startIndex + 1; // Skip the arrow token

    // Expect first pipe
    if (i >= tokens.length || tokens[i].type !== 'PIPE') {
      console.log(`UIO DEBUG: parsePipeDelimitedText: Expected first pipe, got ${tokens[i]?.type}`);
      return null;
    }
    i++; // Skip first pipe

    // Collect text tokens until we find the closing pipe using smart spacing
    let text = '';
    while (i < tokens.length && tokens[i].type !== 'PIPE') {
      // Smart space handling: only add space if needed
      if (text && this.shouldAddSpaceBetweenTokens(text, tokens[i].value, tokens[i].type)) {
        text += ' ';
      }
      text += tokens[i].value;
      i++;
    }

    // Expect closing pipe
    if (i >= tokens.length || tokens[i].type !== 'PIPE') {
      return null;
    }
    i++; // Skip closing pipe

    // Expect target identifier
    if (
      i >= tokens.length ||
      (tokens[i].type !== 'Identifier' && tokens[i].type !== 'NODE_STRING')
    ) {
      return null;
    }

    const targetId = tokens[i].value;
    i++;

    console.log(
      `UIO DEBUG: parsePipeDelimitedText: Successfully parsed - arrow: ${arrow}, text: "${text}", target: ${targetId}`
    );

    return {
      arrow,
      targetId,
      text,
      type: this.getArrowType(arrow),
      stroke: this.getArrowStroke(arrow),
      length: this.getArrowLength(arrow),
      nextIndex: i,
    };
  }

  /**
   * Check if a LINK token is a continuation of an arrow pattern
   */
  private isArrowContinuation(linkValue: string): boolean {
    // Arrow continuation patterns: -->, ==>, -.->, etc.
    // But NOT standalone == which should be treated as text
    const arrowContinuationPatterns = [
      /^-+>$/, // -->, --->, etc.
      /^=+>$/, // ==>, ===>, etc.
      /^-\.+-?$/, // -.--, -.-, etc.
      /^\.+-?$/, // .-, .--, etc.
      /^<-+$/, // <--, <---, etc.
      /^<=+$/, // <==, <===, etc.
      /^[ox]-+$/, // o--, x--, etc.
      /^-+[ox]$/, // --o, --x, etc.
    ];

    return arrowContinuationPatterns.some((pattern) => pattern.test(linkValue));
  }

  /**
   * Parse complex arrow pattern (A<-- text -->B)
   */
  private parseComplexArrowPattern(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): {
    arrow: string;
    targetId: string;
    text: string;
    type: string;
    stroke: string;
    length: number;
    nextIndex: number;
  } | null {
    console.log(`UIO DEBUG: parseComplexArrowPattern called at index ${startIndex}`);
    let i = startIndex;

    // Collect all tokens until we find the target identifier
    const arrowParts: string[] = [];
    let text = '';
    let targetId = '';
    let foundText = false;

    while (i < tokens.length) {
      const token = tokens[i];
      console.log(
        `UIO DEBUG: parseComplexArrowPattern: processing token ${i}: ${token.type}:${token.value}`
      );

      if (token.type === 'Arrow' || token.type === 'LINK') {
        console.log(`UIO DEBUG: parseComplexArrowPattern: found Arrow/LINK token: ${token.value}`);

        // If we already have text, check if this LINK token should be treated as text or arrow part
        if (foundText && !this.isArrowContinuation(token.value)) {
          // This LINK token is part of the text, not the arrow
          console.log(`UIO DEBUG: parseComplexArrowPattern: treating LINK as text: ${token.value}`);
          text += ' ' + token.value;
        } else {
          // This is part of the arrow pattern
          arrowParts.push(token.value);
        }
      } else if (token.type === 'Hyphen') {
        // Part of a split arrow pattern like '-..-> split into '-..' + '-' + '>'
        arrowParts.push(token.value);
      } else if (token.type === 'TagEnd' && token.value === '>') {
        // Arrow head that got split off
        arrowParts.push(token.value);
      } else if (token.type === 'TagStart' && token.value === '<') {
        // Left arrow head that got split off
        arrowParts.push(token.value);
      } else if (token.type === '⚠' && token.value === '.') {
        // Dot that got split off from dotted arrows
        arrowParts.push(token.value);
      } else if (token.type === 'STR') {
        // Handle quoted strings for edge text
        console.log(`UIO DEBUG: parseComplexArrowPattern: found STR token: ${token.value}`);
        // Remove quotes from the string value
        const cleanText = token.value.replace(/^"(.*)"$/, '$1');
        if (!foundText) {
          console.log(
            `UIO DEBUG: parseComplexArrowPattern: setting text = ${cleanText} (from STR)`
          );
          text = cleanText;
          foundText = true;
        }
      } else if (
        token.type === 'Identifier' ||
        token.type === 'NODE_STRING' ||
        token.type === '⚠' ||
        token.type === 'DIR' ||
        token.type === 'GRAPH'
      ) {
        // This could be text or the target node
        // For single-ended arrows like A e1@----x B, B should be the target directly
        // For double-ended arrows like A x-- text --x B, text is in the middle

        // Check if this is a single-ended arrow (arrow parts contain only one complete arrow)
        const fullArrow = arrowParts.join('');

        // Look ahead to see if there's another Arrow token (indicating double-ended arrow)
        let hasSecondArrow = false;
        for (let j = i + 1; j < tokens.length && j < i + 3; j++) {
          if (tokens[j].type === 'Arrow') {
            hasSecondArrow = true;
            break;
          }
          if (tokens[j].type === 'Semi') {
            break; // End of statement
          }
        }

        const isSingleEndedArrow =
          arrowParts.length === 1 &&
          !hasSecondArrow && // Not part of a double-ended arrow pattern
          (/^-+[>ox]$/.exec(fullArrow) || // Normal arrows: -->, --x, --o
            /^[<ox]-+$/.exec(fullArrow) || // Reverse arrows: <--, x--, o--
            /^-\.+-[>ox]$/.exec(fullArrow) || // Dotted arrows: -..->, -..-x, -..-o
            /^[<ox]-\.+-$/.exec(fullArrow) || // Reverse dotted: <-..--, x-..--, o--.--
            /^=+[>ox]$/.exec(fullArrow) || // Thick arrows: ==>, ==x, ==o
            /^[<ox]=+$/.exec(fullArrow));

        if (isSingleEndedArrow) {
          // For single-ended arrows, this identifier is the target
          console.log(
            `UIO DEBUG: parseComplexArrowPattern: setting targetId = ${token.value} (single-ended arrow)`
          );
          targetId = token.value;
          i++;
          break;
        } else if (arrowParts.length > 0 && !foundText) {
          // This is text in the middle of a double-ended arrow
          console.log(
            `UIO DEBUG: parseComplexArrowPattern: setting text = ${token.value} (double-ended arrow)`
          );
          text = token.value;
          foundText = true;
        } else if (foundText && arrowParts.length === 1) {
          // We already have text and only one arrow part, continue collecting text tokens
          console.log(`UIO DEBUG: parseComplexArrowPattern: appending to text: ${token.value}`);
          text += ' ' + token.value;
        } else if (foundText && arrowParts.length > 1) {
          // We have text and multiple arrow parts, this should be the target
          console.log(
            `UIO DEBUG: parseComplexArrowPattern: setting targetId = ${token.value} (double-ended arrow with text)`
          );
          targetId = token.value;
          i++;
          break;
        } else {
          // No arrow parts yet, this might be the start of a pattern
          // But be conservative - don't assume single chars are arrow parts
          console.log(`UIO DEBUG: parseComplexArrowPattern: no arrow parts yet, breaking`);
          break;
        }
      } else {
        // Unknown token, might be end of pattern or semicolon
        if (token.type === 'Semi') {
          break;
        }
        // For other tokens, try to continue
      }
      i++;
    }

    if (!targetId || arrowParts.length === 0) {
      return null;
    }

    // Reconstruct the full arrow pattern (no spaces between parts)
    const fullArrow = arrowParts.join('');

    // For double-ended arrows, calculate length based on the longer side
    let length: number;
    if (arrowParts.length > 1) {
      // Double-ended arrow - use the longer side for length calculation
      const lengths = arrowParts.map((part) => this.getArrowLength(part));
      length = Math.max(...lengths);
    } else {
      // Single-ended arrow - use normal calculation
      length = this.getArrowLength(fullArrow);
    }

    return {
      arrow: fullArrow,
      targetId,
      text,
      type: this.getArrowType(fullArrow),
      stroke: this.getArrowStroke(fullArrow),
      length,
      nextIndex: i,
    };
  }

  /**
   * Parse a subgraph statement (subgraph A ... end)
   * Following JISON approach: collect all nodes mentioned within subgraph scope
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseSubgraphStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    console.log(
      `UIO DEBUG: parseSubgraphStatement called at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
    );
    log.debug(
      `UIO parseSubgraphStatement called at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
    );

    // Skip 'subgraph' keyword
    i++;

    // Get subgraph ID (can be NODE_STRING or STR)
    if (i >= tokens.length || (tokens[i].type !== 'NODE_STRING' && tokens[i].type !== 'STR')) {
      console.log(
        `UIO DEBUG: parseSubgraphStatement: No valid subgraph ID found at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
      );
      return i;
    }

    let subgraphId = tokens[i].value;
    let subgraphLabelType: 'text' | 'markdown' | 'string' = 'text';

    // Process subgraph ID based on token type
    if (tokens[i].type === 'STR') {
      // For subgraph titles, JISON always uses type: 'text' regardless of quotes/backticks
      // But we still need to process the text content (remove quotes and backticks)
      const processed = processNodeText(subgraphId);
      subgraphId = processed.text;

      // Special case: if the processed text contains markdown (backticks were present),
      // then it should be type: 'markdown', otherwise always 'text' for subgraph titles
      if (processed.type === 'markdown') {
        subgraphLabelType = 'markdown';
      } else {
        subgraphLabelType = 'text'; // Always 'text' for quoted strings without backticks
      }
    }

    i++;

    console.log(`UIO DEBUG: parseSubgraphStatement: Parsing subgraph: ${subgraphId}`);
    log.debug(`UIO Parsing subgraph: ${subgraphId}`);

    // Collect all nodes and directions mentioned within this subgraph
    const subgraphDocument: any[] = [];
    const mentionedNodes = new Set<string>();

    while (i < tokens.length && tokens[i].type !== 'END') {
      const token = tokens[i];
      console.log(
        `UIO DEBUG: parseSubgraphStatement: Processing token ${i} inside subgraph: ${token.type}:${token.value}`
      );

      switch (token.type) {
        case 'NODE_STRING': {
          // Check if this is a direction statement
          const lookahead = this.lookAhead(tokens, i, 2);
          if (
            lookahead.length >= 2 &&
            lookahead[0].value === 'direction' &&
            lookahead[1].type === 'DIR'
          ) {
            // This is a direction statement - add to document like JISON
            const directionValue = lookahead[1].value;
            subgraphDocument.push({ stmt: 'dir', value: directionValue });
            i += 2; // Skip 'direction' and direction value
            log.debug(`UIO Subgraph ${subgraphId} direction: ${directionValue}`);
          } else {
            // Parse statement and collect all nodes mentioned
            // But be careful not to consume tokens beyond the END token
            const nodesBefore = this.yy ? new Set(this.yy.getVertices().keys()) : new Set();

            // Find the next END token to limit parsing scope
            let endTokenIndex = -1;
            for (let j = i; j < tokens.length; j++) {
              if (tokens[j].type === 'END') {
                endTokenIndex = j;
                break;
              }
            }

            // Create a limited token array that stops before the END token
            const limitedTokens = endTokenIndex >= 0 ? tokens.slice(0, endTokenIndex) : tokens;

            // Temporarily replace the tokens array to limit parseStatement scope
            const newIndex = this.parseStatement(limitedTokens, i);

            // If parseStatement would have gone beyond the END token, stop at the END token
            if (endTokenIndex >= 0 && newIndex >= endTokenIndex) {
              i = endTokenIndex;
            } else {
              i = newIndex;
            }

            const nodesAfter = this.yy ? new Set(this.yy.getVertices().keys()) : new Set();

            // Track all nodes that were referenced in this statement
            for (const node of nodesAfter) {
              if (!nodesBefore.has(node)) {
                mentionedNodes.add(String(node));
              }
            }

            // Also check if this was a standalone node (just an identifier)
            if (lookahead.length >= 1 && lookahead[0].type === 'NODE_STRING') {
              // Check if this is not part of an edge (no arrow following)
              const nextLookahead = this.lookAhead(tokens, i, 1);
              if (nextLookahead.length === 0 || nextLookahead[0].type !== 'LINK') {
                mentionedNodes.add(lookahead[0].value);
                // Ensure the node exists in the graph
                if (this.yy) {
                  this.yy.addVertex(
                    lookahead[0].value,
                    { text: lookahead[0].value, type: 'text' },
                    'round',
                    [],
                    [],
                    '',
                    {},
                    undefined
                  );
                }
              }
            }
          }
          break;
        }
        case 'SquareStart':
        case 'RoundStart':
        case 'ParenStart':
        case 'DiamondStart':
        case 'CircleStart':
        case 'DoubleCircleStart':
        case 'StadiumStart':
        case 'SubroutineStart':
        case 'CylinderStart':
        case 'HexagonStart':
        case 'RectStart': {
          // Handle orphaned shape tokens (shape tokens without preceding node ID)
          // Parse statement and collect all nodes mentioned
          const nodesBefore = this.yy ? new Set(this.yy.getVertices().keys()) : new Set();

          // Find the next END token to limit parsing scope
          let endTokenIndex = -1;
          for (let j = i; j < tokens.length; j++) {
            if (tokens[j].type === 'END') {
              endTokenIndex = j;
              break;
            }
          }

          // Create a limited token array that stops before the END token
          const limitedTokens = endTokenIndex >= 0 ? tokens.slice(0, endTokenIndex) : tokens;

          // Parse the orphaned shape statement
          const newIndex = this.parseStatement(limitedTokens, i);

          // If parseStatement would have gone beyond the END token, stop at the END token
          if (endTokenIndex >= 0 && newIndex >= endTokenIndex) {
            i = endTokenIndex;
          } else {
            i = newIndex;
          }

          const nodesAfter = this.yy ? new Set(this.yy.getVertices().keys()) : new Set();

          // Track all nodes that were referenced in this statement
          for (const node of nodesAfter) {
            if (!nodesBefore.has(node)) {
              mentionedNodes.add(String(node));
            }
          }
          break;
        }
        default:
          i++; // Skip unknown tokens
          break;
      }
    }

    // Skip 'end' keyword
    if (i < tokens.length && tokens[i].type === 'END') {
      i++;
    }

    // Add all mentioned nodes to the document
    subgraphDocument.push(...[...mentionedNodes]);

    console.log(
      `UIO DEBUG: parseSubgraphStatement: Final document for ${subgraphId}:`,
      subgraphDocument
    );
    console.log(`UIO DEBUG: parseSubgraphStatement: Mentioned nodes:`, [...mentionedNodes]);

    if (this.yy && subgraphDocument.length > 0) {
      console.log(
        `UIO DEBUG: parseSubgraphStatement: Creating subgraph ${subgraphId} with document:`,
        subgraphDocument
      );
      log.debug(`UIO Creating subgraph ${subgraphId} with document:`, subgraphDocument);

      // Use the preserved label type from earlier processing
      console.log(
        `UIO DEBUG: Creating subgraph with title: "${subgraphId}", labelType: "${subgraphLabelType}"`
      );

      // Call addSubGraph with the complete document (matching JISON approach)
      this.yy.addSubGraph({ text: subgraphId }, subgraphDocument, {
        text: subgraphId,
        type: subgraphLabelType,
      });
    } else {
      console.log(
        `UIO DEBUG: parseSubgraphStatement: NOT creating subgraph - yy:${!!this.yy}, docLength:${subgraphDocument.length}`
      );
    }

    console.log(`UIO DEBUG: parseSubgraphStatement: Returning index ${i}`);
    return i;
  }

  /**
   * Parse a direction statement (direction BT)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseDirectionStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Skip 'direction' keyword
    i++;

    // Get direction value
    if (i >= tokens.length || tokens[i].type !== 'Direction') {
      return i;
    }

    const direction = tokens[i].value;
    i++;

    log.debug(`UIO Setting subgraph direction: ${direction}`);

    if (this.yy) {
      // Set direction for current subgraph
      this.yy.setDirection(direction);
    }

    return i;
  }

  /**
   * Parse a click statement (click A callback, click A href "url", etc.)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index
   * @returns Next index to process
   */
  private parseClickStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;

    // Skip 'click' keyword
    i++;

    if (i >= tokens.length) {
      return i;
    }

    // Get node ID
    const nodeId = tokens[i].value;
    i++;

    if (i >= tokens.length) {
      return i;
    }

    // Look ahead to determine click type
    const lookahead = this.lookAhead(tokens, i, 5);
    console.log(
      `UIO DEBUG: Click statement lookahead:`,
      lookahead.map((t) => `${t.type}:${t.value}`)
    );

    // Handle different click patterns
    if (lookahead.length >= 1) {
      const firstToken = lookahead[0];

      // Pattern: click A "url" [tooltip] [target]
      if (firstToken.type === 'STR') {
        return this.parseClickLink(tokens, i, nodeId);
      }

      // Pattern: click A href "url" [tooltip] [target]
      if (firstToken.value === 'href') {
        i++; // Skip 'href'
        return this.parseClickLink(tokens, i, nodeId);
      }

      // Pattern: click A callback [tooltip] OR click A call callback(args) [tooltip]
      // Now that "call" is not a keyword, check if first token is "call" (as identifier)
      if (firstToken.value === 'call') {
        // This is "call callback()" pattern - skip the "call" token
        i++; // Skip 'call'
        return this.parseClickCallback(tokens, i, nodeId);
      }

      // Pattern: click A callback [tooltip] (standard callback)
      return this.parseClickCallback(tokens, i, nodeId);
    }

    return i;
  }

  /**
   * Parse click link statement (click A "url" or click A href "url")
   */
  private parseClickLink(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number,
    nodeId: string
  ): number {
    let i = startIndex;

    if (i >= tokens.length || tokens[i].type !== 'STR') {
      return i;
    }

    // Extract URL from quotes
    const url = tokens[i].value.replace(/^["']|["']$/g, '');
    i++;

    let tooltip: string | undefined;
    let target: string | undefined;

    // Check for tooltip and/or target
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'STR' && !tooltip) {
        // This is a tooltip
        tooltip = token.value.replace(/^["']|["']$/g, '');
        i++;
      } else if (token.type === 'LINK_TARGET' && !target) {
        // This is a target (_blank, _self, etc.)
        target = token.value;
        i++;
      } else {
        // End of click statement
        break;
      }
    }

    console.log(`UIO DEBUG: Setting link for ${nodeId}: url=${url}, target=${target}`);

    if (this.yy) {
      // Match JISON behavior: call setLink with 2 or 3 parameters based on whether target exists
      if (target) {
        this.yy.setLink(nodeId, url, target);
      } else {
        // Call with only 2 parameters when no target (to match test expectations)
        (this.yy.setLink as any)(nodeId, url);
      }
      if (tooltip) {
        this.yy.setTooltip(nodeId, tooltip);
      }
    }

    return i;
  }

  /**
   * Parse click callback statement (click A callback or click A call callback())
   */
  private parseClickCallback(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number,
    nodeId: string
  ): number {
    let i = startIndex;

    if (i >= tokens.length) {
      return i;
    }

    // Get callback name (should now be a single identifier)
    let callbackName = tokens[i].value;
    let callbackArgs: string | undefined;
    i++; // Skip callback name token

    // Check if callback has parentheses with arguments
    if (callbackName.includes('(') && callbackName.includes(')')) {
      // Extract function name and arguments from single token like "callback(arg1, arg2)"
      const match = /^([^(]+)\(([^)]*)\)$/.exec(callbackName);
      if (match) {
        callbackName = match[1];
        callbackArgs = match[2];
      }
    } else if (i < tokens.length && tokens[i].type === 'ParenStart') {
      // Handle case where parentheses are separate tokens: callback ( args )
      i++; // Skip opening parenthesis

      // Collect arguments until closing parenthesis, preserving spaces
      const argTokens: string[] = [];
      while (i < tokens.length && tokens[i].type !== 'ParenEnd') {
        argTokens.push(tokens[i].value);
        // Add space after comma
        if (tokens[i].value === ',' && i + 1 < tokens.length && tokens[i + 1].type !== 'ParenEnd') {
          argTokens.push(' ');
        }
        i++;
      }

      if (i < tokens.length && tokens[i].type === 'ParenEnd') {
        i++; // Skip closing parenthesis
        callbackArgs = argTokens.join('');
      }
    }

    // Check for tooltip
    let tooltip: string | undefined;
    if (i < tokens.length && tokens[i].type === 'STR') {
      tooltip = tokens[i].value.replace(/^["']|["']$/g, '');
      i++;
    }

    console.log(
      `UIO DEBUG: Setting click event for ${nodeId}: callback=${callbackName}, args=${callbackArgs}`
    );

    if (this.yy) {
      if (callbackArgs) {
        this.yy.setClickEvent(nodeId, callbackName, callbackArgs);
      } else {
        // Match JISON behavior: call with 2 parameters when no args
        (this.yy.setClickEvent as any)(nodeId, callbackName);
      }
      if (tooltip) {
        this.yy.setTooltip(nodeId, tooltip);
      }
    }

    return i;
  }
}

// Create parser instance
const newParser = new LezerFlowParser();

// Export in JISON-compatible format
const flow = {
  parser: {
    parse: newParser.parse.bind(newParser),
    get yy() {
      return newParser.yy;
    },
    set yy(value) {
      newParser.yy = value;
    },
    getVertices: () => newParser.yy?.getVertices(),
    getEdges: () => newParser.yy?.getEdges(),
    getDirection: () => newParser.yy?.getDirection(),
    getSubGraphs: () => newParser.yy?.getSubGraphs(),
  },
};

export default flow;
