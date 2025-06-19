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
  linkStyles: Array<{
    positions: ('default' | number)[];
    styles?: string[];
    interpolate?: string;
  }>;
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
  private currentSubgraph: any = null;
  private currentSubgraphNodes: string[] | null = null;
  private flowDb: any = null; // FlowDB instance for direct integration
  private linkStyles: Array<{
    positions: ('default' | number)[];
    styles?: string[];
    interpolate?: string;
  }> = [];

  constructor() {
    super();
    this.validateVisitor();
  }

  // Set FlowDB instance for direct integration
  setFlowDb(flowDb: any): void {
    this.flowDb = flowDb;
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
    this.currentSubgraph = null;
    this.currentSubgraphNodes = null;
    this.linkStyles = [];
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
      linkStyles: this.linkStyles,
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

            // Include stroke property if present
            if (linkData.stroke) {
              edge.stroke = linkData.stroke;
            }

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
      // Store the current node ID before visiting
      const previousNodeId = this.lastNodeId;
      this.visit(vertex); // Process the vertex (adds to vertices, etc.)
      // The visit should have set this.lastNodeId to the correct value
      nodeIds.push(this.lastNodeId);
      // Don't restore previousNodeId as we want to keep the last processed ID
    }
    return nodeIds;
  }

  // Styled vertex
  styledVertex(ctx: any): void {
    if (ctx.vertex) {
      this.visit(ctx.vertex);
    }

    // Handle direct class application with ::: syntax
    if (ctx.StyleSeparator && ctx.className) {
      const className = this.visit(ctx.className);
      const nodeId = this.lastNodeId; // Get the node ID from the vertex we just processed

      if (nodeId) {
        if (this.flowDb && typeof this.flowDb.setClass === 'function') {
          this.flowDb.setClass(nodeId, className);
        } else if (this.vertices[nodeId]) {
          if (!this.vertices[nodeId].classes) {
            this.vertices[nodeId].classes = [];
          }
          this.vertices[nodeId].classes.push(className);
        }
      }
    }
  }

  // Vertex - handles different node shapes
  vertex(ctx: any): void {
    // Handle the new structure with separate vertex rules
    if (ctx.vertexWithSquare) {
      this.visit(ctx.vertexWithSquare);
    } else if (ctx.vertexWithDoubleCircle) {
      this.visit(ctx.vertexWithDoubleCircle);
    } else if (ctx.vertexWithCircle) {
      this.visit(ctx.vertexWithCircle);
    } else if (ctx.vertexWithRound) {
      this.visit(ctx.vertexWithRound);
    } else if (ctx.vertexWithHexagon) {
      this.visit(ctx.vertexWithHexagon);
    } else if (ctx.vertexWithDiamond) {
      this.visit(ctx.vertexWithDiamond);
    } else if (ctx.vertexWithSubroutine) {
      this.visit(ctx.vertexWithSubroutine);
    } else if (ctx.vertexWithTrapezoidVariant) {
      this.visit(ctx.vertexWithTrapezoidVariant);
    } else if (ctx.vertexWithStadium) {
      this.visit(ctx.vertexWithStadium);
    } else if (ctx.vertexWithEllipse) {
      this.visit(ctx.vertexWithEllipse);
    } else if (ctx.vertexWithCylinder) {
      this.visit(ctx.vertexWithCylinder);
    } else if (ctx.nodeId) {
      // Plain node
      const nodeId = this.visit(ctx.nodeId);
      this.addVertex(nodeId, nodeId, 'default');
    }
  }

  // Helper method to add vertex
  private addVertex(nodeId: string, nodeText: string, nodeType: string): void {
    // Add vertex to FlowDB if available, otherwise add to internal vertices
    if (this.flowDb && typeof this.flowDb.addVertex === 'function') {
      // Create textObj structure expected by FlowDB
      // Always create textObj, even for empty text, to prevent FlowDB from using nodeId as text
      const textObj = { text: nodeText, type: 'text' };
      this.flowDb.addVertex(
        nodeId,
        textObj,
        nodeType,
        [], // style
        [], // classes
        undefined, // dir
        {}, // props
        undefined // metadata
      );
    } else {
      // Fallback to internal tracking
      this.vertices[nodeId] = {
        id: nodeId,
        text: nodeText,
        type: nodeType,
        classes: [],
      };
    }
    this.lastNodeId = nodeId;

    // Track node in current subgraph if we're inside one
    if (this.currentSubgraphNodes && !this.currentSubgraphNodes.includes(nodeId)) {
      this.currentSubgraphNodes.push(nodeId);
    }
  }

  // Individual vertex shape visitors
  vertexWithSquare(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'square');
  }

  vertexWithDoubleCircle(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = ctx.nodeText ? this.visit(ctx.nodeText) : '';
    this.addVertex(nodeId, nodeText, 'doublecircle');
  }

  vertexWithCircle(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = ctx.nodeText ? this.visit(ctx.nodeText) : '';
    this.addVertex(nodeId, nodeText, 'circle');
  }

  vertexWithRound(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'round');
  }

  vertexWithHexagon(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'hexagon');
  }

  vertexWithDiamond(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'diamond');
  }

  vertexWithSubroutine(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'subroutine');
  }

  vertexWithTrapezoidVariant(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);

    // Determine trapezoid type based on start/end token combination
    let shapeType = 'trapezoid';

    if (ctx.TrapezoidStart && ctx.TrapezoidEnd) {
      shapeType = 'trapezoid';
    } else if (ctx.InvTrapezoidStart && ctx.InvTrapezoidEnd) {
      shapeType = 'inv_trapezoid';
    } else if (ctx.TrapezoidStart && ctx.InvTrapezoidEnd) {
      shapeType = 'lean_right';
    } else if (ctx.InvTrapezoidStart && ctx.TrapezoidEnd) {
      shapeType = 'lean_left';
    }

    this.addVertex(nodeId, nodeText, shapeType);
  }

  vertexWithStadium(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'stadium');
  }

  vertexWithEllipse(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'ellipse');
  }

  vertexWithCylinder(ctx: any): void {
    const nodeId = this.visit(ctx.nodeId);
    const nodeText = this.visit(ctx.nodeText);
    this.addVertex(nodeId, nodeText, 'cylinder');
  }

  // Vertex with node data syntax
  vertexWithNodeData(ctx: any): void {
    console.debug('🔥 vertexWithNodeData called with ctx:', ctx);
    const nodeId = this.visit(ctx.nodeId);
    const nodeDataProps = this.visit(ctx.nodeData);

    console.debug('🔥 nodeId:', nodeId, 'nodeDataProps:', nodeDataProps);

    // Extract shape and label from node data
    const shape = nodeDataProps.shape || 'squareRect'; // Default shape
    const label = nodeDataProps.label || nodeId; // Use nodeId as default label

    // Map shape name to the correct type for FlowDB
    const mappedShape = this.mapShapeNameToType(shape);

    console.debug('🔥 Adding vertex with shape:', mappedShape, 'label:', label);

    // Add vertex with node data properties
    this.addVertexWithData(nodeId, label, mappedShape, nodeDataProps);
  }

  // Node data visitor
  nodeData(ctx: any): any {
    console.debug('🔥 nodeData called with ctx:', ctx);
    const result = this.visit(ctx.nodeDataContent);
    console.debug('🔥 nodeData result:', result);
    return result;
  }

  // Node data content visitor
  nodeDataContent(ctx: any): any {
    const props: any = {};

    if (ctx.ShapeDataContent) {
      // Parse the shape data content
      const content = ctx.ShapeDataContent.map((token: any) => token.image).join('');
      this.parseNodeDataContent(content, props);
    }

    if (ctx.nodeDataString) {
      // Handle quoted strings in node data
      ctx.nodeDataString.forEach((stringCtx: any) => {
        const stringValue = this.visit(stringCtx);
        // This would need more sophisticated parsing to handle key-value pairs with quoted strings
        // For now, we'll handle this in parseNodeDataContent
      });
    }

    return props;
  }

  // Node data string visitor
  nodeDataString(ctx: any): string {
    if (ctx.ShapeDataStringContent) {
      return ctx.ShapeDataStringContent.map((token: any) => token.image).join('');
    }
    return '';
  }

  // Helper method to parse node data content
  private parseNodeDataContent(content: string, props: any): void {
    // Parse YAML-like content: "shape: rounded, label: 'Hello'"
    // Split by commas and parse key-value pairs
    const pairs = content.split(',').map((pair) => pair.trim());

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        props[key] = value;
      }
    }
  }

  // Map shape names from node data to FlowDB types
  private mapShapeNameToType(shapeName: string): string {
    // Map common shape names to their FlowDB equivalents
    const shapeMap: Record<string, string> = {
      // User-friendly names to FlowDB types
      rounded: 'rounded', // Keep as 'rounded' - it's a valid ShapeID
      rectangle: 'squareRect', // Map to internal type
      rect: 'squareRect', // Map to internal type
      square: 'square', // Direct mapping
      circle: 'circle', // Direct mapping
      diamond: 'diamond', // Direct mapping
      hexagon: 'hexagon', // Direct mapping
      ellipse: 'ellipse', // Direct mapping
      stadium: 'stadium', // Direct mapping
      subroutine: 'subroutine', // Direct mapping
      cylinder: 'cylinder', // Direct mapping
      round: 'round', // Direct mapping
      doublecircle: 'doublecircle', // Direct mapping
      odd: 'odd', // Direct mapping
      trapezoid: 'trapezoid', // Direct mapping
      inv_trapezoid: 'inv_trapezoid', // Direct mapping
      lean_right: 'lean_right', // Direct mapping
      lean_left: 'lean_left', // Direct mapping
    };

    return shapeMap[shapeName] || shapeName; // Return mapped value or original if not found
  }

  // Enhanced addVertex method that supports node data
  private addVertexWithData(
    nodeId: string,
    nodeText: string,
    nodeType: string,
    nodeData: any
  ): void {
    // Validate shape if provided in nodeData
    if (nodeData.shape && !this.isValidShape(nodeData.shape)) {
      throw new Error(`No such shape: ${nodeData.shape}.`);
    }

    // Add vertex to FlowDB if available, otherwise add to internal vertices
    if (this.flowDb && typeof this.flowDb.addVertex === 'function') {
      // Create textObj structure expected by FlowDB
      const textObj = { text: nodeText, type: 'text' };
      this.flowDb.addVertex(
        nodeId,
        textObj,
        nodeType, // This should be the mapped shape type
        [], // style
        [], // classes
        undefined, // dir
        nodeData, // props - pass the node data as props
        undefined // metadata
      );
    } else {
      // Fallback to internal tracking
      this.vertices[nodeId] = {
        id: nodeId,
        text: nodeText,
        type: nodeType,
        classes: [],
        props: nodeData,
      };
    }
    this.lastNodeId = nodeId;

    // Track node in current subgraph if we're inside one
    if (this.currentSubgraphNodes && !this.currentSubgraphNodes.includes(nodeId)) {
      this.currentSubgraphNodes.push(nodeId);
    }
  }

  // Helper method to validate shape names
  private isValidShape(shape: string): boolean {
    const validShapes = [
      'squareRect',
      'square',
      'circle',
      'ellipse',
      'stadium',
      'subroutine',
      'cylinder',
      'group',
      'doublecircle',
      'odd',
      'diamond',
      'hexagon',
      'rect_left_inv_arrow',
      'lean_right',
      'lean_left',
      'trapezoid',
      'inv_trapezoid',
      'rect',
      'rectWithTitle',
      'start',
      'end',
      'note',
      'rounded',
      'round', // Add common shape aliases
    ];

    // Check if shape is valid
    if (!validShapes.includes(shape)) {
      return false;
    }

    // Check for internal-only shapes that shouldn't be used directly
    const internalShapes = ['rect_left_inv_arrow'];
    if (internalShapes.includes(shape)) {
      throw new Error(`No such shape: ${shape}. Shape names should be lowercase.`);
    }

    return true;
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
        // Handle multiple start nodes (for & syntax)
        startNodes.forEach((startNode: string) => {
          const edge: any = {
            start: startNode,
            end: linkData.node,
            type: linkData.linkType,
            text: linkData.linkText,
          };

          // Include stroke property if present
          if (linkData.linkStroke) {
            edge.stroke = linkData.linkStroke;
          }

          // Include length property if present
          if (linkData.linkLength) {
            edge.length = linkData.linkLength;
          }

          this.edges.push(edge);
        });
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

    // Add to FlowDB if available, otherwise add to internal vertices
    if (this.flowDb && typeof this.flowDb.addVertex === 'function') {
      // Create textObj structure expected by FlowDB
      const textObj = text ? { text: text, type: 'text' } : undefined;
      this.flowDb.addVertex(
        nodeId,
        textObj,
        type,
        [], // style
        [], // classes
        undefined, // dir
        {}, // props
        undefined // metadata
      );
    } else {
      // Fallback to internal tracking
      if (!this.vertices[nodeId]) {
        this.vertices[nodeId] = {
          id: nodeId,
          text: text,
          type: type,
        };
      }
    }

    // Handle style class
    if (ctx.StyleSeparator && ctx.className) {
      const className = this.visit(ctx.className);
      if (this.flowDb && typeof this.flowDb.setClass === 'function') {
        this.flowDb.setClass(nodeId, className);
      } else if (this.vertices[nodeId]) {
        this.vertices[nodeId].classes = [className];
      }
    }

    // Set lastNodeId for compatibility with node() method
    this.lastNodeId = nodeId;

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
    if (ctx.leanRightShape) {
      return this.visit(ctx.leanRightShape);
    } else if (ctx.leanLeftShape) {
      return this.visit(ctx.leanLeftShape);
    } else if (ctx.subroutineShape) {
      return this.visit(ctx.subroutineShape);
    } else if (ctx.trapezoidShape) {
      return this.visit(ctx.trapezoidShape);
    } else if (ctx.invTrapezoidShape) {
      return this.visit(ctx.invTrapezoidShape);
    } else if (ctx.rectShape) {
      return this.visit(ctx.rectShape);
    } else if (ctx.squareShape) {
      return this.visit(ctx.squareShape);
    } else if (ctx.circleShape) {
      return this.visit(ctx.circleShape);
    } else if (ctx.diamondShape) {
      return this.visit(ctx.diamondShape);
    } else if (ctx.oddShape) {
      return this.visit(ctx.oddShape);
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

  subroutineShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'subroutine', text };
  }

  trapezoidShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'trapezoid', text };
  }

  invTrapezoidShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'inv_trapezoid', text };
  }

  leanRightShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'lean_right', text };
  }

  leanLeftShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'lean_left', text };
  }

  rectShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'rect', text };
  }

  oddShape(ctx: any): any {
    const text = this.visit(ctx.nodeText);
    return { type: 'odd', text };
  }

  nodeText(ctx: any): string {
    if (ctx.TextContent) {
      return ctx.TextContent[0].image;
    } else if (ctx.RectTextContent) {
      return ctx.RectTextContent[0].image;
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
    const image = token.image.trim();
    let type = 'arrow_open'; // Default
    let stroke = 'normal'; // Default
    let length: number | undefined = undefined;

    // Check for bidirectional arrows first
    if (image.startsWith('<') && image.endsWith('>')) {
      const line = image.slice(1, -1); // Remove < and >
      if (line.includes('.')) {
        type = 'double_arrow_point';
        stroke = 'dotted';
      } else if (line.startsWith('=')) {
        type = 'double_arrow_point';
        stroke = 'thick';
      } else {
        type = 'double_arrow_point';
        stroke = 'normal';
      }
      return { type, stroke, text: '', length };
    }

    // Determine arrow type based on ending character (following original destructEndLink logic)
    const lastChar = image.slice(-1);
    let line = image.slice(0, -1); // Remove last character

    switch (lastChar) {
      case 'x':
        type = 'arrow_cross';
        if (image.startsWith('x')) {
          type = 'double_' + type;
          line = line.slice(1);
        }
        break;
      case '>':
        type = 'arrow_point';
        if (image.startsWith('<')) {
          type = 'double_' + type;
          line = line.slice(1);
        }
        break;
      case 'o':
        type = 'arrow_circle';
        if (image.startsWith('o')) {
          type = 'double_' + type;
          line = line.slice(1);
        }
        break;
      default:
        // If it doesn't end with x, >, or o, it's an open arrow
        type = 'arrow_open';
        line = image; // Use full image for line analysis
        break;
    }

    // Determine stroke based on line pattern (following original destructEndLink logic)
    if (line.startsWith('=')) {
      stroke = 'thick';
    } else if (line.startsWith('~')) {
      stroke = 'invisible';
    } else {
      stroke = 'normal';
    }

    // Check for dotted pattern
    const dots = (line.match(/\./g) || []).length;
    if (dots > 0) {
      stroke = 'dotted';
      length = dots;
    } else {
      // Calculate length based on dashes
      length = line.length - 1;
    }

    const result: any = { type, stroke, text: '' };
    if (length !== undefined) {
      result.length = length;
    }
    return result;
  }

  linkWithEdgeText(ctx: any): any {
    let text = '';
    if (ctx.edgeText) {
      text = this.visit(ctx.edgeText);
    }

    // Get the link type from the EdgeTextEnd token and combine with start token info
    let linkData: any = { type: 'arrow_point', stroke: 'normal', text: '' };

    // First, determine the stroke type from the start token
    let stroke = 'normal';
    if (ctx.START_DOTTED_LINK) {
      stroke = 'dotted';
    } else if (ctx.START_THICK_LINK) {
      stroke = 'thick';
    }

    // Then, determine the arrow type from the end token
    if (ctx.EdgeTextEnd) {
      linkData = this.parseLinkToken(ctx.EdgeTextEnd[0]);
      // Override the stroke with the start token information
      linkData.stroke = stroke;
    } else {
      // Fallback if no EdgeTextEnd token
      linkData = { type: 'arrow_point', stroke: stroke, text: '' };
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
    if (ctx.QuotedString) {
      ctx.QuotedString.forEach((token: IToken) => {
        // Remove quotes from quoted string
        text += token.image.slice(1, -1);
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

    // Ensure styles is an array
    const styleArray = Array.isArray(styles) ? styles : [styles];

    if (this.flowDb && typeof this.flowDb.setStyle === 'function') {
      // Use FlowDB method to set styles (creates vertex if needed)
      this.flowDb.setStyle(nodeId, styleArray);
    } else {
      // Fallback to internal tracking
      this.ensureVertex(nodeId);
      if (this.vertices[nodeId]) {
        // Set styles array (as expected by tests)
        this.vertices[nodeId].styles = styleArray;
        // Also set style string for backward compatibility
        this.vertices[nodeId].style = styleArray.join(',');
      }
    }
  }

  classDefStatement(ctx: any): void {
    const className = this.visit(ctx.className);
    const styles = this.visit(ctx.styleList);

    // Ensure styles is an array
    const styleArray = Array.isArray(styles) ? styles : [styles];

    if (this.flowDb && typeof this.flowDb.addClass === 'function') {
      // Use FlowDB method to add class
      this.flowDb.addClass(className, styleArray);
    } else {
      // Fallback to internal tracking
      this.classes[className] = styleArray.join(',');
    }
  }

  classStatement(ctx: any): void {
    const nodeIds = this.visit(ctx.nodeIdList);
    const className = this.visit(ctx.className);

    nodeIds.forEach((nodeId: string) => {
      // Ensure the vertex exists first
      this.ensureVertex(nodeId);

      if (this.flowDb && typeof this.flowDb.setClass === 'function') {
        // Use FlowDB method to set class
        this.flowDb.setClass(nodeId, className);
      } else {
        // Fallback to internal tracking
        if (this.vertices[nodeId]) {
          this.vertices[nodeId].classes = [className];
        }
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
    let subgraphId: string | undefined = undefined;
    let title: string | undefined = undefined;

    // Extract subgraph ID and title
    if (ctx.subgraphId) {
      // Check if the subgraphId is actually a quoted string (title-only case)
      const subgraphIdNode = ctx.subgraphId[0]; // Get the first element from the array
      if (subgraphIdNode.children && subgraphIdNode.children.QuotedString) {
        // This is a quoted title, not an ID - use it as title and auto-generate ID
        const quotedString = subgraphIdNode.children.QuotedString[0].image;
        title = quotedString.slice(1, -1); // Remove quotes
        subgraphId = undefined; // Will be auto-generated
      } else {
        // Get the parsed subgraph ID/title
        const parsedValue = this.visit(ctx.subgraphId);

        // Check if this is a multi-word title (contains spaces)
        if (parsedValue.includes(' ')) {
          // Multi-word unquoted title - treat as title with auto-generated ID
          title = parsedValue;
          subgraphId = undefined; // Will be auto-generated
        } else {
          // Single word - treat as ID
          subgraphId = parsedValue;
        }
      }
    }

    // Extract title from brackets or additional quoted string
    if (ctx.nodeText) {
      title = this.visit(ctx.nodeText);
    } else if (ctx.QuotedString) {
      title = ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
    }

    // Store current subgraph context for direction handling
    const prevSubgraph = this.currentSubgraph;
    const prevSubgraphNodes = this.currentSubgraphNodes;
    const currentSubgraph = {
      id: subgraphId,
      title: title,
      dir: undefined as string | undefined,
    };
    this.currentSubgraph = currentSubgraph;

    // Initialize node tracking for this subgraph
    const subgraphNodes: string[] = [];
    this.currentSubgraphNodes = subgraphNodes;

    // Process subgraph statements
    if (ctx.statement) {
      ctx.statement.forEach((stmt: any) => {
        this.visit(stmt);
      });
    }

    // Call FlowDB addSubGraph method directly (like JISON parser does)
    if (this.flowDb && typeof this.flowDb.addSubGraph === 'function') {
      // Format parameters as expected by FlowDB
      const idObj = subgraphId ? { text: subgraphId } : { text: '' };
      const titleObj = { text: title || subgraphId || '', type: 'text' };

      // Reverse the node order to match JISON parser behavior
      const reversedNodes = [...subgraphNodes].reverse();
      const sgId = this.flowDb.addSubGraph(idObj, reversedNodes, titleObj);

      // Set direction if it was specified within the subgraph
      if (currentSubgraph.dir) {
        const subgraphs = this.flowDb.getSubGraphs
          ? this.flowDb.getSubGraphs()
          : this.flowDb.subGraphs;
        if (subgraphs && subgraphs.length > 0) {
          const lastSubgraph = subgraphs[subgraphs.length - 1];
          if (lastSubgraph) {
            lastSubgraph.dir = currentSubgraph.dir;
          }
        }
      }
    } else {
      // Fallback to internal tracking
      // Reverse the node order to match JISON parser behavior
      const reversedNodes = [...subgraphNodes].reverse();
      this.subGraphs.push({
        id: subgraphId || `subGraph${this.subCount++}`,
        title: title || subgraphId || '',
        nodes: reversedNodes,
        dir: currentSubgraph.dir,
      });
    }

    // Restore previous subgraph context
    this.currentSubgraph = prevSubgraph;
    this.currentSubgraphNodes = prevSubgraphNodes;
  }

  directionStatement(ctx: any): void {
    const direction = ctx.DirectionValue[0].image;
    this.direction = direction;

    // If we're currently processing a subgraph, set its direction
    if (this.currentSubgraph) {
      this.currentSubgraph.dir = direction;
    }
  }

  // Helper methods for remaining rules...
  className(ctx: any): string {
    return ctx.NODE_STRING[0].image;
  }

  nodeIdList(ctx: any): string[] {
    const ids: string[] = [];

    if (ctx.nodeId) {
      ctx.nodeId.forEach((node: any) => {
        const nodeId = this.visit(node);
        // Handle case where comma-separated node IDs are tokenized as a single token
        // e.g., "a,b" becomes a single nodeId instead of separate ones
        if (nodeId.includes(',')) {
          const splitIds = nodeId.split(',').map((id: string) => id.trim());
          ids.push(...splitIds);
        } else {
          ids.push(nodeId);
        }
      });
    }

    return ids;
  }

  styleList(ctx: any): string[] {
    const styles: string[] = [];
    if (ctx.style) {
      ctx.style.forEach((style: any) => {
        const styleValue = this.visit(style);
        // Handle case where comma-separated styles are tokenized as a single token
        // e.g., "background:#fff,border:1px solid red" becomes multiple styles
        if (styleValue.includes(',')) {
          const splitStyles = styleValue.split(',');
          styles.push(...splitStyles);
        } else {
          styles.push(styleValue);
        }
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

    // Reconstruct the original text with proper spacing
    if (allTokens.length === 0) {
      return '';
    }

    let result = allTokens[0].image;
    for (let i = 1; i < allTokens.length; i++) {
      const prevToken = allTokens[i - 1];
      const currentToken = allTokens[i];

      // Calculate the exact number of spaces between tokens
      const gapSize = currentToken.startOffset - prevToken.endOffset - 1;
      if (gapSize > 0) {
        // Add the exact number of spaces that were in the original input
        result += ' '.repeat(gapSize) + currentToken.image;
      } else {
        result += currentToken.image;
      }
    }

    return result;
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

    // Include stroke property if present
    if (linkData.stroke) {
      edge.stroke = linkData.stroke;
    }

    // Include length property if present
    if (linkData.length) {
      edge.length = linkData.length;
    }

    this.edges.push(edge);
  }

  // Helper method to ensure a vertex exists
  private ensureVertex(nodeId: string): void {
    // Check if vertex exists in FlowDB or internal vertices
    const existsInFlowDb = this.flowDb && this.flowDb.getVertices().has(nodeId);
    const existsInInternal = this.vertices[nodeId];

    if (!existsInFlowDb && !existsInInternal) {
      if (this.flowDb && typeof this.flowDb.addVertex === 'function') {
        // Add to FlowDB
        const textObj = { text: nodeId, type: 'text' };
        this.flowDb.addVertex(
          nodeId,
          textObj,
          'default', // type
          [], // style
          [], // classes
          undefined, // dir
          {}, // props
          undefined // metadata
        );
      } else {
        // Fallback to internal tracking
        this.vertices[nodeId] = {
          id: nodeId,
          text: nodeId,
          type: 'default',
        };
      }
    }
  }

  // Missing visitor methods
  linkStyleStatement(ctx: any): void {
    // Handle link style statements following JISON grammar patterns
    let positions: ('default' | number)[] = [];
    let interpolate: string | undefined;
    let styles: string[] = [];

    // Determine which pattern we're dealing with
    if (ctx.Default) {
      positions = ['default'];
    } else if (ctx.numberList) {
      positions = this.visit(ctx.numberList);
    }

    // Check for interpolate
    if (ctx.Interpolate && ctx.alphaNum) {
      interpolate = this.visit(ctx.alphaNum);
    }

    // Check for styles
    if (ctx.styleList) {
      styles = this.visit(ctx.styleList);
    }

    // Store the linkStyle operation for later application
    this.linkStyles.push({
      positions,
      styles: styles.length > 0 ? styles : undefined,
      interpolate,
    });
  }

  linkIndexList(_ctx: any): number[] {
    // Handle link index lists
    // TODO: Implement link index parsing
    return [];
  }

  numberList(ctx: any): number[] {
    const numbers: number[] = [];

    // Handle properly tokenized numbers (NumberToken, Comma, NumberToken, ...)
    if (ctx.NumberToken && !ctx.NODE_STRING) {
      ctx.NumberToken.forEach((token: any) => {
        numbers.push(parseInt(token.image, 10));
      });
    }

    // Handle mixed case: NumberToken followed by NODE_STRING (e.g., "0" + ",1")
    if (ctx.NumberToken && ctx.NODE_STRING) {
      // Add the first number
      numbers.push(parseInt(ctx.NumberToken[0].image, 10));

      // Parse the comma-separated part
      const nodeString = ctx.NODE_STRING[0].image;
      if (nodeString.startsWith(',')) {
        // Remove the leading comma and split by comma
        const remainingNumbers = nodeString.substring(1).split(',');
        remainingNumbers.forEach((numStr: string) => {
          const num = parseInt(numStr.trim(), 10);
          if (!isNaN(num)) {
            numbers.push(num);
          }
        });
      }
    }

    // Handle comma-separated numbers that got tokenized as NODE_STRING only
    if (!ctx.NumberToken && ctx.NODE_STRING) {
      const nodeString = ctx.NODE_STRING[0].image;
      // Parse comma-separated numbers like "0,1" or "0,1,2"
      const numberStrings = nodeString.split(',');
      numberStrings.forEach((numStr: string) => {
        const num = parseInt(numStr.trim(), 10);
        if (!isNaN(num)) {
          numbers.push(num);
        }
      });
    }

    return numbers;
  }

  alphaNum(ctx: any): string {
    if (ctx.NODE_STRING) {
      return ctx.NODE_STRING[0].image;
    } else if (ctx.NumberToken) {
      return ctx.NumberToken[0].image;
    }
    return '';
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
    if (ctx.QuotedString) {
      return ctx.QuotedString[0].image.slice(1, -1); // Remove quotes
    } else if (ctx.StringStart && ctx.StringContent && ctx.StringEnd) {
      return ctx.StringContent[0].image; // String content without quotes
    } else {
      // Handle single or multi-word subgraph titles (including keywords)
      // Collect all tokens and sort by position to maintain original order
      const allTokens: any[] = [];

      // Collect all token types that can appear in subgraph titles
      const tokenTypes = ['NODE_STRING', 'NumberToken', 'Style', 'Class', 'Click'];
      tokenTypes.forEach((tokenType) => {
        if (ctx[tokenType] && Array.isArray(ctx[tokenType])) {
          ctx[tokenType].forEach((token: any) => {
            allTokens.push({
              image: token.image,
              startOffset: token.startOffset,
              endOffset: token.endOffset,
              tokenType: tokenType,
            });
          });
        }
      });

      allTokens.sort((a, b) => a.startOffset - b.startOffset);

      // Special case: if we have exactly 2 tokens and they are NumberToken + NODE_STRING
      // with no space between them, concatenate without space (e.g., "1test")
      if (
        allTokens.length === 2 &&
        allTokens[0].tokenType === 'NumberToken' &&
        allTokens[1].tokenType === 'NODE_STRING'
      ) {
        // Check if tokens are adjacent (no space between them)
        // endOffset is inclusive, so adjacent tokens have endOffset + 1 === startOffset
        if (allTokens[0].endOffset + 1 === allTokens[1].startOffset) {
          return allTokens[0].image + allTokens[1].image;
        }
      }

      // Otherwise, join with spaces for multi-word titles
      return allTokens.map((token) => token.image).join(' ');
    }
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
      linkStyles: this.linkStyles,
    };
  }
}
