/**
 * ANTLR-based Flowchart Parser
 *
 * This is a proper ANTLR implementation using antlr-ng generated parser code.
 * It provides the same interface as the Jison parser for 100% compatibility.
 *
 * Goal: Achieve 99.7% pass rate (944/947 tests) to match Jison parser performance
 */

import { CharStream, CommonTokenStream, ParseTreeWalker, ParseTreeListener } from 'antlr4ng';
import { FlowLexer } from './generated/FlowLexer.js';
import { FlowParser, VertexStatementContext } from './generated/FlowParser.js';

/**
 * Listener implementation that builds the flowchart model
 */
class FlowchartListener implements ParseTreeListener {
  private db: any;
  private subgraphStack: {
    id?: string;
    title?: string;
    titleType?: string;
    nodes: (string | { stmt: string; value: string })[];
  }[] = [];
  private currentArrowText: string = '';
  private currentLinkData: any = null;

  constructor(db: any) {
    this.db = db;
  }

  // Required ParseTreeListener methods
  visitTerminal() {
    // Empty implementation
  }
  visitErrorNode() {
    // Empty implementation
  }
  enterEveryRule() {
    // Empty implementation
  }
  exitEveryRule() {
    // Empty implementation
  }

  // Handle vertex statements (nodes and edges)
  exitVertexStatement = (ctx: VertexStatementContext) => {
    console.log('DEBUG: exitVertexStatement called');
    // Handle the current node
    const nodeCtx = ctx.node();
    const shapeDataCtx = ctx.shapeData();
    console.log(
      'DEBUG: exitVertexStatement - nodeCtx:',
      !!nodeCtx,
      'shapeDataCtx:',
      !!shapeDataCtx
    );

    if (nodeCtx) {
      console.log('DEBUG: exitVertexStatement - nodeCtx text:', nodeCtx.getText());
    }
    if (shapeDataCtx) {
      console.log('DEBUG: exitVertexStatement - shapeDataCtx text:', shapeDataCtx.getText());
    }

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
  };

  // Handle node statements (ampersand chaining)
  // This matches Jison's node rule behavior
  exitNode = (ctx: any) => {
    try {
      console.log('DEBUG: exitNode called with context:', ctx.constructor.name);

      // Get all children to understand the structure
      const children = ctx.children || [];
      console.log(
        'DEBUG: exitNode children:',
        children.map((c: any) => c.constructor.name)
      );

      // Debug: Print the full text of this node context
      console.log('DEBUG: exitNode full text:', ctx.getText());

      // Process all styled vertices in the ampersand chain
      // The ANTLR tree walker might not visit all styled vertices, so we manually process them
      // But skip nodes that will be processed with shape data to avoid duplicates
      this.ensureAllStyledVerticesProcessed(ctx);

      // Process all shape data contexts in the ampersand chain
      // There can be multiple shape data contexts in a chain like: n4@{...} & n5@{...}
      this.processAllShapeDataInChain(ctx);
    } catch (_error) {
      console.log('DEBUG: Error in exitNode:', _error);
      // Error handling for exitNode
    }
  };

  // Handle styled vertex statements (individual nodes)
  exitStyledVertex = (ctx: any) => {
    try {
      console.log('DEBUG: exitStyledVertex called');
      // Extract node ID using the context object directly
      const nodeId = this.extractNodeId(ctx);
      console.log('DEBUG: exitStyledVertex nodeId:', nodeId);
      if (!nodeId) {
        console.log('DEBUG: exitStyledVertex - no nodeId, skipping');
        return; // Skip if no valid node ID
      }

      const children = ctx.children;

      // Check if this node already exists in the database
      // If it does, it means it was already processed by exitVertexStatement with shape data
      // In that case, we should NOT override it with default shape
      const existingVertex = (this.db as any).vertices?.get(nodeId);
      if (existingVertex) {
        console.log('DEBUG: exitStyledVertex - node already exists, skipping:', nodeId);
        return;
      }

      console.log('DEBUG: exitStyledVertex - processing new node:', nodeId);

      // Get the vertex context to determine shape
      let vertexCtx = null;
      let nodeText = nodeId; // Default text is the node ID

      // Find the vertex child context
      if (children && children.length > 0) {
        for (const child of children) {
          if (child.constructor.name === 'VertexContext') {
            vertexCtx = child;
            break;
          }
        }
      }

      // Get node shape from vertex type
      let nodeShape = 'square'; // default

      if (vertexCtx) {
        console.log('DEBUG: vertexCtx.getText():', vertexCtx.getText());
        console.log(
          'DEBUG: vertexCtx children:',
          vertexCtx.children?.map((c: any) => c.constructor.name)
        );

        // Extract text from vertex context
        // Check if there's a TextContext child (for square bracket text like n2["label"])
        const textCtx = vertexCtx.text ? vertexCtx.text() : null;
        if (textCtx) {
          console.log('DEBUG: Found TextContext, extracting text from it');
          const textWithType = this.extractTextWithType(textCtx);
          console.log(
            'DEBUG: extracted text from TextContext:',
            textWithType.text,
            'type:',
            textWithType.type
          );
          if (textWithType.text) {
            nodeText = textWithType.text;
          }
        } else {
          // No text context, use the node ID as text (will be updated by shape data if present)
          console.log('DEBUG: No TextContext found, using nodeId as text');
          nodeText = nodeId;
        }

        // Determine shape based on vertex context
        if (vertexCtx.SQS()) {
          nodeShape = 'square';
        } else if (vertexCtx.CIRCLE_START()) {
          nodeShape = 'circle';
        } else if (vertexCtx.PS()) {
          nodeShape = 'round';
        } else if (vertexCtx.DOUBLECIRCLE_START()) {
          nodeShape = 'doublecircle';
        } else if (vertexCtx.ELLIPSE_START()) {
          nodeShape = 'ellipse';
        } else if (vertexCtx.STADIUM_START()) {
          nodeShape = 'stadium';
        } else if (vertexCtx.SUBROUTINE_START()) {
          nodeShape = 'subroutine';
        } else if (vertexCtx.DIAMOND_START().length === 2) {
          nodeShape = 'hexagon';
        } else if (vertexCtx.DIAMOND_START().length === 1) {
          nodeShape = 'diamond';
        } else if (vertexCtx.TAGEND()) {
          nodeShape = 'odd';
        } else if (
          vertexCtx.TRAP_START &&
          vertexCtx.TRAP_START() &&
          vertexCtx.TRAPEND &&
          vertexCtx.TRAPEND()
        ) {
          nodeShape = 'trapezoid';
        } else if (
          vertexCtx.INVTRAP_START &&
          vertexCtx.INVTRAP_START() &&
          vertexCtx.INVTRAPEND &&
          vertexCtx.INVTRAPEND()
        ) {
          nodeShape = 'inv_trapezoid';
        } else if (
          vertexCtx.TRAP_START &&
          vertexCtx.TRAP_START() &&
          vertexCtx.INVTRAPEND &&
          vertexCtx.INVTRAPEND()
        ) {
          nodeShape = 'lean_right';
        } else if (
          vertexCtx.INVTRAP_START &&
          vertexCtx.INVTRAP_START() &&
          vertexCtx.TRAPEND &&
          vertexCtx.TRAPEND()
        ) {
          nodeShape = 'lean_left';
        }
      }

      const textObj = { text: nodeText, type: 'text' };

      console.log(
        `DEBUG: exitStyledVertex - about to add vertex ${nodeId} with text: ${nodeText}, shape: ${nodeShape}`
      );

      // Add vertex to database (no shape data for styled vertex)
      this.db.addVertex(nodeId, textObj, nodeShape, [], [], '', {}, '');

      console.log(`DEBUG: exitStyledVertex - successfully added vertex ${nodeId}`);

      // AFTER vertex creation, check for class application pattern: vertex STYLE_SEPARATOR idString
      if (children && children.length >= 3) {
        // Look for STYLE_SEPARATOR (:::) pattern
        for (let i = 0; i < children.length - 1; i++) {
          if (children[i].getText && children[i].getText() === ':::') {
            // Found STYLE_SEPARATOR, next should be the class name
            const className = children[i + 1].getText();
            if (className) {
              // Apply class to vertex: setClass(vertex, className)
              this.db.setClass(nodeId, className);
              break;
            }
          }
        }
      }

      // Note: Subgraph node tracking is handled in edge processing methods
      // to match Jison parser behavior which collects nodes from statements
    } catch (_error) {
      // Error handling for exitStyledVertex
    }
  };

