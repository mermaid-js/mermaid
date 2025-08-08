import { vi } from 'vitest';
import { setSiteConfig } from '../../diagram-api/diagramAPI.js';
import mermaidAPI from '../../mermaidAPI.js';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { SequenceDB } from './sequenceDb.js';

beforeAll(async () => {
  // Is required to load the sequence diagram
  await Diagram.fromText('sequenceDiagram');
});

/**
 * Sequence diagrams require their own very special version of a mocked d3 module
 * diagrams/sequence/svgDraw uses statements like this with d3 nodes: (note the [0][0])
 *
 *   // in drawText(...)
 *   textHeight += (textElem._groups || textElem)[0][0].getBBox().height;
 */
vi.mock('d3', () => {
  const NewD3 = function () {
    function returnThis() {
      return this;
    }
    return {
      append: function () {
        return NewD3();
      },
      lower: returnThis,
      attr: returnThis,
      style: returnThis,
      text: returnThis,
      // [0][0] (below) is required by drawText() in packages/mermaid/src/diagrams/sequence/svgDraw.js
      0: {
        0: {
          getBBox: function () {
            return {
              height: 10,
              width: 20,
            };
          },
        },
      },
    };
  };

  return {
    select: function () {
      return new NewD3();
    },

    selectAll: function () {
      return new NewD3();
    },

    // TODO: In d3 these are CurveFactory types, not strings
    curveBasis: 'basis',
    curveBasisClosed: 'basisClosed',
    curveBasisOpen: 'basisOpen',
    curveBumpX: 'bumpX',
    curveBumpY: 'bumpY',
    curveBundle: 'bundle',
    curveCardinalClosed: 'cardinalClosed',
    curveCardinalOpen: 'cardinalOpen',
    curveCardinal: 'cardinal',
    curveCatmullRomClosed: 'catmullRomClosed',
    curveCatmullRomOpen: 'catmullRomOpen',
    curveCatmullRom: 'catmullRom',
    curveLinear: 'linear',
    curveLinearClosed: 'linearClosed',
    curveMonotoneX: 'monotoneX',
    curveMonotoneY: 'monotoneY',
    curveNatural: 'natural',
    curveStep: 'step',
    curveStepAfter: 'stepAfter',
    curveStepBefore: 'stepBefore',
  };
});
// -------------------------------

addDiagrams();

/**
 * @param conf
 * @param key
 * @param value
 */
function addConf(conf, key, value) {
  if (value !== undefined) {
    conf[key] = value;
  }
  return conf;
}

// const parser = sequence.parser;

describe('when parsing a sequenceDiagram', function () {
  let diagram;
  beforeEach(async function () {
    diagram = await Diagram.fromText(`
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`);
  });
  it('should parse', async () => {
    const diagram = await Diagram.fromText(`
      sequenceDiagram
        participant Alice@{ type : database }
        Bob->>Alice: Hi Alice

        `);
  });
});
