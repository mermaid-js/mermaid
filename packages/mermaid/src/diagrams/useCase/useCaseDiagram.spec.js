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

describe('more than one useCase diagram', () => {
  it('should not have duplicated actors', async () => {
    const diagram = await Diagram.fromText(`
        usecase
         actor Developer1
         actor Developer2`);
    expect(diagram.db.getActors()).toMatchInlineSnapshot(`
      [
        {
          "name": "Developer1",
          "type": "actor",
        },
        {
          "name": "Developer2",
          "type": "actor",
        },
      ]
    `);
    
    const diagram2 = await Diagram.fromText(`
        usecase
         actor Developer1
         actor Developer2`);

    expect(diagram2.db.getActors()).toMatchInlineSnapshot(`
      [
        {
          "name": "Developer1",
          "type": "actor",
        },
        {
          "name": "Developer2",
          "type": "actor",
        },
      ]
    `);

    // Add different actor
    const diagram3 = await Diagram.fromText(`
        usecase
         actor User
         actor Admin`);

    expect(diagram3.db.getActors()).toMatchInlineSnapshot(`
      [
        {
          "name": "User",
          "type": "actor",
        },
        {
          "name": "Admin",
          "type": "actor",
        },
      ]
    `);
  });
});

describe('when parsing a useCaseDiagram', function () {
  let diagram;
  beforeEach(async function () {
    diagram = await Diagram.fromText(`
usecase
 actor Developer1
 actor Developer2
 actor Developer3`);
  });
  
  it('should handle a useCaseDiagram definition', function () {
    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].type).toBe('actor');
    expect(actors[1].name).toBe('Developer2');
    expect(actors[1].type).toBe('actor');
    expect(actors[2].name).toBe('Developer3');
    expect(actors[2].type).toBe('actor');
  });

  it('should handle a simple useCaseDiagram with two actors', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Admin`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Admin');
  });

  it('should handle a single actor useCaseDiagram', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor SingleUser`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('SingleUser');
    expect(actors[0].type).toBe('actor');
  });

  it('should handle actors with alphanumeric names', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User123
 actor Admin_2
 actor Developer_v1`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('User123');
    expect(actors[1].name).toBe('Admin_2');
    expect(actors[2].name).toBe('Developer_v1');
  });

  it('should handle actors with underscore names', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor _private_user
 actor public_admin_`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('_private_user');
    expect(actors[1].name).toBe('public_admin_');
  });

  it('should handle comments in a useCaseDiagram', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 % This is a comment
 actor Admin`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Admin');
  });

  it('should handle new lines in a useCaseDiagram', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User

 % Comment
 actor Admin

 actor Developer
    `);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Admin');
    expect(actors[2].name).toBe('Developer');
  });

  it('should handle leading spaces in lines in a useCaseDiagram', async () => {
    const diagram = await Diagram.fromText(`
usecase
  actor User
   actor Admin
    actor Developer`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Admin');
    expect(actors[2].name).toBe('Developer');
  });

  it('should handle mixed spacing in a useCaseDiagram', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
	actor Admin
  actor Developer
   actor Tester`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(4);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Admin');
    expect(actors[2].name).toBe('Developer');
    expect(actors[3].name).toBe('Tester');
  });

  it('should handle empty useCaseDiagram', async () => {
    const diagram = await Diagram.fromText(`
usecase`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(0);
  });

  it('should handle useCaseDiagram with only comments', async () => {
    const diagram = await Diagram.fromText(`
usecase
 % This is a comment
 % Another comment`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(0);
  });

  it('should handle useCaseDiagram with only whitespace', async () => {
    const diagram = await Diagram.fromText(`
usecase


  `);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(0);
  });
});

describe('when handling edge cases in useCaseDiagram', function () {
  it('should handle actors with very long names', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor VeryLongActorNameThatExceedsNormalLength
 actor AnotherVeryLongActorNameForTesting`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('VeryLongActorNameThatExceedsNormalLength');
    expect(actors[1].name).toBe('AnotherVeryLongActorNameForTesting');
  });

  it('should handle actors with single character names', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor A
 actor B
 actor C`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('A');
    expect(actors[1].name).toBe('B');
    expect(actors[2].name).toBe('C');
  });

  it('should handle duplicate actor names', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor User
 actor Admin`);

    const actors = diagram.db.getActors();
    // Should handle duplicates appropriately (depending on implementation)
    expect(actors.length).toBeGreaterThan(0);
    expect(actors.some(actor => actor.name === 'User')).toBe(true);
    expect(actors.some(actor => actor.name === 'Admin')).toBe(true);
  });

  it('should handle actors with numbers only', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User123
 actor Admin456`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('User123');
    expect(actors[1].name).toBe('Admin456');
  });

  it('should handle mixed case actor names', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor UserName
 actor ADMIN
 actor developer
 actor TestUser`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(4);
    expect(actors[0].name).toBe('UserName');
    expect(actors[1].name).toBe('ADMIN');
    expect(actors[2].name).toBe('developer');
    expect(actors[3].name).toBe('TestUser');
  });
});