  // Handle standalone vertex statements like e1@{curve: basis}
  exitStandaloneVertex = (ctx: any) => {
    try {
      // Handle both NODE_STRING and LINK_ID tokens
      let nodeString = '';
      if (ctx.NODE_STRING && ctx.NODE_STRING()) {
        nodeString = ctx.NODE_STRING().getText();
      } else if (ctx.LINK_ID && ctx.LINK_ID()) {
        // Remove the '@' suffix from LINK_ID to get the actual node ID
        const linkIdText = ctx.LINK_ID().getText();
        nodeString = linkIdText.substring(0, linkIdText.length - 1);
      }

      const shapeDataCtx = ctx.shapeData();

      if (shapeDataCtx) {
        const shapeDataText = shapeDataCtx.getText();
        // Extract the content between { and } for YAML parsing
        // e.g., "@{ shape: rounded }" -> "shape: rounded"
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

        // Parse the shape data and add it as vertex metadata
        // This will be processed by FlowDB.addVertex which handles edge properties
        this.db.addVertex(
          nodeString,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          yamlContent
        );
      }
    } catch (_error) {
      // Error handling - silently continue for now
    }
  };

  // Reserved keywords that cannot be used as node IDs (matches Jison parser)
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

  // Validate that a node ID doesn't start with reserved keywords
  private validateNodeId(nodeId: string) {
    for (const keyword of FlowchartListener.RESERVED_KEYWORDS) {
      if (
        nodeId.startsWith(keyword + '.') ||
        nodeId.startsWith(keyword + '-') ||
        nodeId.startsWith(keyword + '/')
      ) {
        throw new Error(`Node ID cannot start with reserved keyword: ${keyword}`);
      }
    }
  }

