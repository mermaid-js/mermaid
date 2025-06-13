import type { IToken } from 'chevrotain';
import { FlowchartParser } from './flowParser.js';

// Define interfaces matching existing Mermaid structures
interface Vertex {
  id: string;
  text?: string;
  type?: string;
  style?: string;
  classes?: string[];
  dir?: string;
  props?: Record<string, string>;
}

interface Edge {
  start: string | string[];
  end: string | string[];
  type?: string;
  stroke?: string;
  length?: number;
  text?: string;
}

interface ParseResult {
  vertices: Record<string, Vertex>;
  edges: Edge[];
  classes: Record<string, string>;
  subGraphs: any[];
  direction: string;
  clickEvents: any[];
  tooltips: Record<string, string>;
  accTitle: string;
  accDescription: string;
}

const BaseVisitor = new FlowchartParser().getBaseCstVisitorConstructor();

export class FlowchartAstVisitor extends BaseVisitor {
  private vertices: Record<string, Vertex> = {};
  private edges: Edge[] = [];
  private classes: Record<string, string> = {};
  private subGraphs: any[] = [];
  private direction = 'TB';
  private clickEvents: any[] = [];
  private tooltips: Record<string, string> = {};
  private subCount = 0;
  private accTitle = '';
  private accDescription = '';

  constructor() {
    super();
    this.validateVisitor();
  }

  // Clear visitor state for new parse
  clear(): void {
    this.vertices = {};
    this.edges = [];
    this.classes = {};
    this.subGraphs = [];
    this.direction = 'TB';
    this.clickEvents = [];
    this.tooltips = {};
    this.subCount = 0;
    this.lastNodeId = '';
    this.accTitle = '';
    this.accDescription = '';
  }

  flowchart(ctx: any): ParseResult {
    this.visit(ctx.graphDeclaration);

    if (ctx.statement) {
      ctx.statement.forEach((stmt: any) => this.visit(stmt));
    }

    return {
      vertices: this.vertices,
      edges: this.edges,
      classes: this.classes,
      subGraphs: this.subGraphs,
      direction: this.direction,
      clickEvents: this.clickEvents,
      tooltips: this.tooltips,
      accTitle: this.accTitle,
      accDescription: this.accDescription,
    };
  }

  graphDeclaration(ctx: any): void {
    if (ctx.DirectionValue) {
      this.direction = ctx.DirectionValue[0].image;
    }
  }

  statement(ctx: any): void {
    if (ctx.vertexStatement) {
      this.visit(ctx.vertexStatement);
    } else if (ctx.styleStatement) {
      this.visit(ctx.styleStatement);
    } else if (ctx.linkStyleStatement) {
      this.visit(ctx.linkStyleStatement);
    } else if (ctx.classDefStatement) {
      this.visit(ctx.classDefStatement);
    } else if (ctx.classStatement) {
      this.visit(ctx.classStatement);
    } else if (ctx.clickStatement) {
      this.visit(ctx.clickStatement);
    } else if (ctx.subgraphStatement) {
      this.visit(ctx.subgraphStatement);
    } else if (ctx.directionStatement) {
      this.visit(ctx.directionStatement);
    } else if (ctx.accStatement) {
      this.visit(ctx.accStatement);
    }
  }

  // Statement separator (does nothing)
  statementSeparator(_ctx: any): void {
    // No action needed for separators
  }

  // Vertex statement - handles node chains with links
  vertexStatement(ctx: any): void {
    const nodes = ctx.node || [];
    const links = ctx.link || [];

    // Process first node and collect all node IDs (for ampersand syntax)
    let startNodeIds: string[] = [];
    if (nodes.length > 0) {
      startNodeIds = this.visit(nodes[0]);
    }

    // Process alternating links and nodes
    for (const [i, link] of links.entries()) {
      const linkData = this.visit(link);
      const nextNode = nodes[i + 1];

      if (nextNode) {
        // Collect target node IDs (for ampersand syntax)
        const endNodeIds = this.visit(nextNode);

        // Create edges from each start node to each end node
        for (const startNodeId of startNodeIds) {
          for (const endNodeId of endNodeIds) {
            const edge: any = {
              start: startNodeId,
              end: endNodeId,
              type: linkData.type,
              text: linkData.text || '',
            };

            // Include length property if present
            if (linkData.length) {
              edge.length = linkData.length;
            }

            this.edges.push(edge);
          }
        }

        // Update start nodes for next iteration
        startNodeIds = endNodeIds;
      }
    }
  }