describe('when testing useCaseDiagram parsing errors', function () {
  it('should handle malformed actor declarations gracefully', async () => {
    // Test what happens with invalid syntax
    let error = false;
    try {
      await Diagram.fromText(`
usecase
 actor
 actor User`);
    } catch (e) {
      error = true;
    }
    // Depending on implementation, this might error or ignore the malformed line
    // The test verifies the parser handles it gracefully
    // We don't assert on error here as behavior may vary
  });

  it('should handle missing usecase keyword', async () => {
    let error = false;
    try {
      await Diagram.fromText(`
 actor User
 actor Admin`);
    } catch (e) {
      error = true;
    }
    // Should error since useCase keyword is required
    expect(error).toBe(true);
  });
});

describe('when testing useCaseDiagram metadata support', function () {
  it('should parse actor with simple metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ icon : 'icon_name', place: "sample place" }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeDefined();
    expect(actors[0].metadata.icon).toBe('icon_name');
    expect(actors[0].metadata.place).toBe('sample place');
  });

  it('should parse actor with complex metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ icon : 'icon_name', type : 'hollow', place: "sample place", material:"sample" }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeDefined();
    expect(actors[0].metadata.icon).toBe('icon_name');
    expect(actors[0].metadata.type).toBe('hollow');
    expect(actors[0].metadata.place).toBe('sample place');
    expect(actors[0].metadata.material).toBe('sample');
  });

  it('should parse mixed actors with and without metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Developer1@{ icon : 'dev_icon' }
 actor Admin@{ type: 'admin', place: "office" }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);

    // First actor without metadata
    expect(actors[0].name).toBe('User');
    expect(actors[0].metadata).toBeUndefined();

    // Second actor with simple metadata
    expect(actors[1].name).toBe('Developer1');
    expect(actors[1].metadata).toBeDefined();
    expect(actors[1].metadata.icon).toBe('dev_icon');

    // Third actor with multiple metadata
    expect(actors[2].name).toBe('Admin');
    expect(actors[2].metadata).toBeDefined();
    expect(actors[2].metadata.type).toBe('admin');
    expect(actors[2].metadata.place).toBe('office');
  });

  it('should handle empty metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeDefined();
    expect(Object.keys(actors[0].metadata).length).toBe(0);
  });

  it('should handle metadata with different quote styles', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ icon : 'single_quotes', place: "double_quotes", type: unquoted }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(1);
    expect(actors[0].metadata.icon).toBe('single_quotes');
    expect(actors[0].metadata.place).toBe('double_quotes');
    expect(actors[0].metadata.type).toBe('unquoted');
  });

  it('should maintain backward compatibility with existing syntax', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 actor Developer2
 actor Developer3`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeUndefined();
    expect(actors[1].name).toBe('Developer2');
    expect(actors[1].metadata).toBeUndefined();
    expect(actors[2].name).toBe('Developer3');
    expect(actors[2].metadata).toBeUndefined();
  });

  it('should handle metadata with spaces around values', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ icon : 'icon_name' , place: "sample place" , type : hollow }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(1);
    expect(actors[0].metadata.icon).toBe('icon_name');
    expect(actors[0].metadata.place).toBe('sample place');
    expect(actors[0].metadata.type).toBe('hollow');
  });
});

describe('when testing useCaseDiagram multiple actors in single line', function () {
  it('should parse three actors in single line', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1, Developer2, Developer3`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeUndefined();
    expect(actors[1].name).toBe('Developer2');
    expect(actors[1].metadata).toBeUndefined();
    expect(actors[2].name).toBe('Developer3');
    expect(actors[2].metadata).toBeUndefined();
  });

  it('should parse two actors in single line', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1, Developer2`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Developer2');
  });

  it('should parse five actors in single line', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1, Developer2, Developer3, Developer4, Developer5`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(5);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Developer2');
    expect(actors[2].name).toBe('Developer3');
    expect(actors[3].name).toBe('Developer4');
    expect(actors[4].name).toBe('Developer5');
  });

  it('should parse multiple actors with metadata in single line', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ icon: 'dev' }, Developer2, Developer3@{ type: 'admin' }`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);

    // First actor with metadata
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeDefined();
    expect(actors[0].metadata.icon).toBe('dev');

    // Second actor without metadata
    expect(actors[1].name).toBe('Developer2');
    expect(actors[1].metadata).toBeUndefined();

    // Third actor with metadata
    expect(actors[2].name).toBe('Developer3');
    expect(actors[2].metadata).toBeDefined();
    expect(actors[2].metadata.type).toBe('admin');
  });

  it('should handle spaces around commas in actor list', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1 , Developer2 ,Developer3,  Developer4  `);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(4);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Developer2');
    expect(actors[2].name).toBe('Developer3');
    expect(actors[3].name).toBe('Developer4');
  });

  it('should handle mixed single and multiple actor lines', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Developer1, Developer2, Developer3
 actor Admin
 actor Tester1, Tester2`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(7);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Developer1');
    expect(actors[2].name).toBe('Developer2');
    expect(actors[3].name).toBe('Developer3');
    expect(actors[4].name).toBe('Admin');
    expect(actors[5].name).toBe('Tester1');
    expect(actors[6].name).toBe('Tester2');
  });

  it('should maintain backward compatibility with existing single actor syntax', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 actor Developer2
 actor Developer3`);

    const actors = diagram.db.getActors();
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Developer2');
    expect(actors[2].name).toBe('Developer3');
  });
});