  private processNode(nodeCtx: any, shapeDataCtx?: any) {
    const styledVertexCtx = nodeCtx.styledVertex();
    if (!styledVertexCtx) {
      return;
    }

    const vertexCtx = styledVertexCtx.vertex();
    if (!vertexCtx) {
      return;
    }

    // Get node ID
    const idCtx = vertexCtx.idString();
    const nodeId = idCtx ? idCtx.getText() : '';

    // Validate node ID against reserved keywords
    this.validateNodeId(nodeId);

    // Check for class application pattern: vertex STYLE_SEPARATOR idString
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
            break;
          }
        }
      }
    }

    // Get node text - if there's explicit text, use it, otherwise use the ID
    const textCtx = vertexCtx.text();
    let textObj;
    if (textCtx) {
      const textWithType = this.extractTextWithType(textCtx);
      textObj = { text: textWithType.text, type: textWithType.type };
    } else {
      textObj = { text: nodeId, type: 'text' };
    }

    // Determine node shape based on the vertex structure
    let nodeShape = 'square'; // default
    if (vertexCtx.SQS()) {
      nodeShape = 'square';
    } else if (vertexCtx.CIRCLE_START()) {
      nodeShape = 'circle';
    } else if (vertexCtx.PS()) {
      nodeShape = 'round';
    } else if (vertexCtx.DOUBLECIRCLE_START()) {
      nodeShape = 'doublecircle';
    } else if (vertexCtx.ELLIPSE_START()) {
      nodeShape = 'ellipse';
    } else if (vertexCtx.STADIUM_START()) {
      nodeShape = 'stadium';
    } else if (vertexCtx.SUBROUTINE_START()) {
      nodeShape = 'subroutine';
    } else if (vertexCtx.DIAMOND_START().length === 2) {
      nodeShape = 'hexagon';
    } else if (vertexCtx.DIAMOND_START().length === 1) {
      nodeShape = 'diamond';
    } else if (vertexCtx.TAGEND()) {
      nodeShape = 'odd';
    } else if (
      vertexCtx.CYLINDER_START &&
      vertexCtx.CYLINDER_START() &&
      vertexCtx.CYLINDEREND &&
      vertexCtx.CYLINDEREND()
    ) {
      nodeShape = 'cylinder';
    } else if (vertexCtx.VERTEX_WITH_PROPS_START && vertexCtx.VERTEX_WITH_PROPS_START()) {
      nodeShape = 'rect';
    } else if (
      vertexCtx.TRAP_START &&
      vertexCtx.TRAP_START() &&
      vertexCtx.TRAPEND &&
      vertexCtx.TRAPEND()
    ) {
      nodeShape = 'trapezoid';
    } else if (
      vertexCtx.INVTRAP_START &&
      vertexCtx.INVTRAP_START() &&
      vertexCtx.INVTRAPEND &&
      vertexCtx.INVTRAPEND()
    ) {
      nodeShape = 'inv_trapezoid';
    } else if (
      vertexCtx.TRAP_START &&
      vertexCtx.TRAP_START() &&
      vertexCtx.INVTRAPEND &&
      vertexCtx.INVTRAPEND()
    ) {
      nodeShape = 'lean_right';
    } else if (
      vertexCtx.INVTRAP_START &&
      vertexCtx.INVTRAP_START() &&
      vertexCtx.TRAPEND &&
      vertexCtx.TRAPEND()
    ) {
      nodeShape = 'lean_left';
    }

    // Process shape data if present
    let shapeDataYaml = '';
    if (shapeDataCtx) {
      const shapeDataText = shapeDataCtx.getText();
      console.log('Processing shape data:', shapeDataText);

      // Extract the content between { and } for YAML parsing
      // e.g., "@{ shape: rounded }" -> "shape: rounded"
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

      // Handle YAML content more carefully to preserve multiline strings
      const lines = yamlContent.split('\n');

      // Check if this contains YAML pipe syntax (|) which needs special handling
      const hasPipeSyntax = yamlContent.includes('|');

      // Check if this contains quoted multiline strings that need <br/> conversion
      const hasQuotedMultiline =
        yamlContent.includes('"') &&
        yamlContent.includes('\n') &&
        /label:\s*"[^"]*\n[^"]*"/.test(yamlContent);

      if (hasQuotedMultiline) {
        // Handle quoted multiline strings - convert newlines to <br/> before YAML processing
        let processedYaml = yamlContent;

        // Find quoted multiline strings and replace newlines with <br/>
        processedYaml = processedYaml.replace(
          /label:\s*"([^"]*\n[^"]*?)"/g,
          (_match: string, content: string) => {
            const convertedContent = content.replace(/\n\s*/g, '<br/>');
            return `label: "${convertedContent}"`;
          }
        );

        // Normalize the processed YAML
        const processedLines = processedYaml.split('\n');
        const normalizedLines = processedLines
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);

        shapeDataYaml = normalizedLines.join('\n');
      } else if (hasPipeSyntax) {
        // For pipe syntax, preserve the structure but fix indentation
        // The pipe syntax requires proper indentation to work
        let minIndent = Infinity;
        const nonEmptyLines = lines.filter((line: string) => line.trim().length > 0);

        // Find minimum indentation (excluding the first line which might be "label: |")
        for (let i = 1; i < nonEmptyLines.length; i++) {
          const line = nonEmptyLines[i];
          const match = line.match(/^(\s*)/);
          if (match && line.trim().length > 0) {
            minIndent = Math.min(minIndent, match[1].length);
          }
        }

        // Normalize indentation while preserving structure
        const normalizedLines = lines.map((line: string, index: number) => {
          if (line.trim().length === 0) return ''; // Keep empty lines
          if (index === 0 || line.includes(':')) {
            // First line or lines with colons (property definitions)
            return line.trim();
          } else {
            // Content lines - preserve relative indentation
            const currentIndent = line.match(/^(\s*)/)?.[1]?.length || 0;
            const relativeIndent = Math.max(0, currentIndent - minIndent);
            return '  '.repeat(relativeIndent) + line.trim();
          }
        });

        shapeDataYaml = normalizedLines.join('\n');
      } else {
        // For regular YAML, normalize as before
        const normalizedLines = lines
          .map((line: string) => line.trim()) // Remove leading/trailing whitespace
          .filter((line: string) => line.length > 0); // Remove empty lines

        shapeDataYaml = normalizedLines.join('\n');
      }
    }

    // Add vertex to database
    console.log(
      `DEBUG: Adding vertex ${nodeId} with label: ${textObj?.text || nodeId}, shapeData: ${shapeDataYaml || 'none'}`
    );
    this.db.addVertex(nodeId, textObj, nodeShape, [], [], '', {}, shapeDataYaml);

    // Debug: Check what the vertex looks like after adding
    const verticesAfter = this.db.getVertices();
    const addedVertex = verticesAfter.get(nodeId);
    console.log(
      `DEBUG: Vertex ${nodeId} after adding - text: ${addedVertex?.text}, type: ${addedVertex?.type}`
    );

    // Debug: Show current node order in database
    const nodeOrder = Array.from(verticesAfter.keys());
    console.log(`DEBUG: Current node order in DB: [${nodeOrder.join(', ')}]`);

    // Track individual nodes in current subgraph if we're inside one
    // Use unshift() to match the Jison behavior for node ordering
    if (this.subgraphStack.length > 0) {
      const currentSubgraph = this.subgraphStack[this.subgraphStack.length - 1];
      if (!currentSubgraph.nodes.includes(nodeId)) {
        currentSubgraph.nodes.unshift(nodeId);
      }
    }
  }

  private processNodeWithShapeData(styledVertexCtx: any, shapeDataCtx: any) {
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
    } else {
      textObj = { text: nodeId, type: 'text' };
    }

    // Get node shape from vertex type
    let nodeShape = 'square'; // default

    // Shape detection logic for trapezoid and other shapes

    if (vertexCtx.SQS()) {
      nodeShape = 'square';
    } else if (vertexCtx.CIRCLE_START()) {
      nodeShape = 'circle';
    } else if (vertexCtx.PS()) {
      nodeShape = 'round';
    } else if (vertexCtx.DOUBLECIRCLE_START()) {
      nodeShape = 'doublecircle';
    } else if (vertexCtx.ELLIPSE_START()) {
      nodeShape = 'ellipse';
    } else if (vertexCtx.STADIUM_START()) {
      nodeShape = 'stadium';
    } else if (vertexCtx.SUBROUTINE_START()) {
      nodeShape = 'subroutine';
    } else if (vertexCtx.DIAMOND_START().length === 2) {
      nodeShape = 'hexagon';
    } else if (vertexCtx.DIAMOND_START().length === 1) {
      nodeShape = 'diamond';
    } else if (vertexCtx.TAGEND()) {
      nodeShape = 'odd';
    } else if (
      vertexCtx.TRAP_START &&
      vertexCtx.TRAP_START() &&
      vertexCtx.TRAPEND &&
      vertexCtx.TRAPEND()
    ) {
      nodeShape = 'trapezoid';
    } else if (
      vertexCtx.INVTRAP_START &&
      vertexCtx.INVTRAP_START() &&
      vertexCtx.INVTRAPEND &&
      vertexCtx.INVTRAPEND()
    ) {
      nodeShape = 'inv_trapezoid';
    } else if (
      vertexCtx.TRAP_START &&
      vertexCtx.TRAP_START() &&
      vertexCtx.INVTRAPEND &&
      vertexCtx.INVTRAPEND()
    ) {
      nodeShape = 'lean_right';
    } else if (
      vertexCtx.INVTRAP_START &&
      vertexCtx.INVTRAP_START() &&
      vertexCtx.TRAPEND &&
      vertexCtx.TRAPEND()
    ) {
      nodeShape = 'lean_left';
    }

    // Shape detection complete

    // Extract shape data content
    let shapeDataContent = '';
    if (shapeDataCtx) {
      const contentCtx = shapeDataCtx.shapeDataContent();
      if (contentCtx) {
        shapeDataContent = contentCtx.getText();
      }
    }

    // Add vertex to database with shape data - let validation errors bubble up
    this.db.addVertex(nodeId, textObj, nodeShape, [], [], '', {}, shapeDataContent);

    // Note: Subgraph node tracking is handled in edge processing methods
    // to match Jison parser behavior which collects nodes from statements
  }

  private findStyledVertexInNode(nodeCtx: any): any | null {
    try {
      // The NodeContext should contain a StyledVertexContext
      // We need to recursively search for it
      if (!nodeCtx || !nodeCtx.children) {
        return null;
      }

      // Look for StyledVertexContext in the children
      for (const child of nodeCtx.children) {
        if (child.constructor.name === 'StyledVertexContext') {
          return child;
        }
        // Recursively search in child nodes
        const found = this.findStyledVertexInNode(child);
        if (found) {
          return found;
        }
      }

      return null;
    } catch (_error) {
      // Error handling for findStyledVertexInNode
      return null;
    }
  }

  private findLastStyledVertexInNode(nodeCtx: any): any | null {
    try {
      if (!nodeCtx || !nodeCtx.children) {
        return null;
      }

      let lastStyledVertex = null;

      // Recursively collect all styled vertices and return the last one
      const collectStyledVertices = (ctx: any): any[] => {
        if (!ctx || !ctx.children) {
          return [];
        }

        const vertices: any[] = [];
        for (const child of ctx.children) {
          if (child.constructor.name === 'StyledVertexContext') {
            vertices.push(child);
          } else {
            // Recursively search in child contexts
            vertices.push(...collectStyledVertices(child));
          }
        }
        return vertices;
      };

      const allVertices = collectStyledVertices(nodeCtx);
      if (allVertices.length > 0) {
        lastStyledVertex = allVertices[allVertices.length - 1];
      }

      return lastStyledVertex;
    } catch (_error) {
      // Error handling for findLastStyledVertexInNode
      return null;
    }
  }

  private extractNodeId(nodeCtx: any): string | null {
    if (!nodeCtx) {
      return null;
    }

    // For VertexStatementContext, get the node
    if (nodeCtx.node) {
      const node = nodeCtx.node();
      if (node) {
        const styledVertex = node.styledVertex();
        if (styledVertex) {
          const vertex = styledVertex.vertex();
          if (vertex) {
            const idCtx = vertex.idString();
            const nodeId = idCtx ? idCtx.getText() : null;

            return nodeId;
          }
        }
      }
    }

    // For NodeContext, get directly
    if (nodeCtx.styledVertex) {
      const styledVertex = nodeCtx.styledVertex();
      if (styledVertex) {
        const vertex = styledVertex.vertex();
        if (vertex) {
          const idCtx = vertex.idString();
          return idCtx ? idCtx.getText() : null;
        }
      }
    }

    // For StyledVertexContext directly
    if (nodeCtx.vertex) {
      const vertex = nodeCtx.vertex();
      if (vertex) {
        const idCtx = vertex.idString();
        return idCtx ? idCtx.getText() : null;
      }
    }

    return null;
  }

  // Extract array of node IDs to handle ampersand chaining
  private extractNodeIds(nodeCtx: any): string[] {
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

  // Ensure all styled vertices in a node chain are processed
  private ensureAllStyledVerticesProcessed(nodeCtx: any) {
    if (!nodeCtx) {
      return;
    }

    console.log('DEBUG: ensureAllStyledVerticesProcessed called');

    // Find all styled vertices in the chain and process them using existing logic
    const styledVertices = this.findAllStyledVerticesInChain(nodeCtx);
    console.log('DEBUG: Found styled vertices:', styledVertices.length);

    for (const styledVertexCtx of styledVertices) {
      // Use the existing exitStyledVertex logic
      console.log('DEBUG: Processing styled vertex via exitStyledVertex');
      this.exitStyledVertex(styledVertexCtx);
    }
  }

  // Find all styled vertices in a node chain
  private findAllStyledVerticesInChain(nodeCtx: any): any[] {
    const styledVertices: any[] = [];
    this.collectStyledVerticesRecursively(nodeCtx, styledVertices);
    return styledVertices;
  }

  // Recursively collect all styled vertices from a node chain
  private collectStyledVerticesRecursively(nodeCtx: any, styledVertices: any[]) {
    if (!nodeCtx) {
      return;
    }

    // Get the styled vertex from this level
    const styledVertex = nodeCtx.styledVertex ? nodeCtx.styledVertex() : null;
    if (styledVertex) {
      styledVertices.push(styledVertex);
    }

    // Recursively process child node contexts
    const children = nodeCtx.children || [];
    for (const child of children) {
      if (child.constructor.name === 'NodeContext') {
        this.collectStyledVerticesRecursively(child, styledVertices);
      }
    }
  }

  // Process all shape data contexts in a node chain
  private processAllShapeDataInChain(nodeCtx: any) {
    if (!nodeCtx) {
      return;
    }

    // Find all shape data contexts and their associated styled vertices
    const shapeDataPairs = this.findAllShapeDataInChain(nodeCtx);

    for (const { styledVertexCtx, shapeDataCtx } of shapeDataPairs) {
      this.processNodeWithShapeData(styledVertexCtx, shapeDataCtx);
    }
  }

  // Find all shape data contexts and their associated styled vertices in a chain
  private findAllShapeDataInChain(
    nodeCtx: any
  ): Array<{ styledVertexCtx: any; shapeDataCtx: any }> {
    const pairs: Array<{ styledVertexCtx: any; shapeDataCtx: any }> = [];
    this.collectShapeDataPairsRecursively(nodeCtx, pairs);
    return pairs;
  }

  // Recursively collect shape data and styled vertex pairs
  private collectShapeDataPairsRecursively(
    nodeCtx: any,
    pairs: Array<{ styledVertexCtx: any; shapeDataCtx: any }>
  ) {
    if (!nodeCtx) {
      return;
    }

    const children = nodeCtx.children || [];

    // Look for shape data in this level
    let shapeDataCtx = null;
    let childNodeCtx = null;
    let styledVertexCtx = null;

    for (const child of children) {
      const childType = child.constructor.name;

      if (childType === 'ShapeDataContext') {
        shapeDataCtx = child;
      } else if (childType === 'NodeContext') {
        childNodeCtx = child;
      } else if (childType === 'StyledVertexContext') {
        styledVertexCtx = child;
      }
    }

    // If we have shape data, find the target styled vertex
    if (shapeDataCtx) {
      let targetStyledVertex = null;

      if (childNodeCtx) {
        // Shape data applies to the last styled vertex in the child node chain
        targetStyledVertex = this.findLastStyledVertexInNode(childNodeCtx);
      } else if (styledVertexCtx) {
        // Only if there's no child node, shape data applies to the styled vertex at this level
        targetStyledVertex = styledVertexCtx;
      }

      if (targetStyledVertex) {
        pairs.push({ styledVertexCtx: targetStyledVertex, shapeDataCtx });
      }
    }

    // Always recursively process child node contexts to find nested shape data
    if (childNodeCtx) {
      this.collectShapeDataPairsRecursively(childNodeCtx, pairs);
    }
  }

  // Recursively collect node IDs from a node context (handles ampersand chaining)
  private collectNodeIdsFromNode(nodeCtx: any, nodeIds: string[]) {
    if (!nodeCtx) {
      return;
    }

    // For left-recursive grammar like: node -> node AMP styledVertex
    // We need to process child nodes first, then the current styledVertex
    // This ensures correct left-to-right order for A & B

    // First, recursively process child node contexts (left side of ampersand)
    const children = nodeCtx.children || [];
    for (const child of children) {
      if (child.constructor.name === 'NodeContext') {
        this.collectNodeIdsFromNode(child, nodeIds);
      }
    }

    // Then, get the styled vertex from this node (right side of ampersand)
    const styledVertex = nodeCtx.styledVertex ? nodeCtx.styledVertex() : null;
    if (styledVertex) {
      const vertex = styledVertex.vertex();
      if (vertex) {
        const idCtx = vertex.idString();
        if (idCtx) {
          const nodeId = idCtx.getText();
          if (nodeId && !nodeIds.includes(nodeId)) {
            nodeIds.push(nodeId);
          }
        }
      }
    }
  }

  private extractStringContent(text: string): string {
    // Remove surrounding quotes if present
    if (text.startsWith('"') && text.endsWith('"')) {
      return text.slice(1, -1);
    }
    return text;
  }

  // Helper method to extract string content from contexts and handle quote stripping
  private extractStringFromContext(ctx: any): string {
    if (!ctx) return '';

    // Check if this context contains a stringLiteral
    const stringLiterals = ctx.stringLiteral ? ctx.stringLiteral() : null;
    if (stringLiterals && Array.isArray(stringLiterals) && stringLiterals.length > 0) {
      // Handle stringLiteral context - extract just the STR token content
      const strToken = stringLiterals[0].STR();
      if (strToken) {
        return strToken.getText();
      }
    } else if (stringLiterals && !Array.isArray(stringLiterals)) {
      // Handle single stringLiteral (not array)
      const strToken = stringLiterals.STR();
      if (strToken) {
        return strToken.getText();
      }
    }

    // Check for direct STR token
    if (ctx.STR) {
      const strTokens = Array.isArray(ctx.STR()) ? ctx.STR() : [ctx.STR()];
      if (strTokens.length > 0) {
        return strTokens[0].getText();
      }
    }

    // Fallback to extracting text and stripping quotes manually
    let text = ctx.getText().trim();
    // Handle both complete quotes and incomplete quotes (due to lexer mode issues)
    if (text.startsWith('"')) {
      if (text.endsWith('"')) {
        // Complete quoted string
        text = text.slice(1, -1);
      } else {
        // Incomplete quoted string (missing closing quote due to lexer mode)
        text = text.slice(1);
      }
    }
    return text;
  }

  // Extract styles from stylesOpt context
  private extractStylesOpt(stylesOptCtx: any): string[] {
    if (!stylesOptCtx || !stylesOptCtx.children) {
      return [];
    }

    const styles: string[] = [];

    // stylesOpt can be: style | stylesOpt COMMA style
    // We need to traverse and collect all style components
    const collectStyles = (ctx: any) => {
      if (!ctx || !ctx.children) return;

      for (const child of ctx.children) {
        if (child.constructor.name === 'StyleContext') {
          // This is a style context, collect its components
          const styleText = child.getText();
          if (styleText && styleText.trim()) {
            styles.push(styleText.trim());
          }
        } else if (child.constructor.name === 'StylesOptContext') {
          // Recursive stylesOpt, collect from it
          collectStyles(child);
        }
      }
    };

    collectStyles(stylesOptCtx);
    return styles;
  }

  private extractNumList(numListCtx: any): number[] {
    const numbers: number[] = [];

    function collectNumbers(ctx: any) {
      if (!ctx) return;

      // Check if this context has NUM token
      if (ctx.NUM && ctx.NUM()) {
        const numText = ctx.NUM().getText();
        const num = parseInt(numText, 10);
        if (!isNaN(num)) {
          numbers.push(num);
        }
      }

      // Recursively check children for more numbers
      if (ctx.children) {
        for (const child of ctx.children) {
          collectNumbers(child);
        }
      }
    }

    collectNumbers(numListCtx);
    return numbers;
  }

  // Process edges between arrays of nodes (handles ampersand chaining)
  private processEdgeArray(startNodeIds: string[], endNodeIds: string[], linkCtx: any) {
    // Extract link information
    const linkData = this.extractLinkData(linkCtx);

    // Use the database's addLink method which handles all combinations
    this.db.addLink(startNodeIds, endNodeIds, linkData);

    // Track nodes in current subgraph if we're inside one
    if (this.subgraphStack.length > 0) {
      const currentSubgraph = this.subgraphStack[this.subgraphStack.length - 1];

      // To match Jison behavior for chained vertices, we need to add nodes in the order
      // that matches how Jison processes chains: rightmost nodes first
      // For a chain a1-->a2-->a3, Jison produces [a3, a2, a1]
      // The key insight: Jison processes left-to-right but builds the list by prepending
      // So we add start nodes first (they appear earlier), then end nodes
      for (const startNodeId of startNodeIds) {
        if (!currentSubgraph.nodes.includes(startNodeId)) {
          currentSubgraph.nodes.unshift(startNodeId); // Add to beginning to match Jison order
        }
      }
      for (const endNodeId of endNodeIds) {
        if (!currentSubgraph.nodes.includes(endNodeId)) {
          currentSubgraph.nodes.unshift(endNodeId); // Add to beginning to match Jison order
        }
      }
    }
  }

  // Extract link data from link context (shared by processEdge and processEdgeArray)
  private extractLinkData(linkCtx: any): any {
    let linkText = '';
    const linkType: any = { text: undefined };
    let linkId: string | undefined = undefined;

    // Check if we have arrow text from exitArrowText
    if (this.currentArrowText) {
      linkText = this.currentArrowText;
      // Clear the arrow text after using it
      this.currentArrowText = '';
    }

    // Check for arrowText (pipe-delimited text: |text|) at top level
    const arrowTextCtx = linkCtx.arrowText();
    if (arrowTextCtx) {
      console.log('Processing arrowText context');
      const textContent = arrowTextCtx.text();
      if (textContent) {
        const textWithType = this.extractTextWithType(textContent);
        linkType.text = { text: textWithType.text, type: textWithType.type };
      }
    }

    // Check for LINK_ID first (for edge IDs like e1@-->)
    if (linkCtx.LINK_ID && linkCtx.LINK_ID()) {
      const linkIdText = linkCtx.LINK_ID().getText();
      // Remove the '@' suffix to get the actual ID
      linkId = linkIdText.substring(0, linkIdText.length - 1);
    }

    // Check for labeled edges with START_LINK tokens (double-ended arrow detection)
    let startLinkText = '';
    if (linkCtx.START_LINK_NORMAL && linkCtx.START_LINK_NORMAL()) {
      startLinkText = linkCtx.START_LINK_NORMAL().getText();
    } else if (linkCtx.START_LINK_THICK && linkCtx.START_LINK_THICK()) {
      startLinkText = linkCtx.START_LINK_THICK().getText();
    } else if (linkCtx.START_LINK_DOTTED && linkCtx.START_LINK_DOTTED()) {
      startLinkText = linkCtx.START_LINK_DOTTED().getText();
    }

    // Check for different link types
    if (linkCtx.LINK_NORMAL()) {
      linkText = linkCtx.LINK_NORMAL().getText();
    } else if (linkCtx.LINK_THICK()) {
      linkText = linkCtx.LINK_THICK().getText();
    } else if (linkCtx.LINK_DOTTED()) {
      linkText = linkCtx.LINK_DOTTED().getText();
    } else if (linkCtx.linkStatement()) {
      const linkStmt = linkCtx.linkStatement();

      // Check for LINK_ID in linkStatement
      if (linkStmt.LINK_ID && linkStmt.LINK_ID()) {
        const linkIdText = linkStmt.LINK_ID().getText();
        linkId = linkIdText.substring(0, linkIdText.length - 1);
      }

      if (linkStmt.LINK_NORMAL()) {
        linkText = linkStmt.LINK_NORMAL().getText();
      } else if (linkStmt.LINK_THICK()) {
        linkText = linkStmt.LINK_THICK().getText();
      } else if (linkStmt.LINK_DOTTED()) {
        linkText = linkStmt.LINK_DOTTED().getText();
      } else if (linkStmt.LINK_STATEMENT_NORMAL()) {
        linkText = linkStmt.LINK_STATEMENT_NORMAL().getText();
      } else if (linkStmt.LINK_STATEMENT_THICK()) {
        linkText = linkStmt.LINK_STATEMENT_THICK().getText();
      } else if (linkStmt.LINK_STATEMENT_DOTTED()) {
        linkText = linkStmt.LINK_STATEMENT_DOTTED().getText();
      }
    }

    // Convert linkText to edge type using the same logic as destructEndLink
    // If we have both start and end link tokens, use destructLink for double-ended arrow detection
    let edgeInfo;
    if (startLinkText && linkText) {
      // Use the database's destructLink method for double-ended arrow detection
      edgeInfo = this.db.destructLink(linkText, startLinkText);
    } else {
      // Use destructEndLink for single-ended arrows
      edgeInfo = this.destructEndLink(linkText);
    }

    // Create linkType object with the correct type
    linkType.type = edgeInfo.type;
    linkType.stroke = edgeInfo.stroke;
    linkType.length = edgeInfo.length;

    // Add linkId if present
    if (linkId) {
      linkType.id = linkId;
    }

    // Check for edge text
    const edgeTextCtx = linkCtx.edgeText();
    if (edgeTextCtx) {
      console.log('Processing edgeText context');
      // edgeText contains a text context, so we need to extract it properly
      const textCtx = edgeTextCtx.text ? edgeTextCtx.text() : null;
      if (textCtx) {
        const textWithType = this.extractTextWithType(textCtx);
        linkType.text = { text: textWithType.text, type: textWithType.type };
      } else {
        // Fallback to direct text extraction with processing
        const textContent = edgeTextCtx.getText();

        if (textContent) {
          // Apply the same text processing logic as extractTextWithType
          // First, trim whitespace to handle ANTLR parser boundary issues
          const trimmedContent = textContent.trim();
          let processedText = trimmedContent;
          let textType = 'text';

          // Detect different text types based on wrapping characters
          if (
            trimmedContent.startsWith('"') &&
            trimmedContent.endsWith('"') &&
            trimmedContent.length > 4 &&
            trimmedContent.charAt(1) === '`' &&
            trimmedContent.charAt(trimmedContent.length - 2) === '`'
          ) {
            // Markdown strings: "`text`" (wrapped in quotes)
            processedText = trimmedContent.slice(2, -2);
            textType = 'markdown';
          } else if (
            trimmedContent.startsWith('"') &&
            trimmedContent.endsWith('"') &&
            trimmedContent.length > 2
          ) {
            // Quoted strings: "text"
            processedText = trimmedContent.slice(1, -1);
            textType = 'string';
          }

          linkType.text = { text: processedText, type: textType };
        }
      }
    }

    return linkType;
  }

  // Implementation of destructEndLink logic from flowDb.ts
  private destructEndLink(_str: string) {
    const str = _str.trim();
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

    // Count dots for dotted lines
    const dots = this.countChar('.', line);
    if (dots) {
      stroke = 'dotted';
      length = dots;
    }

    return { type, stroke, length };
  }

  // Helper method to count characters
  private countChar(char: string, str: string): number {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === char) {
        count++;
      }
    }
    return count;
  }

  // Handle subgraph statements - enter
  enterSubgraphStatement = (ctx: any) => {
    try {
      // Extract subgraph ID and title
      let id: string | undefined;
      let title = '';

      const textNoTagsCtx = ctx.textNoTags();
      if (textNoTagsCtx) {
        const idWithType = this.extractTextWithType(textNoTagsCtx);
        const idText = idWithType.text;
        const idType = idWithType.type;
        id = idText;

        // Check if there's a title in brackets [title]
        const textCtx = ctx.text();
        let titleType = idType; // Default to ID type
        if (textCtx) {
          const titleWithType = this.extractTextWithType(textCtx);
          title = titleWithType.text;
          titleType = titleWithType.type;
        } else {
          // If no separate title, use the ID as title and its type
          title = idText;
          titleType = idType;
        }

        // Push new subgraph context onto stack
        this.subgraphStack.push({
          id,
          title,
          titleType,
          nodes: [],
        });
      }
    } catch (_error) {
      // Error handling for subgraph processing
    }
  };

  // Handle subgraph statements - exit
  exitSubgraphStatement = (_ctx: any) => {
    try {
      // Pop the current subgraph from stack
      const currentSubgraph = this.subgraphStack.pop();
      if (!currentSubgraph) {
        return;
      }

      // Prepare parameters for FlowDB.addSubGraph
      // Special handling: if ID contains spaces, treat it as title-only (like Jison pattern 2)
      let id: { text: string } | undefined;
      let title: { text: string; type: string };

      if (currentSubgraph.id && /\s/.test(currentSubgraph.id)) {
        // ID contains spaces - treat as title-only subgraph (auto-generate ID)
        // Pass the same object reference for both id and title to match Jison behavior
        const titleObj = {
          text: currentSubgraph.title || '',
          type: currentSubgraph.titleType || 'text',
        };
        id = titleObj;
        title = titleObj;
      } else {
        // Normal ID/title handling
        id = currentSubgraph.id ? { text: currentSubgraph.id } : undefined;
        title = { text: currentSubgraph.title || '', type: currentSubgraph.titleType || 'text' };
      }

      const nodeList = currentSubgraph.nodes;

      // Add the subgraph to the database
      this.db.addSubGraph(id, nodeList, title);
    } catch (_error) {
      // Error handling for subgraph processing
    }
  };

  // Handle click statements for interactions
  exitClickStatement = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 1) return;

      // CLICK token now contains both 'click' and node ID (like Jison)
      const clickToken = children[0].getText(); // CLICK token: "click nodeId"
      const nodeId = clickToken.replace(/^click\s+/, ''); // Extract node ID from CLICK token
      const secondToken = children.length > 1 ? children[1].getText() : null; // Next token after CLICK

      // Determine the type of click statement based on the pattern
      if (secondToken === 'href') {
        // HREF patterns: click nodeId href "url" [tooltip] [target]
        if (children.length >= 3) {
          const url = this.extractStringContent(children[2].getText());
          let tooltip = undefined;
          let target = undefined;

          // Check for additional parameters
          if (children.length >= 4) {
            const fourthToken = children[3].getText();
            if (fourthToken.startsWith('"')) {
              // Has tooltip
              tooltip = this.extractStringContent(fourthToken);
              if (children.length >= 5) {
                target = children[4].getText();
              }
            } else {
              // Has target
              target = fourthToken;
            }
          }

          // Only pass target parameter if it's defined (matches Jison behavior)
          if (target !== undefined) {
            this.db.setLink(nodeId, url, target);
          } else {
            this.db.setLink(nodeId, url);
          }
          if (tooltip) {
            this.db.setTooltip(nodeId, tooltip);
          }
        }
      } else if (secondToken && secondToken.trim() === 'call') {
        // CALL patterns: click nodeId call functionName[(args)] [tooltip]
        if (children.length >= 3) {
          const callbackToken = children[2].getText();

          let functionName = callbackToken;
          let functionArgs = undefined;
          let tooltip = undefined;

          // Check if the callback token contains arguments: functionName(args)
          const callbackMatch = /^([A-Za-z0-9_]+)\(([^)]*)\)$/.exec(callbackToken);
          if (callbackMatch) {
            functionName = callbackMatch[1];
            functionArgs = callbackMatch[2];
            // If arguments are empty, set to undefined to match Jison behavior
            if (functionArgs.trim() === '') {
              functionArgs = undefined;
            }
          } else {
            // Check if function has arguments in a separate token (CALLBACKARGS token)
            if (children.length >= 4) {
              const argsToken = children[3].getText();

              // Handle different argument formats
              if (argsToken && argsToken.trim() !== '' && argsToken.trim() !== '()') {
                // If it's just parentheses with content, extract the content
                if (argsToken.startsWith('(') && argsToken.endsWith(')')) {
                  functionArgs = argsToken.slice(1, -1); // Remove outer parentheses
                } else {
                  functionArgs = argsToken;
                }
              }
            }
          }

          // Check for tooltip
          // For call patterns, tooltip can be in different positions:
          // - If callback has args in same token: click A call callback(args) "tooltip" -> tooltip at index 3
          // - If callback has no args: click A call callback() "tooltip" -> tooltip at index 3
          // - If callback has separate args token: click A call callback (args) "tooltip" -> tooltip at index 4
          if (children.length >= 4) {
            const tooltipToken = children[3].getText();
            if (tooltipToken && tooltipToken.startsWith('"') && tooltipToken.endsWith('"')) {
              tooltip = this.extractStringContent(tooltipToken);
            } else if (children.length >= 5) {
              // Check index 4 for separate args case
              const tooltipToken4 = children[4].getText();
              if (tooltipToken4 && tooltipToken4.startsWith('"') && tooltipToken4.endsWith('"')) {
                tooltip = this.extractStringContent(tooltipToken4);
              }
            }
          }

          // Only pass functionArgs if it's defined (matches Jison behavior)
          if (functionArgs !== undefined) {
            this.db.setClickEvent(nodeId, functionName, functionArgs);
          } else {
            this.db.setClickEvent(nodeId, functionName);
          }
          if (tooltip) {
            this.db.setTooltip(nodeId, tooltip);
          }
        }
      } else if (secondToken && secondToken.startsWith('"')) {
        // Direct URL patterns: click nodeId "url" [tooltip] [target]
        const url = this.extractStringContent(secondToken);
        let tooltip = undefined;
        let target = undefined;

        if (children.length >= 3) {
          const thirdToken = children[2].getText();
          if (thirdToken.startsWith('"')) {
            // Has tooltip
            tooltip = this.extractStringContent(thirdToken);
            if (children.length >= 4) {
              target = children[3].getText();
            }
          } else {
            // Has target
            target = thirdToken;
          }
        }

        // Only pass target parameter if it's defined (matches Jison behavior)
        if (target !== undefined) {
          this.db.setLink(nodeId, url, target);
        } else {
          this.db.setLink(nodeId, url);
        }
        if (tooltip) {
          this.db.setTooltip(nodeId, tooltip);
        }
      } else if (secondToken) {
        // Callback patterns: click nodeId callbackName [tooltip]
        const callbackName = secondToken;
        let tooltip = undefined;

        if (children.length >= 3 && children[2].getText().startsWith('"')) {
          tooltip = this.extractStringContent(children[2].getText());
        }

        this.db.setClickEvent(nodeId, callbackName);
        if (tooltip) {
          this.db.setTooltip(nodeId, tooltip);
        }
      }
    } catch (_error) {
      // Error handling for click statement processing
    }
  };

  // Handle style statements
  exitStyleStatement = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 5) return;

      // Pattern: STYLE WS idString WS stylesOpt
      const nodeId = children[2].getText(); // idString
      const stylesOpt = this.extractStylesOpt(children[4]); // stylesOpt

      // Call addVertex with styles: addVertex(id, textObj, type, style, classes, dir, props, metadata)
      this.db.addVertex(
        nodeId,
        undefined,
        undefined,
        stylesOpt,
        undefined,
        undefined,
        {},
        undefined
      );
    } catch (_error) {
      // Error handling for style statement processing
    }
  };

  // Extract text content from a text context and determine label type
  private extractTextContent(textCtx: any): { text: string; type: string } {
    if (!textCtx || !textCtx.children) return { text: '', type: 'text' };

    let text = '';
    let hasMarkdown = false;

    for (const child of textCtx.children) {
      if (child.getText) {
        const childText = child.getText();

        // Check if this child is an MD_STR token
        if (child.symbol && child.symbol.type) {
          // Get the token type name from the lexer
          const tokenTypeName = this.getTokenTypeName(child.symbol.type);
          if (tokenTypeName === 'MD_STR') {
            hasMarkdown = true;
            text += childText;
          } else {
            text += childText;
          }
        } else {
          text += childText;
        }
      }
    }

    return {
      text: text,
      type: hasMarkdown ? 'markdown' : 'text',
    };
  }

  // Helper method to get token type name from token type number
  private getTokenTypeName(tokenType: number): string {
    // This is a simplified approach - in a full implementation, you'd use the lexer's vocabulary
    // For now, we'll use a different approach to detect MD_STR tokens
    return 'UNKNOWN';
  }

  // Extract text content and detect markdown strings by checking for MD_STR tokens
  private extractTextWithType(textCtx: any): { text: string; type: string } {
    if (!textCtx) return { text: '', type: 'text' };

    const fullText = textCtx.getText();

    // Check if the text came from specific context types to determine the label type
    let detectedType = 'text'; // default

    if (textCtx.children && textCtx.children.length > 0) {
      const firstChild = textCtx.children[0];
      const childConstructor = firstChild.constructor.name;

      if (childConstructor === 'StringLiteralContext') {
        // This came from a quoted string in the grammar
        detectedType = 'string';
      }
    }

    // Detect different text types based on wrapping characters (for cases where quotes are preserved)
    if (fullText.startsWith('`') && fullText.endsWith('`') && fullText.length > 2) {
      // Markdown strings: "`text`"
      const strippedText = fullText.slice(1, -1);

      return {
        text: strippedText,
        type: 'markdown',
      };
    } else if (fullText.startsWith('"') && fullText.endsWith('"') && fullText.length > 2) {
      // Quoted strings: "text" (fallback case)
      const strippedText = fullText.slice(1, -1);

      // Check if the inner content has backticks (nested markdown)
      if (strippedText.startsWith('`') && strippedText.endsWith('`') && strippedText.length > 2) {
        const innerStrippedText = strippedText.slice(1, -1);
        return {
          text: innerStrippedText,
          type: 'markdown',
        };
      }

      return {
        text: strippedText,
        type: 'text',
      };
    }

    // Use the detected type from context analysis
    return {
      text: fullText,
      type: detectedType,
    };
  }

  // Check if a text context contains markdown by examining the lexer tokens
  private checkForMarkdownInContext(textCtx: any): boolean {
    // Walk through the token stream to find MD_STR tokens
    if (!textCtx.start || !textCtx.stop) return false;

    const startIndex = textCtx.start.tokenIndex;
    const stopIndex = textCtx.stop.tokenIndex;

    // Access the token stream from the parser context
    // This is a more direct approach to check for MD_STR tokens
    try {
      const parser = textCtx.parser;
      if (parser && parser.getTokenStream) {
        const tokenStream = parser.getTokenStream();
        for (let i = startIndex; i <= stopIndex; i++) {
          const token = tokenStream.get(i);
          if (token && token.type) {
            // Check if this token type corresponds to MD_STR
            // MD_STR should be token type that comes after MD_STRING_START
            const tokenText = token.text;
            if (tokenText && !tokenText.includes('`') && !tokenText.includes('"')) {
              // This might be the content of an MD_STR token
              // Check if there are backticks around this token in the original input
              const prevToken = i > 0 ? tokenStream.get(i - 1) : null;
              const nextToken = tokenStream.get(i + 1);

              if (prevToken && nextToken) {
                const prevText = prevToken.text || '';
                const nextText = nextToken.text || '';

                // Look for the pattern: "`content`" where content is this token
                if (prevText.includes('`') || nextText.includes('`')) {
                  return true;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Fallback - if we can't access the token stream, return false
    }

    return false;
  }

  // Handle link processing - this is the critical missing method
  exitLink = (ctx: any) => {
    try {
      // Store link data for use in vertexStatement processing
      this.currentLinkData = this.extractLinkData(ctx);
    } catch (_error) {
      // Error handling for link processing
    }
  };

  // Handle arrow text (pipe-delimited edge text)
  exitArrowText = (ctx: any) => {
    try {
      // arrowText: PIPE text PIPE
      // Extract the text content between the pipes
      const children = ctx.children;
      if (children && children.length >= 3) {
        // Find the text node (should be between the two PIPE tokens)
        for (let i = 1; i < children.length - 1; i++) {
          const child = children[i];
          if (child.constructor.name === 'TextContext') {
            // Store the arrow text for use by the parent link rule
            const textWithType = this.extractTextWithType(child);
            this.currentArrowText = textWithType.text;
            break;
          }
        }
      }
    } catch (_error) {
      // Error handling - silently continue for now
    }
  };

  // Handle linkStyle statements
  exitLinkStyleStatement = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 5) return;

      // Parse different linkStyle patterns:
      // LINKSTYLE WS DEFAULT WS stylesOpt
      // LINKSTYLE WS numList WS stylesOpt
      // LINKSTYLE WS DEFAULT WS INTERPOLATE WS alphaNum WS stylesOpt
      // LINKSTYLE WS numList WS INTERPOLATE WS alphaNum WS stylesOpt
      // LINKSTYLE WS DEFAULT WS INTERPOLATE WS alphaNum
      // LINKSTYLE WS numList WS INTERPOLATE WS alphaNum

      let positions: ('default' | number)[] = [];
      let stylesOpt: string[] = [];
      let interpolate: string | undefined = undefined;

      // Find positions (DEFAULT or numList)
      if (children[2].getText() === 'default') {
        positions = ['default'];
      } else {
        // Parse numList - extract numbers from the numList context
        const numListCtx = children[2];
        positions = this.extractNumList(numListCtx);
      }

      // Check if INTERPOLATE is present
      const interpolateIndex = children.findIndex(
        (child: any) => child.getText && child.getText() === 'interpolate'
      );

      if (interpolateIndex !== -1) {
        // Has interpolate - get the alphaNum value
        interpolate = children[interpolateIndex + 2].getText(); // alphaNum after INTERPOLATE WS

        // Check if there are styles after interpolate
        if (children.length > interpolateIndex + 3) {
          stylesOpt = this.extractStylesOpt(children[interpolateIndex + 4]); // stylesOpt after alphaNum WS
        }
      } else {
        // No interpolate - styles are at position 4
        stylesOpt = this.extractStylesOpt(children[4]);
      }

      // Apply interpolate if present
      if (interpolate) {
        this.db.updateLinkInterpolate(positions, interpolate);
      }

      // Apply styles if present
      if (stylesOpt.length > 0) {
        this.db.updateLink(positions, stylesOpt);
      }
    } catch (_error) {
      // Error handling for linkStyle statement processing
    }
  };

  // Handle class definition statements
  exitClassDefStatement = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 5) return;

      // Pattern: CLASSDEF WS idString WS stylesOpt
      const className = children[2].getText(); // idString
      const stylesOpt = this.extractStylesOpt(children[4]); // stylesOpt

      // Call addClass: addClass(ids, style)
      this.db.addClass(className, stylesOpt);
    } catch (_error) {
      // Error handling for classDef statement processing
    }
  };

  // Handle class statements
  exitClassStatement = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 5) return;

      // Pattern: CLASS WS idString WS idString
      const nodeId = children[2].getText(); // first idString (vertex)
      const className = children[4].getText(); // second idString (class)

      // Call setClass: setClass(ids, className)
      this.db.setClass(nodeId, className);
    } catch (_error) {
      // Error handling for class statement processing
    }
  };

  // Handle accessibility title statements
  exitAccTitle = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 2) return;

      // Pattern: ACC_TITLE ACC_TITLE_VALUE
      const titleValue = children[1].getText(); // ACC_TITLE_VALUE

      // Call setAccTitle with trimmed value
      this.db.setAccTitle(titleValue.trim());
    } catch (_error) {
      // Error handling for accTitle statement processing
    }
  };

  // Handle accessibility description statements
  exitAccDescr = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 2) return;

      let descrValue = '';

      if (children.length === 2) {
        // Pattern: ACC_DESCR ACC_DESCR_VALUE
        descrValue = children[1].getText(); // ACC_DESCR_VALUE
      } else if (children.length === 3) {
        // Pattern: ACC_DESCR_MULTI ACC_DESCR_MULTILINE_VALUE ACC_DESCR_MULTILINE_END
        descrValue = children[1].getText(); // ACC_DESCR_MULTILINE_VALUE
      }

      // Call setAccDescription with trimmed value
      this.db.setAccDescription(descrValue.trim());
    } catch (_error) {
      // Error handling for accDescr statement processing
    }
  };

  // Handle graph configuration - matches Jison's graphConfig rule
  exitGraphConfig = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 2) return;

      // Check for GRAPH DIR pattern
      if (children.length >= 2) {
        const graphToken = children[0];
        const dirToken = children[1];

        if (
          graphToken &&
          dirToken &&
          graphToken.getText() &&
          (graphToken.getText().includes('graph') || graphToken.getText().includes('flowchart'))
        ) {
          const dirText = dirToken.getText();

          // Check if this is a DIR token (not NODIR)
          if (dirText && dirText !== '' && !dirText.includes('\n')) {
            // Call setDirection with the raw direction value
            // FlowDB.setDirection will handle the symbol mapping (>, <, ^, v -> LR, RL, BT, TB)
            this.db.setDirection(dirText.trim());
          } else {
            // NODIR case - set default direction
            this.db.setDirection('TB');
          }
        }
      }
    } catch (_error) {
      // Error handling for graph config processing
    }
  };

  // Handle direction statements
  exitDirection = (ctx: any) => {
    try {
      const children = ctx.children;
      if (!children || children.length < 1) return;

      // Get the direction token (DIRECTION_TB, DIRECTION_BT, etc.)
      const directionToken = children[0].getText();

      // Extract the direction value from the token
      let directionValue = '';
      if (directionToken.includes('TB')) {
        directionValue = 'TB';
      } else if (directionToken.includes('BT')) {
        directionValue = 'BT';
      } else if (directionToken.includes('RL')) {
        directionValue = 'RL';
      } else if (directionToken.includes('LR')) {
        directionValue = 'LR';
      }

      if (directionValue) {
        // Create direction statement object that matches Jison's format
        const directionStmt = { stmt: 'dir', value: directionValue };

        // Add to current subgraph if we're inside one
        if (this.subgraphStack.length > 0) {
          const currentSubgraph = this.subgraphStack[this.subgraphStack.length - 1];
          currentSubgraph.nodes.push(directionStmt);
        }
      }
    } catch (_error) {
      // Error handling for direction statement processing
    }
  };

  exitShapeData = (_ctx: any) => {
    try {
      // Shape data is handled by collecting content in exitShapeDataContent
      // and then processed when the shape data is used in vertex statements
    } catch (_error) {
      // Error handling for shape data processing
    }
  };

  exitShapeDataContent = (_ctx: any) => {
    // Shape data content is collected and processed when used
    // The actual processing happens in vertex statement handlers
  };
}

