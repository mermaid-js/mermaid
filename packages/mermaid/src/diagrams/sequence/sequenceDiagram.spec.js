import { vi } from 'vitest';

import * as configApi from '../../config.js';
import mermaidAPI from '../../mermaidAPI.js';
import { Diagram, getDiagramFromText } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';

beforeAll(async () => {
  // Is required to load the sequence diagram
  await getDiagramFromText('sequenceDiagram');
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
let diagram;

describe('more than one sequence diagram', () => {
  it('should not have duplicated messages', () => {
    const diagram1 = new Diagram(`
        sequenceDiagram
        Alice->Bob:Hello Bob, how are you?
        Bob-->Alice: I am good thanks!`);
    expect(diagram1.db.getMessages()).toMatchInlineSnapshot(`
      [
        {
          "from": "Alice",
          "message": "Hello Bob, how are you?",
          "to": "Bob",
          "type": 5,
          "wrap": false,
        },
        {
          "from": "Bob",
          "message": "I am good thanks!",
          "to": "Alice",
          "type": 6,
          "wrap": false,
        },
      ]
    `);
    const diagram2 = new Diagram(`
        sequenceDiagram
        Alice->Bob:Hello Bob, how are you?
        Bob-->Alice: I am good thanks!`);

    expect(diagram2.db.getMessages()).toMatchInlineSnapshot(`
      [
        {
          "from": "Alice",
          "message": "Hello Bob, how are you?",
          "to": "Bob",
          "type": 5,
          "wrap": false,
        },
        {
          "from": "Bob",
          "message": "I am good thanks!",
          "to": "Alice",
          "type": 6,
          "wrap": false,
        },
      ]
    `);

    // Add John actor
    const diagram3 = new Diagram(`
        sequenceDiagram
        Alice->John:Hello John, how are you?
        John-->Alice: I am good thanks!`);

    expect(diagram3.db.getMessages()).toMatchInlineSnapshot(`
      [
        {
          "from": "Alice",
          "message": "Hello John, how are you?",
          "to": "John",
          "type": 5,
          "wrap": false,
        },
        {
          "from": "John",
          "message": "I am good thanks!",
          "to": "Alice",
          "type": 6,
          "wrap": false,
        },
      ]
    `);
  });
});

describe('when parsing a sequenceDiagram', function () {
  beforeEach(function () {
    // diagram.db = sequenceDb;
    // diagram.db.clear();
    diagram = new Diagram(`
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`);
    diagram.db.clear();
  });
  it('should handle a sequenceDiagram definition', async function () {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('should not show sequence numbers per default', async () => {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram); // needs to be rendered for the correct value of visibility auto numbers
    expect(diagram.db.showSequenceNumbers()).toBe(false);
  });
  it('should show sequence numbers when autonumber is enabled', async () => {
    const str = `
sequenceDiagram
autonumber
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram); // needs to be rendered for the correct value of visibility auto numbers
    expect(diagram.db.showSequenceNumbers()).toBe(true);
  });
  it('should handle a sequenceDiagram definition with a title:', async () => {
    const str = `
sequenceDiagram
title: Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    expect(diagram.db.getAccDescription()).toBe('');
    const messages = diagram.db.getMessages();
    const title = diagram.db.getDiagramTitle();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
    expect(title).toBe('Diagram Title');
  });

  it('should handle a sequenceDiagram definition with a title without a :', async () => {
    const str = `
sequenceDiagram
title Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    expect(diagram.db.getAccDescription()).toBe('');
    const messages = diagram.db.getMessages();
    const title = diagram.db.getDiagramTitle();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
    expect(title).toBe('Diagram Title');
  });

  it('should handle a sequenceDiagram definition with a accessibility title and description (accDescr)', async () => {
    const str = `
sequenceDiagram
title: Diagram Title
accTitle: This is the title
accDescr: Accessibility Description
Alice->Bob:Hello Bob, how are you?
`;

    await mermaidAPI.parse(str);
    expect(diagram.db.getDiagramTitle()).toBe('Diagram Title');
    expect(diagram.db.getAccTitle()).toBe('This is the title');
    expect(diagram.db.getAccDescription()).toBe('Accessibility Description');
    const messages = diagram.db.getMessages();
  });
  it('should handle a sequenceDiagram definition with a accessibility title and multiline description (accDescr)', async () => {
    const str = `
sequenceDiagram
accTitle: This is the title
accDescr {
Accessibility
Description
}
Alice->Bob:Hello Bob, how are you?
`;

    await mermaidAPI.parse(str);
    expect(diagram.db.getAccTitle()).toBe('This is the title');
    expect(diagram.db.getAccDescription()).toBe('Accessibility\nDescription');
    const messages = diagram.db.getMessages();
  });

  it('should space in actor names', async () => {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are - you?
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('should handle dashes in actor names', async () => {
    const str = `
sequenceDiagram
Alice-in-Wonderland->Bob:Hello Bob, how are - you?
Bob-->Alice-in-Wonderland:I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors['Alice-in-Wonderland'].description).toBe('Alice-in-Wonderland');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('Alice-in-Wonderland');
    expect(messages[1].from).toBe('Bob');
  });

  it('should handle dashes in participant names', async () => {
    const str = `
sequenceDiagram
participant Alice-in-Wonderland
participant Bob
Alice-in-Wonderland->Bob:Hello Bob, how are - you?
Bob-->Alice-in-Wonderland:I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(Object.keys(actors)).toEqual(['Alice-in-Wonderland', 'Bob']);
    expect(actors['Alice-in-Wonderland'].description).toBe('Alice-in-Wonderland');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('Alice-in-Wonderland');
    expect(messages[1].from).toBe('Bob');
  });

  it('should alias participants', async () => {
    const str = `
sequenceDiagram
participant A as Alice
participant B as Bob
A->B:Hello Bob, how are you?
B-->A: I am good thanks!`;

    await mermaidAPI.parse(str);

    const actors = diagram.db.getActors();

    expect(Object.keys(actors)).toEqual(['A', 'B']);
    expect(actors.A.description).toBe('Alice');
    expect(actors.B.description).toBe('Bob');

    const messages = diagram.db.getMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('A');
    expect(messages[1].from).toBe('B');
  });
  it('should alias a mix of actors and participants apa12', async () => {
    const str = `
sequenceDiagram
  actor Alice as Alice2
  actor Bob
  participant John as John2
  participant Mandy
  Alice->>Bob: Hi Bob
  Bob->>Alice: Hi Alice
  Alice->>John: Hi John
  John->>Mandy: Hi Mandy
  Mandy ->>Joan: Hi Joan`;

    await mermaidAPI.parse(str);

    const actors = diagram.db.getActors();
    expect(Object.keys(actors)).toEqual(['Alice', 'Bob', 'John', 'Mandy', 'Joan']);
    expect(actors.Alice.description).toBe('Alice2');
    expect(actors.Alice.type).toBe('actor');
    expect(actors.Bob.description).toBe('Bob');
    expect(actors.John.type).toBe('participant');
    expect(actors.Joan.type).toBe('participant');

    const messages = diagram.db.getMessages();
    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[4].to).toBe('Joan');
  });
  it('should alias actors apa13', async () => {
    const str = `
sequenceDiagram
actor A as Alice
actor B as Bob
A->B:Hello Bob, how are you?
B-->A: I am good thanks!`;

    await mermaidAPI.parse(str);

    const actors = diagram.db.getActors();
    expect(Object.keys(actors)).toEqual(['A', 'B']);
    expect(actors.A.description).toBe('Alice');
    expect(actors.B.description).toBe('Bob');

    const messages = diagram.db.getMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('A');
    expect(messages[1].from).toBe('B');
  });
  it('should handle in async messages', async () => {
    const str = `
sequenceDiagram
Alice-xBob:Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.SOLID_CROSS);
  });
  it('should handle in async dotted messages', async () => {
    const str = `
sequenceDiagram
Alice--xBob:Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.DOTTED_CROSS);
  });
  it('should handle in sync messages', async () => {
    const str = `
sequenceDiagram
Alice-)Bob:Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.SOLID_POINT);
  });
  it('should handle in sync dotted messages', async () => {
    const str = `
sequenceDiagram
Alice--)Bob:Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.DOTTED_POINT);
  });
  it('should handle in arrow messages', async () => {
    const str = `
sequenceDiagram
Alice->>Bob:Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.SOLID);
  });
  it('should handle in arrow messages', async () => {
    const str = 'sequenceDiagram\n' + 'Alice-->>Bob:Hello Bob, how are you?';

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.DOTTED);
  });
  it('should handle actor activation', async () => {
    const str = `
sequenceDiagram
Alice-->>Bob:Hello Bob, how are you?
activate Bob
Bob-->>Alice:Hello Alice, I'm fine and  you?
deactivate Bob`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(diagram.db.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(diagram.db.LINETYPE.ACTIVE_END);
    expect(messages[3].from.actor).toBe('Bob');
  });
  it('should handle actor one line notation activation', async () => {
    const str = `
      sequenceDiagram
      Alice-->>+Bob:Hello Bob, how are you?
      Bob-->>- Alice:Hello Alice, I'm fine and  you?`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(diagram.db.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(diagram.db.LINETYPE.ACTIVE_END);
    expect(messages[3].from.actor).toBe('Bob');
  });
  it('should handle stacked activations', async () => {
    const str = `
      sequenceDiagram
      Alice-->>+Bob:Hello Bob, how are you?
      Bob-->>+Carol:Carol, let me introduce Alice?
      Bob-->>- Alice:Hello Alice, please meet Carol?
      Carol->>- Bob:Oh Bob, I'm so happy to be here!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(8);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(diagram.db.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(diagram.db.LINETYPE.ACTIVE_START);
    expect(messages[3].from.actor).toBe('Carol');
    expect(messages[5].type).toBe(diagram.db.LINETYPE.ACTIVE_END);
    expect(messages[5].from.actor).toBe('Bob');
    expect(messages[7].type).toBe(diagram.db.LINETYPE.ACTIVE_END);
    expect(messages[7].from.actor).toBe('Carol');
  });
  it('should handle fail parsing when activating an inactive participant', async () => {
    const str = `
      sequenceDiagram
      participant user as End User
      participant Server as Server
      participant System as System
      participant System2 as System2

      user->>+Server: Test
      user->>+Server: Test2
      user->>System: Test
      Server->>-user: Test
      Server->>-user: Test2

      %% The following deactivation of Server will fail
      Server->>-user: Test3`;

    let error = false;
    try {
      await mermaidAPI.parse(str);
    } catch (e) {
      error = true;
    }
    expect(error).toBe(true);
  });

  it('should handle comments in a sequenceDiagram', async () => {
    const str = `
      sequenceDiagram
      Alice->Bob: Hello Bob, how are you?
      %% Comment
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('should handle new lines in a sequenceDiagram', async () => {
    const str = `
      sequenceDiagram
      Alice->Bob: Hello Bob, how are you?

      %% Comment
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!
      `;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('should handle semicolons', async () => {
    const str = `
sequenceDiagram;Alice->Bob: Hello Bob, how are you?;Note right of Bob: Bob thinks;Bob-->Alice: I am good thanks!;`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('should handle one leading space in lines in a sequenceDiagram', async () => {
    const str = `
sequenceDiagram
 Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('should handle several leading spaces in lines in a sequenceDiagram', async () => {
    const str = `
sequenceDiagram
   Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('should handle several leading spaces in lines in a sequenceDiagram', async () => {
    const str = `
sequenceDiagram
participant Alice
participant Bob
Alice->John: Hello John, how are you?
    loop Healthcheck
John->John: Fight against hypochondria
 end
Note right of John: Rational thoughts<br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
Bob-->John: Jolly good!`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(8);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('John');
  });
  it('should handle different line breaks', async () => {
    const str = `
sequenceDiagram
participant 1 as multiline<br>text
participant 2 as multiline<br/>text
participant 3 as multiline<br />text
participant 4 as multiline<br \t/>text
1->>2: multiline<br>text
note right of 2: multiline<br>text
2->>3: multiline<br/>text
note right of 3: multiline<br/>text
3->>4: multiline<br />text
note right of 4: multiline<br />text
4->>1: multiline<br \t/>text
note right of 1: multiline<br \t/>text
`;

    await mermaidAPI.parse(str);

    const actors = diagram.db.getActors();
    expect(actors['1'].description).toBe('multiline<br>text');
    expect(actors['2'].description).toBe('multiline<br/>text');
    expect(actors['3'].description).toBe('multiline<br />text');
    expect(actors['4'].description).toBe('multiline<br \t/>text');

    const messages = diagram.db.getMessages();
    expect(messages[0].message).toBe('multiline<br>text');
    expect(messages[1].message).toBe('multiline<br>text');
    expect(messages[2].message).toBe('multiline<br/>text');
    expect(messages[3].message).toBe('multiline<br/>text');
    expect(messages[4].message).toBe('multiline<br />text');
    expect(messages[5].message).toBe('multiline<br />text');
    expect(messages[6].message).toBe('multiline<br \t/>text');
    expect(messages[7].message).toBe('multiline<br \t/>text');
  });
  it('should handle notes and messages without wrap specified', async () => {
    const str = `
sequenceDiagram
participant 1
participant 2
participant 3
participant 4
1->>2: single-line text
note right of 2: single-line text
2->>3:nowrap: single-line text
note right of 3:nowrap: single-line text
3->>4: multiline<br/>text
note right of 4: multiline<br/>text
4->>1:nowrap: multiline<br/>text
note right of 1:nowrap: multiline<br/>text
`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[0].message).toBe('single-line text');
    expect(messages[1].message).toBe('single-line text');
    expect(messages[2].message).toBe('single-line text');
    expect(messages[3].message).toBe('single-line text');
    expect(messages[4].message).toBe('multiline<br/>text');
    expect(messages[5].message).toBe('multiline<br/>text');
    expect(messages[6].message).toBe('multiline<br/>text');
    expect(messages[7].message).toBe('multiline<br/>text');

    // wrap indicates whether wrap is specified
    expect(messages[0].wrap).toBe(false);
    expect(messages[1].wrap).toBe(false);
    expect(messages[2].wrap).toBe(false);
    expect(messages[3].wrap).toBe(false);
    expect(messages[4].wrap).toBe(false);
    expect(messages[5].wrap).toBe(false);
    expect(messages[6].wrap).toBe(false);
    expect(messages[7].wrap).toBe(false);
  });
  it('should handle notes and messages with wrap specified', async () => {
    const str = `
sequenceDiagram
participant 1
participant 2
participant 3
participant 4
1->>2:wrap: single-line text
note right of 2:wrap: single-line text
2->>3:wrap: multiline<br/>text
note right of 3:wrap: multiline<br/>text
`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[0].message).toBe('single-line text');
    expect(messages[1].message).toBe('single-line text');
    expect(messages[2].message).toBe('multiline<br/>text');
    expect(messages[3].message).toBe('multiline<br/>text');
    expect(messages[0].wrap).toBe(true);
    expect(messages[1].wrap).toBe(true);
    expect(messages[2].wrap).toBe(true);
    expect(messages[3].wrap).toBe(true);
  });
  it('should handle notes and messages with nowrap or line breaks', async () => {
    const str = `
sequenceDiagram
participant 1
participant 2
1->>2: single-line text
note right of 2: single-line text
`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[0].message).toBe('single-line text');
    expect(messages[1].message).toBe('single-line text');
    expect(messages[0].wrap).toBe(false);
    expect(messages[1].wrap).toBe(false);
  });
  it('should handle notes over a single actor', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Bob: Bob thinks
`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].from).toBe('Bob');
    expect(messages[1].to).toBe('Bob');
  });
  it('should handle notes over multiple actors', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Alice,Bob: confusion
Note over Bob,Alice: resolution
`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].from).toBe('Alice');
    expect(messages[1].to).toBe('Bob');
    expect(messages[2].from).toBe('Bob');
    expect(messages[2].to).toBe('Alice');
  });
  it('should handle loop statements', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
loop Multiple happy responses

Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('should add a rect around sequence', async () => {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, how are you?
        %% Comment
        rect rgb(200, 255, 200)
        Note right of Bob: Bob thinks
        Bob-->Alice: I am good thanks
        end
    `;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();
    expect(messages[1].type).toEqual(diagram.db.LINETYPE.RECT_START);
    expect(messages[1].message).toBe('rgb(200, 255, 200)');
    expect(messages[2].type).toEqual(diagram.db.LINETYPE.NOTE);
    expect(messages[3].type).toEqual(diagram.db.LINETYPE.DOTTED_OPEN);
    expect(messages[4].type).toEqual(diagram.db.LINETYPE.RECT_END);
  });

  it('should allow for nested rects', async () => {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, how are you?
        %% Comment
        rect rgb(200, 255, 200)
        rect rgb(0, 0, 0)
        Note right of Bob: Bob thinks
        end
        Bob-->Alice: I am good thanks
        end
    `;
    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();
    expect(messages[1].type).toEqual(diagram.db.LINETYPE.RECT_START);
    expect(messages[1].message).toBe('rgb(200, 255, 200)');
    expect(messages[2].type).toEqual(diagram.db.LINETYPE.RECT_START);
    expect(messages[2].message).toBe('rgb(0, 0, 0)');
    expect(messages[3].type).toEqual(diagram.db.LINETYPE.NOTE);
    expect(messages[4].type).toEqual(diagram.db.LINETYPE.RECT_END);
    expect(messages[5].type).toEqual(diagram.db.LINETYPE.DOTTED_OPEN);
    expect(messages[6].type).toEqual(diagram.db.LINETYPE.RECT_END);
  });
  it('should handle opt statements', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
opt Perhaps a happy response

Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('should handle alt statements', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
alt isWell

Bob-->Alice: I am good thanks!
else isSick
Bob-->Alice: Feel sick...
end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();

    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(7);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('should handle alt statements with multiple elses', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
alt isWell

Bob-->Alice: I am good thanks!
else isSick
Bob-->Alice: Feel sick...
else default
Bob-->Alice: :-)
end`;
    await mermaidAPI.parse(str);
    const messages = diagram.db.getMessages();
    expect(messages.length).toBe(9);
    expect(messages[1].from).toBe('Bob');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.ALT_START);
    expect(messages[3].from).toBe('Bob');
    expect(messages[4].type).toBe(diagram.db.LINETYPE.ALT_ELSE);
    expect(messages[5].from).toBe('Bob');
    expect(messages[6].type).toBe(diagram.db.LINETYPE.ALT_ELSE);
    expect(messages[7].from).toBe('Bob');
    expect(messages[8].type).toBe(diagram.db.LINETYPE.ALT_END);
  });
  it('should handle critical statements without options', async () => {
    const str = `
sequenceDiagram
    critical Establish a connection to the DB
        Service-->DB: connect
    end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();

    expect(actors.Service.description).toBe('Service');
    expect(actors.DB.description).toBe('DB');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.CRITICAL_START);
    expect(messages[1].from).toBe('Service');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.CRITICAL_END);
  });
  it('should handle critical statements with options', async () => {
    const str = `
sequenceDiagram
    critical Establish a connection to the DB
        Service-->DB: connect
    option Network timeout
        Service-->Service: Log error
    option Credentials rejected
        Service-->Service: Log different error
    end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();

    expect(actors.Service.description).toBe('Service');
    expect(actors.DB.description).toBe('DB');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(7);
    expect(messages[0].type).toBe(diagram.db.LINETYPE.CRITICAL_START);
    expect(messages[1].from).toBe('Service');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.CRITICAL_OPTION);
    expect(messages[3].from).toBe('Service');
    expect(messages[4].type).toBe(diagram.db.LINETYPE.CRITICAL_OPTION);
    expect(messages[5].from).toBe('Service');
    expect(messages[6].type).toBe(diagram.db.LINETYPE.CRITICAL_END);
  });
  it('should handle break statements', async () => {
    const str = `
sequenceDiagram
    Consumer-->API: Book something
    API-->BookingService: Start booking process
    break when the booking process fails
        API-->Consumer: show failure
    end
    API-->BillingService: Start billing process`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();

    expect(actors.Consumer.description).toBe('Consumer');
    expect(actors.API.description).toBe('API');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(6);
    expect(messages[0].from).toBe('Consumer');
    expect(messages[1].from).toBe('API');
    expect(messages[2].type).toBe(diagram.db.LINETYPE.BREAK_START);
    expect(messages[3].from).toBe('API');
    expect(messages[4].type).toBe(diagram.db.LINETYPE.BREAK_END);
    expect(messages[5].from).toBe('API');
  });
  it('should handle par statements a sequenceDiagram', async () => {
    const str = `
sequenceDiagram
par Parallel one
Alice->>Bob: Hello Bob, how are you?
Bob-->>Alice: I am good thanks!
and Parallel two
Alice->>Bob: Are you OK?
Bob-->>Alice: Fine!
and Parallel three
Alice->>Bob: What do you think about it?
Bob-->>Alice: It's good!
end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();

    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(10);
    expect(messages[0].message).toBe('Parallel one');
    expect(messages[1].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle par_over statements', async () => {
    const str = `
sequenceDiagram
par_over Parallel overlap
Alice ->> Bob: Message
Note left of Alice: Alice note
Note right of Bob: Bob note
end`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();

    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = diagram.db.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].message).toBe('Parallel overlap');
    expect(messages[1].from).toBe('Alice');
    expect(messages[2].from).toBe('Alice');
    expect(messages[3].from).toBe('Bob');
  });
  it('should handle special characters in signals', async () => {
    const str = 'sequenceDiagram\n' + 'Alice->Bob: -:<>,;# comment';

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[0].message).toBe('-:<>,');
  });
  it('should handle special characters in notes', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note right of Bob: -:<>,;# comment`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('should handle special characters in loop', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop -:<>,;# comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('should handle special characters in opt', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
opt -:<>,;# comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('should handle special characters in alt', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
alt -:<>,;# comment
Bob-->Alice: I am good thanks!
else ,<>:-#; comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('-:<>,');
    expect(messages[3].message).toBe(',<>:-');
  });
  it('should handle special characters in par', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
par -:<>,;# comment
Bob-->Alice: I am good thanks!
and ,<>:-#; comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('-:<>,');
    expect(messages[3].message).toBe(',<>:-');
  });
  it('should handle no-label loop', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
  });
  it('should handle no-label opt', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
opt # comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
  });
  it('should handle no-label alt', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
alt;Bob-->Alice: I am good thanks!
else # comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
    expect(messages[3].message).toBe('');
    expect(messages[4].message).toBe('I am good thanks!');
  });
  it('should handle no-label par', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
par;Bob-->Alice: I am good thanks!
and # comment
Bob-->Alice: I am good thanks!
end`;

    await mermaidAPI.parse(str);

    const messages = diagram.db.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
    expect(messages[3].message).toBe('');
    expect(messages[4].message).toBe('I am good thanks!');
  });

  it('should handle links', async () => {
    const str = `
sequenceDiagram
participant a as Alice
participant b as Bob
participant c as Charlie
links a: { "Repo": "https://repo.contoso.com/", "Dashboard": "https://dashboard.contoso.com/" }
links b: { "Dashboard": "https://dashboard.contoso.com/" }
links a: { "On-Call": "https://oncall.contoso.com/?svc=alice" }
link a: Endpoint @ https://alice.contoso.com
link a: Swagger @ https://swagger.contoso.com
link a: Tests @ https://tests.contoso.com/?svc=alice@contoso.com
`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.a.links['Repo']).toBe('https://repo.contoso.com/');
    expect(actors.b.links['Repo']).toBe(undefined);
    expect(actors.a.links['Dashboard']).toBe('https://dashboard.contoso.com/');
    expect(actors.b.links['Dashboard']).toBe('https://dashboard.contoso.com/');
    expect(actors.a.links['On-Call']).toBe('https://oncall.contoso.com/?svc=alice');
    expect(actors.c.links['Dashboard']).toBe(undefined);
    expect(actors.a.links['Endpoint']).toBe('https://alice.contoso.com');
    expect(actors.a.links['Swagger']).toBe('https://swagger.contoso.com');
    expect(actors.a.links['Tests']).toBe('https://tests.contoso.com/?svc=alice@contoso.com');
  });

  it('should handle properties EXPERIMENTAL: USE WITH CAUTION', async () => {
    //Be aware that the syntax for "properties" is likely to be changed.
    const str = `
sequenceDiagram
participant a as Alice
participant b as Bob
participant c as Charlie
properties a: {"class": "internal-service-actor", "icon": "@clock"}
properties b: {"class": "external-service-actor", "icon": "@computer"}
`;

    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    expect(actors.a.properties['class']).toBe('internal-service-actor');
    expect(actors.b.properties['class']).toBe('external-service-actor');
    expect(actors.a.properties['icon']).toBe('@clock');
    expect(actors.b.properties['icon']).toBe('@computer');
    expect(actors.c.properties['class']).toBe(undefined);
  });

  it('should handle box', async () => {
    const str = `
sequenceDiagram
box green Group 1
participant a as Alice
participant b as Bob
end
participant c as Charlie
links a: { "Repo": "https://repo.contoso.com/", "Dashboard": "https://dashboard.contoso.com/" }
links b: { "Dashboard": "https://dashboard.contoso.com/" }
links a: { "On-Call": "https://oncall.contoso.com/?svc=alice" }
link a: Endpoint @ https://alice.contoso.com
link a: Swagger @ https://swagger.contoso.com
link a: Tests @ https://tests.contoso.com/?svc=alice@contoso.com
`;

    await mermaidAPI.parse(str);
    const boxes = diagram.db.getBoxes();
    expect(boxes[0].name).toEqual('Group 1');
    expect(boxes[0].actorKeys).toEqual(['a', 'b']);
    expect(boxes[0].fill).toEqual('green');
  });

  it('should handle box without color', async () => {
    const str = `
  sequenceDiagram
  box Group 1
  participant a as Alice
  participant b as Bob
  end
  participant c as Charlie
  links a: { "Repo": "https://repo.contoso.com/", "Dashboard": "https://dashboard.contoso.com/" }
  links b: { "Dashboard": "https://dashboard.contoso.com/" }
  links a: { "On-Call": "https://oncall.contoso.com/?svc=alice" }
  link a: Endpoint @ https://alice.contoso.com
  link a: Swagger @ https://swagger.contoso.com
  link a: Tests @ https://tests.contoso.com/?svc=alice@contoso.com
  `;

    await mermaidAPI.parse(str);
    const boxes = diagram.db.getBoxes();
    expect(boxes[0].name).toEqual('Group 1');
    expect(boxes[0].actorKeys).toEqual(['a', 'b']);
    expect(boxes[0].fill).toEqual('transparent');
  });

  it('should handle box without description', async () => {
    const str = `
  sequenceDiagram
  box Aqua
  participant a as Alice
  participant b as Bob
  end
  participant c as Charlie
  links a: { "Repo": "https://repo.contoso.com/", "Dashboard": "https://dashboard.contoso.com/" }
  links b: { "Dashboard": "https://dashboard.contoso.com/" }
  links a: { "On-Call": "https://oncall.contoso.com/?svc=alice" }
  link a: Endpoint @ https://alice.contoso.com
  link a: Swagger @ https://swagger.contoso.com
  link a: Tests @ https://tests.contoso.com/?svc=alice@contoso.com
  `;

    await mermaidAPI.parse(str);
    const boxes = diagram.db.getBoxes();
    expect(boxes[0].name).toBeFalsy();
    expect(boxes[0].actorKeys).toEqual(['a', 'b']);
    expect(boxes[0].fill).toEqual('Aqua');
  });

  it('should handle simple actor creation', async () => {
    const str = `
  sequenceDiagram
  participant a as Alice
  a ->>b: Hello Bob?
  create participant c
  b-->>c: Hello c!
  c ->> b: Hello b?
  create actor d as Donald
  a ->> d: Hello Donald?
  `;
    await mermaidAPI.parse(str);
    const actors = diagram.db.getActors();
    const createdActors = diagram.db.getCreatedActors();
    expect(actors['c'].name).toEqual('c');
    expect(actors['c'].description).toEqual('c');
    expect(actors['c'].type).toEqual('participant');
    expect(createdActors['c']).toEqual(1);
    expect(actors['d'].name).toEqual('d');
    expect(actors['d'].description).toEqual('Donald');
    expect(actors['d'].type).toEqual('actor');
    expect(createdActors['d']).toEqual(3);
  });
  it('should handle simple actor destruction', async () => {
    const str = `
  sequenceDiagram
  participant a as Alice
  a ->>b: Hello Bob?
  destroy a
  b-->>a: Hello Alice!
  b ->> c: Where is Alice?
  destroy c
  b ->> c: Where are you?
  `;
    await mermaidAPI.parse(str);
    const destroyedActors = diagram.db.getDestroyedActors();
    expect(destroyedActors['a']).toEqual(1);
    expect(destroyedActors['c']).toEqual(3);
  });
  it('should handle the creation and destruction of the same actor', async () => {
    const str = `
  sequenceDiagram
  a ->>b: Hello Bob?
  create participant c
  b ->>c: Hello c!
  c ->> b: Hello b?
  destroy c
  b ->> c : Bye c !
  `;
    await mermaidAPI.parse(str);
    const createdActors = diagram.db.getCreatedActors();
    const destroyedActors = diagram.db.getDestroyedActors();
    expect(createdActors['c']).toEqual(1);
    expect(destroyedActors['c']).toEqual(3);
  });
});
describe('when checking the bounds in a sequenceDiagram', function () {
  beforeAll(() => {
    let conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25,
    };

    mermaidAPI.initialize({ sequence: conf });
  });

  let conf;
  beforeEach(function () {
    mermaidAPI.reset();
    // diagram.db = sequenceDb;
    // diagram.db.clear();
    diagram.renderer.bounds.init();
    conf = diagram.db.getConfig();
  });
  it('should handle a simple bound call', async () => {
    diagram.renderer.bounds.insert(100, 100, 200, 200);

    const { bounds } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(100);
    expect(bounds.starty).toBe(100);
    expect(bounds.stopx).toBe(200);
    expect(bounds.stopy).toBe(200);
  });
  it('should handle an expanding bound', async () => {
    diagram.renderer.bounds.insert(100, 100, 200, 200);
    diagram.renderer.bounds.insert(25, 50, 300, 400);

    const { bounds } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('should handle inserts within the bound without changing the outer bounds', async () => {
    diagram.renderer.bounds.insert(100, 100, 200, 200);
    diagram.renderer.bounds.insert(25, 50, 300, 400);
    diagram.renderer.bounds.insert(125, 150, 150, 200);

    const { bounds } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('should handle a loop without expanding the area', async () => {
    diagram.renderer.bounds.insert(25, 50, 300, 400);
    diagram.renderer.bounds.verticalPos = 150;
    diagram.renderer.bounds.newLoop();
    diagram.renderer.bounds.insert(125, 150, 150, 200);

    const loop = diagram.renderer.bounds.endLoop();

    expect(loop.startx).toBe(125 - conf.boxMargin);
    expect(loop.starty).toBe(150 - conf.boxMargin);
    expect(loop.stopx).toBe(150 + conf.boxMargin);
    expect(loop.stopy).toBe(200 + conf.boxMargin);

    // Check bounds of first loop
    const { bounds } = diagram.renderer.bounds.getBounds();

    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('should handle multiple loops withtout expanding the bounds', async () => {
    diagram.renderer.bounds.insert(100, 100, 1000, 1000);
    diagram.renderer.bounds.verticalPos = 200;
    diagram.renderer.bounds.newLoop();
    diagram.renderer.bounds.newLoop();
    diagram.renderer.bounds.insert(200, 200, 300, 300);

    // Check bounds of first loop
    let loop = diagram.renderer.bounds.endLoop();

    expect(loop.startx).toBe(200 - conf.boxMargin);
    expect(loop.starty).toBe(200 - conf.boxMargin);
    expect(loop.stopx).toBe(300 + conf.boxMargin);
    expect(loop.stopy).toBe(300 + conf.boxMargin);

    // Check bounds of second loop
    loop = diagram.renderer.bounds.endLoop();

    expect(loop.startx).toBe(200 - 2 * conf.boxMargin);
    expect(loop.starty).toBe(200 - 2 * conf.boxMargin);
    expect(loop.stopx).toBe(300 + 2 * conf.boxMargin);
    expect(loop.stopy).toBe(300 + 2 * conf.boxMargin);

    // Check bounds of first loop
    const { bounds } = diagram.renderer.bounds.getBounds();

    expect(bounds.startx).toBe(100);
    expect(bounds.starty).toBe(100);
    expect(bounds.stopx).toBe(1000);
    expect(bounds.stopy).toBe(1000);
  });
  it('should handle a loop that expands the area', async () => {
    diagram.renderer.bounds.insert(100, 100, 200, 200);
    diagram.renderer.bounds.verticalPos = 200;
    diagram.renderer.bounds.newLoop();
    diagram.renderer.bounds.insert(50, 50, 300, 300);

    const loop = diagram.renderer.bounds.endLoop();

    expect(loop.startx).toBe(50 - conf.boxMargin);
    expect(loop.starty).toBe(50 - conf.boxMargin);
    expect(loop.stopx).toBe(300 + conf.boxMargin);
    expect(loop.stopy).toBe(300 + conf.boxMargin);

    // Check bounds after the loop
    const { bounds } = diagram.renderer.bounds.getBounds();

    expect(bounds.startx).toBe(loop.startx);
    expect(bounds.starty).toBe(loop.starty);
    expect(bounds.stopx).toBe(loop.stopx);
    expect(bounds.stopy).toBe(loop.stopy);
  });
});

describe('when rendering a sequenceDiagram APA', function () {
  beforeAll(() => {
    let conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25,
      wrap: false,
      mirrorActors: false,
    };
    configApi.setSiteConfig({ logLevel: 5, sequence: conf });
  });
  let conf;
  beforeEach(function () {
    mermaidAPI.reset();

    // });
    conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25,
      wrap: false,
      mirrorActors: false,
    };
    configApi.setSiteConfig({ logLevel: 5, sequence: conf });
    diagram = new Diagram(`
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`);
    diagram.db.clear();
  });
  ['tspan', 'fo', 'old', undefined].forEach(function (textPlacement) {
    it(`
it should handle one actor, when textPlacement is ${textPlacement}`, async () => {
      const str = `
sequenceDiagram
participant Alice`;

      // mermaidAPI.reinitialize({ sequence: { textPlacement: textPlacement } });
      await mermaidAPI.parse(str);
      // diagram.renderer.setConf(mermaidAPI.getConfig().sequence);
      diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

      const { bounds } = diagram.renderer.bounds.getBounds();
      expect(bounds.startx).toBe(0);
      expect(bounds.starty).toBe(0);
      expect(bounds.stopx).toBe(conf.width);
      expect(bounds.stopy).toBe(conf.height);
    });
  });
  it('should handle same actor with different whitespace properly', async () => {
    const str = `
sequenceDiagram
participant Alice
participant Alice
participant Alice
`;

    await mermaidAPI.parse(str);

    const actors = diagram.db.getActors();
    expect(Object.keys(actors)).toEqual(['Alice']);
  });
  it('should handle one actor and a centered note', async () => {
    const str = `
sequenceDiagram
participant Alice
Note over Alice: Alice thinks
`;

    expect(mermaidAPI.getConfig().sequence.mirrorActors).toBeFalsy();
    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('should handle one actor and a note to the left', async () => {
    const str = `
sequenceDiagram
participant Alice
Note left of Alice: Alice thinks`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('should handle one actor and a note to the right', async () => {
    const str = `
sequenceDiagram
participant Alice
Note right of Alice: Alice thinks`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width / 2 + conf.actorMargin / 2 + conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('should handle two actors', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should handle two actors in a box', async () => {
    const str = `
sequenceDiagram
box rgb(34, 56, 0) Group1
participant Alice
participant Bob
end
Alice->Bob: Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin + conf.boxTextMargin * 2);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 20);
  });
  it('should handle two actors with init directive', async () => {
    const str = `
%%{init: {'logLevel': 0}}%%
sequenceDiagram
Alice->Bob: Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should handle two actors with init directive with multiline directive', async () => {
    const str = `
%%{init: { 'logLevel': 0}}%%
sequenceDiagram
%%{
wrap
}%%
Alice->Bob: Hello Bob, how are you?`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const msgs = diagram.db.getMessages();
    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
    expect(msgs.every((v) => v.wrap)).toBe(true);
  });
  it('should handle two actors and two centered shared notes', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Alice,Bob: Looks
Note over Bob,Alice: Looks back
`;
    // mermaidAPI.initialize({logLevel:0})
    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('should draw two actors and two messages', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Bob->Alice: Fine!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two actors notes to the right', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob->Alice: Fine!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    const expStopX = conf.actorMargin + conf.width + conf.width / 2 + conf.noteMargin + conf.width;

    expect(bounds.stopx).toBe(expStopX);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two actors notes to the left', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note left of Alice: Bob thinks
Bob->Alice: Fine!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two actors notes to the left with text wrapped (inline)', async () => {
    const str = `
sequenceDiagram
Alice->>Bob:wrap: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const msgs = diagram.db.getMessages();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(msgs[0].wrap).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two actors notes to the left with text wrapped (directive)', async () => {
    const str = `
%%{init: { 'theme': 'dark' } }%%
sequenceDiagram
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const msgs = diagram.db.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(msgs.every((v) => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two actors notes to the left with text wrapped and the init directive sets the theme to dark', async () => {
    const str = `
%%{init:{'theme':'dark'}}%%
sequenceDiagram
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const msgs = diagram.db.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(msgs.every((v) => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two actors, notes to the left with text wrapped and the init directive sets the theme to dark and fontFamily to Menlo, fontSize to 18, and fontWeight to 800', async () => {
    const str = `
    %%{init: { "theme": "dark", 'config': { "fontFamily": "Menlo", "fontSize": 18, "messageFontWeight": 400, "wrap": true }}}%%
sequenceDiagram
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;
    // mermaidAPI.initialize({ logLevel: 0 });
    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const msgs = diagram.db.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(mermaid.sequence.fontFamily).toBe('Menlo');
    expect(mermaid.sequence.fontSize).toBe(18);
    expect(mermaid.sequence.messageFontWeight).toBe(400);
    expect(msgs.every((v) => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('should draw two loops', async () => {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop Cheers
Bob->Alice: Fine!
end`;
    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastLoop().stopy);
  });
  it('should draw background rect', async () => {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, are you alright?
        rect rgb(0, 0, 0)
          Bob->Alice: I feel surrounded by darkness
        end
    `;
    await mermaidAPI.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);
    const { bounds, models } = diagram.renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastLoop().stopy);
  });
});

describe('when rendering a sequenceDiagram with actor mirror activated', () => {
  beforeAll(() => {
    let conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25,
      mirrorActors: true,
      // Depending on css styling this might need adjustment
      // Prolongs the edge of the diagram downwards
      bottomMarginAdj: 1,
    };

    mermaidAPI.initialize({ sequence: conf });
  });

  let conf;
  beforeEach(function () {
    mermaidAPI.reset();
    // diagram.db = sequenceDb;
    diagram.db.clear();
    conf = diagram.db.getConfig();
    diagram.renderer.bounds.init();
  });
  ['tspan', 'fo', 'old', undefined].forEach(function (textPlacement) {
    it('should handle one actor, when textPlacement is' + textPlacement, async () => {
      mermaidAPI.initialize(addConf(conf, 'textPlacement', textPlacement));
      diagram.renderer.bounds.init();
      const str = `
sequenceDiagram
participant Alice`;
      diagram.renderer.bounds.init();
      await mermaidAPI.parse(str);
      diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

      const { bounds, models } = diagram.renderer.bounds.getBounds();
      expect(bounds.startx).toBe(0);
      expect(bounds.starty).toBe(0);
      expect(bounds.stopx).toBe(conf.width);
      expect(bounds.stopy).toBe(
        models.lastActor().stopy + models.lastActor().height + conf.boxMargin
      );
    });
  });
});

describe('when rendering a sequenceDiagram with directives', () => {
  beforeAll(function () {
    let conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25,
    };
    mermaidAPI.initialize({ sequence: conf });
  });

  let conf;
  beforeEach(function () {
    mermaidAPI.reset();
    // diagram.db = sequenceDb;
    diagram.db.clear();
    conf = diagram.db.getConfig();
    diagram.renderer.bounds.init();
  });

  it('should handle one actor, when theme is dark and logLevel is 1 DX1 (dfg1)', async () => {
    const str = `
%%{init: { "theme": "dark", "logLevel": 1 } }%%
sequenceDiagram
%%{wrap}%%
participant Alice
`;
    diagram = new Diagram(str);

    diagram.renderer.bounds.init();
    await mermaidAPI.parse(str);

    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.theme).toBe('dark');
    expect(mermaid.logLevel).toBe(1);
    expect(bounds.startx).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopy).toBe(
      models.lastActor().stopy + models.lastActor().height + mermaid.sequence.boxMargin
    );
  });
  it('should handle one actor, when logLevel is 3 (dfg0)', async () => {
    const str = `
%%{initialize: { "logLevel": 3 }}%%
sequenceDiagram
participant Alice
`;

    diagram.parse(str);
    diagram.renderer.draw(str, 'tst', '1.2.3', diagram);

    const { bounds, models } = diagram.renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(3);
    expect(bounds.startx).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopy).toBe(
      models.lastActor().stopy + models.lastActor().height + mermaid.sequence.boxMargin
    );
  });
  it('should hide sequence numbers when autonumber is removed when autonumber is enabled', async () => {
    const str1 = `
sequenceDiagram
autonumber
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str1);
    diagram.renderer.draw(str1, 'tst', '1.2.3', diagram); // needs to be rendered for the correct value of visibility auto numbers
    expect(diagram.db.showSequenceNumbers()).toBe(true);

    const str2 = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    await mermaidAPI.parse(str2);
    diagram.renderer.draw(str2, 'tst', '1.2.3', diagram);
    expect(diagram.db.showSequenceNumbers()).toBe(false);
  });
});
