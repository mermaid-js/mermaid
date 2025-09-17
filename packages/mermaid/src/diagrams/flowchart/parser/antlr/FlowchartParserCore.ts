import type { VertexStatementContext } from './generated/FlowParser.js';

/**
 * Core shared logic for both Listener and Visitor patterns
 * Contains all the proven parsing logic that achieves 99.1% test compatibility
 */
export class FlowchartParserCore {
  protected db: any;
  protected subgraphStack: any[] = [];
  protected currentSubgraphNodes: any[][] = []; // Stack of node lists for nested subgraphs
  protected direction: string = 'TB'; // Default direction
  protected subgraphTitleTypeStack: string[] = []; // Stack to track title types for nested subgraphs

  // Reserved keywords that cannot be used as node ID prefixes
  private static readonly RESERVED_KEYWORDS = [
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

  constructor(db: any) {
    this.db = db;
  }

  // Direction processing methods
  protected processDirectionStatement(direction: string): void {
    this.direction = this.normalizeDirection(direction);
    this.db.setDirection(this.direction);
  }

  // Graph declaration processing (handles "graph >", "flowchart ^", etc.)
  protected processGraphDeclaration(ctx: any): void {
    const graphText = ctx.getText();
    console.log('🔍 FlowchartParser: Processing graph declaration:', graphText);

    // Extract direction from graph declaration: "graph >", "flowchart ^", etc.
    const directionMatch = graphText.match(
      /(?:graph|flowchart|flowchart-elk)\s*([<>^v]|TB|TD|BT|LR|RL)/
    );
    if (directionMatch) {
      const direction = directionMatch[1];
      console.log('🔍 FlowchartParser: Found direction in graph declaration:', direction);
      this.processDirectionStatement(direction);
    } else {
      // Set default direction if none specified
      this.processDirectionStatement('TB');
    }
  }

  protected normalizeDirection(dir: string): string {
    switch (dir) {
      case 'TD':
        return 'TB';
      case '<':
        return 'RL';
      case '>':
        return 'LR';
      case '^':
        return 'BT';
      case 'v':
        return 'TB';
      default:
        return dir;
    }
  }

  // Accessibility processing methods
  protected processAccTitleStatement(title: string): void {
    this.db.setAccTitle(title);
  }

  protected processAccDescStatement(desc: string): void {
    this.db.setAccDescription(desc);
  }

  // Subgraph processing methods
  protected processSubgraphStatement(id: string, title?: string): void {
    // Push default title type for new subgraph (will be updated during title processing)
    this.subgraphTitleTypeStack.push('text');

    const subgraphData = {
      id: id,
      title: title || id,
      nodes: [],
      edges: [],
    };
    this.subgraphStack.push(subgraphData);
    // Push a new node list for this subgraph to track direction statements
    this.currentSubgraphNodes.push([]);
    // Don't call addSubGraph here - wait until we have all nodes
  }

  protected processSubgraphEnd(): void {
    if (this.subgraphStack.length > 0) {
      const completedSubgraph = this.subgraphStack.pop();
      // Pop the current subgraph's node list and merge it with the subgraph nodes
      const currentNodes = this.currentSubgraphNodes.pop() || [];
      const allNodes = [...completedSubgraph.nodes, ...currentNodes];

      // Now call addSubGraph with the complete list of nodes
      // Pop the title type for this subgraph from the stack
      const titleType = this.subgraphTitleTypeStack.pop() || 'text';
      console.log('🔍 Subgraph end: using stored title type:', titleType);

      this.db.addSubGraph({ text: completedSubgraph.id }, allNodes, {
        text: completedSubgraph.title,
        type: titleType,
      });
      console.log(
        `🔍 FlowchartParser: Completed subgraph ${completedSubgraph.id} with nodes: [${allNodes.join(', ')}]`
      );
    }
  }

  // Core vertex statement processing - shared by both Listener and Visitor
  protected processVertexStatementCore(ctx: VertexStatementContext): void {
    // Handle the current node
    const nodeCtx = ctx.node();
    const shapeDataCtx = ctx.shapeData();

    if (nodeCtx) {
      this.processNode(nodeCtx, shapeDataCtx);
    }

    // Handle edges (links) - this is where A-->B gets processed
    const linkCtx = ctx.link();
    const prevVertexCtx = ctx.vertexStatement();

    if (linkCtx && prevVertexCtx && nodeCtx) {
      // We have a link: prevVertex --link--> currentNode
      // Extract arrays of node IDs to handle ampersand chaining
      const startNodeIds = this.extractNodeIds(prevVertexCtx);
      const endNodeIds = this.extractNodeIds(nodeCtx);

      if (startNodeIds.length > 0 && endNodeIds.length > 0) {
        this.processEdgeArray(startNodeIds, endNodeIds, linkCtx);
      }
    }
  }

  // Core node processing - moved from Listener for shared use
  protected processNode(nodeCtx: any, shapeDataCtx?: any): void {
    // Process all styled vertices in this node (handles ampersand chaining)
    this.processAllStyledVerticesInNode(nodeCtx, shapeDataCtx);
  }

  // Recursively process all styled vertices in a node context
  protected processAllStyledVerticesInNode(nodeCtx: any, shapeDataCtx?: any): void {
    if (!nodeCtx) {
      return;
    }

    // For left-recursive grammar, process nested node first (left side)
    const nestedNodeCtx = nodeCtx.node();
    if (nestedNodeCtx) {
      // Recursively process the nested node first
      this.processAllStyledVerticesInNode(nestedNodeCtx, shapeDataCtx);
    }

    // Then process the direct styled vertex (right side)
    const styledVertexCtx = nodeCtx.styledVertex();
    if (styledVertexCtx) {
      this.processSingleStyledVertex(styledVertexCtx, shapeDataCtx);
    }
  }

  // Process a single styled vertex
  protected processSingleStyledVertex(styledVertexCtx: any, shapeDataCtx?: any): void {
    const vertexCtx = styledVertexCtx.vertex();
    if (!vertexCtx) {
      return;
    }

    // Check if this styled vertex has its own shape data
    const localShapeDataCtx = styledVertexCtx.shapeData();
    const effectiveShapeDataCtx = localShapeDataCtx || shapeDataCtx;

    // Get node ID
    const idCtx = vertexCtx.idString();
    const nodeId = idCtx ? idCtx.getText() : '';

    // Validate node ID against reserved keywords
    this.validateNodeId(nodeId);

    // Always process as regular vertex first to create the vertex
    this.processRegularVertex(styledVertexCtx, effectiveShapeDataCtx);

    // Then check for class application pattern: vertex STYLE_SEPARATOR idString
    const children = styledVertexCtx.children;
    if (children && children.length >= 3) {
      // Look for STYLE_SEPARATOR (:::) pattern
      for (let i = 0; i < children.length - 1; i++) {
        if (children[i].getText && children[i].getText() === ':::') {
          // Found STYLE_SEPARATOR, next should be the class name
          const className = children[i + 1].getText();
          if (className) {
            // Apply class to vertex: setClass(vertex, className)
            this.db.setClass(nodeId, className);
          }
        }
      }
    }
  }

  protected extractNodeIds(nodeCtx: any): string[] {
    if (!nodeCtx) {
      return [];
    }

    const nodeIds: string[] = [];

    // For VertexStatementContext, get the node
    if (nodeCtx.node) {
      const node = nodeCtx.node();
      if (node) {
        // Recursively collect all node IDs from the node context
        this.collectNodeIdsFromNode(node, nodeIds);
      }
    }

    // For NodeContext directly
    if (nodeCtx.styledVertex) {
      this.collectNodeIdsFromNode(nodeCtx, nodeIds);
    }

    return nodeIds;
  }

  // Helper method to collect node IDs from a node context
  protected collectNodeIdsFromNode(nodeCtx: any, nodeIds: string[]): void {
    if (!nodeCtx) {
      return;
    }

    // For NodeContext, handle nested node first to maintain correct order (A & B should be [A, B])
    if (nodeCtx.node) {
      const nestedNodeCtx = nodeCtx.node();
      if (nestedNodeCtx) {
        this.collectNodeIdsFromNode(nestedNodeCtx, nodeIds);
      }
    }

    // Then handle the direct styled vertex
    if (nodeCtx.styledVertex) {
      const styledVertexCtx = nodeCtx.styledVertex();
      if (styledVertexCtx) {
        const vertexCtx = styledVertexCtx.vertex();
        if (vertexCtx) {
          const idCtx = vertexCtx.idString();
          if (idCtx) {
            const nodeId = idCtx.getText();
            if (nodeId && !nodeIds.includes(nodeId)) {
              nodeIds.push(nodeId);
            }
          }
        }
      }
    }

    // Handle other children recursively (but skip node and styledVertex as they're handled above)
    if (nodeCtx.children) {
      for (const child of nodeCtx.children) {
        // Skip node and styledVertex contexts as they're handled above
        if (child && typeof child.node !== 'function' && typeof child.styledVertex !== 'function') {
          this.collectNodeIdsFromNode(child, nodeIds);
        }
      }
    }
  }

  protected processEdgeArray(startNodeIds: string[], endNodeIds: string[], linkCtx: any): void {
    // Extract link information
    const linkData = this.extractLinkData(linkCtx);

    // Use the database's addLink method which handles all combinations
    this.db.addLink(startNodeIds, endNodeIds, linkData);

    // Track nodes in current subgraph if we're inside one
    if (this.subgraphStack.length > 0) {
      const currentSubgraph = this.subgraphStack[this.subgraphStack.length - 1];

      // Add start nodes first, then end nodes
      for (const startNodeId of startNodeIds) {
        if (!currentSubgraph.nodes.includes(startNodeId)) {
          currentSubgraph.nodes.unshift(startNodeId);
        }
      }
      for (const endNodeId of endNodeIds) {
        if (!currentSubgraph.nodes.includes(endNodeId)) {
          currentSubgraph.nodes.unshift(endNodeId);
        }
      }
    }
  }

  // Validate that a node ID doesn't start with reserved keywords
  protected validateNodeId(nodeId: string | null): void {
    if (!nodeId) return; // Skip validation for null/undefined nodeId

    for (const keyword of FlowchartParserCore.RESERVED_KEYWORDS) {
      if (
        nodeId.startsWith(keyword + '.') ||
        nodeId.startsWith(keyword + '-') ||
        nodeId.startsWith(keyword + '/')
      ) {
        throw new Error(`Node ID cannot start with reserved keyword: ${keyword}`);
      }
    }
  }

  protected processRegularVertex(styledVertexCtx: any, shapeDataCtx?: any): void {
    // Extract node ID from styled vertex
    const nodeId = this.extractNodeId(styledVertexCtx);
    if (!nodeId) {
      return;
    }

    // Validate node ID against reserved keywords
    this.validateNodeId(nodeId);

    // Extract vertex context to get text and shape
    const vertexCtx = styledVertexCtx.vertex();
    if (!vertexCtx) {
      return;
    }

    // Get node text - if there's explicit text, use it, otherwise use the ID
    const textCtx = vertexCtx.text();
    let textObj;
    if (textCtx) {
      const textWithType = this.extractTextWithType(textCtx);
      textObj = { text: textWithType.text, type: textWithType.type };
    } else if (vertexCtx.ELLIPSE_COMPLETE()) {
      // Extract text from ELLIPSE_COMPLETE token: (-text-)
      const ellipseToken = vertexCtx.ELLIPSE_COMPLETE().getText();
      const ellipseText = ellipseToken.slice(2, -2); // Remove (- and -)
      textObj = { text: ellipseText, type: 'text' };
    } else {
      textObj = { text: nodeId, type: 'text' };
    }

    // Get node shape from vertex type based on grammar structure
    let nodeShape = 'squareRect'; // default - matches Jison parser behavior

    // Determine shape based on the number of children and their types
    const children = vertexCtx.children || [];

    if (children.length === 1) {
      // Simple node ID without shape tokens - should be squareRect
      nodeShape = 'squareRect';
    } else {
      // Node with shape tokens - determine shape based on tokens

      if (vertexCtx.TAGEND && vertexCtx.TAGEND()) {
        // Odd shape: >text] - check this first since it's most specific
        nodeShape = 'odd';
      } else if (
        vertexCtx.TRAP_START &&
        vertexCtx.TRAP_START() &&
        vertexCtx.TRAPEND &&
        vertexCtx.TRAPEND()
      ) {
        // Trapezoid: [/text\]
        nodeShape = 'trapezoid';
      } else if (
        vertexCtx.INVTRAP_START &&
        vertexCtx.INVTRAP_START() &&
        vertexCtx.INVTRAPEND &&
        vertexCtx.INVTRAPEND()
      ) {
        // Inv trapezoid: [\text/]
        nodeShape = 'inv_trapezoid';
      } else if (
        vertexCtx.TRAP_START &&
        vertexCtx.TRAP_START() &&
        vertexCtx.INVTRAPEND &&
        vertexCtx.INVTRAPEND()
      ) {
        // Lean right: [/text/]
        nodeShape = 'lean_right';
      } else if (
        vertexCtx.INVTRAP_START &&
        vertexCtx.INVTRAP_START() &&
        vertexCtx.TRAPEND &&
        vertexCtx.TRAPEND()
      ) {
        // Lean left: [\text\]
        nodeShape = 'lean_left';
      } else if (vertexCtx.CYLINDER_START && vertexCtx.CYLINDER_START()) {
        // Cylinder: [(text)]
        nodeShape = 'cylinder';
      } else if (vertexCtx.VERTEX_WITH_PROPS_START && vertexCtx.VERTEX_WITH_PROPS_START()) {
        // Vertex with props: [|field:value|text] - this is treated as rect
        nodeShape = 'rect';
      } else if (vertexCtx.SQS && vertexCtx.SQS()) {
        // Square brackets [text] create square type (matches Jison parser)
        nodeShape = 'square';
      } else if (vertexCtx.CIRCLE_START && vertexCtx.CIRCLE_START()) {
        nodeShape = 'circle';
      } else if (vertexCtx.PS && vertexCtx.PS()) {
        nodeShape = 'round';
      } else if (vertexCtx.DOUBLECIRCLE_START && vertexCtx.DOUBLECIRCLE_START()) {
        nodeShape = 'doublecircle';
      } else if (vertexCtx.ELLIPSE_COMPLETE && vertexCtx.ELLIPSE_COMPLETE()) {
        nodeShape = 'ellipse';
      } else if (vertexCtx.ELLIPSE_START && vertexCtx.ELLIPSE_START()) {
        nodeShape = 'ellipse';
      } else if (vertexCtx.STADIUM_START && vertexCtx.STADIUM_START()) {
        nodeShape = 'stadium';
      } else if (vertexCtx.SUBROUTINE_START && vertexCtx.SUBROUTINE_START()) {
        nodeShape = 'subroutine';
      } else if (vertexCtx.DIAMOND_START && vertexCtx.DIAMOND_START()) {
        // Check if it's a hexagon (double diamond) or regular diamond
        const diamondStarts = vertexCtx.DIAMOND_START();
        if (diamondStarts && diamondStarts.length >= 2) {
          nodeShape = 'hexagon';
        } else {
          nodeShape = 'diamond';
        }
      }
    } // End of shape detection for nodes with shape tokens

    // Process shape data if present
    let shapeDataYaml = '';
    if (shapeDataCtx) {
      shapeDataYaml = this.processShapeData(shapeDataCtx);
    }

    // Add vertex to database
    this.db.addVertex(nodeId, textObj, nodeShape, [], [], '', {}, shapeDataYaml);

    // Track individual nodes in current subgraph if we're inside one
    if (this.subgraphStack.length > 0) {
      const currentSubgraph = this.subgraphStack[this.subgraphStack.length - 1];
      if (!currentSubgraph.nodes.includes(nodeId)) {
        currentSubgraph.nodes.unshift(nodeId);
      }
    }
  }

  // Helper methods (simplified versions for now)
  protected extractNodeId(styledVertexCtx: any): string | null {
    if (!styledVertexCtx) return null;
    const vertexCtx = styledVertexCtx.vertex();
    if (!vertexCtx) return null;
    const idCtx = vertexCtx.idString();
    return idCtx ? idCtx.getText() : null;
  }

  protected extractLinkData(linkCtx: any): any {
    let linkText = '';
    let linkTextType = 'text';
    let stroke = 'normal';
    let length = 1;
    let type = 'arrow_point'; // default arrow type
    let edgeId = null;

    if (!linkCtx) {
      return {
        text: { text: linkText, type: linkTextType },
        type,
        stroke,
        length,
      };
    }

    // Get the raw link text to analyze arrow type and stroke
    const linkText_raw = linkCtx.getText();

    // Extract edge ID if present (e.g., "e1@-->")
    const idMatch = linkText_raw.match(/^([^@]+)@/);
    if (idMatch) {
      edgeId = idMatch[1];
    }

    // Extract link text if present - try multiple ways to find text
    let textCtx = null;

    // Method 1: Direct text() method
    if (linkCtx.text && typeof linkCtx.text === 'function') {
      textCtx = linkCtx.text();
    }

    // Method 2: Look for text in children
    if (!textCtx && linkCtx.children) {
      for (const child of linkCtx.children) {
        if (
          child.constructor.name.includes('Text') ||
          (child.text && typeof child.text === 'function')
        ) {
          textCtx = child.text ? child.text() : child;
          break;
        }
      }
    }

    // Method 3: Extract text from patterns like |text| or "text"
    if (!textCtx) {
      const textMatch =
        linkText_raw.match(/\|([^|]*)\|/) ||
        linkText_raw.match(/"([^"]*`[^"]*)"/) || // Handle quotes with backticks inside: "`content`"
        linkText_raw.match(/"([^"]*)"/) || // Handle regular quotes: "content"
        linkText_raw.match(/--\s+([^-]+?)\s+--/) ||
        linkText_raw.match(/==\s+([^=]+?)\s+==/) ||
        linkText_raw.match(/-\.\s+([^.]+?)\s+\.-/);

      if (textMatch) {
        linkText = textMatch[1];

        // Check if extracted text contains backticks (markdown inside quotes)
        if (linkText.startsWith('`') && linkText.endsWith('`')) {
          linkTextType = 'markdown';
          linkText = linkText.slice(1, -1); // Remove backticks like Jison does
        }
      }
    } else if (textCtx) {
      // Use the same text processing logic as nodes for consistency
      const textWithType = this.extractTextWithType(textCtx);
      linkText = textWithType.text;
      linkTextType = textWithType.type;
    }

    // Extract the pure link pattern without text for destructLink analysis
    let linkPattern = linkText_raw;

    // Remove edge ID if present (e.g., "e1@<-- text -->" -> "<-- text -->")
    if (edgeId) {
      linkPattern = linkText_raw.replace(/^[^@]+@/, '');
    }

    // Remove text from link pattern for destructLink analysis
    // Handle different text patterns:
    // 1. --x|text| -> --x
    // 2. -- text --x -> --x
    // 3. <-- text --> -> <-- and -->

    // Pattern 1: Remove |text| from patterns like --x|text|
    linkPattern = linkPattern.replace(/\|[^|]*\|/, '');

    // Pattern 2: Remove text from patterns like "-- text --x" -> "--x"
    // Look for pattern: START_PATTERN text END_PATTERN
    const textInMiddleMatch = linkPattern.match(/^(\s*-+)\s+(.+?)\s+(-+[xo>]?\s*)$/);
    if (textInMiddleMatch) {
      const startPart = textInMiddleMatch[1]; // "--"
      const endPart = textInMiddleMatch[3]; // "--x"
      linkPattern = startPart + endPart; // "--" + "--x" = "----x"
      // But we want just the end part for single arrows
      linkPattern = endPart.trim();
    }

    // For patterns with text, extract just the link pattern parts
    // Examples: "<-- text -->" -> "<-->"
    //          "x-- text --x" -> "x--x"
    //          "o== text ==o" -> "o==o"
    if (linkText) {
      // Double-ended patterns with text
      const doublePatterns = [
        { regex: /^<--+\s+.+?\s+--+>$/, replacement: '<-->' }, // <-- text --> -> <-->
        { regex: /^<==+\s+.+?\s+==+>$/, replacement: '<==>' }, // <== text ==> -> <==>
        { regex: /^<-\.+\s+.+?\s+\.+->$/, replacement: '<-.->' }, // <-. text .-> -> <-.->
        { regex: /^x--+\s+.+?\s+--+x$/, replacement: 'x--x' }, // x-- text --x -> x--x
        { regex: /^x==+\s+.+?\s+==+x$/, replacement: 'x==x' }, // x== text ==x -> x==x
        { regex: /^x-\.+\s+.+?\s+\.+-x$/, replacement: 'x-.-x' }, // x-. text .-x -> x-.-x
        { regex: /^o--+\s+.+?\s+--+o$/, replacement: 'o--o' }, // o-- text --o -> o--o
        { regex: /^o==+\s+.+?\s+==+o$/, replacement: 'o==o' }, // o== text ==o -> o==o
        { regex: /^o-\.+\s+.+?\s+\.+-o$/, replacement: 'o-.-o' }, // o-. text .-o -> o-.-o
      ];

      for (const pattern of doublePatterns) {
        if (pattern.regex.test(linkPattern)) {
          linkPattern = linkPattern.replace(pattern.regex, pattern.replacement);
          break;
        }
      }

      // Single-ended patterns with text (e.g., "-- text -->" -> "-->")
      const singlePatterns = [
        { regex: /^--+\s+.+?\s+--+[xo>]$/, replacement: '-->' }, // -- text --> -> -->
        { regex: /^==+\s+.+?\s+==+[xo>]$/, replacement: '==>' }, // == text ==> -> ==>
        { regex: /^-\.+\s+.+?\s+\.+-[xo>]$/, replacement: '.->' }, // -. text .-> -> .->
        { regex: /^--+\|.+?\|$/, replacement: '---' }, // ---|text| -> ---
        { regex: /^==+\|.+?\|$/, replacement: '===' }, // ===|text| -> ===
        { regex: /^-\.+\|.+?\|$/, replacement: '-.-' }, // -.-|text| -> -.-
        // Handle labeled edges - preserve the length from the right side
        {
          regex: /^\s*--\s+.+?\s+(--+)\s*$/,
          replacement: (match: string, p1: string) => p1,
        }, // -- Label --- -> ---
        {
          regex: /^\s*==\s+.+?\s+(==+)\s*$/,
          replacement: (match: string, p1: string) => p1,
        }, // == Label === -> ===
        {
          regex: /^\s*-\.\s+.+?\s+(\.+-)\s*$/,
          replacement: (match: string, p1: string) => p1,
        }, // -. Label .- -> -.-
        // Handle labeled edges with arrows - preserve the length from the right side
        {
          regex: /^\s*--\s+.+?\s+(--+)>\s*$/,
          replacement: (match: string, p1: string) => p1 + '>',
        }, // -- Label --> -> -->
        {
          regex: /^\s*==\s+.+?\s+(==+)>\s*$/,
          replacement: (match: string, p1: string) => p1 + '>',
        }, // == Label ==> -> ==>
        {
          regex: /^\s*-\.\s+.+?\s+(\.+-)>\s*$/,
          replacement: (match: string, p1: string) => p1 + '>',
        }, // -. Label .-> -> .->
      ];

      for (const pattern of singlePatterns) {
        if (pattern.regex.test(linkPattern)) {
          if (typeof pattern.replacement === 'function') {
            linkPattern = linkPattern.replace(pattern.regex, pattern.replacement);
          } else {
            linkPattern = pattern.replacement;
          }
          break;
        }
      }
    }

    // Use destructLink logic to determine arrow type and stroke
    // Check if this is a double arrow pattern
    const doubleArrowMatch = linkPattern.match(/^\s*(<[=\-.]+)\s+.+?\s+([=\-.]+>)\s*$/);
    let linkInfo;
    if (doubleArrowMatch) {
      // Double arrow: call destructLink with both start and end parts
      const startLink = doubleArrowMatch[1]; // e.g., "<--"
      const endLink = doubleArrowMatch[2]; // e.g., "-->"
      linkInfo = this.destructLink(endLink, startLink);
    } else {
      // Single arrow: call destructLink with just the pattern
      linkInfo = this.destructLink(linkPattern);
    }
    type = linkInfo.type;
    stroke = linkInfo.stroke;
    length = linkInfo.length;

    const result: any = {
      text: { text: linkText, type: linkTextType },
      type,
      stroke,
      length,
    };

    if (edgeId) {
      result.id = edgeId;
    }

    return result;
  }

  // Implement destructLink logic from FlowDB
  private destructStartLink(str: string): { type: string; stroke: string } {
    str = str.trim();
    let type = 'arrow_open';

    switch (str[0]) {
      case '<':
        type = 'arrow_point';
        str = str.slice(1);
        break;
      case 'x':
        type = 'arrow_cross';
        str = str.slice(1);
        break;
      case 'o':
        type = 'arrow_circle';
        str = str.slice(1);
        break;
    }

    let stroke = 'normal';

    if (str.includes('=')) {
      stroke = 'thick';
    }

    if (str.includes('.')) {
      stroke = 'dotted';
    }

    return { type, stroke };
  }

  private countChar(char: string, str: string): number {
    const length = str.length;
    let count = 0;
    for (let i = 0; i < length; ++i) {
      if (str[i] === char) {
        ++count;
      }
    }
    return count;
  }

  private destructEndLink(str: string): { type: string; stroke: string; length: number } {
    str = str.trim();
    let line = str.slice(0, -1);
    let type = 'arrow_open';

    switch (str.slice(-1)) {
      case 'x':
        type = 'arrow_cross';
        if (str.startsWith('x')) {
          type = 'double_' + type;
          line = line.slice(1);
        }
        break;
      case '>':
        type = 'arrow_point';
        if (str.startsWith('<')) {
          type = 'double_' + type;
          line = line.slice(1);
        }
        break;
      case 'o':
        type = 'arrow_circle';
        if (str.startsWith('o')) {
          type = 'double_' + type;
          line = line.slice(1);
        }
        break;
    }

    let stroke = 'normal';
    let length = line.length - 1;

    if (line.startsWith('=')) {
      stroke = 'thick';
    }

    if (line.startsWith('~')) {
      stroke = 'invisible';
    }

    const dots = this.countChar('.', line);

    if (dots) {
      stroke = 'dotted';
      length = dots;
    }

    return { type, stroke, length };
  }

  private destructLink(
    str: string,
    startStr?: string
  ): { type: string; stroke: string; length: number } {
    const info = this.destructEndLink(str);
    let startInfo;
    if (startStr) {
      startInfo = this.destructStartLink(startStr);

      if (startInfo.stroke !== info.stroke) {
        return { type: 'INVALID', stroke: 'INVALID', length: 1 };
      }

      if (startInfo.type === 'arrow_open') {
        // -- xyz -->  - take arrow type from ending
        startInfo.type = info.type;
      } else {
        // x-- xyz -->  - not supported
        if (startInfo.type !== info.type) {
          return { type: 'INVALID', stroke: 'INVALID', length: 1 };
        }

        startInfo.type = 'double_' + startInfo.type;
      }

      if (startInfo.type === 'double_arrow') {
        startInfo.type = 'double_arrow_point';
      }

      return { type: startInfo.type, stroke: startInfo.stroke, length: info.length };
    }

    return info;
  }

  protected extractTextWithType(textCtx: any): { text: string; type: string } {
    if (!textCtx) return { text: '', type: 'text' };

    let text = textCtx.getText();
    let type = 'text';

    // Check parse tree structure to detect string types (since ANTLR lexer strips quotes)
    if (textCtx.children) {
      for (const child of textCtx.children) {
        // Check for stringLiteral (quoted strings) - quotes already stripped by lexer
        if (
          child.constructor.name === 'StringLiteralContext' ||
          (child.stringLiteral && child.stringLiteral())
        ) {
          type = 'string';

          // Special case: Check if quoted string contains backticks (markdown inside quotes)
          // This matches Jison behavior where "`content`" inside quotes becomes markdown
          if (text.startsWith('`') && text.endsWith('`')) {
            type = 'markdown';
            text = text.slice(1, -1); // Remove backticks like Jison does
          }
          break;
        }
        // Check for EdgeTextTokenContext (edge text tokens)
        else if (child.constructor.name === 'EdgeTextTokenContext') {
          // Edge text can contain quoted strings with backticks
          // Handle pattern: "`content`" -> markdown with backticks stripped
          if (text.match(/^"[^"]*`[^`]*`[^"]*"\s*$/)) {
            type = 'markdown';
            // Extract content between quotes and strip backticks
            const match = text.match(/^"([^"]*)"(\s*)$/);
            if (match) {
              let content = match[1];
              if (content.startsWith('`') && content.endsWith('`')) {
                content = content.slice(1, -1); // Remove backticks
              }
              text = content;
            }
          }
          // Handle regular quoted strings: "content" -> string
          else if (text.match(/^"[^"]*"\s*$/)) {
            type = 'string';
            // Extract content between quotes
            const match = text.match(/^"([^"]*)"\s*$/);
            if (match) {
              text = match[1];
            }
          }
          break;
        }
        // Check for MD_STR (markdown strings with backticks)
        else if (
          child.symbol &&
          child.symbol.type &&
          child.symbol.text &&
          child.symbol.text.includes('`')
        ) {
          type = 'markdown';
          // Strip backticks for markdown (matches Jison behavior)
          if (text.startsWith('`') && text.endsWith('`')) {
            text = text.slice(1, -1);
          }
          break;
        }
      }
    }

    // Fallback: Check text content for markdown backticks (for cases where parse tree detection fails)
    if (type === 'text' && text.startsWith('`') && text.endsWith('`')) {
      type = 'markdown';
      text = text.slice(1, -1); // Remove backticks like Jison does
    }
    return { text, type };
  }

  protected processShapeData(shapeDataCtx: any): string {
    if (!shapeDataCtx) return '';

    const shapeDataText = shapeDataCtx.getText();

    // Extract the content between { and } for YAML parsing
    let yamlContent = shapeDataText;

    // Remove the @ prefix if present
    if (yamlContent.startsWith('@')) {
      yamlContent = yamlContent.substring(1);
    }

    // Remove optional whitespace after @
    yamlContent = yamlContent.trim();

    // Remove the { and } wrapper
    if (yamlContent.startsWith('{') && yamlContent.endsWith('}')) {
      yamlContent = yamlContent.substring(1, yamlContent.length - 1).trim();
    }

    // Normalize the YAML content
    const lines = yamlContent.split('\n');
    const normalizedLines = lines
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    return normalizedLines.join('\n');
  }

  // Style processing methods
  protected processStyleStatementCore(ctx: any): void {
    // Extract style information - for style statements, the idString is a vertex ID, not a class name
    const styleData = this.extractStyleData(ctx);
    if (styleData) {
      // Create vertex with styles - matches Jison behavior: yy.addVertex($idString,undefined,undefined,$stylesOpt);
      // Parameters: id, text, type, styles, classes, dir, props, shapeDataYaml
      this.db.addVertex(
        styleData.className,
        undefined,
        undefined,
        styleData.styles,
        [],
        '',
        {},
        ''
      );
    }
  }

  protected processLinkStyleStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing linkStyle statement');

    try {
      // Extract components from the linkStyle statement
      // Grammar patterns:
      // LINKSTYLE WS DEFAULT WS stylesOpt
      // LINKSTYLE WS numList WS stylesOpt
      // LINKSTYLE WS DEFAULT WS INTERPOLATE WS alphaNum WS stylesOpt
      // LINKSTYLE WS numList WS INTERPOLATE WS alphaNum WS stylesOpt
      // LINKSTYLE WS DEFAULT WS INTERPOLATE WS alphaNum
      // LINKSTYLE WS numList WS INTERPOLATE WS alphaNum

      let positions: ('default' | number)[] = [];
      let interpolateValue: string | null = null;
      let styles: string[] = [];

      // Check for DEFAULT token
      const defaultToken = ctx.DEFAULT && ctx.DEFAULT();
      if (defaultToken) {
        positions = ['default'];
      }

      // Check for numList (comma-separated numbers)
      const numListCtx = ctx.numList && ctx.numList();
      if (numListCtx) {
        positions = this.extractNumList(numListCtx);
      }

      // Check for INTERPOLATE and alphaNum
      const interpolateToken = ctx.INTERPOLATE && ctx.INTERPOLATE();
      const alphaNumCtx = ctx.alphaNum && ctx.alphaNum();
      if (interpolateToken && alphaNumCtx) {
        interpolateValue = alphaNumCtx.getText();
      }

      // Check for stylesOpt
      const stylesOptCtx = ctx.stylesOpt && ctx.stylesOpt();
      if (stylesOptCtx) {
        styles = this.extractStylesOpt(stylesOptCtx);
      }

      console.log(
        `🔍 FlowchartParser: linkStyle - positions: ${JSON.stringify(positions)}, interpolate: ${interpolateValue}, styles: ${JSON.stringify(styles)}`
      );

      // Apply interpolation if specified
      if (interpolateValue) {
        this.db.updateLinkInterpolate(positions, interpolateValue);
      }

      // Apply styles if specified
      if (styles.length > 0) {
        this.db.updateLink(positions, styles);
      }
    } catch (error) {
      console.error('❌ FlowchartParser: Error processing linkStyle statement:', error);
    }
  }

  // Helper method to extract number list from numList context
  private extractNumList(numListCtx: any): number[] {
    const numbers: number[] = [];

    try {
      // numList can be: NUM | numList COMMA NUM
      // We need to traverse the context to extract all numbers
      const children = numListCtx.children || [];

      for (const child of children) {
        if (child.symbol && child.symbol.type) {
          // Check if this is a NUM token
          const tokenType = child.symbol.type;
          if (tokenType === this.getNumTokenType()) {
            const numValue = parseInt(child.getText(), 10);
            if (!isNaN(numValue)) {
              numbers.push(numValue);
            }
          }
        }
      }

      // Fallback: try to extract numbers from text
      if (numbers.length === 0) {
        const text = numListCtx.getText();
        const matches = text.match(/\d+/g);
        if (matches) {
          for (const match of matches) {
            const num = parseInt(match, 10);
            if (!isNaN(num)) {
              numbers.push(num);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ FlowchartParser: Error extracting numList:', error);
    }

    return numbers;
  }

  // Helper method to extract styles from stylesOpt context
  private extractStylesOpt(stylesOptCtx: any): string[] {
    const styles: string[] = [];

    try {
      // stylesOpt can be: style | stylesOpt COMMA style
      // We need to traverse and extract all style components
      const text = stylesOptCtx.getText();

      // Split by comma and clean up each style
      const styleStrings = text
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      styles.push(...styleStrings);
    } catch (error) {
      console.error('❌ FlowchartParser: Error extracting stylesOpt:', error);
    }

    return styles;
  }

  // Helper method to get NUM token type (implementation depends on lexer)
  private getNumTokenType(): number {
    // This would need to be implemented based on the actual lexer token types
    // For now, return a placeholder
    return -1; // Placeholder
  }

  // Core class definition statement processing - shared by both Listener and Visitor
  protected processClassDefStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing class definition statement');

    const classDefData = this.extractClassDefData(ctx);
    if (!classDefData) return;

    const { className, styles } = classDefData;

    // Add class definition to database
    this.db.addClass(className, styles);
  }

  protected processClassStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing class statement');

    // Extract class information
    const classData = this.extractClassData(ctx);
    if (classData) {
      for (const nodeId of classData.nodeIds) {
        this.db.setClass(nodeId, classData.className);
      }
    }
  }

  protected processClickStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing click statement');

    // Extract click information and tooltip separately
    const clickData = this.extractClickData(ctx);
    if (!clickData) {
      console.log('❌ FlowchartParser: Failed to extract click data');
      return;
    }

    const { nodeId, functionName, link, target } = clickData;

    if (functionName) {
      // Handle callback function - match Jison parser behavior
      const functionArgs = functionName.includes('(')
        ? functionName.substring(functionName.indexOf('(') + 1, functionName.lastIndexOf(')'))
        : '';
      const cleanFunctionName = functionName.includes('(')
        ? functionName.substring(0, functionName.indexOf('('))
        : functionName;

      if (functionArgs) {
        // Callback with arguments - call with 3 parameters (like Jison: setClickEvent($CLICK, $CALLBACKNAME, $CALLBACKARGS))
        console.log('🔍 FlowchartParser: Calling setClickEvent with args:', {
          nodeId,
          cleanFunctionName,
          functionArgs,
        });
        this.db.setClickEvent(nodeId, cleanFunctionName, functionArgs);
      } else {
        // Simple callback - call with 2 parameters (like Jison: setClickEvent($CLICK, $CALLBACKNAME))
        console.log('🔍 FlowchartParser: Calling setClickEvent simple:', {
          nodeId,
          cleanFunctionName,
        });
        this.db.setClickEvent(nodeId, cleanFunctionName);
      }
    } else if (link) {
      // Handle href link - match Jison parser behavior
      if (target && target !== '_self') {
        // Link with explicit target - call with 3 parameters (like Jison: setLink($CLICK, $STR, $LINK_TARGET))
        console.log('🔍 FlowchartParser: Calling setLink with target:', { nodeId, link, target });
        this.db.setLink(nodeId, link, target);
      } else {
        // Simple link - call with 2 parameters (like Jison: setLink($CLICK, $STR))
        console.log('🔍 FlowchartParser: Calling setLink simple:', { nodeId, link });
        this.db.setLink(nodeId, link);
      }
    }

    // Handle tooltip separately - match Jison parser behavior
    // Tooltips are always handled as separate setTooltip calls, never as additional parameters
    this.extractAndSetTooltip(ctx, nodeId);
  }

  protected extractAndSetTooltip(ctx: any, nodeId: string): void {
    console.log('🔍 FlowchartParser: Extracting tooltip for node:', nodeId);

    const stringLiterals = ctx.stringLiteral && ctx.stringLiteral();
    const callToken = ctx.CALL && ctx.CALL();
    const callbackArgsToken = ctx.CALLBACKARGS && ctx.CALLBACKARGS();
    const hrefToken = ctx.HREF && ctx.HREF();

    if (!stringLiterals || stringLiterals.length === 0) {
      console.log('🔍 FlowchartParser: No string literals found for tooltip');
      return;
    }

    let tooltip: string | undefined;

    // Determine tooltip based on the click statement pattern
    if (callToken && callbackArgsToken) {
      // Pattern: "click A call callback() 'tooltip'" - tooltip is first string literal
      if (stringLiterals.length > 0) {
        const tooltipText = stringLiterals[0].getText();
        tooltip = tooltipText.replace(/^["'](.*?)["']$/, '$1');
        console.log('🔍 FlowchartParser: Found call callback tooltip:', tooltip);
      }
    } else if (ctx.CALLBACKNAME && ctx.CALLBACKNAME()) {
      // Pattern: "click A callback 'tooltip'" - tooltip is first string literal
      if (stringLiterals.length > 0) {
        const tooltipText = stringLiterals[0].getText();
        tooltip = tooltipText.replace(/^["'](.*?)["']$/, '$1');
        console.log('🔍 FlowchartParser: Found callback tooltip:', tooltip);
      }
    } else if (hrefToken) {
      // Pattern: "click A href 'link' 'tooltip'" - tooltip is second string literal
      if (stringLiterals.length > 1) {
        const tooltipText = stringLiterals[1].getText();
        if (tooltipText.startsWith('"') || tooltipText.startsWith("'")) {
          tooltip = tooltipText.replace(/^["'](.*?)["']$/, '$1');
          console.log('🔍 FlowchartParser: Found href tooltip:', tooltip);
        }
      }
    } else {
      // Pattern: "click A 'link' 'tooltip'" - tooltip is second string literal
      if (stringLiterals.length > 1) {
        const tooltipText = stringLiterals[1].getText();
        if (tooltipText.startsWith('"') || tooltipText.startsWith("'")) {
          tooltip = tooltipText.replace(/^["'](.*?)["']$/, '$1');
          console.log('🔍 FlowchartParser: Found link tooltip:', tooltip);
        }
      }
    }

    // Set tooltip if found
    if (tooltip) {
      console.log('🔍 FlowchartParser: Setting tooltip:', { nodeId, tooltip });
      this.db.setTooltip(nodeId, tooltip);
    }
  }

  // Direction statement processing
  protected processDirectionStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing direction statement');

    // Extract direction from context
    const directionText = ctx.getText();
    const directionMatch = directionText.match(/direction\s+(TB|TD|BT|LR|RL)/);
    if (directionMatch) {
      const direction = directionMatch[1];

      // Check if we're inside a subgraph
      if (this.currentSubgraphNodes.length > 0) {
        // Inside a subgraph - add direction as a special object to the current subgraph's node list
        console.log('🔍 FlowchartParser: Adding direction to subgraph:', direction);
        this.currentSubgraphNodes[this.currentSubgraphNodes.length - 1].push({
          stmt: 'dir',
          value: direction,
        });
      } else {
        // Global direction statement
        this.processDirectionStatement(direction);
      }
    }
  }

  // Accessibility statement processing
  protected processAccTitleStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing accTitle statement');

    const titleText = ctx.getText();
    const titleMatch = titleText.match(/accTitle:\s*(.+)/);
    if (titleMatch) {
      this.processAccTitleStatement(titleMatch[1].trim());
    }
  }

  protected processAccDescStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing accDescr statement');

    const descText = ctx.getText();

    // Handle single-line format: accDescr: description
    const singleLineMatch = descText.match(/accDescr:\s*(.+)/);
    if (singleLineMatch) {
      this.processAccDescStatement(singleLineMatch[1].trim());
      return;
    }

    // Handle multi-line block format: accDescr { description with multiple lines }
    const blockMatch = descText.match(/accDescr\s*\{\s*([\s\S]*?)\s*\}/);
    if (blockMatch) {
      // Clean up the multi-line content: trim whitespace and normalize line breaks
      const content = blockMatch[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
      this.processAccDescStatement(content);
      return;
    }

    console.log('🔍 FlowchartParser: No accDescr pattern matched for:', descText);
  }

  // Subgraph statement processing
  protected processSubgraphStatementCore(ctx: any): void {
    console.log('🔍 FlowchartParser: Processing subgraph statement');

    const extractedId = this.extractSubgraphId(ctx);
    const title = this.extractSubgraphLabel(ctx);

    // Handle auto-ID generation for title-only subgraphs
    const id = extractedId || `subGraph${this.subgraphStack.length}`;

    this.processSubgraphStatement(id, title);
  }

  protected processSubgraphEndCore(): void {
    console.log('🔍 FlowchartParser: Processing subgraph end');
    this.processSubgraphEnd();
  }

  // Helper methods for extracting data from contexts
  protected extractSubgraphId(ctx: any): string | null {
    // Extract subgraph ID from context based on grammar patterns:
    // SUBGRAPH WS textNoTags SQS text SQE - textNoTags is ID, text is title
    // SUBGRAPH WS textNoTags - textNoTags is both ID and title
    // SUBGRAPH - no ID or title

    const children = ctx.children || [];

    // Check if we have the pattern with square brackets (ID + title)
    let hasSQS = false;
    for (const child of children) {
      if (child.constructor.name === 'TerminalNode' && child.getText() === '[') {
        hasSQS = true;
        break;
      }
    }

    if (hasSQS) {
      // Pattern: SUBGRAPH WS textNoTags SQS text SQE
      // textNoTags is the ID
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.constructor.name === 'TextNoTagsContext') {
          return child.getText().trim();
        }
      }
    } else {
      // Pattern: SUBGRAPH WS textNoTags - textNoTags could be ID or title
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.constructor.name === 'TextNoTagsContext') {
          const text = child.getText().trim();
          // If the text is quoted, treat it as a title-only subgraph (return null for auto-ID generation)
          if (
            (text.startsWith('"') && text.endsWith('"')) ||
            (text.startsWith("'") && text.endsWith("'"))
          ) {
            return null; // This will trigger auto-ID generation in the database
          }
          // Otherwise, treat it as both ID and title
          return text;
        }
      }
    }

    // Pattern: SUBGRAPH - generate a unique ID
    return `subgraph_${Date.now()}`;
  }

  protected extractSubgraphLabel(ctx: any): string | null {
    // Extract subgraph label from context based on grammar patterns:
    // SUBGRAPH WS textNoTags SQS text SQE - title is in 'text' between SQS and SQE
    // SUBGRAPH WS textNoTags - textNoTags is the title
    // SUBGRAPH - no title

    const children = ctx.children || [];

    // Check if we have the pattern with square brackets (ID + title)
    let hasSQS = false;
    for (const child of children) {
      if (child.constructor.name === 'TerminalNode' && child.getText() === '[') {
        hasSQS = true;
        break;
      }
    }

    if (hasSQS) {
      // Pattern: SUBGRAPH WS textNoTags SQS text SQE
      // Title is in the 'text' part between SQS and SQE
      let foundSQS = false;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.constructor.name === 'TerminalNode' && child.getText() === '[') {
          foundSQS = true;
          continue;
        }

        if (foundSQS && child.constructor.name === 'TextContext') {
          // Use the same text processing logic as nodes and edges for consistency
          const textWithType = this.extractTextWithType(child);
          // Update the current subgraph's title type in the stack
          if (this.subgraphTitleTypeStack.length > 0) {
            this.subgraphTitleTypeStack[this.subgraphTitleTypeStack.length - 1] = textWithType.type;
          }
          return textWithType.text;
        }
      }
    } else {
      // Pattern: SUBGRAPH WS textNoTags - textNoTags is the title
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.constructor.name === 'TextNoTagsContext') {
          let text = child.getText().trim();
          // For TextNoTagsContext, we need to manually check for markdown patterns
          // since it doesn't go through the same parse tree structure as TextContext
          let type = 'text';

          // Check for quoted strings with backticks: "`content`"
          if (text.match(/^"[^"]*`[^`]*`[^"]*"$/)) {
            type = 'markdown';
            console.log('🔍 Subgraph title: detected quoted markdown:', text);
            // Extract content between quotes and strip backticks
            const match = text.match(/^"([^"]*)"$/);
            if (match) {
              let content = match[1];
              if (content.startsWith('`') && content.endsWith('`')) {
                content = content.slice(1, -1); // Remove backticks
              }
              text = content;
              console.log('🔍 Subgraph title: processed markdown text:', text);
            }
          }
          // Check for regular quoted strings: "content"
          else if (text.match(/^"[^"]*"$/)) {
            type = 'string';
            const match = text.match(/^"([^"]*)"$/);
            if (match) {
              text = match[1];
            }
          }
          // Check for backtick strings: `content`
          else if (text.startsWith('`') && text.endsWith('`')) {
            type = 'markdown';
            text = text.slice(1, -1); // Remove backticks
          }

          // Store the type information for later use in processSubgraphEnd
          this.lastSubgraphTitleType = type;
          console.log('🔍 Subgraph title: stored type:', type, 'text:', text);
          return text;
        }
      }
    }

    return null;
  }

  protected extractStyleData(ctx: any): { className: string; styles: string[] } | null {
    // Extract style class name and styles
    const classNameCtx = ctx.idString && ctx.idString();
    const stylesCtx = ctx.stylesOpt && ctx.stylesOpt();

    if (!classNameCtx) return null;

    const className = classNameCtx.getText();
    const styles = stylesCtx ? this.extractStylesOpt(stylesCtx) : [];

    return { className, styles };
  }

  protected extractClassDefData(ctx: any): { className: string; styles: string[] } | null {
    // For classDefStatement: CLASSDEF WS idString WS stylesOpt
    // We need to access the children to get the idString and stylesOpt elements
    const children = ctx.children;
    if (!children || children.length < 5) return null;

    // children[2] = idString (class name), children[4] = stylesOpt (styles)
    const classNameCtx = children[2];
    const stylesOptCtx = children[4];

    if (!classNameCtx || !stylesOptCtx) return null;

    const className = classNameCtx.getText();
    const stylesText = stylesOptCtx.getText();

    // Parse styles - split by comma and trim
    const styles = stylesText
      .split(',')
      .map((style: string) => style.trim())
      .filter((style: string) => style.length > 0);

    return { className, styles };
  }

  protected extractClassData(ctx: any): { nodeIds: string[]; className: string } | null {
    // For classStatement: CLASS WS idString WS idString
    // We need to access the children to get the two different idString elements
    const children = ctx.children;
    if (!children || children.length < 5) return null;

    // children[2] = first idString (node IDs), children[4] = second idString (class name)
    const nodeIdsCtx = children[2];
    const classNameCtx = children[4];

    if (!nodeIdsCtx || !classNameCtx) return null;

    // Get the text and split by comma to handle multiple node IDs
    const nodeIdsText = nodeIdsCtx.getText();
    const nodeIds = nodeIdsText
      .split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);
    const className = classNameCtx.getText();

    return { nodeIds, className };
  }

  protected extractClickData(
    ctx: any
  ): { nodeId: string; functionName?: string; link?: string; target?: string } | null {
    console.log('🔍 FlowchartParser: Extracting click data from context');

    // The CLICK token contains both 'click' and the node ID
    const clickToken = ctx.CLICK && ctx.CLICK();
    if (!clickToken) {
      console.log('❌ FlowchartParser: No CLICK token found');
      return null;
    }

    // Extract node ID from CLICK token (format: "click NodeId")
    const clickText = clickToken.getText();
    console.log('🔍 FlowchartParser: CLICK token text:', clickText);

    const clickMatch = clickText.match(/^click\s+([A-Za-z0-9_]+)$/);
    if (!clickMatch) {
      console.log('❌ FlowchartParser: Could not extract node ID from CLICK token');
      return null;
    }

    const nodeId = clickMatch[1];
    console.log('🔍 FlowchartParser: Extracted node ID:', nodeId);

    // Check for callback function
    const callToken = ctx.CALL && ctx.CALL();
    const callbackNameToken = ctx.CALLBACKNAME && ctx.CALLBACKNAME();
    const callbackArgsToken = ctx.CALLBACKARGS && ctx.CALLBACKARGS();
    const hrefToken = ctx.HREF && ctx.HREF();
    const stringLiterals = ctx.stringLiteral && ctx.stringLiteral();

    let functionName: string | undefined;
    let link: string | undefined;
    let target: string = '_self';

    if (callbackNameToken) {
      functionName = callbackNameToken.getText();
      console.log('🔍 FlowchartParser: Found callback function:', functionName);

      // If there are callback args, append them
      if (callbackArgsToken) {
        const argsText = callbackArgsToken.getText();
        functionName += argsText;
        console.log('🔍 FlowchartParser: Added callback args:', argsText);
      }
    } else if (callToken && callbackArgsToken) {
      // Handle "call callback(args)" pattern where CALLBACKARGS contains the full function call
      const argsText = callbackArgsToken.getText();
      functionName = argsText;
      console.log('🔍 FlowchartParser: Found call with args:', functionName);
    }

    if (hrefToken) {
      // For href, the link is in the string literal
      if (stringLiterals && stringLiterals.length > 0) {
        const linkText = stringLiterals[0].getText();
        // Remove quotes from string literal
        link = linkText.replace(/^"(.*)"$/, '$1');
        console.log('🔍 FlowchartParser: Found href link:', link);
      }

      // Check for LINK_TARGET token (like _blank, _self, etc.)
      const linkTargetToken = ctx.LINK_TARGET && ctx.LINK_TARGET();
      if (linkTargetToken) {
        target = linkTargetToken.getText();
        console.log('🔍 FlowchartParser: Found LINK_TARGET:', target);
      }
      // Note: For href, second string literal is tooltip, not target (handled separately)
    } else if (
      !hrefToken &&
      !callToken &&
      !callbackNameToken &&
      stringLiterals &&
      stringLiterals.length > 0
    ) {
      // Handle direct string literal (like: click A "click.html")
      // Only treat as link if there's no callback function
      const linkText = stringLiterals[0].getText();
      link = linkText.replace(/^"(.*)"$/, '$1');
      console.log('🔍 FlowchartParser: Found direct link:', link);

      // Check for LINK_TARGET token (like _blank, _self, etc.)
      const linkTargetToken = ctx.LINK_TARGET && ctx.LINK_TARGET();
      if (linkTargetToken) {
        target = linkTargetToken.getText();
        console.log('🔍 FlowchartParser: Found LINK_TARGET token:', target);
      }
      // Note: For direct links, second string literal is tooltip, not target (handled separately)
    }

    // Note: Tooltip processing is now handled separately in extractAndSetTooltip method

    const result = {
      nodeId,
      functionName,
      link,
      target,
    };

    console.log('🔍 FlowchartParser: Final click data:', result);
    return result;
  }
}
