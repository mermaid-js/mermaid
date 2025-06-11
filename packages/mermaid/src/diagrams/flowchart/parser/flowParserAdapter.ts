import { FlowchartLexer } from './flowLexer.js';
import { FlowchartParser } from './flowParser.js';
import { FlowchartAstVisitor } from './flowAst.js';

// Interface matching existing Mermaid flowDb expectations
export interface FlowDb {
  vertices: Record<string, any>;
  edges: any[];
  classes: Record<string, string>;
  subGraphs: any[];
  direction: string;
  tooltips: Record<string, string>;
  clickEvents: any[];
  firstGraph: () => boolean;
  setDirection: (dir: string) => void;
  addVertex: (
    id: string,
    text?: string,
    type?: string,
    style?: string,
    classes?: string[],
    dir?: string,
    props?: any
  ) => void;
  addLink: (start: string | string[], end: string | string[], linkData: any) => void;
  addClass: (id: string, style: string) => void;
  setClass: (ids: string | string[], className: string) => void;
  setClickEvent: (id: string, functionName: string, functionArgs?: string) => void;
  setLink: (id: string, link: string, target?: string) => void;
  addSubGraph: (id: string, list: any[], title: string) => string;
  getVertices: () => Record<string, any>;
  getEdges: () => any[];
  getClasses: () => Record<string, string>;
  clear: () => void;
  setAccTitle: (title: string) => void;
  setAccDescription: (description: string) => void;
}

class FlowchartParserAdapter {
  public lexer: any;
  public parser: FlowchartParser;
  public visitor: FlowchartAstVisitor;

  // Mermaid compatibility
  public yy: FlowDb;

  constructor() {
    this.lexer = FlowchartLexer;
    this.parser = new FlowchartParser();
    this.visitor = new FlowchartAstVisitor();

    // Initialize yy object for Mermaid compatibility
    this.yy = this.createYY();
  }

  public createYY(): FlowDb {
    const state = {
      vertices: new Map<string, any>(),
      edges: [] as any[],
      classes: {} as Record<string, string>,
      subGraphs: [] as any[],
      direction: 'TB',
      tooltips: {} as Record<string, string>,
      clickEvents: [] as any[],
      subCount: 0,
      accTitle: '',
      accDescription: '',
    };

    return {
      vertices: state.vertices,
      edges: state.edges,
      classes: state.classes,
      subGraphs: state.subGraphs,
      direction: state.direction,
      tooltips: state.tooltips,
      clickEvents: state.clickEvents,

      firstGraph: () => true,

      setDirection: (dir: string) => {
        state.direction = dir;
      },

      addVertex: (
        id: string,
        text?: string,
        type?: string,
        style?: string,
        classes?: string[],
        dir?: string,
        props?: any
      ) => {
        state.vertices.set(id, {
          id,
          text: text || id,
          type: type || 'default',
          style,
          classes,
          dir,
          props,
        });
      },

      addLink: (start: string | string[], end: string | string[], linkData: any) => {
        state.edges.push({
          start: Array.isArray(start) ? start[start.length - 1] : start,
          end: Array.isArray(end) ? end[end.length - 1] : end,
          type: linkData.type || 'arrow',
          stroke: linkData.stroke || 'normal',
          length: linkData.length,
          text: linkData.text,
        });
      },

      addClass: (id: string, style: string) => {
        state.classes[id] = style;
      },

      setClass: (ids: string | string[], className: string) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        idArray.forEach((id) => {
          const vertex = state.vertices.get(id);
          if (vertex) {
            vertex.classes = [className];
          }
        });
      },

      setClickEvent: (id: string, functionName: string, functionArgs?: string) => {
        state.clickEvents.push({
          id,
          functionName,
          functionArgs,
        });
      },

      setLink: (id: string, link: string, target?: string) => {
        state.clickEvents.push({
          id,
          link,
          target,
        });
      },

      addSubGraph: (id: string, list: any[], title: string) => {
        const sgId = id || `subGraph${state.subCount++}`;
        state.subGraphs.push({
          id: sgId,
          nodes: list,
          title: title || sgId,
        });
        return sgId;
      },

      getVertices: () => state.vertices,
      getEdges: () => state.edges,
      getClasses: () => state.classes,

      clear: () => {
        state.vertices.clear();
        state.edges.length = 0;
        state.classes = {};
        state.subGraphs = [];
        state.direction = 'TB';
        state.tooltips = {};
        state.clickEvents = [];
        state.subCount = 0;
        state.accTitle = '';
        state.accDescription = '';
      },

      setAccTitle: (title: string) => {
        state.accTitle = title;
      },

      setAccDescription: (description: string) => {
        state.accDescription = description;
      },
    };
  }

  parse(text: string): any {
    // Clear previous state
    this.yy.clear();

    // Tokenize
    const lexResult = this.lexer.tokenize(text);

    if (lexResult.errors.length > 0) {
      const error = lexResult.errors[0];
      throw new Error(
        `Lexing error at line ${error.line}, column ${error.column}: ${error.message}`
      );
    }

    // Parse
    this.parser.input = lexResult.tokens;
    const cst = this.parser.flowchart();

    if (this.parser.errors.length > 0) {
      const error = this.parser.errors[0];
      throw new Error(`Parse error: ${error.message}`);
    }

    // Visit CST and build AST
    const ast = this.visitor.visit(cst);

    // Update yy state with parsed data
    // Convert plain object vertices to Map
    Object.entries(ast.vertices).forEach(([id, vertex]) => {
      this.yy.vertices.set(id, vertex);
    });
    this.yy.edges.push(...ast.edges);
    Object.assign(this.yy.classes, ast.classes);
    this.yy.subGraphs.push(...ast.subGraphs);
    this.yy.direction = ast.direction;
    Object.assign(this.yy.tooltips, ast.tooltips);
    this.yy.clickEvents.push(...ast.clickEvents);

    return ast;
  }

  // Compatibility method for Mermaid
  getYY(): FlowDb {
    return this.yy;
  }
}