  // Node - handles multiple nodes with ampersand
  node(ctx: any): string[] {
    const styledVertices = ctx.styledVertex || [];
    const nodeIds: string[] = [];
    for (const vertex of styledVertices) {
      this.visit(vertex);
      // Collect the node ID that was just processed
      nodeIds.push(this.lastNodeId);
    }
    return nodeIds;
  }

  // Styled vertex
  styledVertex(ctx: any): void {
    if (ctx.vertex) {
      this.visit(ctx.vertex);
    }
    // TODO: Handle styling
  }

  // Vertex - handles different node shapes
  vertex(ctx: any): void {
    const nodeIds = ctx.nodeId || [];
    const nodeTexts = ctx.nodeText || [];

    if (nodeIds.length > 0) {
      const nodeId = this.visit(nodeIds[0]);
      let nodeText = nodeId;
      let nodeType = 'default';

      // Determine node type based on tokens present
      if (ctx.SquareStart) {
        nodeType = 'square';
        if (nodeTexts.length > 0) {
          nodeText = this.visit(nodeTexts[0]);
        }
      } else if (ctx.DoubleCircleStart) {
        nodeType = 'doublecircle';
        if (nodeTexts.length > 0) {
          nodeText = this.visit(nodeTexts[0]);
        }
      } else if (ctx.CircleStart) {
        nodeType = 'circle';
        if (nodeTexts.length > 0) {
          nodeText = this.visit(nodeTexts[0]);
        }
      } else if (ctx.PS) {
        nodeType = 'round';
        if (nodeTexts.length > 0) {
          nodeText = this.visit(nodeTexts[0]);
        }
      } else if (ctx.HexagonStart) {
        nodeType = 'hexagon';
        if (nodeTexts.length > 0) {
          nodeText = this.visit(nodeTexts[0]);
        }
      } else if (ctx.DiamondStart) {
        nodeType = 'diamond';
        if (nodeTexts.length > 0) {
          nodeText = this.visit(nodeTexts[0]);
        }
      }

      // Add vertex to the graph
      this.vertices[nodeId] = {
        id: nodeId,
        text: nodeText,
        type: nodeType,
        classes: [],
      };
      this.lastNodeId = nodeId;
    }
  }

  // Helper to get last processed node ID
  private lastNodeId = '';
  private getLastNodeId(): string {
    return this.lastNodeId;
  }

  nodeStatement(ctx: any): void {
    const nodes: string[] = [];

    // Process first node
    const firstNode = this.visit(ctx.nodeDefinition[0]);
    nodes.push(firstNode.id);

    // Process additional nodes (connected with &)
    if (ctx.Ampersand) {
      ctx.nodeDefinition.slice(1).forEach((nodeDef: any) => {
        const node = this.visit(nodeDef);
        nodes.push(node.id);
      });
    }

    // Process link chain if present
    if (ctx.linkChain) {
      const linkedNodes = this.visit(ctx.linkChain);
      // Create edges between nodes
      const startNodes = nodes;
      linkedNodes.forEach((linkData: any) => {
        const edge: any = {
          start: startNodes,
          end: linkData.node,
          type: linkData.linkType,
          text: linkData.linkText,
        };

        // Include length property if present
        if (linkData.linkLength) {
          edge.length = linkData.linkLength;
        }

        this.edges.push(edge);
      });
    }
  }

  nodeDefinition(ctx: any): any {
    const nodeId = this.visit(ctx.nodeId);
    let text = nodeId;
    let type = 'default';

    if (ctx.nodeShape) {
      const shapeData = this.visit(ctx.nodeShape);
      text = shapeData.text || nodeId;
      type = shapeData.type;
    }

    // Add to vertices if not exists
    if (!this.vertices[nodeId]) {
      this.vertices[nodeId] = {
        id: nodeId,
        text: text,
        type: type,
      };
    }

    // Handle style class
    if (ctx.StyleSeparator && ctx.className) {
      const className = this.visit(ctx.className);
      this.vertices[nodeId].classes = [className];
    }

    return { id: nodeId, text, type };
  }

