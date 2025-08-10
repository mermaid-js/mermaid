// Lezer-based flowchart parser
import { parser as lezerParser } from './flow.grammar.js';
import type { FlowDB } from '../flowDb.js';
import type { FlowVertexTypeParam } from '../types.js';
import { log } from '../../../logger.js';

// Token type definition
interface Token {
  type: string;
  value: string;
  from: number;
  to: number;
}

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
  private pendingChainNodes: string[] = [];
  private currentSourceNodes: string[] = []; // For collecting source nodes in vertex chaining
  private currentTargetNodes: string[] = []; // For collecting target nodes in vertex chaining
  private lastTargetNodes: string[] = []; // Track target nodes for continuation edges
  private pendingShapedTargetId: string | null = null; // Track target node that needs shaping
  private lastEdgeInfo: {
    sourceNodes: string[];
    targetNodes: string[];
    edgeText: string;
    edgeType: string;
    edgeStroke: string;
  } | null = null; // Track last edge for retroactive target chaining
  private originalSource = '';

  constructor() {
    this.yy = undefined;
  }

  /**
   * Parse flowchart source code using Lezer parser
   * @param src - The flowchart source code
   * @returns Parse result (for compatibility)
   */
  parse(src: string): unknown {
    log.debug('UIO Our custom parser is being called with:', src);
    if (!this.yy) {
      throw new Error('Parser database (yy) not initialized. Call parser.yy = new FlowDB() first.');
    }

    try {
      // Preprocess source (same as JISON version)
      const newSrc = src.replace(/}\s*\n/g, '}\n');

      log.debug('UIO Parsing flowchart with Lezer:', newSrc);

      // Keep a copy of the original source for substring extraction
      this.originalSource = newSrc;

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
    log.debug('UIO Collected tokens:', tokens);
    log.debug('UIO Collected tokens:', tokens);

    // Preprocess tokens to merge fragmented edge patterns
    const processedTokens = this.preprocessTokens(tokens);

    // Second pass: parse the token sequence
    this.parseTokenSequence(processedTokens);
  }

  /**
   * Preprocess tokens to merge fragmented edge patterns
   * @param tokens - The raw tokens from the parser
   */
  private preprocessTokens(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): { type: string; value: string; from: number; to: number }[] {
    log.debug('UIO Preprocessing tokens to merge fragmented edge patterns...');

    const processedTokens: { type: string; value: string; from: number; to: number }[] = [];
    let i = 0;

    // Helper: detect head-open tokens like x--, o--, x==, o==, x-., o-.
    const isHeadOpenToken = (val: string) =>
      val === 'x--' ||
      val === 'o--' ||
      val === 'x==' ||
      val === 'o==' ||
      val === 'x-.' ||
      val === 'o-.';

    while (i < tokens.length) {
      const token = tokens[i];

      // Skip non-statement tokens
      if (token.type === 'GRAPH' || token.type === 'DIR' || token.type === 'SEMI') {
        processedTokens.push(token);
        i++;
        continue;
      }

      // Convert NODE_STRING head-open tokens (x--, o--, x==, o==, x-., o-.) into LINK when used as arrow openers
      if (token.type === 'NODE_STRING' && isHeadOpenToken(token.value)) {
        // Require a plausible source node immediately before in the processed stream
        const prev = processedTokens[processedTokens.length - 1];
        // Look ahead for a closing LINK that ends with matching head (x/o)
        const head = token.value[0]; // 'x' or 'o'
        let hasClosingTail = false;
        for (let j = i + 1; j < Math.min(tokens.length, i + 6); j++) {
          const t = tokens[j];
          if (t.type === 'LINK' && (t.value.endsWith(head) || t.value.endsWith('>'))) {
            hasClosingTail = true;
            break;
          }
        }
        if (prev && (prev.type === 'Identifier' || prev.type === 'NODE_STRING') && hasClosingTail) {
          const converted = { ...token, type: 'LINK' };
          log.debug(`UIO Converted head-open token ${token.value} to LINK for double-ended arrow`);
          processedTokens.push(converted);
          i++;
          continue;
        }
      }

      // Try to detect fragmented edge patterns
      const mergedPattern = this.tryMergeFragmentedEdgePattern(tokens, i);
      if (mergedPattern) {
        log.debug(
          `UIO Merged fragmented edge pattern: ${mergedPattern.mergedTokens.map((t) => t.value).join(' ')}`
        );
        processedTokens.push(...mergedPattern.mergedTokens);
        i = mergedPattern.nextIndex;
      } else {
        processedTokens.push(token);
        i++;
      }
    }

    return processedTokens;
  }

  /**
   * Try to merge fragmented edge patterns like "A--text including URL space and send-->B"
   * @param tokens - All tokens
   * @param startIndex - Starting index to check
   */
  private tryMergeFragmentedEdgePattern(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): {
    mergedTokens: { type: string; value: string; from: number; to: number }[];
    nextIndex: number;
  } | null {
    // Look for patterns like:
    // 1. A--text including URL space and send-->B
    // 2. A-- text including URL space and send -->B
    // 3. A---|text|B (pipe-delimited)

    // First, check for pipe-delimited pattern (A---|text|B), including fragmented tails like
    // [NODE_STRING 'A', LINK '--', NODE_STRING '-', PIPE '|', ..., PIPE '|', NODE_STRING 'B']
    if (this.isPipeDelimitedEdgePattern(tokens, startIndex)) {
      const endIndex = this.findPipeDelimitedPatternEnd(tokens, startIndex);
      if (endIndex > startIndex) {
        const patternTokens = tokens.slice(startIndex, endIndex);
        log.debug(
          `UIO Analyzing pipe-delimited edge pattern: ${patternTokens.map((t) => t.value).join(' ')}`
        );

        const merged = this.detectAndMergeEdgePattern(patternTokens, tokens, startIndex);
        if (merged) {
          return {
            mergedTokens: merged,
            nextIndex: endIndex,
          };
        }
      }
    }

    // Find the end of this potential edge pattern
    let endIndex = startIndex;
    let foundArrowEnd = false;

    // Look ahead to find arrow end patterns
    // Start from the token after the opener to avoid treating the opening LINK "--" as the end
    for (let i = startIndex + 1; i < tokens.length && i < startIndex + 40; i++) {
      const token = tokens[i];
      if (token.type === 'SEMI') {
        endIndex = i;
        break;
      }

      if (token.type === 'LINK') {
        const v = token.value;
        const isClosing = v.includes('>') || /[ox]$/.test(v);
        if (isClosing) {
          foundArrowEnd = true;
          endIndex = i + 1; // Include the target node
          if (
            i + 1 < tokens.length &&
            (tokens[i + 1].type === 'NODE_STRING' ||
              tokens[i + 1].type === 'Identifier' ||
              tokens[i + 1].type === 'DIR')
          ) {
            endIndex = i + 2; // Include target node
          }
          break;
        }
        continue;
      }

      if (token.type === 'TagEnd') {
        const prev = tokens[i - 1];
        if (
          prev &&
          prev.type === 'NODE_STRING' &&
          (prev.value.endsWith('--') || prev.value.endsWith('=='))
        ) {
          foundArrowEnd = true;
          endIndex = i + 1;
          if (
            i + 1 < tokens.length &&
            (tokens[i + 1].type === 'NODE_STRING' ||
              tokens[i + 1].type === 'Identifier' ||
              tokens[i + 1].type === 'DIR')
          ) {
            endIndex = i + 2;
          }
          break;
        }
      }

      if (
        token.type === 'NODE_STRING' &&
        (token.value.endsWith('-->') || token.value.endsWith('==>'))
      ) {
        foundArrowEnd = true;
        endIndex = i + 1;
        if (
          i + 1 < tokens.length &&
          (tokens[i + 1].type === 'NODE_STRING' ||
            tokens[i + 1].type === 'Identifier' ||
            tokens[i + 1].type === 'DIR')
        ) {
          endIndex = i + 2;
        }
        break;
      }
    }

    if (!foundArrowEnd || endIndex <= startIndex + 1) {
      return null; // Not a complex edge pattern
    }

    // Special handling: if this looks like A--text ... -->B or A-- text ... -->B,
    // fall back to Pattern1/Pattern2 detection so we retain the text.
    // This helps edge text without pipes.
    {
      const slice = tokens.slice(startIndex, endIndex);
      const merged = this.detectAndMergeEdgePattern(slice, tokens, startIndex);
      if (merged) {
        return {
          mergedTokens: merged,
          nextIndex: endIndex,
        } as any; // Will be handled by caller above
      }
    }

    // Extract the tokens that form this edge pattern
    const patternTokens = tokens.slice(startIndex, endIndex);
    log.debug(
      `UIO Analyzing potential edge pattern: ${patternTokens.map((t) => t.value).join(' ')}`
    );

    // Try to detect specific patterns
    const merged = this.detectAndMergeEdgePattern(patternTokens, tokens, startIndex);
    if (merged) {
      return {
        mergedTokens: merged,
        nextIndex: endIndex,
      };
    }

    return null;
  }

  /**
   * Check if tokens starting at index form a pipe-delimited edge pattern
   */
  private isPipeDelimitedEdgePattern(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): boolean {
    if (startIndex + 3 >= tokens.length) {
      return false;
    }

    const first = tokens[startIndex];
    const second = tokens[startIndex + 1];

    return (
      first.type === 'NODE_STRING' && this.endsWithArrow(first.value) && second.type === 'PIPE'
    );
  }

  /**
   * Check if a single NODE_STRING token contains a simple edge pattern
   */
  private isSimpleEdgePattern(token: { type: string; value: string }): boolean {
    if (token.type !== 'NODE_STRING') {
      return false;
    }

    // Check for patterns like A---B, A--xB, A--oB, A-->B, etc.
    const simpleEdgePatterns = [
      /^(.+?)(---?)([ox]?)(.+)$/, // A---B, A--B, A---xB, A--oB
      /^(.+?)(==+)([ox]?)(.+)$/, // A===B, A==B, A===xB, A==oB
      /^(.+?)(-\.-?)([ox]?)(.+)$/, // A-.-B, A-.B, A-.-xB, A-.oB
      /^(.+?)(--+>)(.+)$/, // A-->B, A--->B
      /^(.+?)(==+>)(.+)$/, // A==>B, A===>B
      /^(.+?)(-\.->)(.+)$/, // A-.->B
    ];

    return simpleEdgePatterns.some((pattern) => pattern.test(token.value));
  }

  /**
   * Check if a token is part of a pipe-delimited pattern (should not be treated as simple edge)
   */
  private isPartOfPipeDelimitedPattern(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): boolean {
    // Check if the current token could be the start of a pipe-delimited pattern
    // This includes tokens that end with arrows (A---) or arrow+ending (A--x)
    if (startIndex + 1 < tokens.length) {
      const currentToken = tokens[startIndex];
      const nextToken = tokens[startIndex + 1];

      if (currentToken.type === 'NODE_STRING' && nextToken.type === 'PIPE') {
        // Check if current token ends with arrow patterns that could be pipe-delimited
        const arrowPatterns = [
          /---?[ox]?$/, // ---, --, --x, --o, ---x, ---o
          /==+[ox]?$/, // ==, ===, ==x, ==o, ===x, ===o
          /-\.-?[ox]?$/, // -., -.-,  -.x, -.o, -.-x, -.-o
        ];

        return arrowPatterns.some((pattern) => pattern.test(currentToken.value));
      }
    }

    return false;
  }

  /**
   * Find the end index of a pipe-delimited pattern
   */
  private findPipeDelimitedPatternEnd(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    // Look for the closing pipe and target node
    for (let i = startIndex + 2; i < tokens.length; i++) {
      if (
        tokens[i].type === 'PIPE' &&
        i + 1 < tokens.length &&
        tokens[i + 1].type === 'NODE_STRING'
      ) {
        return i + 2; // Include the target node
      }
      if (tokens[i].type === 'SEMI') {
        break; // End of statement
      }
    }
    return startIndex;
  }

  /**
   * Helper: does a NODE_STRING like "A-.-" followed by TagEnd '>' and a NODE_STRING target
   * represent a dotted simple edge A-.->B? If so, merge into canonical tokens.
   */
  private matchesDottedSimple(tokens: { type: string; value: string }[]): boolean {
    return (
      tokens.length >= 3 &&
      tokens[0].type === 'NODE_STRING' &&
      tokens[0].value.endsWith('-.-') &&
      tokens[1].type === 'TagEnd' &&
      tokens[1].value === '>' &&
      tokens[2].type === 'NODE_STRING'
    );
  }
  private mergeDottedSimple(tokens: { type: string; value: string; from: number; to: number }[]) {
    const first = tokens[0];
    const target = tokens[2];
    const src = first.value.slice(0, -3); // drop '-.-'
    return [
      { type: 'NODE_STRING', value: src, from: first.from, to: first.from + src.length },
      { type: 'LINK', value: '-.->', from: first.from + src.length, to: target.from },
      { type: 'NODE_STRING', value: target.value, from: target.from, to: target.to },
    ];
  }
  /**
   * Helper: does a NODE_STRING like "A==" followed by TagEnd '>' and a NODE_STRING target
   * represent a thick simple edge A==>B? If so, merge into canonical tokens.
   */
  private matchesThickSimple(tokens: { type: string; value: string }[]): boolean {
    return (
      tokens.length >= 3 &&
      tokens[0].type === 'NODE_STRING' &&
      tokens[0].value.endsWith('==') &&
      tokens[1].type === 'TagEnd' &&
      tokens[1].value === '>' &&
      tokens[2].type === 'NODE_STRING'
    );
  }
  private mergeThickSimple(tokens: { type: string; value: string; from: number; to: number }[]) {
    const first = tokens[0];
    const target = tokens[2];
    const src = first.value.slice(0, -2); // drop '=='
    return [
      { type: 'NODE_STRING', value: src, from: first.from, to: first.from + src.length },
      { type: 'LINK', value: '==>', from: first.from + src.length, to: target.from },
      { type: 'NODE_STRING', value: target.value, from: target.from, to: target.to },
    ];
  }

  /**
   * Check if tokens match pipe-delimited pattern: A---|text|B
   */
  private matchesPipeDelimitedPattern(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): boolean {
    if (tokens.length < 4) {
      return false;
    }

    // First token normally is NODE_STRING ending with arrow (like "A---", "A==>", "A-.-").
    // However, some inputs tokenize the tail as LINK + NODE_STRING '-' before the first pipe.
    // Support both forms.
    const first = tokens[0];

    if (first.type === 'NODE_STRING' && this.endsWithArrow(first.value)) {
      // Case A: Compact form e.g., ["A---", "|", ..., "|", "B"]
      if (tokens[1].type !== 'PIPE') {
        return false;
      }
      // Find the closing pipe and target
      let closingPipeIndex = -1;
      for (let i = 2; i < tokens.length; i++) {
        if (tokens[i].type === 'PIPE') {
          closingPipeIndex = i;
          break;
        }
      }
      if (closingPipeIndex === -1 || closingPipeIndex >= tokens.length - 1) {
        return false;
      }
      const last = tokens[tokens.length - 1];
      if (last.type !== 'NODE_STRING') {
        return false;
      }
      const textTokens = tokens.slice(2, closingPipeIndex);
      return textTokens.every((t) => this.isTextToken(t.type));
    }

    // Case B: Fragmented tail such as ["A", "--", "-", "|", ..., "|", "B"]
    if (
      first.type === 'NODE_STRING' &&
      tokens.length >= 5 &&
      tokens[1].type === 'LINK' &&
      (tokens[1].value === '--' || tokens[1].value === '==') &&
      tokens[2].type === 'NODE_STRING' &&
      tokens[2].value === '-' &&
      tokens[3].type === 'PIPE'
    ) {
      // Find the closing pipe and ensure a NODE_STRING target exists
      let closingPipeIndex = -1;
      for (let i = 4; i < tokens.length; i++) {
        if (tokens[i].type === 'PIPE') {
          closingPipeIndex = i;
          break;
        }
      }
      if (closingPipeIndex === -1 || closingPipeIndex >= tokens.length - 1) {
        return false;
      }
      const last = tokens[tokens.length - 1];
      if (last.type !== 'NODE_STRING') {
        return false;
      }
      const textTokens = tokens.slice(4, closingPipeIndex);
      return textTokens.every((t) => this.isTextToken(t.type));
    }

    return false;
  }

  /**
   * Merge pipe-delimited pattern tokens into proper edge format
   */
  private mergePipeDelimitedPattern(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): { type: string; value: string; from: number; to: number }[] {
    const firstToken = tokens[0];

    // Extract source node ID and arrow from first token (e.g., "A---" -> "A" + "---")
    const { sourceId, arrow } = this.extractSourceAndArrow(firstToken.value);

    // Find the closing pipe
    let closingPipeIndex = -1;
    for (let i = 2; i < tokens.length; i++) {
      if (tokens[i].type === 'PIPE') {
        closingPipeIndex = i;
        break;
      }
    }

    // Extract text from tokens between pipes
    const textTokens = tokens.slice(2, closingPipeIndex);
    const edgeText = textTokens
      .map((t) => t.value)
      .join(' ')
      .trim();

    const targetToken = tokens[tokens.length - 1];

    log.debug(
      `UIO Pipe-delimited merge - source: ${sourceId}, arrow: ${arrow}, text: "${edgeText}", target: ${targetToken.value}`
    );

    return [
      {
        type: 'NODE_STRING',
        value: sourceId,
        from: firstToken.from,
        to: firstToken.from + sourceId.length,
      },
      {
        type: 'LINK',
        value: arrow,
        from: firstToken.from + sourceId.length,
        to: firstToken.from + sourceId.length + arrow.length,
      },
      {
        type: 'PIPE',
        value: '|',
        from: firstToken.from + sourceId.length + arrow.length,
        to: firstToken.from + sourceId.length + arrow.length + 1,
      },
      {
        type: 'NODE_STRING',
        value: edgeText,
        from: firstToken.from + sourceId.length + arrow.length + 1,
        to: firstToken.from + sourceId.length + arrow.length + 1 + edgeText.length,
      },
      {
        type: 'PIPE',
        value: '|',
        from: firstToken.from + sourceId.length + arrow.length + 1 + edgeText.length,
        to: firstToken.from + sourceId.length + arrow.length + 2 + edgeText.length,
      },
      {
        type: 'NODE_STRING',
        value: targetToken.value,
        from: targetToken.from,
        to: targetToken.to,
      },
    ];
  }

  /**
   * Check if a string ends with an arrow pattern
   */
  private endsWithArrow(value: string): boolean {
    return (
      value.endsWith('---') ||
      value.endsWith('-->') ||
      value.endsWith('==>') ||
      value.endsWith('===') ||
      value.endsWith('-.-') ||
      value.endsWith('-.->') ||
      value.endsWith('--') ||
      value.endsWith('==')
    );
  }

  /**
   * Extract source node ID and arrow from a combined string
   */
  private extractSourceAndArrow(value: string): { sourceId: string; arrow: string } {
    // Try different arrow patterns, longest first
    const patterns = ['--->', '===>', '-.->', '---', '===', '-.-', '-->', '==>', '--', '=='];

    for (const pattern of patterns) {
      if (value.endsWith(pattern)) {
        const sourceId = value.substring(0, value.length - pattern.length);
        return { sourceId, arrow: pattern };
      }
    }

    // Fallback - shouldn't happen if endsWithArrow returned true
    return { sourceId: value, arrow: '' };
  }

  /**
   * Merge a simple edge pattern token (A---B) into proper edge format
   */
  private mergeSimpleEdgePattern(token: {
    type: string;
    value: string;
    from: number;
    to: number;
  }): { type: string; value: string; from: number; to: number }[] {
    const value = token.value;

    // Try to match different simple edge patterns
    const patterns = [
      { regex: /^(.+?)(---?)([ox])(.+)$/, hasEnding: true }, // A---xB, A--oB
      { regex: /^(.+?)(---?)(.+)$/, hasEnding: false }, // A---B, A--B
      { regex: /^(.+?)(==+)([ox])(.+)$/, hasEnding: true }, // A===xB, A==oB
      { regex: /^(.+?)(==+)(.+)$/, hasEnding: false }, // A===B, A==B
      { regex: /^(.+?)(-\.-?)([ox])(.+)$/, hasEnding: true }, // A-.-xB, A-.oB
      { regex: /^(.+?)(-\.-?)(.+)$/, hasEnding: false }, // A-.-B, A-.B
      { regex: /^(.+?)(--+>)(.+)$/, hasEnding: false }, // A-->B, A--->B
      { regex: /^(.+?)(==+>)(.+)$/, hasEnding: false }, // A==>B, A===>B
      { regex: /^(.+?)(-\.->)(.+)$/, hasEnding: false }, // A-.->B
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern.regex);
      if (match) {
        const sourceId = match[1];
        let arrow: string;
        let targetId: string;

        if (pattern.hasEnding) {
          // Pattern with ending: source, arrow, ending, target
          arrow = match[2] + match[3]; // arrow + ending (x, o)
          targetId = match[4];
        } else {
          // Pattern without ending: source, arrow, target
          arrow = match[2];
          targetId = match[3];
        }

        console.log(
          `UIO DEBUG: Simple edge merge - source: ${sourceId}, arrow: ${arrow}, target: ${targetId}`
        );

        return [
          {
            type: 'NODE_STRING',
            value: sourceId,
            from: token.from,
            to: token.from + sourceId.length,
          },
          {
            type: 'LINK',
            value: arrow,
            from: token.from + sourceId.length,
            to: token.from + sourceId.length + arrow.length,
          },
          {
            type: 'NODE_STRING',
            value: targetId,
            from: token.from + sourceId.length + arrow.length,
            to: token.to,
          },
        ];
      }
    }

    // Fallback - return original token if no pattern matches
    console.log(`UIO DEBUG: No simple edge pattern matched for: ${value}`);
    return [token];
  }

  /**
   * Detect and merge specific edge patterns
   * @param patternTokens - The tokens that form the potential edge pattern
   * @param allTokens - All tokens (for context)
   * @param startIndex - Starting index in allTokens
   */
  private detectAndMergeEdgePattern(
    patternTokens: { type: string; value: string; from: number; to: number }[],
    allTokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): { type: string; value: string; from: number; to: number }[] | null {
    // Pattern 0: Simple edge pattern A---B, A--xB, A-->B (single token)
    if (patternTokens.length === 1 && this.isSimpleEdgePattern(patternTokens[0])) {
      return this.mergeSimpleEdgePattern(patternTokens[0]);
    }

    // Pattern 3: Pipe-delimited edge text A---|text|B
    // Tokens: [A---, |, text, tokens..., |, B]
    if (this.matchesPipeDelimitedPattern(patternTokens)) {
      return this.mergePipeDelimitedPattern(patternTokens);
    }

    // Pattern 1: A--text including URL space and send-->B
    // Tokens: [A--text, including, URL, space, and, send--, >, B]
    if (this.matchesPattern1(patternTokens)) {
      return this.mergePattern1(patternTokens);
    }

    // Pattern 2: A-- text including URL space and send -->B
    // Tokens: [A--, text, including, URL, space, and, send, -->, B]
    if (this.matchesPattern2(patternTokens)) {
      return this.mergePattern2(patternTokens);
    }

    // New: simple dotted A-.->B collapsed as NODE_STRING + '>' + NODE_STRING
    if (this.matchesDottedSimple(patternTokens)) {
      return this.mergeDottedSimple(patternTokens as any);
    }

    // New: simple thick A==>B collapsed as NODE_STRING + '>' + NODE_STRING
    if (this.matchesThickSimple(patternTokens)) {
      return this.mergeThickSimple(patternTokens as any);
    }

    return null;
  }

  /**
   * Check if a token type can be treated as text in edge patterns
   */
  private isTextToken(tokenType: string): boolean {
    // Treat a wide set of tokens as allowable middle text between arrows.
    // This matches JISON behavior where many keywords are allowed in edge labels.
    return (
      tokenType === 'NODE_STRING' ||
      tokenType === 'STR' ||
      tokenType === 'Flowchart' ||
      tokenType === 'GRAPH' ||
      tokenType === 'DIR' ||
      tokenType === 'SUBGRAPH' ||
      tokenType === 'END' ||
      tokenType === 'STYLE' ||
      tokenType === 'CLASS' ||
      tokenType === 'CLASSDEF' ||
      tokenType === 'LINKSTYLE' ||
      tokenType === 'INTERPOLATE' ||
      tokenType === 'DEFAULT' ||
      tokenType === 'CLICK' ||
      tokenType === 'HREF' ||
      tokenType === 'CALL' ||
      tokenType === 'LINK_TARGET' ||
      tokenType === 'SLASH' || // for '/'
      tokenType === 'BACKTICK' || // for '`'
      tokenType === '⚠' // generic punctuation/token emitted by lexer (e.g., '/')
    );
  }

  /**
   * Check if tokens match Pattern 1: A--text including URL space and send-->B
   */
  private matchesPattern1(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): boolean {
    if (tokens.length < 3) {
      return false;
    }

    // First token should be NODE_STRING ending with text (like "A--text")
    const first = tokens[0];
    if (first.type !== 'NODE_STRING' || !first.value.includes('--')) {
      return false;
    }

    // Should have middle tokens that can be treated as text (NODE_STRING or keywords)
    const hasMiddleTokens = tokens.slice(1, -2).every((t) => this.isTextToken(t.type));
    if (!hasMiddleTokens) {
      return false;
    }

    // Should end with arrow pattern and target
    const secondLast = tokens[tokens.length - 2];
    const last = tokens[tokens.length - 1];

    return (
      (secondLast.type === 'NODE_STRING' &&
        secondLast.value.endsWith('--') &&
        last.type === 'TagEnd' &&
        last.value === '>') ||
      (secondLast.type === 'TagEnd' && last.type === 'NODE_STRING')
    );
  }

  /**
   * Check if tokens match Pattern 2: A-- text including URL space and send -->B
   */
  private matchesPattern2(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): boolean {
    if (tokens.length < 4) {
      return false;
    }

    // First token should be NODE_STRING ending with -- (like "A--")
    const first = tokens[0];
    if (first.type !== 'NODE_STRING' || !first.value.endsWith('--')) {
      return false;
    }

    // Should have middle tokens that can be treated as text (NODE_STRING or keywords)
    const middleTokens = tokens.slice(1, -2);
    const hasMiddleTokens = middleTokens.every((t) => this.isTextToken(t.type));
    if (!hasMiddleTokens) {
      return false;
    }

    // Should end with LINK and target
    const secondLast = tokens[tokens.length - 2];
    const last = tokens[tokens.length - 1];

    return (
      secondLast.type === 'LINK' && secondLast.value.startsWith('--') && last.type === 'NODE_STRING'
    );
  }

  /**
   * Merge Pattern 1 tokens into proper edge format
   */
  private mergePattern1(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): { type: string; value: string; from: number; to: number }[] {
    // Extract source node ID from first token (e.g., "A--text" -> "A")
    const firstToken = tokens[0];
    const sourceMatch = /^(.+?)--/.exec(firstToken.value);
    const sourceId = sourceMatch ? sourceMatch[1] : firstToken.value;

    // Extract text from all tokens
    const textParts = [firstToken.value.substring(sourceId.length + 2)]; // Remove "A--" part

    // Process all middle tokens, handling the special case of the last one
    for (let i = 1; i < tokens.length - 1; i++) {
      const token = tokens[i];
      if (this.isTextToken(token.type)) {
        // Normalize single-character separator tokens into their literal form for text
        if (token.type === 'SLASH') {
          textParts.push('/');
          continue;
        }
        if (token.type === 'BACKTICK') {
          textParts.push('`');
          continue;
        }
        // Check if this is a token that ends with '--' and should have it removed
        if (token.value.endsWith('--') && i < tokens.length - 1) {
          // Check if the next token is TagEnd (>) - this indicates it's the arrow end
          const nextToken = tokens[i + 1];
          if (nextToken && nextToken.type === 'TagEnd') {
            const textPart = token.value.substring(0, token.value.length - 2);

            if (textPart.trim()) {
              textParts.push(textPart);
            }
          } else {
            // Regular token that happens to end with '--'
            textParts.push(token.value);
          }
        } else {
          // Regular token
          textParts.push(token.value);
        }
      }
    }

    const edgeText = textParts.join(' ').trim();
    const targetToken = tokens[tokens.length - 1];

    console.log(
      `UIO DEBUG: Pattern 1 merge - source: ${sourceId}, text: "${edgeText}", target: ${targetToken.value}`
    );

    return [
      {
        type: 'NODE_STRING',
        value: sourceId,
        from: firstToken.from,
        to: firstToken.from + sourceId.length,
      },
      {
        type: 'LINK',
        value: '--',
        from: firstToken.from + sourceId.length,
        to: firstToken.from + sourceId.length + 2,
      },
      {
        type: 'PIPE',
        value: '|',
        from: firstToken.from + sourceId.length + 2,
        to: firstToken.from + sourceId.length + 3,
      },
      {
        type: 'NODE_STRING',
        value: edgeText,
        from: firstToken.from + sourceId.length + 3,
        to: firstToken.from + sourceId.length + 3 + edgeText.length,
      },
      {
        type: 'PIPE',
        value: '|',
        from: firstToken.from + sourceId.length + 3 + edgeText.length,
        to: firstToken.from + sourceId.length + 4 + edgeText.length,
      },
      {
        type: 'LINK',
        value: '-->',
        from: firstToken.from + sourceId.length + 4 + edgeText.length,
        to: targetToken.from,
      },
      { type: 'NODE_STRING', value: targetToken.value, from: targetToken.from, to: targetToken.to },
    ];
  }

  /**
   * Merge Pattern 2 tokens into proper edge format
   */
  private mergePattern2(
    tokens: { type: string; value: string; from: number; to: number }[]
  ): { type: string; value: string; from: number; to: number }[] {
    // Extract source node ID from first token (e.g., "A--" -> "A")
    const firstToken = tokens[0];
    const sourceId = firstToken.value.substring(0, firstToken.value.length - 2); // Remove "--"

    // Extract text from middle tokens
    const middleTokens = tokens.slice(1, -2);
    const edgeText = middleTokens
      .map((t) => t.value)
      .join(' ')
      .trim();

    const arrowToken = tokens[tokens.length - 2]; // The LINK token (e.g., "--x", "-->", etc.)
    const targetToken = tokens[tokens.length - 1];

    return [
      {
        type: 'NODE_STRING',
        value: sourceId,
        from: firstToken.from,
        to: firstToken.from + sourceId.length,
      },
      {
        type: 'LINK',
        value: '--',
        from: firstToken.from + sourceId.length,
        to: firstToken.from + sourceId.length + 2,
      },
      {
        type: 'PIPE',
        value: '|',
        from: firstToken.from + sourceId.length + 2,
        to: firstToken.from + sourceId.length + 3,
      },
      {
        type: 'NODE_STRING',
        value: edgeText,
        from: firstToken.from + sourceId.length + 3,
        to: firstToken.from + sourceId.length + 3 + edgeText.length,
      },
      {
        type: 'PIPE',
        value: '|',
        from: firstToken.from + sourceId.length + 3 + edgeText.length,
        to: firstToken.from + sourceId.length + 4 + edgeText.length,
      },
      {
        type: 'LINK',
        value: arrowToken.value,
        from: firstToken.from + sourceId.length + 4 + edgeText.length,
        to: targetToken.from,
      },
      { type: 'NODE_STRING', value: targetToken.value, from: targetToken.from, to: targetToken.to },
    ];
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
        case 'GRAPH':
        case 'Flowchart':
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
        case 'ParenStart': // Add ParenStart as an alias for RoundStart
        case 'DiamondStart':
        case 'CircleStart':
        case 'DoubleCircleStart':
        case 'StadiumStart':
        case 'SubroutineStart':
        case 'CylinderStart':
        case 'HexagonStart':
        case 'RectStart':
        case 'TrapStart':
        case 'InvTrapStart':
        case 'TagEnd': // Odd shape start ('>text]') or split-arrow head ('>')
          // Priority 1: If we have a pending shaped target from an embedded arrow, consume as shaped node now
          if (this.pendingShapedTargetId) {
            console.log(
              `UIO DEBUG: Applying shape to pending target node: ${this.pendingShapedTargetId}`
            );
            i = this.parseShapedNodeForTarget(tokens, i, this.pendingShapedTargetId);
            this.pendingShapedTargetId = null; // Clear the pending target
            break;
          }

          // Priority 2: Orphaned shape token for the last referenced node (e.g., A-->B>text])
          if (this.isShapeStart(token) && this.lastReferencedNodeId) {
            console.log(
              `UIO DEBUG: Detected orphaned shape token '${token.type}:${token.value}' for lastReferencedNodeId=${this.lastReferencedNodeId}`
            );
            i = this.parseOrphanedShapeStatement(tokens, i);
            break;
          }

          // Priority 3: Continuation edge head (e.g., A-->B-->C)
          if (token.type === 'TagEnd' && token.value === '>' && this.lastTargetNodes.length > 0) {
            i = this.parseContinuationEdgeStatement(tokens, i);
            break;
          }

          // Fallback: Delegate to parseStatement
          i = this.parseStatement(tokens, i);
          break;
        case 'CLICK':
          i = this.parseClickStatement(tokens, i);
          break;
        case 'STYLE':
          i = this.parseStyleStatement(tokens, i);
          break;
        case 'CLASSDEF':
          i = this.parseClassDefStatement(tokens, i);
          break;
        case 'CLASS':
          i = this.parseClassStatement(tokens, i);
          break;
        case 'LINKSTYLE':
          i = this.parseLinkStyleStatement(tokens, i);
          break;
        case 'AMP':
          // Handle ampersand for vertex chaining
          console.log(`UIO DEBUG: Processing token ${i}: AMP = "${token.value}"`);
          i = this.parseVertexChaining(tokens, i);
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
          // Skip these tokens when they appear standalone
          i++;
          break;
        default:
          // Check if this is an edge property block (edgeId@{...})
          if (
            token.type === 'NODE_STRING' &&
            i + 1 < tokens.length &&
            tokens[i + 1].type === 'At' &&
            i + 2 < tokens.length &&
            tokens[i + 2].type === 'DiamondStart'
          ) {
            console.log(`UIO DEBUG: Detected edge property block: ${token.value}@{...}`);
            i = this.parseEdgePropertyBlock(tokens, i);
          } else {
            i++; // Skip unknown tokens
          }
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

      if (token.type === 'DIR') {
        direction = token.value;
        i++;
      } else if (token.type === 'TagEnd' && token.value === '>') {
        // Handle '>' as LR direction
        direction = 'LR';
        i++;
      } else if (token.value === '<' || token.value === '^' || token.value === 'v') {
        // Handle special direction characters by value regardless of token type
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

    // Accessibility statements: accTitle / accDescr
    if (
      lookahead.length >= 1 &&
      lookahead[0].type === 'NODE_STRING' &&
      (lookahead[0].value === 'accTitle' || lookahead[0].value === 'accDescr')
    ) {
      if (lookahead[0].value === 'accTitle') {
        return this.parseAccTitleStatement(tokens, i);
      } else {
        return this.parseAccDescrStatement(tokens, i);
      }
    }

    // Check if this is a direction statement (direction BT)
    if (
      lookahead.length >= 2 &&
      lookahead[0].value === 'direction' &&
      lookahead[1].type === 'DIR'
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
      extendedLookahead.length >= 3 &&
      (extendedLookahead[0].type === 'Identifier' || extendedLookahead[0].type === 'NODE_STRING') &&
      (extendedLookahead[1].type === 'Identifier' || extendedLookahead[1].type === 'NODE_STRING') &&
      extendedLookahead[2].type === 'At'
    ) {
      console.log(`UIO DEBUG: Edge ID detection: matched pattern with '@'`);
      return this.parseEdgeWithIdStatement(tokens, i);
    }

    // Edge ID continuation without explicit source: e4@-->D (uses last target as source)
    if (
      extendedLookahead.length >= 3 &&
      (extendedLookahead[0].type === 'Identifier' || extendedLookahead[0].type === 'NODE_STRING') &&
      extendedLookahead[1].type === 'At' &&
      (extendedLookahead[2].type === 'LINK' || extendedLookahead[2].type === 'Arrow')
    ) {
      console.log(`UIO DEBUG: Edge ID continuation detected (no explicit source)`);
      return this.parseEdgeWithIdContinuation(tokens, i);
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
    if (lookahead.length >= 3 && this.isShapeStart(lookahead[0])) {
      console.log(`UIO DEBUG: Taking orphaned shape statement path (shape without node ID)`);
      return this.parseOrphanedShapeStatement(tokens, i);
    }

    // Look for LINK or Arrow token in the immediate vicinity (not scanning entire sequence)
    // Only look at the next few tokens to avoid false positives from distant edges
    const immediateTokens = lookahead.slice(0, 5); // Only look at next 5 tokens
    const hasImmediateEdgeToken = immediateTokens.some(
      (token) => token.type === 'Arrow' || token.type === 'LINK'
    );

    // Also check for split arrow patterns like "A--" + ">" (which represents "A-->")
    const hasSplitArrow =
      lookahead.length >= 2 &&
      lookahead[0].type === 'NODE_STRING' &&
      lookahead[0].value.endsWith('--') &&
      lookahead[1].type === 'TagEnd' &&
      lookahead[1].value === '>';

    // Check for embedded arrow patterns in NODE_STRING like "A--x" followed by PIPE (for A--x|text|B)
    const hasEmbeddedArrowWithPipe =
      lookahead.length >= 2 &&
      lookahead[0].type === 'NODE_STRING' &&
      /--[ox]$/.test(lookahead[0].value) && // Ends with --x or --o
      lookahead[1].type === 'PIPE';

    // Check for embedded arrow pattern like "A--xv" where arrow is followed by node ID (for A--xv(text))
    const hasEmbeddedArrowWithNode =
      lookahead.length >= 2 &&
      lookahead[0].type === 'NODE_STRING' &&
      /--[ox].+/.test(lookahead[0].value) && // Contains --x or --o followed by more characters
      this.isShapeStart(lookahead[1].type); // Followed by a shape start

    // Check for vertex chaining pattern (NODE_STRING followed by AMP)
    const hasVertexChaining =
      lookahead.length >= 2 && lookahead[0].type === 'NODE_STRING' && lookahead[1].type === 'AMP';

    if (hasVertexChaining) {
      console.log(`UIO DEBUG: Taking node statement path (vertex chaining detected)`);
      return this.parseNodeStatement(tokens, i);
    }

    // Edge property block: edgeId@{...}
    if (
      lookahead.length >= 3 &&
      (lookahead[0].type === 'Identifier' || lookahead[0].type === 'NODE_STRING') &&
      lookahead[1].type === 'At' &&
      lookahead[2].type === 'DiamondStart'
    ) {
      console.log(`UIO DEBUG: Taking edge property block path`);
      return this.parseEdgePropertyBlock(tokens, i);
    }

    if (
      lookahead.length >= 2 &&
      (hasImmediateEdgeToken ||
        hasSplitArrow ||
        hasEmbeddedArrowWithPipe ||
        hasEmbeddedArrowWithNode)
    ) {
      log.debug(
        `UIO Taking edge statement path (found edge token in lookahead or split arrow pattern)`
      );
      return this.parseEdgeStatement(tokens, i);
    }

    // New: handle combined single-token edge patterns like A---B, A--xB, A--oB
    if (lookahead.length >= 1 && lookahead[0].type === 'NODE_STRING') {
      const combined = this.matchCombinedEdgeToken(lookahead[0].value);
      if (combined) {
        console.log(`UIO DEBUG: Taking combined single-token edge path for ${lookahead[0].value}`);
        return this.parseCombinedSingleTokenEdge(tokens, i);
      }
    }

    // Otherwise, treat as a single node
    console.log(`UIO DEBUG: Taking node statement path (single node)`);
    return this.parseNodeStatement(tokens, i);
  }

  // Detect combined single-token edge like A---B, A--xB, A--oB, A-.-.B
  private matchCombinedEdgeToken(
    val: string
  ): { source: string; arrow: string; target: string } | null {
    // Patterns:
    // 1) A---B or A===B
    // 2) A--xB / A--oB (arrow head inside token)
    // 3) A-.-.B (dotted open)
    // Keep it conservative: only match when there is exactly one “source part”, one “arrow part”, one “target part”
    const m1 = /^([^\s%=\-]+)(-{3,}|={3,})([^\s%=\-]+)$/.exec(val);
    if (m1) {
      return { source: m1[1], arrow: m1[2], target: m1[3] };
    }

    const m2 = /^([^\s%=\-]+)(--[ox])([^\s%=\-]+)$/.exec(val);
    if (m2) {
      return { source: m2[1], arrow: m2[2], target: m2[3] };
    }

    const m3 = /^([^\s%=\-]+)(-\.+-)([^\s%=\-]+)$/.exec(val);
    if (m3) {
      return { source: m3[1], arrow: m3[2], target: m3[3] };
    }

    return null;
  }

  // Parse the combined single-token edge by creating the source/target and link
  private parseCombinedSingleTokenEdge(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    const token = tokens[startIndex];
    const match = this.matchCombinedEdgeToken(token.value);
    if (!match) {
      return startIndex + 1;
    }

    const { source, arrow, target } = match;

    // Create vertices
    if (this.yy) {
      this.yy.addVertex(
        source,
        { text: source, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );
      this.yy.addVertex(
        target,
        { text: target, type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        undefined
      );

      // Create edge
      this.yy.addSingleLink(source, target, {
        text: { text: '', type: 'text' },
        type: this.getArrowType(arrow),
        stroke: this.getArrowStroke(arrow),
        length: this.getArrowLength(arrow),
      });
    }

    // Advance to next token
    return startIndex + 1;
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

    // Check if we have target nodes from the previous statement for continuation
    if (this.lastTargetNodes.length > 0) {
      console.log(
        `UIO DEBUG: parseContinuationEdgeStatement: Using target nodes from previous statement: [${this.lastTargetNodes.join(', ')}]`
      );
      // Use the stored target nodes as sources for continuation
      const sourceNodes = [...this.lastTargetNodes];

      // Parse the continuation edge using the existing parseEdgePattern logic
      const edgeInfo = this.parseEdgePattern(tokens, i);
      if (!edgeInfo) {
        console.log(`UIO DEBUG: parseContinuationEdgeStatement: No valid edge pattern found`);
        return i + 1;
      }

      const cleanTargetId = this.ensureNodeWithInlineClasses(edgeInfo.targetId);

      // Create edges from all previous target nodes to the new target
      console.log(
        `UIO DEBUG: Creating continuation edges from [${sourceNodes.join(', ')}] to [${cleanTargetId}]`
      );
      this.yy.addLink(sourceNodes, [cleanTargetId], {
        text: processNodeText(edgeInfo.text),
        type: edgeInfo.type,
        stroke: edgeInfo.stroke,
        length: edgeInfo.length,
      });

      // Update lastTargetNodes for potential further continuation
      this.lastTargetNodes = [cleanTargetId];

      return edgeInfo.nextIndex;
    }

    // Fallback to legacy single node continuation
    if (!this.lastReferencedNodeId) {
      console.log(
        `UIO DEBUG: parseContinuationEdgeStatement: No lastReferencedNodeId or lastTargetNodes available, skipping`
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
   * Also handles inline class syntax (A:::className)
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
      let nodeId = nodeToken.value;
      const inlineClasses: string[] = [];

      // Check for inline class syntax (:::className)
      if (nodeId.includes(':::')) {
        const parts = nodeId.split(':::');
        nodeId = parts[0];
        if (parts[1]) {
          inlineClasses.push(parts[1]);
          console.log(
            `UIO DEBUG: parseNodeStatement: Detected inline class ${parts[1]} for node ${nodeId}`
          );
        }
      }

      // Special case: if this is a standalone :::className token (nodeId is empty)
      // it means this is a class application to the previously created node
      if (nodeId === '' && inlineClasses.length > 0) {
        console.log(
          `UIO DEBUG: parseNodeStatement: Standalone class application ${inlineClasses[0]} - applying to last created node`
        );

        // Find the most recently created vertex and apply the class
        const vertices = this.yy?.getVertices();
        if (vertices && vertices.size > 0) {
          // Get the last vertex (most recently added)
          const vertexEntries = [...vertices.entries()];
          const lastVertex = vertexEntries[vertexEntries.length - 1];
          const [lastNodeId, lastVertexData] = lastVertex;

          console.log(
            `UIO DEBUG: parseNodeStatement: Applying class ${inlineClasses[0]} to node ${lastNodeId}`
          );

          // Add the class to the existing vertex
          if (!lastVertexData.classes) {
            lastVertexData.classes = [];
          }
          lastVertexData.classes.push(...inlineClasses);
        }

        i++;
        return i;
      }

      log.debug(`UIO Creating node: ${nodeId}`);

      // Look ahead to see if this is a shaped node
      const lookahead = this.lookAhead(tokens, i, 4);

      // Check for shape patterns: A[text], A(text), A{text}, etc.
      if (lookahead.length >= 3 && this.isShapeStart(lookahead[1].type)) {
        console.log(`UIO DEBUG: Detected shaped node: ${nodeId} with shape ${lookahead[1].type}`);
        // Special-case dotted simple edge tokenization: A-.- + > + B => A -.-> B
        if (
          lookahead[1].type === 'TagEnd' &&
          lookahead[0]?.type === 'NODE_STRING' &&
          lookahead[0]?.value.endsWith('-.-') &&
          i + 2 < tokens.length &&
          (tokens[i + 2].type === 'Identifier' || tokens[i + 2].type === 'NODE_STRING')
        ) {
          // Delegate to edge parsing starting from the NODE_STRING token
          return this.parseEdgeStatement(tokens, i);
        }
        return this.parseShapedNode(tokens, i, inlineClasses);
      }

      if (this.yy) {
        // Create a simple node with default properties
        this.yy.addVertex(
          nodeId, // id
          { text: nodeId, type: 'text' }, // textObj
          undefined, // type
          [], // style
          inlineClasses, // classes - use inline classes from :::className syntax
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
   * Check if a token represents a shape start delimiter
   * Accepts either a token object or a token type string for backward compatibility
   */
  private isShapeStart(tokenOrType: { type: string; value: string } | string): boolean {
    const type = typeof tokenOrType === 'string' ? tokenOrType : tokenOrType.type;
    const val = typeof tokenOrType === 'string' ? '' : tokenOrType.value;

    // Base shape starts by token type
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

    if (shapeStarts.includes(type)) {
      return true;
    }

    // Some punctuation comes through as generic '⚠' tokens in the lexer
    // Treat '⚠' with value '>' as an odd-shape start
    if (type === '⚠' && val === '>') {
      return true;
    }

    return false;
  }

  /**
   * Parse a shaped node for a specific target ID (used for embedded arrow patterns)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index (should be at the shape start token)
   * @param targetId - The target node ID to apply the shape to
   * @returns Next index to process
   */
  private parseShapedNodeForTarget(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number,
    targetId: string
  ): number {
    console.log(`UIO DEBUG: parseShapedNodeForTarget: Creating shaped node for target ${targetId}`);

    // Create a virtual token sequence with the target ID followed by the shape tokens
    const virtualTokens = [
      {
        type: 'NODE_STRING',
        value: targetId,
        from: tokens[startIndex].from,
        to: tokens[startIndex].from,
      },
      ...tokens.slice(startIndex),
    ];

    // Parse as a shaped node starting from the virtual node token
    const nextIndex = this.parseShapedNode(virtualTokens, 0);

    // Adjust the return index to account for the virtual token
    return startIndex + (nextIndex - 1);
  }

  /**
   * Parse a shaped node like A[Square], B(Round), C{Diamond}
   * @param tokens - Array of tokens
   * @param startIndex - Starting index (should be at the node ID)
   * @param inlineClasses - Optional inline classes to apply to the node
   * @returns Next index to process
   */
  private parseShapedNode(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number,
    inlineClasses: string[] = []
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

    // Track string parsing state inside shape text
    let inString = false;
    let stringQuote: '"' | "'" | null = null;
    let seenStr = false; // saw a single quoted string token as entire text
    const sawEllipseCloseHyphen = false; // for ellipse (-text-)

    // Collect all tokens until we find any valid shape end delimiter
    while (i < tokens.length && !possibleEndTokens.includes(tokens[i].type)) {
      const tk = tokens[i];

      // If we get a complete quoted string token (STR), allow it only if it's the only content
      if (tk.type === 'STR') {
        if (shapeText.trim().length > 0 || seenStr) {
          throw new Error("got 'STR'");
        }
        shapeText += tk.value; // keep quotes; processNodeText will strip and classify
        seenStr = true;
        i++;
        continue;
      }

      // For ellipse shapes, stop when we encounter the closing hyphen
      if (actualShapeType === 'EllipseStart' && tk.type === 'Hyphen') {
        break; // This is the closing hyphen, don't include it in the text
      }

      // If a full STR was consumed as the only text, parentheses should trigger SQE (legacy)
      if (
        seenStr &&
        (tk.type === 'ParenStart' || tk.type === 'ParenEnd' || tk.value === '(' || tk.value === ')')
      ) {
        throw new Error("Expecting 'SQE'");
      }

      // Quote handling - mirror legacy JISON error behavior
      const isQuoteToken =
        tk.type === 'STR' ||
        tk.type === 'SQS' ||
        tk.type === 'SQE' ||
        tk.type === 'DQS' ||
        tk.type === 'DQE' ||
        (tk.type === '⚠' && (tk.value === '"' || tk.value === "'"));

      if (isQuoteToken) {
        const quoteChar: '"' | "'" = tk.value === "'" ? "'" : '"';

        if (!inString) {
          // If there is already plain text before a quote, error: mixing text and string
          if (shapeText.trim().length > 0) {
            throw new Error("got 'STR'");
          }
          // Enter string mode; do not include quote char itself in text
          inString = true;
          stringQuote = quoteChar;
          i++;
          continue;
        } else {
          // Already inside a string
          if (stringQuote === quoteChar) {
            // Closing the string
            inString = false;
            stringQuote = null;
            i++;
            continue;
          } else {
            // Nested/mismatched quote inside string
            throw new Error("Expecting 'SQE'");
          }
        }
      }

      // If inside a string, any parentheses should trigger the SQE error (unterminated string expected)
      if (
        inString &&
        (tk.type === 'ParenStart' || tk.type === 'ParenEnd' || tk.value === '(' || tk.value === ')')
      ) {
        throw new Error("Expecting 'SQE'");
      }

      // In square/rect shapes, parentheses are not allowed within text (legacy behavior)
      if ((actualShapeType === 'SquareStart' || actualShapeType === 'RectStart') && !inString) {
        if (tk.type === 'ParenStart' || tk.value === '(') {
          throw new Error("got 'PS'");
        }
        if (tk.type === 'ParenEnd' || tk.value === ')') {
          throw new Error("got 'PE'");
        }
      }

      // Note: We don't stop for statement keywords when inside shape delimiters
      // Keywords like 'linkStyle', 'classDef', etc. should be treated as regular text
      // when they appear inside shapes like [linkStyle] or (classDef)

      // Check for HTML tag pattern: < + tag_name + >
      if (
        tk.type === '⚠' &&
        tk.value === '<' &&
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
            const currentToken = tk;
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
        const currentToken = tk;
        const gap = currentToken.from - prevToken.to;

        if (gap > 0) {
          // Preserve original spacing (gap represents number of spaces)
          shapeText += ' '.repeat(gap);
        } else if (this.shouldAddSpaceBetweenTokens(shapeText, tk.value, tk.type)) {
          // Fall back to smart spacing if no gap
          shapeText += ' ';
        }
      }

      // Special handling for ellipse shapes: if this is the last token and it ends with '-',
      // strip the trailing hyphen as it's part of the shape syntax (-text-)
      let tokenValue = tk.value;
      if (
        actualShapeType === 'EllipseStart' &&
        tk.type === 'NODE_STRING' &&
        tokenValue.endsWith('-') &&
        (i + 1 >= tokens.length || possibleEndTokens.includes(tokens[i + 1].type))
      ) {
        tokenValue = tokenValue.slice(0, -1); // Remove trailing hyphen
        console.log(
          `UIO DEBUG: Stripped trailing hyphen from ellipse text: "${tk.value}" -> "${tokenValue}"`
        );
      }

      shapeText += tokenValue;
      i++;
    }

    // If we are still in a string when the shape ends or input ends, error
    if (inString) {
      throw new Error("Expecting 'SQE'");
    }

    // Special handling for ellipse end: need to skip the final hyphen
    if (
      actualShapeType === 'EllipseStart' && // Skip the final hyphen before the closing parenthesis
      i < tokens.length &&
      tokens[i].type === 'Hyphen'
    ) {
      i++;
    }

    // If we ran out of tokens before encountering the shape end, throw to avoid hanging
    if (i >= tokens.length) {
      throw new Error('Unexpected end of input');
    }

    // Capture the actual end token for shape mapping
    const actualEndToken = tokens[i].type;

    // Skip the shape end delimiter
    if (tokens[i].type === shapeEndType) {
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
      // Don't fall back to nodeId if shapeText is empty - empty text should remain empty
      const processedText = processNodeText(shapeText);

      // Create the shaped node
      this.yy.addVertex(
        nodeId, // id
        { text: processedText.text, type: processedText.type }, // textObj - processed text with correct type
        mapShapeType(nodeType), // type - the shape type (mapped to valid FlowVertexTypeParam)
        [], // style
        inlineClasses, // classes - use inline classes from :::className syntax
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
   * Check if a token type represents a statement-level keyword
   * @param tokenType - The token type to check
   * @returns True if it's a statement-level keyword
   */
  private isStatementKeyword(tokenType: string): boolean {
    const statementKeywords = [
      'CLICK',
      'STYLE',
      'LINKSTYLE',
      'CLASSDEF',
      'CLASS',
      'SUBGRAPH',
      'GRAPH',
      'GraphKeyword',
    ];
    return statementKeywords.includes(tokenType);
  }

  /**
   * Parse vertex chaining with ampersand (&) operator
   * Collects nodes into arrays for proper JISON-compatible addLink calls
   * Handles patterns like: A & B --> C (source chaining) and A --> B & C (target chaining)
   */
  private parseVertexChaining(tokens: Token[], startIndex: number): number {
    console.log(`UIO DEBUG: parseVertexChaining called at index ${startIndex}`);

    // Look back to find the previous node that should be part of the chain
    const prevNodeIndex = startIndex - 1;
    if (prevNodeIndex >= 0 && tokens[prevNodeIndex].type === 'NODE_STRING') {
      const prevNodeId = tokens[prevNodeIndex].value;

      // Check if this is a class application (starts with :::) - these should not participate in vertex chaining
      if (prevNodeId.startsWith(':::')) {
        console.log(
          `UIO DEBUG: parseVertexChaining: Skipping class application ${prevNodeId} - not a node for chaining`
        );

        // Check if we should apply retroactive target chaining
        const nextIndex = startIndex + 1;
        if (nextIndex < tokens.length && tokens[nextIndex].type === 'NODE_STRING') {
          const nextNodeId = tokens[nextIndex].value;
          console.log(
            `UIO DEBUG: parseVertexChaining: Checking for retroactive target chaining with ${nextNodeId}`
          );

          if (this.lastEdgeInfo) {
            console.log(
              `UIO DEBUG: parseVertexChaining: Applying retroactive target chaining - adding ${nextNodeId} to previous edge`
            );

            // Ensure the additional target node exists
            this.ensureNodeWithInlineClasses(nextNodeId);
            const { cleanNodeId } = this.extractInlineClasses(nextNodeId);

            // Create additional edge from all source nodes to the new target
            this.yy.addLink(this.lastEdgeInfo.sourceNodes, [cleanNodeId], {
              text: { text: this.lastEdgeInfo.edgeText, type: 'text' },
              type: this.lastEdgeInfo.edgeType,
              stroke: this.lastEdgeInfo.edgeStroke,
              length: 1,
            });

            // Update the last edge info to include the new target
            this.lastEdgeInfo.targetNodes.push(cleanNodeId);
            this.lastTargetNodes = [...this.lastEdgeInfo.targetNodes];

            console.log(
              `UIO DEBUG: parseVertexChaining: Created retroactive target chaining edge from [${this.lastEdgeInfo.sourceNodes.join(', ')}] to [${cleanNodeId}]`
            );

            // Skip both AMP and NODE_STRING tokens
            return startIndex + 2;
          }
        }

        return startIndex + 1; // Skip the AMP token and continue
      }

      console.log(`UIO DEBUG: parseVertexChaining: Found previous node ${prevNodeId} for chaining`);

      // Ensure the previous node exists with inline classes applied
      this.ensureNodeWithInlineClasses(prevNodeId);

      // Look ahead to find the next node after the AMP
      const nextIndex = startIndex + 1;
      if (nextIndex < tokens.length && tokens[nextIndex].type === 'NODE_STRING') {
        const nextNodeId = tokens[nextIndex].value;
        console.log(`UIO DEBUG: parseVertexChaining: Found next node ${nextNodeId} for chaining`);

        // Ensure the next node exists with inline classes applied
        this.ensureNodeWithInlineClasses(nextNodeId);

        // Determine if this is source chaining or target chaining
        // Look further back to see if there was a recent edge
        const hasRecentEdge = this.hasRecentEdgeInTokens(tokens, startIndex);

        const { cleanNodeId: cleanPrevNodeId } = this.extractInlineClasses(prevNodeId);
        const { cleanNodeId: cleanNextNodeId } = this.extractInlineClasses(nextNodeId);

        console.log(
          `UIO DEBUG: parseVertexChaining: cleanPrevNodeId=${cleanPrevNodeId}, cleanNextNodeId=${cleanNextNodeId}`
        );

        if (hasRecentEdge) {
          // Target chaining: A --> B & C (create A-->B and A-->C)
          console.log(`UIO DEBUG: parseVertexChaining: Target chaining detected`);
          // Add both nodes to target nodes collection
          if (this.currentTargetNodes.length === 0) {
            this.currentTargetNodes.push(cleanPrevNodeId);
          }
          this.currentTargetNodes.push(cleanNextNodeId);
          console.log(
            `UIO DEBUG: parseVertexChaining: Added ${cleanPrevNodeId} and ${cleanNextNodeId} to current target nodes: [${this.currentTargetNodes.join(', ')}]`
          );
        } else {
          // Source chaining: A & B --> C (create A-->C and B-->C)
          console.log(`UIO DEBUG: parseVertexChaining: Source chaining detected`);
          // Add both nodes to source nodes collection
          if (this.currentSourceNodes.length === 0) {
            // First time: add both previous and next nodes
            this.currentSourceNodes.push(cleanPrevNodeId);
            this.currentSourceNodes.push(cleanNextNodeId);
          } else {
            // Subsequent times: only add the next node (previous is already in the array)
            this.currentSourceNodes.push(cleanNextNodeId);
          }
          console.log(
            `UIO DEBUG: parseVertexChaining: Added ${cleanPrevNodeId} and ${cleanNextNodeId} to current source nodes: [${this.currentSourceNodes.join(', ')}]`
          );
        }
      }
    }

    // Skip the AMP token and continue
    return startIndex + 1;
  }

  /**
   * Check if there was a recent edge in the token stream (for target chaining detection)
   */
  private hasRecentEdgeInTokens(tokens: Token[], currentIndex: number): boolean {
    // Look back a few tokens to see if there was an edge
    for (let i = Math.max(0, currentIndex - 5); i < currentIndex; i++) {
      if (tokens[i].type === 'LINK' || tokens[i].type === 'Arrow' || tokens[i].type === 'TagEnd') {
        return true;
      }
    }
    return false;
  }

  /**
   * Collect additional target nodes for target chaining (A --> B & C & D)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index (after the first target)
   * @returns Object with additional target node IDs and number of tokens consumed
   */
  private collectAdditionalTargets(
    tokens: Token[],
    startIndex: number
  ): { additionalTargets: string[]; tokensConsumed: number } {
    const additionalTargets: string[] = [];
    let i = startIndex;
    const originalIndex = startIndex;

    // Look for pattern: AMP NODE_STRING (& C)
    while (
      i < tokens.length - 1 &&
      tokens[i].type === 'AMP' &&
      tokens[i + 1].type === 'NODE_STRING'
    ) {
      const targetNodeId = tokens[i + 1].value;
      const { cleanNodeId } = this.extractInlineClasses(targetNodeId);

      // Ensure the target node exists
      this.ensureNodeWithInlineClasses(targetNodeId);

      additionalTargets.push(cleanNodeId);
      console.log(`UIO DEBUG: collectAdditionalTargets: Found additional target ${cleanNodeId}`);

      i += 2; // Skip AMP and NODE_STRING
    }

    return {
      additionalTargets,
      tokensConsumed: i - originalIndex,
    };
  }

  /**
   * Parse sequential chaining patterns (A-->B-->C creates A-->B and B-->C)
   * @param tokens - Array of tokens
   * @param startIndex - Starting index (after the first edge)
   * @param currentTarget - The target of the first edge (becomes source of next edge)
   * @returns Array of additional edges to create
   */
  private parseSequentialChaining(
    tokens: Token[],
    startIndex: number,
    currentTarget: string
  ): { source: string; target: string }[] {
    const additionalEdges: { source: string; target: string }[] = [];
    let i = startIndex;
    let currentSource = currentTarget;

    // Look for pattern: TagEnd NODE_STRING-- TagEnd NODE_STRING (-->B-->C)
    while (i < tokens.length - 2) {
      // Check for TagEnd followed by NODE_STRING with arrow suffix
      if (
        tokens[i].type === 'TagEnd' &&
        tokens[i + 1].type === 'NODE_STRING' &&
        tokens[i + 1].value.endsWith('--')
      ) {
        // Extract the target node ID (remove the -- suffix)
        const targetNodeId = tokens[i + 1].value.slice(0, -2);
        const { cleanNodeId } = this.extractInlineClasses(targetNodeId);

        // Ensure the target node exists
        this.ensureNodeWithInlineClasses(targetNodeId);

        // Create the edge
        additionalEdges.push({ source: currentSource, target: cleanNodeId });
        console.log(
          `UIO DEBUG: parseSequentialChaining: Found sequential edge ${currentSource} --> ${cleanNodeId}`
        );

        // The target becomes the source for the next edge
        currentSource = cleanNodeId;
        i += 2; // Skip TagEnd and NODE_STRING
      } else if (
        tokens[i].type === 'TagEnd' &&
        tokens[i + 1].type === 'NODE_STRING' &&
        !tokens[i + 1].value.endsWith('--')
      ) {
        // Final node in the chain (no arrow suffix)
        const targetNodeId = tokens[i + 1].value;
        const { cleanNodeId } = this.extractInlineClasses(targetNodeId);

        // Ensure the target node exists
        this.ensureNodeWithInlineClasses(targetNodeId);

        // Create the final edge
        additionalEdges.push({ source: currentSource, target: cleanNodeId });
        console.log(
          `UIO DEBUG: parseSequentialChaining: Found final sequential edge ${currentSource} --> ${cleanNodeId}`
        );

        break; // End of chain
      } else {
        break; // No more sequential chaining
      }
    }

    return additionalEdges;
  }

  /**
   * Parse a style statement: style nodeId styleProperties
   * Example: style A background:#fff,border:1px solid red
   */
  private parseStyleStatement(tokens: Token[], startIndex: number): number {
    console.log(`UIO DEBUG: parseStyleStatement called at index ${startIndex}`);

    let i = startIndex + 1; // Skip the STYLE token

    // Get the node ID
    if (i >= tokens.length || tokens[i].type !== 'NODE_STRING') {
      console.log(`UIO DEBUG: parseStyleStatement: Expected node ID at index ${i}`);
      return i;
    }

    const nodeId = tokens[i].value;
    console.log(`UIO DEBUG: parseStyleStatement: nodeId=${nodeId}`);
    i++;

    // Collect style properties until we hit a semicolon or end of tokens
    // Handle comma-separated styles where each style can contain spaces
    const styleProperties: string[] = [];
    let currentStyle = '';

    while (i < tokens.length && tokens[i].type !== 'SEMI') {
      if (tokens[i].type === 'NODE_STRING') {
        if (currentStyle) {
          currentStyle += ' ' + tokens[i].value;
        } else {
          currentStyle = tokens[i].value;
        }
        console.log(`UIO DEBUG: parseStyleStatement: Building style: "${currentStyle}"`);
      } else if (
        tokens[i].type === '⚠' &&
        tokens[i].value === ',' && // Comma separates styles - save current style and start new one
        currentStyle
      ) {
        styleProperties.push(currentStyle);
        console.log(`UIO DEBUG: parseStyleStatement: Completed style: "${currentStyle}"`);
        currentStyle = '';
      }
      i++;
    }

    // Add the last style if there is one
    if (currentStyle) {
      styleProperties.push(currentStyle);
      console.log(`UIO DEBUG: parseStyleStatement: Completed final style: "${currentStyle}"`);
    }

    // Apply the styles to the node
    if (styleProperties.length > 0) {
      console.log(
        `UIO DEBUG: parseStyleStatement: Applying ${styleProperties.length} styles to node ${nodeId}`
      );

      // Ensure the node exists
      const existingVertices = this.yy.getVertices();
      if (!existingVertices.has(nodeId)) {
        this.yy.addVertex(
          nodeId,
          { text: nodeId, type: 'text' },
          undefined, // type
          [], // style
          [], // classes
          '', // dir
          {}, // props
          undefined // metadata
        );
      }

      // Apply styles to the node
      const vertex = existingVertices.get(nodeId);
      if (vertex) {
        // Initialize styles array if it doesn't exist
        if (!vertex.styles) {
          vertex.styles = [];
        }

        // Add all style properties to the vertex
        for (const styleProperty of styleProperties) {
          vertex.styles.push(styleProperty);
          console.log(
            `UIO DEBUG: parseStyleStatement: Added style "${styleProperty}" to vertex ${nodeId}`
          );
        }
      } else {
        console.log(
          `UIO DEBUG: parseStyleStatement: Vertex ${nodeId} not found, cannot apply styles`
        );
      }
    }

    return i;
  }

  /**
   * Parse a classDef statement: classDef className[,className2,...] styleProperties
   * Example: classDef exClass background:#bbb,border:1px solid red
   * Example: classDef firstClass,secondClass background:#bbb,border:1px solid red
   */
  private parseClassDefStatement(tokens: Token[], startIndex: number): number {
    console.log(`UIO DEBUG: parseClassDefStatement called at index ${startIndex}`);

    let i = startIndex + 1; // Skip the CLASSDEF token

    // Collect class names (comma-separated)
    const classNames: string[] = [];
    let collectingClassNames = true;

    while (i < tokens.length && tokens[i].type !== 'SEMI' && collectingClassNames) {
      if (tokens[i].type === 'NODE_STRING') {
        // Check if this looks like a style property (contains :)
        if (tokens[i].value.includes(':')) {
          // This is a style property, stop collecting class names
          collectingClassNames = false;
          break;
        } else {
          classNames.push(tokens[i].value);
          console.log(`UIO DEBUG: parseClassDefStatement: Added class name: ${tokens[i].value}`);
        }
      } else if (tokens[i].type === '⚠' && tokens[i].value === ',') {
        // Skip comma separators between class names
        console.log(
          `UIO DEBUG: parseClassDefStatement: Skipping comma separator between class names`
        );
      }
      i++;
    }

    if (classNames.length === 0) {
      console.log(`UIO DEBUG: parseClassDefStatement: No class names found`);
      return i;
    }

    // Now collect style properties until we hit a semicolon, end of tokens, or another statement
    // Handle comma-separated styles where each style can contain spaces
    const styleProperties: string[] = [];
    let currentStyle = '';

    while (i < tokens.length && this.shouldContinueParsingClassDef(tokens, i)) {
      if (tokens[i].type === 'NODE_STRING') {
        if (currentStyle) {
          // Calculate the actual spacing between tokens to preserve original formatting
          const prevToken = tokens[i - 1];
          const currentToken = tokens[i];
          const gap = currentToken.from - prevToken.to;
          const spacing = ' '.repeat(Math.max(1, gap)); // At least one space, but preserve original spacing
          currentStyle += spacing + tokens[i].value;
        } else {
          currentStyle = tokens[i].value;
        }
        console.log(`UIO DEBUG: parseClassDefStatement: Building style: "${currentStyle}"`);
      } else if (tokens[i].type === '⚠' && tokens[i].value === ',') {
        // Comma separates styles - save current style and start new one
        if (currentStyle) {
          styleProperties.push(currentStyle);
          console.log(`UIO DEBUG: parseClassDefStatement: Completed style: "${currentStyle}"`);
          currentStyle = '';
        }
      } else if (tokens[i].type === '⚠' && tokens[i].value.includes('%')) {
        // Handle special case like "%," for percentage values
        currentStyle += tokens[i].value.replace(',', '');
        console.log(`UIO DEBUG: parseClassDefStatement: Added percentage: "${tokens[i].value}"`);
      }
      i++;
    }

    // Add the last style if there is one
    if (currentStyle) {
      styleProperties.push(currentStyle);
      console.log(`UIO DEBUG: parseClassDefStatement: Completed final style: "${currentStyle}"`);
    }

    // Create the class definitions
    if (styleProperties.length > 0) {
      for (const className of classNames) {
        console.log(
          `UIO DEBUG: parseClassDefStatement: Creating class ${className} with ${styleProperties.length} styles`
        );

        // Store the class definition in the FlowDB
        if (this.yy.addClass) {
          // FlowDB.addClass expects a string[] array
          this.yy.addClass(className, styleProperties);
          console.log(
            `UIO DEBUG: parseClassDefStatement: Stored class ${className} with styles: [${styleProperties.join(', ')}]`
          );
        } else {
          // Fallback: try to access classes directly
          const classes = this.yy.getClasses();
          if (classes) {
            classes.set(className, { styles: styleProperties });
            console.log(
              `UIO DEBUG: parseClassDefStatement: Fallback stored class ${className} with ${styleProperties.length} styles`
            );
          }
        }
      }
    }

    return i;
  }

  /**
   * Helper method to extract inline classes from a node ID
   * Handles syntax like "nodeId:::className"
   * @param nodeId - The node ID that may contain inline classes
   * @returns Object with cleanNodeId and classes array
   */
  private extractInlineClasses(nodeId: string): { cleanNodeId: string; classes: string[] } {
    const classes: string[] = [];
    let cleanNodeId = nodeId;

    // First, handle inline classes (nodeId:::className)
    if (nodeId.includes(':::')) {
      const parts = nodeId.split(':::');
      cleanNodeId = parts[0];
      if (parts[1]) {
        classes.push(parts[1]);
        console.log(
          `UIO DEBUG: extractInlineClasses: Extracted class ${parts[1]} from node ${cleanNodeId}`
        );
      }
    }

    // Then, clean arrow suffixes (nodeId-- becomes nodeId)
    if (cleanNodeId.endsWith('--')) {
      cleanNodeId = cleanNodeId.slice(0, -2);
      console.log(
        `UIO DEBUG: extractInlineClasses: Cleaned arrow suffix, nodeId=${cleanNodeId} (was ${nodeId})`
      );
    }

    return { cleanNodeId, classes };
  }

  /**
   * Helper method to ensure a node exists with proper inline classes applied
   * @param nodeId - The node ID that may contain inline classes
   * @param textObj - Optional text object for the node
   * @param nodeType - Optional node type
   */
  private ensureNodeWithInlineClasses(
    nodeId: string,
    textObj?: { text: string; type: string },
    nodeType?: string
  ): string {
    const { cleanNodeId, classes } = this.extractInlineClasses(nodeId);

    if (this.yy) {
      // Check if node already exists
      const vertices = this.yy.getVertices();
      if (!vertices.has(cleanNodeId)) {
        // Create the node
        this.yy.addVertex(
          cleanNodeId,
          textObj || { text: cleanNodeId, type: 'text' },
          nodeType,
          [], // style
          classes, // classes from inline syntax
          '', // dir
          {}, // props
          undefined // metadata
        );
        console.log(
          `UIO DEBUG: ensureNodeWithInlineClasses: Created node ${cleanNodeId} with classes [${classes.join(', ')}]`
        );
      } else if (classes.length > 0) {
        // Node exists, apply classes
        const vertex = vertices.get(cleanNodeId);
        if (vertex) {
          if (!vertex.classes) {
            vertex.classes = [];
          }
          vertex.classes.push(...classes);
          console.log(
            `UIO DEBUG: ensureNodeWithInlineClasses: Applied classes [${classes.join(', ')}] to existing node ${cleanNodeId}`
          );
        }
      }
    }

    return cleanNodeId;
  }

  /**
   * Helper method to determine if we should continue parsing a classDef statement
   * Stops when encountering statement boundaries or other keywords
   */
  private shouldContinueParsingClassDef(
    tokens: { type: string; value: string; from: number; to: number }[],
    index: number
  ): boolean {
    if (index >= tokens.length) {
      return false;
    }

    const token = tokens[index];

    // Stop at semicolon (explicit statement terminator)
    if (token.type === 'SEMI') {
      return false;
    }

    // Stop at other statement keywords
    const statementKeywords = ['CLASSDEF', 'STYLE', 'CLASS', 'LINKSTYLE', 'GRAPH', 'SUBGRAPH'];
    if (statementKeywords.includes(token.type)) {
      return false;
    }

    // Stop at structural tokens that indicate a new statement
    const structuralTokens = ['AMP', 'LINK', 'Arrow'];
    if (structuralTokens.includes(token.type)) {
      return false;
    }

    // Check for significant gaps in token positions (indicates newlines/statement breaks)
    if (index > 0) {
      const prevToken = tokens[index - 1];
      const gap = token.from - prevToken.to;

      // If there's a significant gap (more than a few characters), it's likely a new statement
      // This handles cases where there are newlines between statements
      if (gap > 5) {
        console.log(
          `UIO DEBUG: shouldContinueParsingClassDef: Detected significant gap (${gap}) between tokens, stopping classDef parsing`
        );
        return false;
      }
    }

    // For NODE_STRING tokens, be more permissive to allow multi-word CSS values
    // Only stop if it's clearly not part of a style (like a node ID or keyword)
    if (token.type === 'NODE_STRING') {
      // Allow common CSS value words that don't contain colons
      const cssValueWords = [
        'solid',
        'red',
        'blue',
        'green',
        'black',
        'white',
        'bold',
        'italic',
        'px',
        'em',
        'rem',
        '%',
      ];
      const isLikelyCssValue = cssValueWords.some((word) =>
        token.value.toLowerCase().includes(word.toLowerCase())
      );

      // If it contains a colon, it's definitely a style property
      if (token.value.includes(':')) {
        return true;
      }

      // If it's a likely CSS value word, continue parsing
      if (isLikelyCssValue) {
        console.log(
          `UIO DEBUG: shouldContinueParsingClassDef: "${token.value}" looks like a CSS value, continuing`
        );
        return true;
      }

      // If it's a short token that could be a CSS value, continue
      if (token.value.length <= 6) {
        console.log(
          `UIO DEBUG: shouldContinueParsingClassDef: "${token.value}" is short, might be CSS value, continuing`
        );
        return true;
      }

      // Otherwise, it might be a node ID or other non-style token
      console.log(
        `UIO DEBUG: shouldContinueParsingClassDef: NODE_STRING "${token.value}" doesn't look like a style property, stopping`
      );
      return false;
    }

    // Continue parsing for style-related tokens
    return true;
  }

  /**
   * Map shape start type to FlowDB node type
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

      // Special case for backslash - don't add space if previous character is colon
      if (nextTokenValue === '\\' && lastChar === ':') {
        return false;
      }

      // Add space for other ⚠ tokens (like /, `, etc.)
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

    // First try complex arrow parsing (handles double-ended heads like x-- text --x and dotted x-. text .-x)
    const complex = this.parseComplexArrowPattern(tokens, i);
    let parsed = complex;

    // Fallback to simple edge pattern if complex did not match
    if (!parsed) {
      parsed = this.parseEdgePattern(tokens, i);
    }

    if (!parsed) {
      console.log(`UIO DEBUG: parseEdgeWithIdStatement: no valid arrow pattern after id`);
      return i + 1;
    }

    const { arrow: arrowVal, targetId, text, type, stroke, length, nextIndex } = parsed;
    i = nextIndex;

    console.log(
      `UIO DEBUG: Creating edge with ID: ${sourceId} --[${edgeId}]--> ${targetId} (text: "${text}")`
    );
    log.debug(
      `UIO Creating edge with ID: ${sourceId} --[${edgeId}]--> ${targetId} (text: "${text}")`
    );

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
  private parseEdgeWithIdContinuation(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    // Format: e4@-->D or unique@==>E, using lastTargetNodes as sources
    let i = startIndex;
    const edgeId = tokens[i].value; // e4
    i++; // skip id
    i++; // skip '@'
    const arrowToken = tokens[i];
    const targetToken = tokens[i + 1];
    if (!arrowToken || !(arrowToken.type === 'LINK' || arrowToken.type === 'Arrow')) {
      return i + 1;
    }
    if (!targetToken || targetToken.type !== 'NODE_STRING') {
      return i + 1;
    }

    const arrowVal = arrowToken.value;
    const targetId = targetToken.value;
    const type = this.getArrowType(arrowVal + '>');
    const stroke = this.getArrowStroke(arrowVal + '>');
    const length = this.getArrowLength(arrowVal + '>');
    i += 2;

    if (this.yy) {
      const sources =
        this.lastTargetNodes.length > 0
          ? [...this.lastTargetNodes]
          : this.lastReferencedNodeId
            ? [this.lastReferencedNodeId]
            : [];
      if (sources.length > 0) {
        // Ensure target exists (unless shaped next)
        const isTargetShaped = i < tokens.length && this.isShapeStart(tokens[i].type);
        if (!isTargetShaped) {
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

        // Add links; only the first link uses the provided id
        this.yy.addLink(sources, [targetId], {
          text: { text: '', type: 'text' },
          type,
          stroke,
          length,
          id: edgeId + '@',
        });
        // The FlowDB.addLink strips '@' and uses id for the first link only
      }
    }

    // Update lastTargetNodes for further continuations
    this.lastTargetNodes = [targetId];
    return i;
  }

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

    // Check for split arrow pattern like "A--" + ">" (which represents "A-->")
    const hasSplitArrow =
      i + 1 < tokens.length &&
      sourceToken.value.endsWith('--') &&
      tokens[i + 1].type === 'TagEnd' &&
      tokens[i + 1].value === '>';

    // Check for embedded arrow pattern like "A--x" followed by PIPE (for A--x|text|B)
    const hasEmbeddedArrowWithPipe =
      i + 1 < tokens.length &&
      /--[ox]$/.test(sourceToken.value) && // Ends with --x or --o
      tokens[i + 1].type === 'PIPE';

    // Check for embedded arrow pattern like "A--xv" where arrow is followed by node ID (for A--xv(text))
    const hasEmbeddedArrowWithNode =
      i + 1 < tokens.length &&
      /--[ox].+/.test(sourceToken.value) && // Contains --x or --o followed by more characters
      this.isShapeStart(tokens[i + 1].type); // Followed by a shape start

    // Check for dotted split arrow tail: NODE_STRING like "A-.-" followed by TagEnd:'>' => A -.->
    const dottedTailMatch = /^(?<id>.+?)-(?<dots>\.+)-$/.exec(sourceToken.value);
    const hasDottedSplitArrow =
      i + 1 < tokens.length &&
      !!dottedTailMatch &&
      tokens[i + 1].type === 'TagEnd' &&
      tokens[i + 1].value === '>';

    let sourceId: string;
    if (hasDottedSplitArrow) {
      sourceId = dottedTailMatch.groups!.id;
      console.log(
        `UIO DEBUG: parseEdgeStatement: detected dotted split arrow tail, sourceId=${sourceId}`
      );
    } else if (hasSplitArrow) {
      // Extract the actual node ID by removing the arrow part
      sourceId = sourceToken.value.slice(0, -2); // Remove the trailing "--"
      console.log(
        `UIO DEBUG: parseEdgeStatement: detected split arrow pattern, sourceId=${sourceId}`
      );
    } else if (hasEmbeddedArrowWithPipe) {
      // Extract the actual node ID by removing the arrow part (--x or --o)
      sourceId = sourceToken.value.slice(0, -3); // Remove the trailing "--x" or "--o"
      console.log(
        `UIO DEBUG: parseEdgeStatement: detected embedded arrow with pipe pattern, sourceId=${sourceId}`
      );
    } else if (hasEmbeddedArrowWithNode) {
      // Extract the actual node ID and target node from the combined token (e.g., "A--xv" -> "A" and "v")
      const match = /^(.+?)--[ox](.+)$/.exec(sourceToken.value);
      if (match) {
        sourceId = match[1]; // "A"
        const targetNodeId = match[2]; // "v"
        console.log(
          `UIO DEBUG: parseEdgeStatement: detected embedded arrow with node pattern, sourceId=${sourceId}, targetNodeId=${targetNodeId}`
        );
        // We'll handle this special case later in the parsing logic
      } else {
        sourceId = sourceToken.value;
      }
    } else {
      sourceId = sourceToken.value;
    }
    i++;

    // Check if this is a shaped source node (A[text], A(text), etc.)
    // But skip this check if we detected a split arrow or embedded arrow pattern
    if (
      !hasSplitArrow &&
      !hasEmbeddedArrowWithPipe &&
      !hasEmbeddedArrowWithNode &&
      i < tokens.length &&
      this.isShapeStart(tokens[i].type) &&
      tokens[i].type !== 'TagEnd' // Do not treat '>' as shape start in edge context; it's an arrow head
    ) {
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

    let edgeInfo;
    if (hasDottedSplitArrow) {
      const dots = dottedTailMatch.groups!.dots;
      const dotCount = dots.length;
      const arrow = `-${'.'.repeat(dotCount)}->`;
      // Expect current token at i is TagEnd '>' and next token is target
      if (
        i < tokens.length &&
        tokens[i].type === 'TagEnd' &&
        i + 1 < tokens.length &&
        (tokens[i + 1].type === 'Identifier' ||
          tokens[i + 1].type === 'NODE_STRING' ||
          tokens[i + 1].type === 'DIR')
      ) {
        const targetToken = tokens[i + 1];
        edgeInfo = {
          arrow,
          targetId: targetToken.value,
          text: '',
          type: this.getArrowType(arrow),
          stroke: this.getArrowStroke(arrow),
          length: this.getArrowLength(arrow),
          nextIndex: i + 2,
        };
      }
    } else if (hasEmbeddedArrowWithPipe) {
      // For embedded arrows like "A--x", extract the arrow and handle pipe-delimited text
      const arrowMatch = /--([ox])$/.exec(sourceToken.value);
      if (arrowMatch) {
        const arrowType = arrowMatch[1]; // 'x' or 'o'
        const arrow = `--${arrowType}`;
        console.log(`UIO DEBUG: parseEdgeStatement: extracted embedded arrow: ${arrow}`);

        // Handle pipe-delimited text pattern directly
        if (i < tokens.length && tokens[i].type === 'PIPE') {
          console.log(
            `UIO DEBUG: parseEdgeStatement: Found pipe after embedded arrow, parsing pipe-delimited text`
          );
          // Create a fake startIndex that points to where the arrow would be
          // We need to adjust the parsePipeDelimitedText to work with embedded arrows
          edgeInfo = this.parsePipeDelimitedTextForEmbedded(tokens, i - 1, arrow);
        }
      }
    } else if (hasEmbeddedArrowWithNode) {
      // For embedded arrows like "A--xv", extract the arrow and target node
      const match = /^(.+?)--([ox])(.+)$/.exec(sourceToken.value);
      if (match) {
        const arrowType = match[2]; // 'x' or 'o'
        const arrow = `--${arrowType}`;
        const targetNodeId = match[3]; // 'v'
        console.log(
          `UIO DEBUG: parseEdgeStatement: extracted embedded arrow with node: ${arrow}, target: ${targetNodeId}`
        );

        // Create edge info - let the main parser handle the target node shape
        edgeInfo = {
          arrow,
          targetId: targetNodeId,
          text: '',
          type: this.getArrowType(arrow),
          stroke: this.getArrowStroke(arrow),
          length: this.getArrowLength(arrow),
          nextIndex: i, // Point to the shape token so main parser can handle it
        };
      }
    } else {
      edgeInfo = this.parseEdgePattern(tokens, i);
    }

    if (!edgeInfo) {
      console.log(`UIO DEBUG: parseEdgePattern returned null`);
      return i + 1; // Skip if no valid edge pattern found
    }

    i = edgeInfo.nextIndex;

    // Extract inline classes from source and target nodes
    const cleanSourceId = this.ensureNodeWithInlineClasses(sourceId);
    const cleanTargetId = this.ensureNodeWithInlineClasses(edgeInfo.targetId);

    console.log(
      `UIO DEBUG: Creating edge: ${cleanSourceId} ${edgeInfo.arrow} ${cleanTargetId} (text: "${edgeInfo.text}", type: ${edgeInfo.type}, stroke: ${edgeInfo.stroke})`
    );

    if (this.yy) {
      // Check if target node is followed by a shape delimiter
      // If so, don't create it here - let the main parser handle it as a shaped node
      const isTargetShaped = i < tokens.length && this.isShapeStart(tokens[i].type);

      // For embedded arrow with node pattern, we need to check if the target should be shaped
      // by looking at the current token position which should be at the shape start
      const isEmbeddedTargetShaped =
        hasEmbeddedArrowWithNode && i < tokens.length && this.isShapeStart(tokens[i].type);

      console.log(
        `UIO DEBUG: parseEdgeStatement: targetId=${cleanTargetId}, nextToken=${tokens[i]?.type}:${tokens[i]?.value}, isTargetShaped=${isTargetShaped}, isEmbeddedTargetShaped=${isEmbeddedTargetShaped}`
      );

      if (!isTargetShaped && !isEmbeddedTargetShaped) {
        // Create target node if it doesn't exist or hasn't been properly configured
        // Check if vertex already exists and has custom text/type (indicating it was parsed as a shaped vertex)
        const existingVertices = this.yy.getVertices();
        const existingVertex = existingVertices.get(cleanTargetId);
        const hasCustomProperties =
          existingVertex &&
          (existingVertex.text !== edgeInfo.targetId || existingVertex.type !== undefined);

        if (!hasCustomProperties) {
          this.yy.addVertex(
            cleanTargetId,
            { text: cleanTargetId, type: 'text' },
            undefined, // type
            [], // style
            [], // classes
            '', // dir
            {}, // props
            undefined // metadata
          );
        }
      } else if (isEmbeddedTargetShaped) {
        console.log(
          `UIO DEBUG: parseEdgeStatement: Skipping target node creation for ${cleanTargetId} - will be handled as shaped node`
        );
        // Set the pending shaped target ID so the main parser knows to apply the next shape to this target
        this.pendingShapedTargetId = cleanTargetId;
      } else {
        // Target is shaped - track it for orphaned shape processing
        this.lastReferencedNodeId = cleanTargetId;
        console.log(
          `UIO DEBUG: Tracking lastReferencedNodeId = ${this.lastReferencedNodeId} for orphaned shape processing`
        );
      }

      // Process edge text for markdown
      const processedEdgeText = processNodeText(edgeInfo.text);

      // Determine source nodes: use collected source nodes if available, otherwise use current source
      let sourceNodes: string[] = [];
      if (this.currentSourceNodes.length > 0) {
        sourceNodes = [...this.currentSourceNodes];
        console.log(`UIO DEBUG: Using collected source nodes: [${sourceNodes.join(', ')}]`);
      } else {
        sourceNodes = [cleanSourceId];
        console.log(`UIO DEBUG: Using single source node: [${cleanSourceId}]`);
      }

      // Look ahead to see if there are additional target nodes (target chaining)
      let targetNodes = [cleanTargetId];
      const { additionalTargets, tokensConsumed } = this.collectAdditionalTargets(tokens, i);
      if (additionalTargets.length > 0) {
        targetNodes = targetNodes.concat(additionalTargets);
        console.log(`UIO DEBUG: Found additional targets: [${additionalTargets.join(', ')}]`);
        // Update the index to skip the additional target tokens
        i += tokensConsumed;
      }

      console.log(`UIO DEBUG: Final target nodes: [${targetNodes.join(', ')}]`);

      // Create edges using JISON-compatible addLink function
      console.log(
        `UIO DEBUG: Creating edges from [${sourceNodes.join(', ')}] to [${targetNodes.join(', ')}]`
      );
      this.yy.addLink(sourceNodes, targetNodes, {
        text: { text: processedEdgeText.text, type: processedEdgeText.type },
        type: edgeInfo.type,
        stroke: edgeInfo.stroke,
        length: edgeInfo.length,
      });

      // Store edge information for potential retroactive target chaining
      this.lastEdgeInfo = {
        sourceNodes: [...sourceNodes],
        targetNodes: [...targetNodes],
        edgeText: processedEdgeText.text,
        edgeType: edgeInfo.type,
        edgeStroke: edgeInfo.stroke,
      };
      console.log(
        `UIO DEBUG: Stored last edge info for retroactive chaining: [${sourceNodes.join(', ')}] to [${targetNodes.join(', ')}]`
      );

      // Handle sequential chaining: detect and create additional edges
      if (edgeInfo.isSequentialChaining) {
        console.log(`UIO DEBUG: Sequential chaining detected, looking for additional edges`);
        const additionalEdges = this.parseSequentialChaining(tokens, i, cleanTargetId);
        for (const additionalEdge of additionalEdges) {
          console.log(
            `UIO DEBUG: Creating sequential edge: ${additionalEdge.source} --> ${additionalEdge.target}`
          );
          this.yy.addLink([additionalEdge.source], [additionalEdge.target], {
            text: { text: '', type: 'text' },
            type: edgeInfo.type,
            stroke: edgeInfo.stroke,
            length: edgeInfo.length,
          });
        }
        // Update the index to skip the processed tokens
        i += additionalEdges.length * 2; // Each additional edge is TagEnd + NODE_STRING
      }

      // Store target nodes for potential continuation edges
      this.lastTargetNodes = [...targetNodes];
      console.log(
        `UIO DEBUG: Stored target nodes for continuation: [${this.lastTargetNodes.join(', ')}]`
      );

      // Clear source nodes after creating edges
      this.currentSourceNodes = [];
      console.log(`UIO DEBUG: Cleared current source nodes`);

      // Clear any remaining pending chain nodes (legacy)
      if (this.pendingChainNodes.length > 0) {
        this.pendingChainNodes = [];
        console.log(`UIO DEBUG: Cleared legacy pending chain nodes`);
      }
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
    isSequentialChaining?: boolean;
  } | null {
    let i = startIndex;
    log.debug(
      `UIO DEBUG: parseEdgePattern called at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
    );

    // Check for split arrow pattern (TagEnd with ">")
    let firstArrow: string;
    if (i < tokens.length && tokens[i].type === 'TagEnd' && tokens[i].value === '>') {
      // This is the ">" part of a split arrow like "A--" + ">"
      firstArrow = '-->';
      log.debug(
        `UIO DEBUG: parseEdgePattern: Detected split arrow pattern, treating as "${firstArrow}"`
      );
      i++;
    } else if (i < tokens.length && (tokens[i].type === 'Arrow' || tokens[i].type === 'LINK')) {
      // Regular arrow token
      firstArrow = tokens[i].value;
      i++;
    } else {
      log.debug(`UIO DEBUG: parseEdgePattern: No arrow/link token found at index ${i}`);
      return null;
    }

    // Attempt to normalize split arrow-heads like LINK:"--" + NODE_STRING:"x"/"o"
    let arrowStartIndex = startIndex; // index of the last arrow-related token
    if (
      !this.isCompleteArrow(firstArrow) &&
      i < tokens.length &&
      tokens[i].type === 'NODE_STRING' &&
      (tokens[i].value === 'x' || tokens[i].value === 'o')
    ) {
      firstArrow = `${firstArrow}${tokens[i].value}`; // e.g., "--" + "x" => "--x"
      arrowStartIndex = i; // last arrow-related token index
      i++; // consume head token
      log.debug(`UIO DEBUG: parseEdgePattern: merged split head, firstArrow="${firstArrow}"`);
    }

    // Check if this is a simple arrow (A --> B) or complex (A<-- text -->B)
    const isNowComplete = this.isCompleteArrow(firstArrow);
    log.debug(
      `UIO DEBUG: parseEdgePattern: firstArrow="${firstArrow}", isCompleteArrow=${isNowComplete}`
    );
    if (isNowComplete) {
      // Check for pipe-delimited text pattern: A---|text|B
      log.debug(
        `UIO DEBUG: parseEdgePattern: Checking for pipe at index ${i}, token: ${tokens[i]?.type}:${tokens[i]?.value}`
      );
      if (i < tokens.length && tokens[i].type === 'PIPE') {
        log.debug(`UIO DEBUG: parseEdgePattern: Found pipe, calling parsePipeDelimitedText`);
        // Use the index of the last arrow token so parsePipeDelimitedText finds the pipe at +1
        const pdStart = arrowStartIndex;
        return this.parsePipeDelimitedText(tokens, pdStart, firstArrow);
      }

      // Special-case: dotted labelled simple edge like: A -. Label .- B (length 1..)
      // After firstArrow ('-.'), expect: LABEL (NODE_STRING), CLOSING LINK ('.-','..-','...-'), TARGET (Identifier/NODE_STRING/DIR)
      if (
        firstArrow === '-.' &&
        i + 2 < tokens.length &&
        tokens[i].type === 'NODE_STRING' &&
        tokens[i + 1].type === 'LINK' &&
        /^(\.+)-$/.test(tokens[i + 1].value) &&
        (tokens[i + 2].type === 'Identifier' ||
          tokens[i + 2].type === 'NODE_STRING' ||
          tokens[i + 2].type === 'DIR')
      ) {
        const labelToken = tokens[i];
        const closingLink = tokens[i + 1].value; // e.g., '.-', '..-', '...-'
        const targetToken = tokens[i + 2];

        const dotCount = (closingLink.match(/\./g) ?? []).length; // 1..N
        const targetId = targetToken.value;
        i = i + 3; // consume label, closing link, and target

        const arrowCanonical = `-${'.'.repeat(dotCount)}-`;
        return {
          arrow: arrowCanonical,
          targetId,
          text: labelToken.value,
          type: 'arrow_open',
          stroke: 'dotted',
          length: dotCount,
          nextIndex: i,
        };
      }

      // Special-case: dotted labelled with arrow head like: A -. Label .-> B (length 1..)
      // After firstArrow ('-.'), expect: LABEL (NODE_STRING), CLOSING LINK WITH HEAD ('.->','..->','...->'), TARGET
      if (
        firstArrow === '-.' &&
        i + 2 < tokens.length &&
        tokens[i].type === 'NODE_STRING' &&
        tokens[i + 1].type === 'LINK' &&
        /^(\.+)->$/.test(tokens[i + 1].value) &&
        (tokens[i + 2].type === 'Identifier' ||
          tokens[i + 2].type === 'NODE_STRING' ||
          tokens[i + 2].type === 'DIR')
      ) {
        const labelToken = tokens[i];
        const closingLinkWithHead = tokens[i + 1].value; // '.->', '..->', ...
        const targetToken = tokens[i + 2];

        const dotCount = (closingLinkWithHead.match(/\./g) ?? []).length; // 1..N
        const targetId = targetToken.value;
        i = i + 3; // consume label, closing + head, and target

        // Canonicalize to dotted arrow with point head of matching length
        const arrowCanonical = `-${'.'.repeat(dotCount)}->`;
        return {
          arrow: arrowCanonical,
          targetId,
          text: labelToken.value,
          type: 'arrow_point',
          stroke: 'dotted',
          length: dotCount,
          nextIndex: i,
        };
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

      // Check for sequential chaining pattern (e.g., B-- in A-->B-->C)
      if (targetId.endsWith('--')) {
        // This is a sequential chain - extract the actual node ID
        const actualTargetId = targetId.slice(0, -2); // Remove the trailing "--"
        console.log(
          `UIO DEBUG: parseEdgePattern: Detected sequential chaining, targetId=${actualTargetId} (was ${targetId})`
        );

        // For sequential chaining, the target becomes the source for the next edge
        // We'll handle this in parseEdgeStatement by setting up the next source
        console.log(
          `UIO DEBUG: parseEdgePattern: Sequential chaining detected - ${actualTargetId} will be source for next edge`
        );

        return {
          arrow: firstArrow,
          targetId: actualTargetId,
          text: '',
          type: this.getArrowType(firstArrow),
          stroke: this.getArrowStroke(firstArrow),
          length: this.getArrowLength(firstArrow),
          nextIndex: i,
          isSequentialChaining: true, // Flag to indicate sequential chaining
        };
      }

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

      // Remove arrow heads and count the remaining connector characters
      let connector = arrow;

      // Remove left arrow heads
      connector = connector.replace(/^[<ox]/, '');

      // Remove right arrow heads
      connector = connector.replace(/[>ox]$/, '');

      // Count the connector characters (-, =)
      const matches = connector.match(/[=-]/g);
      const totalConnectors = matches ? matches.length : 0;

      // Subtraction rules to align with JISON tests:
      // - Open-ended (no heads): length = connectors - 2
      // - Single-ended OR double-ended (has any head): length = connectors - 1
      const subtraction = hasLeftArrow || hasRightArrow ? 1 : 2;

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
   * Parse pipe-delimited text pattern for embedded arrows (A--x|text|B)
   */
  private parsePipeDelimitedTextForEmbedded(
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
    console.log(`UIO DEBUG: parsePipeDelimitedTextForEmbedded called with arrow: ${arrow}`);
    let i = startIndex + 1; // Skip the source token, start at the first pipe

    // Expect first pipe
    if (i >= tokens.length || tokens[i].type !== 'PIPE') {
      console.log(
        `UIO DEBUG: parsePipeDelimitedTextForEmbedded: Expected first pipe, got ${tokens[i]?.type}`
      );
      return null;
    }
    i++; // Skip first pipe

    // Collect text tokens until we find the closing pipe using smart spacing
    let text = '';
    while (i < tokens.length && tokens[i].type !== 'PIPE') {
      const t = tokens[i];
      // Smart space handling: only add space if needed
      if (text && this.shouldAddSpaceBetweenTokens(text, t.value, t.type)) {
        text += ' ';
      }
      // Normalize single-character separator tokens that lexer may emit
      if (t.type === 'SLASH') {
        text += '/';
      } else if (t.type === 'BACKTICK') {
        text += '`';
      } else {
        text += t.value;
      }
      i++;
    }

    // Expect closing pipe
    if (i >= tokens.length || tokens[i].type !== 'PIPE') {
      return null;
    }
    i++; // Skip closing pipe

    // Expect target node
    if (
      i >= tokens.length ||
      (tokens[i].type !== 'Identifier' && tokens[i].type !== 'NODE_STRING')
    ) {
      return null;
    }

    const targetId = tokens[i].value;
    i++;

    console.log(
      `UIO DEBUG: parsePipeDelimitedTextForEmbedded: Successfully parsed - arrow: ${arrow}, text: "${text}", target: ${targetId}`
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
      const t = tokens[i];
      // Smart space handling: only add space if needed
      if (text && this.shouldAddSpaceBetweenTokens(text, t.value, t.type)) {
        text += ' ';
      }
      // Normalize single-character separator tokens that lexer may emit
      if (t.type === 'SLASH') {
        text += '/';
      } else if (t.type === 'BACKTICK') {
        text += '`';
      } else {
        text += t.value;
      }
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
      /^-\.+-?$/, // -.--, -.-, etc. (legacy)
      /^\.+-?$/, // .-, .--, etc. (legacy)
      /^\.+-[>ox]$/, // .-x, ..-o (closing dotted with head)
      /^<-+$/, // <--, <---, etc.
      /^<=+$/, // <==, <===, etc.
      /^[ox]-+$/, // o--, x--, etc.
      /^-+[ox]$/, // --o, --x, etc.
      /^[ox]=+$/, // o==, x==, etc. (thick open with head)
      /^=+[ox]$/, // ==o, ==x, etc. (thick close with head)
      /^<-\.$/, // <-.
      /^\.->$/, // .->
      /^=+$/, // open thick continuation (==, ===)
      /^-+$/, // open normal continuation (--, ---)
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
    log.debug(`UIO parseComplexArrowPattern called at index ${startIndex}`);
    let i = startIndex;

    // Collect all tokens until we find the target identifier
    const arrowParts: string[] = [];
    let text = '';
    let targetId = '';
    let foundText = false;

    while (i < tokens.length) {
      const token = tokens[i];
      log.debug(
        `UIO parseComplexArrowPattern: processing token ${i}: ${token.type}:${token.value}`
      );

      // Handle double-ended arrow heads tokenized as identifiers (e.g., 'x' or 'o')
      if (
        (token.type === 'Identifier' || token.type === 'NODE_STRING') &&
        (token.value === 'x' || token.value === 'o') &&
        arrowParts.length === 0
      ) {
        log.debug(`UIO parseComplexArrowPattern: treating '${token.value}' as arrow head prefix`);
        arrowParts.push(token.value);
        i++;
        continue;
      }

      // Handle combined head+open part tokens like 'x--', 'o--', 'x==', 'o==', 'x-.', 'o-.'
      if (
        (token.type === 'Identifier' || token.type === 'NODE_STRING') &&
        arrowParts.length === 0
      ) {
        const m = /^(x|o)(--|==|-\.+)$/.exec(token.value);
        if (m) {
          log.debug(
            `UIO parseComplexArrowPattern: splitting combined head+open '${token.value}' into '${m[1]}' and '${m[2]}'`
          );
          arrowParts.push(m[1]);
          arrowParts.push(m[2]);
          i++;
          continue;
        }
      }

      if (token.type === 'Arrow' || token.type === 'LINK') {
        log.debug(`UIO parseComplexArrowPattern: found Arrow/LINK token: ${token.value}`);

        // If we already have text, check if this LINK token should be treated as text or arrow part
        if (foundText && !this.isArrowContinuation(token.value)) {
          // This LINK token is part of the text, not the arrow
          log.debug(`UIO parseComplexArrowPattern: treating LINK as text: ${token.value}`);
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
        // Handle quoted strings for edge text; preserve quotes so processNodeText can derive labelType
        log.debug(`UIO parseComplexArrowPattern: found STR token: ${token.value}`);
        if (!foundText) {
          log.debug(
            `UIO parseComplexArrowPattern: setting text = ${token.value} (from STR, preserving quotes)`
          );
          text = token.value; // Keep surrounding quotes; downstream will classify as 'string' or 'markdown'
          foundText = true;
        }
      } else if (token.type === 'At') {
        // Treat '@' as part of label text, not as an edge-id marker inside complex edge parsing
        log.debug(`UIO parseComplexArrowPattern: treating '@' as text`);
        if (!foundText) {
          text = '@';
          foundText = true;
        } else if (arrowParts.length <= 1) {
          text += ' @';
        } else {
          // If we've already started the right side arrow, '@' cannot be part of the arrow, so ignore or append conservatively
          text += ' @';
        }
      } else if (
        token.type === 'Identifier' ||
        token.type === 'NODE_STRING' ||
        this.isTextToken(token.type)
      ) {
        // This could be text or the target node
        // For single-ended arrows like A e1@----x B, B should be the target directly
        // For double-ended arrows like A x-- text --x B, text is in the middle

        // Check if this is a single-ended arrow (arrow parts contain only one complete arrow)
        const fullArrow = arrowParts.join('');

        // Look ahead to see if there's another Arrow token (indicating double-ended arrow)
        let hasSecondArrow = false;
        for (let j = i + 1; j < tokens.length && j < i + 6; j++) {
          if (tokens[j].type === 'Arrow' || tokens[j].type === 'LINK') {
            hasSecondArrow = true;
            break;
          }
          if (tokens[j].type === 'SEMI') {
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
          log.debug(
            `UIO parseComplexArrowPattern: setting targetId = ${token.value} (single-ended arrow)`
          );
          targetId = token.value;
          i++;
          break;
        } else if (arrowParts.length > 0 && !foundText) {
          // This is text in the middle of a double-ended arrow
          log.debug(
            `UIO parseComplexArrowPattern: setting text = ${token.value} (double-ended arrow)`
          );
          text = token.value;
          foundText = true;
        } else if (foundText && arrowParts.length <= 1) {
          // Continue collecting multi-word text until the second arrow begins
          log.debug(`UIO parseComplexArrowPattern: appending to text: ${token.value}`);
          text += ' ' + token.value;
        } else if (foundText && arrowParts.length >= 2) {
          // We have text collected and have encountered the second arrow.
          // The current token is the identifier immediately after the second arrow.
          log.debug(
            `UIO parseComplexArrowPattern: setting targetId = ${token.value} (double-ended arrow with text)`
          );
          targetId = token.value;
          i++;
          break;
        } else {
          // NOTE: fixed stray closing brace
          // No arrow parts yet, this might be the start of a pattern
          // But be conservative - don't assume single chars are arrow parts
          log.debug(`UIO parseComplexArrowPattern: no arrow parts yet, breaking`);
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
    if (i >= tokens.length || tokens[i].type !== 'DIR') {
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

  /**
   * Parse a class statement: class nodeId[,nodeId2,...] className
   * Example: class a,b exClass
   */
  private parseClassStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    console.log(`UIO DEBUG: parseClassStatement called at index ${startIndex}`);

    let i = startIndex + 1; // Skip the CLASS token

    // Collect all NODE_STRING tokens first, then determine which is the class name
    const allTokens: string[] = [];

    while (i < tokens.length && tokens[i].type !== 'SEMI') {
      if (tokens[i].type === 'NODE_STRING') {
        allTokens.push(tokens[i].value);
        console.log(`UIO DEBUG: parseClassStatement: Found token: ${tokens[i].value}`);
      } else if (tokens[i].type === '⚠' && tokens[i].value === ',') {
        // Skip comma separators
        console.log(`UIO DEBUG: parseClassStatement: Skipping comma separator`);
      }
      i++;
    }

    if (allTokens.length === 0) {
      console.log(`UIO DEBUG: parseClassStatement: No tokens found`);
      return i;
    }

    // The last token is the class name, all others are node IDs
    const nodeIds = allTokens.slice(0, -1);
    const className = allTokens[allTokens.length - 1];

    console.log(
      `UIO DEBUG: parseClassStatement: nodeIds=[${nodeIds.join(', ')}], className=${className}`
    );

    if (nodeIds.length === 0) {
      console.log(`UIO DEBUG: parseClassStatement: No node IDs found`);
      return i;
    }

    // Apply the class to all specified nodes
    const vertices = this.yy?.getVertices();
    if (vertices) {
      for (const nodeId of nodeIds) {
        console.log(
          `UIO DEBUG: parseClassStatement: Applying class ${className} to node ${nodeId}`
        );

        // Ensure the node exists
        if (!vertices.has(nodeId)) {
          this.yy.addVertex(
            nodeId,
            { text: nodeId, type: 'text' },
            undefined, // type
            [], // style
            [], // classes
            '', // dir
            {}, // props
            undefined // metadata
          );
        }

        // Apply the class to the node
        const vertex = vertices.get(nodeId);
        if (vertex) {
          if (!vertex.classes) {
            vertex.classes = [];
          }
          vertex.classes.push(className);
          console.log(
            `UIO DEBUG: parseClassStatement: Applied class ${className} to vertex ${nodeId}`
          );
        }
      }
    }

    return i;
  }

  /**
   * Parse an edge property block: edgeId@{property: value, ...}
   * Example: e1@{curve: basis}
   * Example: uniqueName@{curve: cardinal, animate: true}
   */
  private parseEdgePropertyBlock(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    console.log(`UIO DEBUG: parseEdgePropertyBlock called at index ${startIndex}`);

    let i = startIndex;

    // Get edge ID
    const edgeId = tokens[i].value;
    console.log(`UIO DEBUG: parseEdgePropertyBlock: edgeId = ${edgeId}`);
    i++; // Skip edge ID

    // Skip '@' symbol
    i++; // Skip '@'

    // Skip '{' symbol
    i++; // Skip '{'

    // Collect property data until we find the closing '}'
    let propertyData = '';
    let braceCount = 1; // We already consumed the opening brace

    while (i < tokens.length && braceCount > 0) {
      const token = tokens[i];

      if (token.type === 'DiamondStart' && token.value === '{') {
        braceCount++;
        propertyData += token.value;
      } else if (token.type === 'DiamondEnd' && token.value === '}') {
        braceCount--;
        if (braceCount > 0) {
          propertyData += token.value;
        }
      } else {
        // Add spacing between tokens to preserve original formatting
        if (
          propertyData &&
          this.shouldAddSpaceBetweenTokens(propertyData, token.value, token.type)
        ) {
          propertyData += ' ';
        }
        propertyData += token.value;
      }
      i++;
    }

    console.log(`UIO DEBUG: parseEdgePropertyBlock: propertyData = "${propertyData}"`);

    // Apply the property data to the edge using the existing addVertex method
    // which handles both nodes and edges based on the ID
    if (this.yy && propertyData.trim()) {
      this.yy.addVertex(
        edgeId,
        { text: '', type: 'text' },
        undefined,
        [],
        [],
        '',
        {},
        propertyData.trim()
      );
      console.log(`UIO DEBUG: parseEdgePropertyBlock: Applied properties to edge ${edgeId}`);
    }

    return i;
  }

  /**
   * Parse a linkStyle statement: linkStyle edgeIndex[,edgeIndex2,...] styleProperties
   * Example: linkStyle 0 stroke-width:1px
   * Example: linkStyle 10,11 stroke-width:1px
   */
  private parseLinkStyleStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    console.log(`UIO DEBUG: parseLinkStyleStatement called at index ${startIndex}`);

    let i = startIndex + 1; // Skip the LINKSTYLE token

    // Handle DEFAULT or explicit indices
    const positions: ('default' | number)[] = [];

    // Expect either DEFAULT or a numList
    if (i < tokens.length && tokens[i].type === 'DEFAULT') {
      positions.push('default');
      i++;
    } else {
      // Parse numList: NUM (COMMA NUM)*
      while (i < tokens.length && tokens[i].type !== 'SEMI') {
        if (tokens[i].type === 'NODE_STRING' && /^\d+$/.test(tokens[i].value)) {
          positions.push(parseInt(tokens[i].value, 10));
        } else if (tokens[i].type === '⚠' && tokens[i].value === ',') {
          // skip comma
        } else {
          break;
        }
        i++;
      }
    }

    // Optional: SPACE INTERPOLATE SPACE alphaNum
    let interpolateValue: string | undefined;
    if (i < tokens.length && tokens[i].type === 'INTERPOLATE') {
      // consume INTERPOLATE
      i++;
      // consume the value (as NODE_STRING)
      if (i < tokens.length && tokens[i].type === 'NODE_STRING') {
        interpolateValue = tokens[i].value;
        i++;
      }
    }

    // Decide if we should collect styles: only if a ';' appears before the next LINKSTYLE (to avoid swallowing next statement)
    let shouldCollectStyles = false;
    for (let j = i; j < tokens.length; j++) {
      if (tokens[j].type === 'SEMI') {
        shouldCollectStyles = true;
        break;
      }
      if (tokens[j].type === 'LINKSTYLE') {
        shouldCollectStyles = false;
        break;
      }
    }

    // Collect styles until ';' (style tokens are NODE_STRING, plus commas split styles)
    const styles: string[] = [];
    if (shouldCollectStyles) {
      let currentStyle = '';
      while (i < tokens.length && tokens[i].type !== 'SEMI') {
        const t = tokens[i];
        if (t.type === 'NODE_STRING') {
          currentStyle = currentStyle ? currentStyle + ' ' + t.value : t.value;
        } else if (t.type === '⚠' && t.value === ',' && currentStyle) {
          styles.push(currentStyle);
          currentStyle = '';
        }
        i++;
      }
      if (currentStyle) {
        styles.push(currentStyle);
      }
    }

    // Apply interpolate first (exactly like JISON)
    if (interpolateValue && positions.length > 0 && this.yy?.updateLinkInterpolate) {
      this.yy.updateLinkInterpolate(positions, interpolateValue);
    }

    // Apply styles (if any)
    if (styles.length > 0 && positions.length > 0 && this.yy?.updateLink) {
      this.yy.updateLink(positions, styles);
    }

    return i;
  }

  /**
   * Parse accTitle: single-line accessibility title
   */
  private parseAccTitleStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;
    // Consume 'accTitle'
    i++;
    // Optional ':' which may come as a generic token (⚠) with value ':'
    if (i < tokens.length && tokens[i].value.trim() === ':') {
      i++;
    }

    // Collect text until semicolon or statement boundary/newline gap
    let title = '';
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === 'SEMI') {
        i++;
        break;
      }
      // Stop on obvious statement starters/structural tokens
      if (
        ['GRAPH', 'SUBGRAPH', 'STYLE', 'CLASSDEF', 'CLASS', 'LINKSTYLE', 'CLICK'].includes(
          t.type
        ) ||
        t.type === 'AMP' ||
        t.type === 'LINK' ||
        t.type === 'Arrow'
      ) {
        break;
      }
      // Stop if large gap (newline) and we already collected some text
      if (title.length > 0 && i > startIndex + 1) {
        const prev = tokens[i - 1];
        const gap = t.from - prev.to;
        if (gap > 5) {
          break;
        }
      }

      // Append with spacing rules
      if (title.length === 0) {
        title = t.value;
      } else {
        if (this.shouldAddSpaceBetweenTokens(title, t.value, t.type)) {
          title += ' ' + t.value;
        } else {
          title += t.value;
        }
      }
      i++;
    }

    title = title.trim();
    if (this.yy && typeof (this.yy as any).setAccTitle === 'function') {
      (this.yy as any).setAccTitle(title);
    }

    return i;
  }

  /**
   * Parse accDescr: single-line or block form with braces
   */
  private parseAccDescrStatement(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;
    // Consume 'accDescr'
    i++;

    // Optional ':' which may come as a generic token (⚠) with value ':'
    if (i < tokens.length && tokens[i].value.trim() === ':') {
      i++;
    }

    // Block form if next token is DiamondStart ("{")
    if (i < tokens.length && tokens[i].type === 'DiamondStart') {
      const blockStart = tokens[i]; // '{'
      i++;
      // Find matching DiamondEnd ("}")
      let j = i;
      let blockEndIndex = -1;
      while (j < tokens.length) {
        if (tokens[j].type === 'DiamondEnd') {
          blockEndIndex = j;
          break;
        }
        j++;
      }
      if (blockEndIndex === -1) {
        // No closing brace; fall back to single-line accumulation
        return this.parseAccDescrSingleLine(tokens, i);
      }

      // Extract substring from original source preserving newlines, trim indentation and empty lines
      const startPos = blockStart.to; // position right after '{'
      const endPos = tokens[blockEndIndex].from; // position right before '}'
      let raw = '';
      try {
        raw = this.originalSource.slice(startPos, endPos);
      } catch (e) {
        // Fallback to token concat if something goes wrong
        return this.parseAccDescrSingleLine(tokens, i);
      }

      const lines = raw
        .split(/\r?\n/)
        .map((ln) => ln.trim())
        .filter((ln) => ln.length > 0);
      const descr = lines.join('\n');

      if (this.yy && typeof (this.yy as any).setAccDescription === 'function') {
        (this.yy as any).setAccDescription(descr);
      }

      // Move index past the closing brace
      return blockEndIndex + 1;
    }

    // Otherwise, treat as single-line form
    return this.parseAccDescrSingleLine(tokens, i);
  }

  private parseAccDescrSingleLine(
    tokens: { type: string; value: string; from: number; to: number }[],
    startIndex: number
  ): number {
    let i = startIndex;
    let descr = '';

    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === 'SEMI') {
        i++;
        break;
      }
      // Stop at obvious statement boundaries
      if (
        ['GRAPH', 'SUBGRAPH', 'STYLE', 'CLASSDEF', 'CLASS', 'LINKSTYLE', 'CLICK'].includes(
          t.type
        ) ||
        t.type === 'AMP' ||
        t.type === 'LINK' ||
        t.type === 'Arrow'
      ) {
        break;
      }

      // Stop if large gap (newline) and we already collected some text
      if (descr.length > 0) {
        const prev = tokens[i - 1];
        const gap = t.from - prev.to;
        if (gap > 5) {
          break;
        }
      }

      if (descr.length === 0) {
        descr = t.value;
      } else {
        if (this.shouldAddSpaceBetweenTokens(descr, t.value, t.type)) {
          descr += ' ' + t.value;
        } else {
          descr += t.value;
        }
      }
      i++;
    }

    descr = descr.trim();
    if (this.yy && typeof (this.yy as any).setAccDescription === 'function') {
      (this.yy as any).setAccDescription(descr);
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