/**
 * ANTLR-based parser class that matches the Jison parser interface
 */
class ANTLRFlowParser {
  yy: any;

  constructor() {
    // Initialize with empty yy - this will be set by the calling code
    this.yy = null;
  }

  /**
   * Parse flowchart input using ANTLR
   * @param input - The flowchart diagram text to parse
   * @returns Parsed result (for compatibility with Jison interface)
   */
  parse(input: string): any {
    try {
      // Reset the database state
      this.yy.clear();

      // Create ANTLR input stream
      const inputStream = CharStream.fromString(input);

      // Create lexer
      const lexer = new FlowLexer(inputStream);

      // Create token stream
      const tokenStream = new CommonTokenStream(lexer);

      // Create parser
      const parser = new FlowParser(tokenStream);

      // Parse starting from the root rule
      const tree = parser.start();

      // Create and use listener to build the model
      const listener = new FlowchartListener(this.yy);
      ParseTreeWalker.DEFAULT.walk(listener, tree);

      return tree;
    } catch (error) {
      // Log error for debugging
      // console.error('ANTLR parsing error:', error);
      throw error;
    }
  }
}

// Create parser instance
const parser = new ANTLRFlowParser();

// Export in the format expected by the existing code
const exportedParser = {
  parse: (input: string) => parser.parse(input),
  parser: parser,
  yy: null as any, // This will be set by the test setup
};

// Make sure the parser uses the external yy when available
Object.defineProperty(exportedParser, 'yy', {
  get() {
    return parser.yy;
  },
  set(value) {
    parser.yy = value;
  },
});

export default exportedParser;