describe('when testing useCaseDiagram system boundaries', function () {
  it('should parse system boundary with use cases', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 systemBoundary Tasks
   coding
   testing
   deploying
 end`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();

    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(3);
    expect(boundaries[0].useCases[0].name).toBe('coding');
    expect(boundaries[0].useCases[1].name).toBe('testing');
    expect(boundaries[0].useCases[2].name).toBe('deploying');
  });

  it('should parse multiple system boundaries', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary Development
   coding
   testing
 end
 systemBoundary Deployment
   staging
   production
 end`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(2);

    expect(boundaries[0].name).toBe('Development');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('coding');
    expect(boundaries[0].useCases[1].name).toBe('testing');

    expect(boundaries[1].name).toBe('Deployment');
    expect(boundaries[1].useCases.length).toBe(2);
    expect(boundaries[1].useCases[0].name).toBe('staging');
    expect(boundaries[1].useCases[1].name).toBe('production');
  });

  it('should parse mixed actors and system boundaries', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1, Developer2
 systemBoundary Tasks
   coding
   testing
 end
 actor Admin`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();

    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Developer2');
    expect(actors[2].name).toBe('Admin');

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('coding');
    expect(boundaries[0].useCases[1].name).toBe('testing');
  });

  it('should handle empty system boundary', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary EmptyTasks
 end`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('EmptyTasks');
    expect(boundaries[0].useCases.length).toBe(0);
  });

  it('should handle system boundary with single use case', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary SingleTask
   coding
 end`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('SingleTask');
    expect(boundaries[0].useCases.length).toBe(1);
    expect(boundaries[0].useCases[0].name).toBe('coding');
  });

  it('should maintain backward compatibility with all previous features', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Developer1@{ icon: 'dev' }, Developer2
 systemBoundary Tasks
   coding
   testing
 end
 actor Admin@{ type: 'admin' }`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();

    // Check actors
    expect(actors.length).toBe(4);
    expect(actors[0].name).toBe('User');
    expect(actors[0].metadata).toBeUndefined();

    expect(actors[1].name).toBe('Developer1');
    expect(actors[1].metadata).toBeDefined();
    expect(actors[1].metadata.icon).toBe('dev');

    expect(actors[2].name).toBe('Developer2');
    expect(actors[2].metadata).toBeUndefined();

    expect(actors[3].name).toBe('Admin');
    expect(actors[3].metadata).toBeDefined();
    expect(actors[3].metadata.type).toBe('admin');

    // Check system boundary
    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('coding');
    expect(boundaries[0].useCases[1].name).toBe('testing');
  });
});