  nodeId(ctx: any): string {
    let nodeId = '';

    if (ctx.NODE_STRING) {
      nodeId = ctx.NODE_STRING[0].image;
    } else if (ctx.NumberToken) {
      nodeId = ctx.NumberToken[0].image;
    } else if (ctx.Default) {
      nodeId = ctx.Default[0].image;
    } else if (ctx.Ampersand) {
      // Standalone & (uses CONSUME2)
      nodeId = ctx.Ampersand[0].image;
    } else if (ctx.Minus) {
      // Standalone - (uses CONSUME2)
      nodeId = ctx.Minus[0].image;
    } else if (ctx.DirectionValue) {
      // Standalone direction value (uses CONSUME2)
      nodeId = ctx.DirectionValue[0].image;
    } else if (ctx.Colon) {
      // Standalone : character
      nodeId = ctx.Colon[0].image;
    } else if (ctx.Comma) {
      // Standalone , character
      nodeId = ctx.Comma[0].image;
    }

    // If no nodeId was found, it might be an empty context
    if (!nodeId) {
      throw new Error('Unable to parse node ID from context');
    }

    // Validate node ID against reserved keywords
    this.validateNodeId(nodeId);

    return nodeId;
  }

  private validateNodeId(nodeId: string): void {
    // Keywords that should throw errors when used as node ID prefixes
    const errorKeywords = [
      'graph',
      'flowchart',
      'flowchart-elk',
      'style',
      'linkStyle',
      'interpolate',
      'classDef',
      'class',
      '_self',
      '_blank',
      '_parent',
      '_top',
      'end',
      'subgraph',
    ];

    // Check if node ID starts with any error keyword followed by a delimiter
    // This matches the original JISON parser behavior where keywords are only
    // rejected when followed by delimiters like '.', '-', '/', etc.
    for (const keyword of errorKeywords) {
      if (nodeId.startsWith(keyword)) {
        // Allow if the keyword is not followed by a delimiter (e.g., "endpoint" is OK, "end.node" is not)
        const afterKeyword = nodeId.substring(keyword.length);
        if (afterKeyword.length === 0 || /^[./-]/.test(afterKeyword)) {
          throw new Error(`Node ID cannot start with reserved keyword: ${keyword}`);
        }
      }
    }
  }

  nodeShape(ctx: any): any {
    if (ctx.squareShape) {
      return this.visit(ctx.squareShape);
    } else if (ctx.circleShape) {
      return this.visit(ctx.circleShape);
    } else if (ctx.diamondShape) {
      return this.visit(ctx.diamondShape);
    }
    return { type: 'default', text: '' };
  }

  squareShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'square', text };
  }

  circleShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'doublecircle', text };
  }

  diamondShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'diamond', text };
  }

  nodeText(ctx: any): string {
    if (ctx.TextContent) {
      return ctx.TextContent[0].image;
    } else if (ctx.NODE_STRING) {
      return ctx.NODE_STRING[0].image;
    } else if (ctx.StringContent) {
      return ctx.StringContent[0].image;
    } else if (ctx.QuotedString) {
      // Remove quotes from quoted string
      const quoted = ctx.QuotedString[0].image;
      return quoted.slice(1, -1);
    } else if (ctx.NumberToken) {
      return ctx.NumberToken[0].image;
    }
    return '';
  }

  linkChain(ctx: any): any[] {
    const links: any[] = [];

    for (const [i, link] of ctx.link.entries()) {
      const linkData = this.visit(link);
      const nodeData = this.visit(ctx.nodeDefinition[i]);

      const linkInfo: any = {
        linkType: linkData.type,
        linkText: linkData.text,
        node: nodeData.id,
      };

      // Include length property if present
      if (linkData.length) {
        linkInfo.linkLength = linkData.length;
      }

      links.push(linkInfo);
    }

    return links;
  }

  link(ctx: any): any {
    let linkData = { type: 'arrow', text: '' };

    if (ctx.linkStatement) {
      linkData = this.visit(ctx.linkStatement);
    } else if (ctx.linkWithEdgeText) {
      linkData = this.visit(ctx.linkWithEdgeText);
    } else if (ctx.linkWithArrowText) {
      linkData = this.visit(ctx.linkWithArrowText);
    }

    return linkData;
  }

  linkStatement(ctx: any): any {
    if (ctx.LINK) {
      return this.parseLinkToken(ctx.LINK[0]);
    } else if (ctx.THICK_LINK) {
      return this.parseLinkToken(ctx.THICK_LINK[0]);
    } else if (ctx.DOTTED_LINK) {
      return this.parseLinkToken(ctx.DOTTED_LINK[0]);
    }
    return { type: 'arrow', text: '' };
  }

  parseLinkToken(token: IToken): any {
    const image = token.image;
    let type = 'arrow_point'; // Default for --> arrows
    let length: string | undefined = undefined;

    // Check for bidirectional arrows first
    if (image.startsWith('<') && image.endsWith('>')) {
      if (image.includes('.')) {
        type = 'double_arrow_dotted';
      } else if (image.includes('=')) {
        type = 'double_arrow_thick';
      } else {
        type = 'double_arrow_point';
      }
      return { type, text: '', length };
    }

    // Determine link type based on pattern
    if (image.includes('.')) {
      type = 'arrow_dotted';
    } else if (image.includes('=')) {
      type = 'arrow_thick';
    }

    // Check for special endings
    if (image.endsWith('o')) {
      type = type.replace('_point', '_circle');
      type = type.replace('_dotted', '_dotted_circle');
      type = type.replace('_thick', '_thick_circle');
    } else if (image.endsWith('x')) {
      type = type.replace('_point', '_cross');
      type = type.replace('_dotted', '_dotted_cross');
      type = type.replace('_thick', '_thick_cross');
    } else if (image.endsWith('-') && !image.includes('.') && !image.includes('=')) {
      type = 'arrow_open'; // Open arrow (no arrowhead)
    }

    // Determine arrow length based on number of dashes
    if (image.includes('-')) {
      const dashCount = (image.match(/-/g) || []).length;
      if (dashCount >= 6) {
        length = 'extralong'; // cspell:disable-line
      } else if (dashCount >= 4) {
        length = 'long';
      }
    }

    const result: any = { type, text: '' };
    if (length) {
      result.length = length;
    }
    return result;
  }

  linkWithEdgeText(ctx: any): any {
    let text = '';
    if (ctx.edgeText) {
      text = this.visit(ctx.edgeText);
    }

    // Get the link type from the START_* token or EdgeTextEnd token
    let linkData: any = { type: 'arrow', text: '' };

    // Check for bidirectional arrows first
    if (ctx.START_LINK && ctx.EdgeTextEnd) {
      const startToken = ctx.START_LINK[0].image;
      const endToken = ctx.EdgeTextEnd[0].image;

      if (startToken.includes('<') && endToken.includes('>')) {
        if (startToken.includes('.') || endToken.includes('.')) {
          linkData = { type: 'double_arrow_dotted', text: '' };
        } else if (startToken.includes('=') || endToken.includes('=')) {
          linkData = { type: 'double_arrow_thick', text: '' };
        } else {
          linkData = { type: 'double_arrow_point', text: '' };
        }
      } else {
        linkData = { type: 'arrow_point', text: '' };

        // Check for arrow length in START_LINK token
        const dashCount = (startToken.match(/-/g) || []).length;
        if (dashCount >= 6) {
          linkData.length = 'extralong'; // cspell:disable-line
        } else if (dashCount >= 4) {
          linkData.length = 'long';
        }
      }
    } else if (ctx.START_DOTTED_LINK) {
      linkData = { type: 'arrow_dotted', text: '' };
    } else if (ctx.START_THICK_LINK) {
      linkData = { type: 'arrow_thick', text: '' };
    } else if (ctx.START_LINK) {
      linkData = { type: 'arrow_point', text: '' };
    } else if (ctx.EdgeTextEnd) {
      linkData = this.parseLinkToken(ctx.EdgeTextEnd[0]);
    }

    linkData.text = text;
    return linkData;
  }

  linkWithArrowText(ctx: any): any {
    // Get the link type from the link token
    let linkData: any = { type: 'arrow', text: '' };
    if (ctx.LINK) {
      linkData = this.parseLinkToken(ctx.LINK[0]);
    } else if (ctx.THICK_LINK) {
      linkData = this.parseLinkToken(ctx.THICK_LINK[0]);
    } else if (ctx.DOTTED_LINK) {
      linkData = this.parseLinkToken(ctx.DOTTED_LINK[0]);
    }

    // Get the arrow text
    if (ctx.arrowText) {
      linkData.text = this.visit(ctx.arrowText);
    }

    return linkData;
  }

  edgeText(ctx: any): string {
    let text = '';
    if (ctx.EdgeTextContent) {
      ctx.EdgeTextContent.forEach((token: IToken) => {
        text += token.image;
      });
    }
    // Note: EdgeTextPipe tokens (|) are delimiters and should not be included in the text
    if (ctx.NODE_STRING) {
      ctx.NODE_STRING.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.EDGE_TEXT) {
      return ctx.EDGE_TEXT[0].image;
    } else if (ctx.String) {
      return ctx.String[0].image.slice(1, -1); // Remove quotes
    } else if (ctx.MarkdownString) {
      return ctx.MarkdownString[0].image.slice(2, -2); // Remove markdown quotes
    }
    return text;
  }

  linkText(ctx: any): string {
    let text = '';
    if (ctx.NodeText) {
      ctx.NodeText.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.String) {
      ctx.String.forEach((token: IToken) => {
        text += token.image.slice(1, -1); // Remove quotes
      });
    }
    if (ctx.MarkdownString) {
      ctx.MarkdownString.forEach((token: IToken) => {
        text += token.image.slice(2, -2); // Remove markdown quotes
      });
    }
    return text;
  }

  arrowText(ctx: any): string {
    if (ctx.text) {
      return this.visit(ctx.text);
    }
    return '';
  }

  text(ctx: any): string {
    let text = '';
    if (ctx.TextContent) {
      ctx.TextContent.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.NODE_STRING) {
      ctx.NODE_STRING.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.NumberToken) {
      ctx.NumberToken.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.WhiteSpace) {
      ctx.WhiteSpace.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.Colon) {
      ctx.Colon.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.Minus) {
      ctx.Minus.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.Ampersand) {
      ctx.Ampersand.forEach((token: IToken) => {
        text += token.image;
      });
    }
    if (ctx.QuotedString) {
      ctx.QuotedString.forEach((token: IToken) => {
        // Remove quotes from quoted string
        text += token.image.slice(1, -1);
      });
    }
    return text;
  }

  styleStatement(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const styles = this.visit(ctx.styleList);

    if (this.vertices[nodeId]) {
      // Ensure styles is an array before calling join
      const styleArray = Array.isArray(styles) ? styles : [styles];
      this.vertices[nodeId].style = styleArray.join(',');
    }
  }

  classDefStatement(ctx: any): void {
    const className = this.visit(ctx.className);
    const styles = this.visit(ctx.styleList);

    // Ensure styles is an array before calling join
    const styleArray = Array.isArray(styles) ? styles : [styles];
    this.classes[className] = styleArray.join(',');
  }

  classStatement(ctx: any): void {
    const nodeIds = this.visit(ctx.nodeIdList);
    const className = this.visit(ctx.className);

    nodeIds.forEach((nodeId: string) => {
      if (this.vertices[nodeId]) {
        this.vertices[nodeId].classes = [className];
      }
    });
  }

  clickStatement(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);

    if (ctx.clickHref) {
      const hrefData = this.visit(ctx.clickHref);
      this.clickEvents.push({
        id: nodeId,
        type: 'href',
        href: hrefData.href,
        target: hrefData.target,
      });
    } else if (ctx.clickCall) {
      const callData = this.visit(ctx.clickCall);
      this.clickEvents.push({
        id: nodeId,
        type: 'call',
        functionName: callData.functionName,
        args: callData.args,
      });
    }

    // Handle tooltip
    if (ctx.String) {
      const tooltip = ctx.String[0].image.slice(1, -1);
      this.tooltips[nodeId] = tooltip;
    }
  }

  subgraphStatement(ctx: any): void {
    const subgraph: any = {
      id: `subGraph${this.subCount++}`,
      title: '',
      nodes: [],
    };

    if (ctx.subgraphId) {
      subgraph.id = this.visit(ctx.subgraphId);
    }

    if (ctx.nodeText) {
      subgraph.title = this.visit(ctx.nodeText);
    } else if (ctx.QuotedString) {
      subgraph.title = ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
    }

    // Store current state
    const prevVertices = this.vertices;

    // Process subgraph statements
    if (ctx.statement) {
      ctx.statement.forEach((stmt: any) => this.visit(stmt));
    }

    // Collect nodes added in subgraph
    Object.keys(this.vertices).forEach((key) => {
      if (!prevVertices[key]) {
        subgraph.nodes.push(key);
      }
    });

    this.subGraphs.push(subgraph);
  }

  directionStatement(ctx: any): void {
    this.direction = ctx.DirectionValue[0].image;
  }

  // Helper methods for remaining rules...
  className(ctx: any): string {
    return ctx.NODE_STRING[0].image;
  }

  nodeIdList(ctx: any): string[] {
    const ids = [this.visit(ctx.nodeId[0])];
    if (ctx.nodeId.length > 1) {
      ctx.nodeId.slice(1).forEach((node: any) => {
        ids.push(this.visit(node));
      });
    }
    return ids;
  }

  styleList(ctx: any): string[] {
    const styles: string[] = [];
    if (ctx.style) {
      ctx.style.forEach((style: any) => {
        styles.push(this.visit(style));
      });
    }
    return styles;
  }

  style(ctx: any): string {
    // Collect all tokens with their positions, excluding semicolons
    const allTokens: IToken[] = [];

    Object.keys(ctx).forEach((key) => {
      if (ctx[key] && Array.isArray(ctx[key]) && key !== 'Semicolon') {
        allTokens.push(...ctx[key]);
      }
    });

    // Sort tokens by their position in the input
    allTokens.sort((a, b) => a.startOffset - b.startOffset);

    // Concatenate tokens in order
    return allTokens.map((token) => token.image).join('');
  }

  standaloneLinkStatement(ctx: any): void {
    const startNodeId = this.visit(ctx.nodeId[0]);
    const endNodeId = this.visit(ctx.nodeId[1]);
    const linkData = this.visit(ctx.link);

    // Ensure both start and end nodes exist as vertices
    this.ensureVertex(startNodeId);
    this.ensureVertex(endNodeId);

    const edge: any = {
      start: startNodeId,
      end: endNodeId,
      type: linkData.type,
      text: linkData.text,
    };

    // Include length property if present
    if (linkData.length) {
      edge.length = linkData.length;
    }

    this.edges.push(edge);
  }

  // Helper method to ensure a vertex exists
  private ensureVertex(nodeId: string): void {
    if (!this.vertices[nodeId]) {
      this.vertices[nodeId] = {
        id: nodeId,
        text: nodeId,
        type: 'default',
      };
    }
  }

  // Missing visitor methods
  linkStyleStatement(_ctx: any): void {
    // Handle link style statements
    // TODO: Implement link styling
  }

  linkIndexList(_ctx: any): number[] {
    // Handle link index lists
    // TODO: Implement link index parsing
    return [];
  }

  numberList(_ctx: any): number[] {
    // Handle number lists
    // TODO: Implement number list parsing
    return [];
  }

  accStatement(ctx: any): void {
    if (ctx.AccTitle && ctx.AccTitleValue) {
      this.accTitle = ctx.AccTitleValue[0].image.trim();
    } else if (ctx.AccDescr && ctx.AccDescrValue) {
      this.accDescription = ctx.AccDescrValue[0].image.trim();
    } else if (ctx.AccDescrMultiline && ctx.AccDescrMultilineValue) {
      this.accDescription = ctx.AccDescrMultilineValue[0].image.trim();
    }
  }

  clickHref(ctx: any): any {
    let href = '';
    if (ctx.NODE_STRING) {
      href = ctx.NODE_STRING[0].image;
    } else if (ctx.QuotedString) {
      href = ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
    }
    return {
      href: href,
      target: undefined,
    };
  }

  clickCall(ctx: any): any {
    let functionName = '';

    if (ctx.Call) {
      if (ctx.NODE_STRING) {
        functionName = ctx.NODE_STRING[0].image;
      } else if (ctx.QuotedString) {
        functionName = ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
      }
      return {
        functionName: functionName,
        args: [], // TODO: Parse arguments if present
      };
    } else if (ctx.Callback) {
      if (ctx.NODE_STRING) {
        functionName = ctx.NODE_STRING[0].image;
      } else if (ctx.QuotedString) {
        functionName = ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
      } else if (ctx.StringStart && ctx.StringContent && ctx.StringEnd) {
        functionName = ctx.StringContent[0].image; // String content without quotes
      }
      return {
        functionName: functionName,
        args: [],
      };
    }
    return {
      functionName: '',
      args: [],
    };
  }

  subgraphId(ctx: any): string {
    if (ctx.NODE_STRING) {
      return ctx.NODE_STRING[0].image;
    } else if (ctx.QuotedString) {
      return ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
    } else if (ctx.StringStart && ctx.StringContent && ctx.StringEnd) {
      return ctx.StringContent[0].image; // String content without quotes
    }
    return '';
  }

  // Return the complete AST
  getAST() {
    return {
      vertices: this.vertices,
      edges: this.edges,
      classes: this.classes,
      subGraphs: this.subGraphs,
      direction: this.direction,
      clickEvents: this.clickEvents,
      tooltips: this.tooltips,
      accTitle: this.accTitle,
      accDescription: this.accDescription,
    };
  }
}