// Export a singleton instance for compatibility
const parserInstance = new FlowchartParserAdapter();

// Create a flow object that can have its yy property reassigned
const flow = {
  parser: parserInstance,
  yy: parserInstance.yy,
  parse: (text: string) => {
    // Use the current yy object (which might have been reassigned by tests)
    const targetYY = flow.yy;

    // Clear previous state
    targetYY.clear();
    parserInstance.visitor.clear();

    // Tokenize
    const lexResult = parserInstance.lexer.tokenize(text);

    if (lexResult.errors.length > 0) {
      const error = lexResult.errors[0];
      throw new Error(
        `Lexing error at line ${error.line}, column ${error.column}: ${error.message}`
      );
    }

    // Parse
    parserInstance.parser.input = lexResult.tokens;
    const cst = parserInstance.parser.flowchart();

    if (parserInstance.parser.errors.length > 0) {
      const error = parserInstance.parser.errors[0];
      throw new Error(`Parse error: ${error.message}`);
    }

    // Visit CST and build AST
    const ast = parserInstance.visitor.visit(cst);

    // Update yy state with parsed data
    // Convert plain object vertices to Map
    Object.entries(ast.vertices).forEach(([id, vertex]) => {
      // Use addVertex method if available, otherwise set directly
      if (typeof targetYY.addVertex === 'function') {
        // Create textObj structure expected by FlowDB
        const textObj = vertex.text ? { text: vertex.text, type: 'text' } : undefined;
        targetYY.addVertex(
          id,
          textObj,
          vertex.type,
          vertex.style || [],
          vertex.classes || [],
          vertex.dir,
          vertex.props || {},
          undefined // metadata
        );
      } else {
        targetYY.vertices.set(id, vertex);
      }
    });

    // Add edges
    ast.edges.forEach((edge) => {
      if (typeof targetYY.addLink === 'function') {
        // Create the linkData structure expected by FlowDB
        const linkData = {
          type: edge.type,
          stroke: edge.stroke,
          length: edge.length,
          text: edge.text ? { text: edge.text, type: 'text' } : undefined,
        };
        targetYY.addLink([edge.start], [edge.end], linkData);
      } else {
        targetYY.edges.push(edge);
      }
    });

    // Add classes
    Object.entries(ast.classes).forEach(([id, className]) => {
      if (typeof targetYY.addClass === 'function') {
        // FlowDB.addClass expects an array of style strings, not a single string
        const styleArray = className.split(',').map((s) => s.trim());
        targetYY.addClass(id, styleArray);
      } else {
        targetYY.classes[id] = className;
      }
    });

    // Add subgraphs
    if (targetYY.subGraphs) {
      targetYY.subGraphs.push(...ast.subGraphs);
    }

    // Set direction
    if (typeof targetYY.setDirection === 'function') {
      targetYY.setDirection(ast.direction);
    } else {
      targetYY.direction = ast.direction;
    }

    // Add tooltips
    Object.entries(ast.tooltips).forEach(([id, tooltip]) => {
      if (typeof targetYY.setTooltip === 'function') {
        targetYY.setTooltip(id, tooltip);
      } else if (targetYY.tooltips) {
        targetYY.tooltips[id] = tooltip;
      }
    });

    // Add accessibility information
    if (ast.accTitle && typeof targetYY.setAccTitle === 'function') {
      targetYY.setAccTitle(ast.accTitle);
    }
    if (ast.accDescription && typeof targetYY.setAccDescription === 'function') {
      targetYY.setAccDescription(ast.accDescription);
    }

    // Add click events
    ast.clickEvents.forEach((clickEvent) => {
      if (typeof targetYY.setClickEvent === 'function') {
        targetYY.setClickEvent(clickEvent.id, clickEvent.functionName, clickEvent.functionArgs);
      } else if (targetYY.clickEvents) {
        targetYY.clickEvents.push(clickEvent);
      }
    });

    return ast;
  },
};

// Mermaid expects these exports
export const parser = parserInstance;
export const yy = parserInstance.yy;

// Default export for modern imports
export default flow;