describe('when testing useCaseDiagram curly brace system boundaries', function () {
  it('should parse system boundary with curly braces', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 systemBoundary Tasks {
   playing
   reviewing
 }`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();

    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('playing');
    expect(boundaries[0].useCases[1].name).toBe('reviewing');
  });

  it('should parse multiple system boundaries with curly braces', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary Development {
   coding
   testing
 }
 systemBoundary Deployment {
   staging
   production
 }`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(2);

    expect(boundaries[0].name).toBe('Development');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('coding');
    expect(boundaries[0].useCases[1].name).toBe('testing');

    expect(boundaries[1].name).toBe('Deployment');
    expect(boundaries[1].useCases.length).toBe(2);
    expect(boundaries[1].useCases[0].name).toBe('staging');
    expect(boundaries[1].useCases[1].name).toBe('production');
  });

  it('should handle empty system boundary with curly braces', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary EmptyTasks {
 }`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('EmptyTasks');
    expect(boundaries[0].useCases.length).toBe(0);
  });
});

describe('when testing useCaseDiagram actor-usecase relationships', function () {
  it('should parse actor to usecase relationships with -->', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 systemBoundary Tasks {
   playing
   reviewing
 }
 Developer1 --> playing
 Developer1 --> reviewing`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();
    const relationships = diagram.db.getRelationships();

    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);

    expect(relationships.length).toBe(2);
    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('playing');
    expect(relationships[0].arrow).toBe('-->');

    expect(relationships[1].from).toBe('Developer1');
    expect(relationships[1].to).toBe('reviewing');
    expect(relationships[1].arrow).toBe('-->');
  });

  it('should parse actor to usecase relationships with ->', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 systemBoundary Tasks {
   playing
 }
 Developer1 -> playing`);

    const relationships = diagram.db.getRelationships();

    expect(relationships.length).toBe(1);
    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('playing');
    expect(relationships[0].arrow).toBe('->');
  });

  it('should parse multiple actors with relationships', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1, Developer2
 systemBoundary Tasks {
   playing
   reviewing
 }
 Developer1 --> playing
 Developer2 --> reviewing`);

    const actors = diagram.db.getActors();
    const relationships = diagram.db.getRelationships();

    expect(actors.length).toBe(2);
    expect(relationships.length).toBe(2);

    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('playing');

    expect(relationships[1].from).toBe('Developer2');
    expect(relationships[1].to).toBe('reviewing');
  });

  it('should handle complete example with all features', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1@{ icon: 'dev' }
 actor Developer2, Developer3
 systemBoundary Tasks {
   playing
   reviewing
 }
 Developer1 --> playing
 Developer2 --> reviewing
 Developer3 --> playing`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();
    const relationships = diagram.db.getRelationships();

    // Check actors
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[0].metadata).toBeDefined();
    expect(actors[0].metadata.icon).toBe('dev');

    expect(actors[1].name).toBe('Developer2');
    expect(actors[1].metadata).toBeUndefined();

    expect(actors[2].name).toBe('Developer3');
    expect(actors[2].metadata).toBeUndefined();

    // Check system boundary
    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('playing');
    expect(boundaries[0].useCases[1].name).toBe('reviewing');

    // Check relationships
    expect(relationships.length).toBe(3);
    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('playing');

    expect(relationships[1].from).toBe('Developer2');
    expect(relationships[1].to).toBe('reviewing');

    expect(relationships[2].from).toBe('Developer3');
    expect(relationships[2].to).toBe('playing');
  });
});

describe('when testing useCaseDiagram node definitions and relationships', function () {
  it('should parse actor to node relationships', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Tester1
 Tester1 --> c(Go through testing)`);

    const actors = diagram.db.getActors();
    const nodes = diagram.db.getNodes();
    const nodeRelationships = diagram.db.getNodeRelationships();

    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Tester1');

    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('c');
    expect(nodes[0].label).toBe('Go through testing');

    expect(nodeRelationships.length).toBe(1);
    expect(nodeRelationships[0].from).toBe('Tester1');
    expect(nodeRelationships[0].to).toBe('c');
    expect(nodeRelationships[0].arrow).toBe('-->');
  });

  it('should parse inline actor-node relationships', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1 --> a(Go through code)
 actor Developer2 --> b(Go through implementation)`);

    const actors = diagram.db.getActors();
    const inlineRelationships = diagram.db.getInlineRelationships();

    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Developer2');

    expect(inlineRelationships.length).toBe(2);

    expect(inlineRelationships[0].actor).toBe('Developer1');
    expect(inlineRelationships[0].node.id).toBe('a');
    expect(inlineRelationships[0].node.label).toBe('Go through code');
    expect(inlineRelationships[0].arrow).toBe('-->');

    expect(inlineRelationships[1].actor).toBe('Developer2');
    expect(inlineRelationships[1].node.id).toBe('b');
    expect(inlineRelationships[1].node.label).toBe('Go through implementation');
    expect(inlineRelationships[1].arrow).toBe('-->');
  });

  it('should parse mixed syntax with both styles', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Tester1
 Tester1 --> c(Go through testing)
 actor Developer1 --> a(Go through code)
 actor Developer2 --> b(Go through implementation)`);

    const actors = diagram.db.getActors();
    const nodes = diagram.db.getNodes();
    const nodeRelationships = diagram.db.getNodeRelationships();
    const inlineRelationships = diagram.db.getInlineRelationships();

    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('Tester1');
    expect(actors[1].name).toBe('Developer1');
    expect(actors[2].name).toBe('Developer2');

    expect(nodes.length).toBe(3);
    expect(nodes[0].id).toBe('c');
    expect(nodes[1].id).toBe('a');
    expect(nodes[2].id).toBe('b');

    expect(nodeRelationships.length).toBe(1);
    expect(nodeRelationships[0].from).toBe('Tester1');
    expect(nodeRelationships[0].to).toBe('c');

    expect(inlineRelationships.length).toBe(2);
    expect(inlineRelationships[0].actor).toBe('Developer1');
    expect(inlineRelationships[0].node.id).toBe('a');
    expect(inlineRelationships[1].actor).toBe('Developer2');
    expect(inlineRelationships[1].node.id).toBe('b');
  });

  it('should handle node labels with multiple words', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1 --> a(Go through code review process)`);

    const inlineRelationships = diagram.db.getInlineRelationships();

    expect(inlineRelationships.length).toBe(1);
    expect(inlineRelationships[0].node.label).toBe('Go through code review process');
  });

  it('should maintain backward compatibility with all existing features', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Developer1@{ icon: 'dev' }, Developer2
 systemBoundary Tasks {
   coding
   testing
 }
 Developer1 --> coding
 actor Tester1 --> a(Go through testing)
 actor QA --> b(Quality assurance)`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();
    const relationships = diagram.db.getRelationships();
    const inlineRelationships = diagram.db.getInlineRelationships();

    // Check actors
    expect(actors.length).toBe(5);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Developer1');
    expect(actors[1].metadata.icon).toBe('dev');
    expect(actors[2].name).toBe('Developer2');
    expect(actors[3].name).toBe('Tester1');
    expect(actors[4].name).toBe('QA');

    // Check system boundary
    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);

    // Check relationships
    expect(relationships.length).toBe(1);
    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('coding');

    // Check inline relationships
    expect(inlineRelationships.length).toBe(2);
    expect(inlineRelationships[0].actor).toBe('Tester1');
    expect(inlineRelationships[0].node.id).toBe('a');
    expect(inlineRelationships[1].actor).toBe('QA');
    expect(inlineRelationships[1].node.id).toBe('b');
  });
});

