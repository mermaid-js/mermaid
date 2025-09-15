import { vi } from 'vitest';
import { setSiteConfig } from '../../diagram-api/diagramAPI.js';
import mermaidAPI from '../../mermaidAPI.js';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';

beforeAll(async () => {
  // Is required to load the useCase diagram
  await Diagram.fromText('usecase\n actor TestActor');
});

/**
 * UseCase diagrams require a basic d3 mock for rendering
 */
vi.mock('d3', () => {
  const NewD3 = function (this: any) {
    function returnThis(this: any) {
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
      getBBox: function () {
        return {
          height: 10,
          width: 20,
        };
      },
    };
  };

  return {
    select: function () {
      return new (NewD3 as any)();
    },

    selectAll: function () {
      return new (NewD3 as any)();
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
 * @param conf - Configuration object
 * @param key - Configuration key
 * @param value - Configuration value
 */
function addConf(conf: any, key: any, value: any) {
  if (value !== undefined) {
    conf[key] = value;
  }
  return conf;
}

describe('UseCase diagram with ANTLR parser', () => {
  it('should parse actors and use cases correctly', async () => {
    const diagram = await Diagram.fromText(`
        usecase
         actor Developer1
         actor Developer2
         usecase "Login System"
         usecase Authentication
         Developer1 --> "Login System"
         Developer2 --> Authentication
      `);

    expect(diagram).toBeDefined();
    expect(diagram.type).toBe('usecase');
  });

  it('should handle simple usecase diagram', async () => {
    const diagram = await Diagram.fromText(`
        usecase
         actor User
         usecase "View Profile"
         User --> "View Profile"
      `);

    expect(diagram).toBeDefined();
    expect(diagram.type).toBe('usecase');
  });
});
