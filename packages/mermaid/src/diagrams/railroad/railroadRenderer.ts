import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import type { DrawDefinition, HTML, SVG } from '../../diagram-api/types.js';
import { select } from 'd3';
import { RailroadDB, Node, Rule, NonTerm, Term, ZeroOrMany, ZeroOrOne, OneOrMany, Sequence, Choice, Exception, Epsilon} from './railroadDB.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
// import { configureSvgSize } from '../../setupGraphViewbox.js';
// import { Uid } from '../../rendering-util/uid.js';

// import {
//   // select as d3select,
//   scaleOrdinal as d3scaleOrdinal,
//   schemeTableau10 as d3schemeTableau10,
// } from 'd3';

// const fetchSVGElement = (id: string): SVG => {
//   // Get config
//   const { securityLevel } = configApi.getConfig();

//   // Handle root and document for when rendering in sandbox mode
//   let sandboxElement: HTML | undefined;
//   let document: Document | null | undefined;
//   if (securityLevel === 'sandbox') {
//     sandboxElement = select('#i' + id);
//     document = sandboxElement.nodes()[0].contentDocument;
//   }

//   // @ts-ignore - figure out how to assign HTML to document type
//   const root: HTML = sandboxElement && document ? select(document) : select('body');
//   const svg: SVG = root.select('#' + id);
//   return svg;
// };

// interface Params {
//   config: any,
//   svg: SVG,
// }

interface RailroadRendererParams {
  config?: any,
  svg?: SVG
}

abstract class RailroadRenderer<T> {
  public config: any;

  constructor({ config }: { config: any }) {
    this.config = config;
  }

  render(node: Node): T {
    if (node instanceof Rule) {
      return this.renderRule(node);
    } else if (node instanceof Rule) {
      return this.renderRule(node);
    } else if (node instanceof NonTerm) {
      return this.renderNonTerm(node);
    } else if (node instanceof OneOrMany) {
      return this.renderOneOrMany(node);
    } else if (node instanceof Sequence) {
      return this.renderSequence(node);
    } else if (node instanceof Choice) {
      return this.renderChoice(node);
    } else if (node instanceof Term) {
      return this.renderTerm(node);
    } else if (node instanceof ZeroOrMany) {
      return this.renderZeroOrMany(node);
    } else if (node instanceof ZeroOrOne) {
      return this.renderZeroOrOne(node);
    } else if (node instanceof Exception) {
      return this.renderException(node);
    } else {
      // return this.renderBlank();
      throw `${this.constructor.name} does not know how to render ${node.constructor.name}`
    }
  };
  abstract renderBlank(): T;

  abstract renderRule(node: Rule): T;
  abstract renderNonTerm(node: NonTerm): T;
  abstract renderOneOrMany(node: OneOrMany): T;
  abstract renderSequence(node: Sequence): T;
  abstract renderChoice(node: Choice): T;
  abstract renderTerm(node: Term): T;
  abstract renderZeroOrMany(node: ZeroOrMany): T;
  abstract renderZeroOrOne(node: ZeroOrOne): T;
  abstract renderException(node: Exception): T
}

class StringRenderer extends RailroadRenderer<string> {
  renderBlank(): string {
    return '';
  }

  renderRule(node: Rule): string {
    return `${node.label} ::= ${this.render(node.definition)}`;
  }