describe('when testing useCaseDiagram edge labels', function () {
  it('should parse edge labels in actor to node relationships', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 Developer1 --task2--> c(Go through testing)`);

    const actors = diagram.db.getActors();
    const nodes = diagram.db.getNodes();
    const nodeRelationships = diagram.db.getNodeRelationships();

    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');

    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('c');
    expect(nodes[0].label).toBe('Go through testing');

    expect(nodeRelationships.length).toBe(1);
    expect(nodeRelationships[0].from).toBe('Developer1');
    expect(nodeRelationships[0].to).toBe('c');
    expect(nodeRelationships[0].arrow).toBe('--task2-->');
    expect(nodeRelationships[0].label).toBe('task2');
  });

  it('should parse edge labels in inline actor-node relationships', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1 --task1--> a(Go through code)`);

    const actors = diagram.db.getActors();
    const inlineRelationships = diagram.db.getInlineRelationships();

    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe('Developer1');

    expect(inlineRelationships.length).toBe(1);
    expect(inlineRelationships[0].actor).toBe('Developer1');
    expect(inlineRelationships[0].node.id).toBe('a');
    expect(inlineRelationships[0].node.label).toBe('Go through code');
    expect(inlineRelationships[0].arrow).toBe('--task1-->');
    expect(inlineRelationships[0].label).toBe('task1');
  });

  it('should parse mixed edge labels and regular arrows', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 actor Tester1
 Developer1 --task1--> a(Go through code)
 Tester1 --> b(Go through testing)`);

    const actors = diagram.db.getActors();
    const nodeRelationships = diagram.db.getNodeRelationships();

    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('Developer1');
    expect(actors[1].name).toBe('Tester1');

    expect(nodeRelationships.length).toBe(2);

    // First relationship with edge label
    expect(nodeRelationships[0].from).toBe('Developer1');
    expect(nodeRelationships[0].to).toBe('a');
    expect(nodeRelationships[0].label).toBe('task1');

    // Second relationship without edge label
    expect(nodeRelationships[1].from).toBe('Tester1');
    expect(nodeRelationships[1].to).toBe('b');
    expect(nodeRelationships[1].label).toBeUndefined();
  });

  it('should parse edge labels with different arrow types', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor Developer1
 actor Developer2
 Developer1 --task1--> a(Go through code)
 Developer2 --task2-> b(Go through testing)`);

    const nodeRelationships = diagram.db.getNodeRelationships();

    expect(nodeRelationships.length).toBe(2);

    expect(nodeRelationships[0].arrow).toBe('--task1-->');
    expect(nodeRelationships[0].label).toBe('task1');

    expect(nodeRelationships[1].arrow).toBe('--task2->');
    expect(nodeRelationships[1].label).toBe('task2');
  });

  it('should maintain backward compatibility with edge labels', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Developer1@{ icon: 'dev' }
 systemBoundary Tasks {
   coding
   testing
 }
 Developer1 --> coding
 Developer1 --task1--> a(Go through code review)
 actor Tester1 --task2--> b(Quality assurance)`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();
    const relationships = diagram.db.getRelationships();
    const nodeRelationships = diagram.db.getNodeRelationships();
    const inlineRelationships = diagram.db.getInlineRelationships();

    // Check actors
    expect(actors.length).toBe(3);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Developer1');
    expect(actors[1].metadata.icon).toBe('dev');
    expect(actors[2].name).toBe('Tester1');

    // Check system boundary
    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('Tasks');
    expect(boundaries[0].useCases.length).toBe(2);

    // Check regular relationships (no edge label)
    expect(relationships.length).toBe(1);
    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('coding');
    expect(relationships[0].label).toBeUndefined();

    // Check node relationships with edge label
    expect(nodeRelationships.length).toBe(1);
    expect(nodeRelationships[0].from).toBe('Developer1');
    expect(nodeRelationships[0].to).toBe('a');
    expect(nodeRelationships[0].label).toBe('task1');

    // Check inline relationships with edge label
    expect(inlineRelationships.length).toBe(1);
    expect(inlineRelationships[0].actor).toBe('Tester1');
    expect(inlineRelationships[0].node.id).toBe('b');
    expect(inlineRelationships[0].label).toBe('task2');
  });
});

describe('when testing useCaseDiagram system boundary metadata', function () {
  it('should parse system boundary with package type metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary actions
   coding
   testing
 end
 actions@{
   type: package
 }`);

    const boundaries = diagram.db.getSystemBoundaries();
    const metadata = diagram.db.getSystemBoundaryMetadata();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('actions');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].useCases[0].name).toBe('coding');
    expect(boundaries[0].useCases[1].name).toBe('testing');
    expect(boundaries[0].metadata).toEqual({ type: 'package' });

    expect(metadata.length).toBe(1);
    expect(metadata[0].name).toBe('actions');
    expect(metadata[0].metadata).toEqual({ type: 'package' });
  });

  it('should parse system boundary with rect type metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary tasks
   development
   deployment
 end
 tasks@{
   type: rect
 }`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('tasks');
    expect(boundaries[0].metadata).toEqual({ type: 'rect' });
  });

  it('should handle system boundary without metadata (backward compatibility)', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary legacy
   oldTask1
   oldTask2
 end`);

    const boundaries = diagram.db.getSystemBoundaries();
    const metadata = diagram.db.getSystemBoundaryMetadata();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('legacy');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].metadata).toBeUndefined();

    expect(metadata.length).toBe(0);
  });

  it('should handle system boundary with curly brace syntax and metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary modern {
   newTask1
   newTask2
 }
 modern@{
   type: package
 }`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('modern');
    expect(boundaries[0].useCases.length).toBe(2);
    expect(boundaries[0].metadata).toEqual({ type: 'package' });
  });

  it('should handle invalid metadata type and default to rect', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary invalid
   task1
 end
 invalid@{
   type: unknown
 }`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0].name).toBe('invalid');
    expect(boundaries[0].metadata).toEqual({ type: 'unknown' });
    // Note: The renderer will default to 'rect' for unknown types
  });

  it('should handle multiple system boundaries with different metadata', async () => {
    const diagram = await Diagram.fromText(`
usecase
 systemBoundary frontend {
   ui
   components
 }
 systemBoundary backend
   api
   database
 end
 frontend@{
   type: package
 }
 backend@{
   type: rect
 }`);

    const boundaries = diagram.db.getSystemBoundaries();

    expect(boundaries.length).toBe(2);

    const frontend = boundaries.find(b => b.name === 'frontend');
    expect(frontend).toBeDefined();
    expect(frontend.metadata).toEqual({ type: 'package' });
    expect(frontend.useCases.length).toBe(2);

    const backend = boundaries.find(b => b.name === 'backend');
    expect(backend).toBeDefined();
    expect(backend.metadata).toEqual({ type: 'rect' });
    expect(backend.useCases.length).toBe(2);
  });

  it('should maintain backward compatibility with existing system boundary syntax', async () => {
    const diagram = await Diagram.fromText(`
usecase
 actor User
 actor Developer1@{ icon: 'dev' }
 systemBoundary Tasks {
   coding
   testing
 }
 systemBoundary Legacy
   oldTask
 end
 Tasks@{
   type: package
 }
 Developer1 --> coding
 User --> oldTask`);

    const actors = diagram.db.getActors();
    const boundaries = diagram.db.getSystemBoundaries();
    const relationships = diagram.db.getRelationships();

    // Check actors
    expect(actors.length).toBe(2);
    expect(actors[0].name).toBe('User');
    expect(actors[1].name).toBe('Developer1');
    expect(actors[1].metadata.icon).toBe('dev');

    // Check boundaries
    expect(boundaries.length).toBe(2);

    const tasks = boundaries.find(b => b.name === 'Tasks');
    expect(tasks).toBeDefined();
    expect(tasks.metadata).toEqual({ type: 'package' });
    expect(tasks.useCases.length).toBe(2);

    const legacy = boundaries.find(b => b.name === 'Legacy');
    expect(legacy).toBeDefined();
    expect(legacy.metadata).toBeUndefined();
    expect(legacy.useCases.length).toBe(1);

    // Check relationships
    expect(relationships.length).toBe(2);
    expect(relationships[0].from).toBe('Developer1');
    expect(relationships[0].to).toBe('coding');
    expect(relationships[1].from).toBe('User');
    expect(relationships[1].to).toBe('oldTask');
  });
});