  renderNonTerm(node: NonTerm): string {
    const escaped = node.label.replaceAll(/\\([\\'"<>])/g, "\\$1");

    if (this.config?.format?.forceAngleBrackets) {
      return '<' + escaped + '>';
    } else {
      return escaped;
    }
  }

  renderTerm(node: Term): string {
    const escaped = node.label.replaceAll(/\\([\\'"])/g, "\\$1");

    return '"' + escaped + '"';
  }

  renderZeroOrOne(node: ZeroOrOne): string {
    return this.render(node.child) + '?';
  }

  renderOneOrMany(node: OneOrMany): string {
    return this.render(node.child) + '+';
  }

  renderZeroOrMany(node: ZeroOrMany): string {
    return this.render(node.child) + '*';
  }

  renderSequence(node: Sequence): string {
    const delimiter = this.config?.format?.forceComma ? ', ' : ' ';
    const content = node.children.map((c) => this.render(c)).join(delimiter);
    return content;
  }

  renderChoice(node: Choice): string {
    const content = node.children.map((c) => this.render(c)).join(' | ');
    return '(' + content + ')';
  }

  renderException(node: Exception): string {
    return `(${this.render(node.base)}) - ${this.render(node.except)}`;
  }

  renderEpsilon(node: Epsilon): string {
    return node.label;
  }
}

class SVGRenderer extends RailroadRenderer<SVG> {
  public svg;

  constructor({ config, svg }: {config: any, svg: SVG}) {
    super({config})
    this.svg = svg
  }

  renderRule(node: Rule): SVG {
    return `${node.label} ::= ${this.render(node.definition)}`;
  }

  renderNonTerm(node: NonTerm): SVG {
    const escaped = node.label.replaceAll(/\\([\\'"<>])/g, "\\$1");

    if (this.config?.format?.forceAngleBrackets) {
      return '<' + escaped + '>';
    } else {
      return escaped;
    }
  }

  renderTerm(node: Term): SVG {
    const escaped = node.label.replaceAll(/\\([\\'"])/g, "\\$1");

    return '"' + escaped + '"';
  }

  renderZeroOrOne(node: ZeroOrOne): SVG {
    return this.render(node.child) + '?';
  }

  renderOneOrMany(node: OneOrMany): SVG {
    return this.render(node.child) + '+';
  }

  renderZeroOrMany(node: ZeroOrMany): SVG {
    return this.render(node.child) + '*';
  }

  renderSequence(node: Sequence): SVG {
    const delimiter = this.config?.format?.forceComma ? ', ' : ' ';
    const content = node.children.map((c) => this.render(c)).join(delimiter);
    return content;
  }

  renderChoice(node: Choice): SVG {
    const content = node.children.map((c) => this.render(c)).join(' | ');
    return '(' + content + ')';
  }

  renderException(node: Exception): SVG {
    return `(${this.render(node.base)}) - ${this.render(node.except)}`;
  }

  renderEpsilon(node: Epsilon): SVG {
    return node.label;
  }
}

class Dimension {
  constructor(public width: number, public height: number) {}

  add(other: Dimension): Dimension {
    return new Dimension(this.width + other.width, this.height + other.height);
  }
}

/**
 * Draws Railroad diagram.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw: DrawDefinition = (_text, id, _version, diagObj): void => {
  const svg: SVG = selectSvgElement(id);
  const db = diagObj.db as RailroadDB;
  const rules = db.getRules();

  rules.forEach((rule, index) => {
    const { label: label, definition: chunk } = rule;
    console.log(`Key: ${label}, Value:`, chunk);

    const g = svg.append('g').attr('transform', `translate(${0},${10 + index * 20})`);

    const railroadConfig = configApi.getConfig().railroad;
    const renderer = new StringRenderer(railroadConfig);

    const text = renderer.render(rule);
    // const body = chunk.traverse<String>((item, index, parent, result) => {
    //   console.log(item, index, parent);

    //   // return result + item.toEBNF()
    //   return result + renderer.render(item);
    //   // const nestedDimensions = result.reduce((acc, curr) => acc.add(curr), new Dimension(0, 0));
    //   // item.toEBNF();
    //   // return nestedDimensions;
    // });

    // const text = label + ':==' + body;
    g.append('text').text(text);

    const x = g
      .append('rect')
      .attr('x', 100)
      .attr('y', 0)
      .attr('width', 300)
      .attr('height', 10)
      .attr('fill', '#999')

    console.log(x);
    console.log(typeof x);
  });

  // diagObj.renderer
  // const defaultRailroadConfig = configApi!.defaultConfig!.railroad!;
  // Establish svg dimensions and get width and height
  //
  // const width = conf?.width || defaultRailroadConfig.width!;
  // const height = conf?.height || defaultRailroadConfig.width!;
  // const useMaxWidth = conf?.useMaxWidth || defaultRailroadConfig.useMaxWidth!;

  // configureSvgSize(svg, height, width, useMaxWidth);

  // Compute layout
  //

  // Get color scheme for the graph
  // const colorScheme = d3scaleOrdinal(d3schemeTableau10);

  // const transitions: object[] = [
  //   { y: 0, label: 'AAA' },
  //   { y: 50, label: 'BBB' },
  //   { y: 100, label: 'CCC' },
  //   { y: 150, label: 'DDD' },
  // ];

  // svg
  //   .append('g')
  //   .attr('class', 'transition')
  //   .selectAll('.transition')
  //   .data(transitions)
  //   .join('g')
  //   .attr('class', 'node')
  //   .attr('id', (d: any) => d.id)
  //   .attr('transform', function (d: any) {
  //     return 'translate(' + 0 + ',' + d.y + ')';
  //   })
  //   .attr('x', () => 0)
  //   .attr('y', (d: any) => d.y)
  //   .append('rect')
  //   .attr('height', () => 20)
  //   .attr('width', () => 50)
  //   .attr('fill', '#999');

  // svg
  //   .append('g')
  //   .attr('class', 'node-labels')
  //   .attr('font-family', 'sans-serif')
  //   .attr('font-size', 14)
  //   .selectAll('text')
  //   .data(transitions)
  //   .join('text')
  //   .attr('x', (d: any) => (0))
  //   .attr('y', (d: any) => (0))
  //   // .attr('dy', `${showValues ? '0' : '0.35'}em`)
  //   // .attr('text-anchor', (d: any) => (d.x0 < width / 2 ? 'start' : 'end'))
  //   .text((d: any) => d.label);
};

export default {
  draw,
};
