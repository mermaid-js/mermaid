import { parser } from './parser/sequenceDiagram';
import sequenceDb from './sequenceDb';
import * as configApi from '../../config';
import renderer from './sequenceRenderer';
import mermaidAPI from '../../mermaidAPI';

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

describe('when parsing a sequenceDiagram', function () {
  beforeEach(function () {
    parser.yy = sequenceDb;
    parser.yy.clear();
  });
  it('it should handle a sequenceDiagram definition', function () {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should not show sequence numbers per default', function () {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    expect(parser.yy.showSequenceNumbers()).toBe(false);
  });
  it('it should show sequence numbers when autonumber is enabled', function () {
    const str = `
sequenceDiagram
autonumber
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    expect(parser.yy.showSequenceNumbers()).toBe(true);
  });
  it('it should handle a sequenceDiagram definition with a title', function () {
    const str = `
sequenceDiagram
title: Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();
    const title = parser.yy.getTitle();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
    expect(title).toBe('Diagram Title');
  });
  it('it should space in actor names', function () {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are - you?
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should handle dashes in actor names', function () {
    const str = `
sequenceDiagram
Alice-in-Wonderland->Bob:Hello Bob, how are - you?
Bob-->Alice-in-Wonderland:I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors['Alice-in-Wonderland'].description).toBe('Alice-in-Wonderland');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('Alice-in-Wonderland');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should alias participants', function () {
    const str = `
sequenceDiagram
participant A as Alice
participant B as Bob
A->B:Hello Bob, how are you?
B-->A: I am good thanks!`;

    mermaidAPI.parse(str);

    const actors = parser.yy.getActors();

    expect(Object.keys(actors)).toEqual(['A', 'B']);
    expect(actors.A.description).toBe('Alice');
    expect(actors.B.description).toBe('Bob');

    const messages = parser.yy.getMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('A');
    expect(messages[1].from).toBe('B');
  });
  it('it should alias a mix of actors and participants apa12', function () {
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

    mermaidAPI.parse(str);

    const actors = parser.yy.getActors();
    expect(Object.keys(actors)).toEqual(['Alice', 'Bob', 'John', 'Mandy', 'Joan']);
    expect(actors.Alice.description).toBe('Alice2');
    expect(actors.Alice.type).toBe('actor');
    expect(actors.Bob.description).toBe('Bob');
    expect(actors.John.type).toBe('participant');
    expect(actors.Joan.type).toBe('participant');

    const messages = parser.yy.getMessages();
    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[4].to).toBe('Joan');
  });
  it('it should alias actors apa13', function () {
    const str = `
sequenceDiagram
actor A as Alice
actor B as Bob
A->B:Hello Bob, how are you?
B-->A: I am good thanks!`;

    mermaidAPI.parse(str);

    const actors = parser.yy.getActors();
    expect(Object.keys(actors)).toEqual(['A', 'B']);
    expect(actors.A.description).toBe('Alice');
    expect(actors.B.description).toBe('Bob');

    const messages = parser.yy.getMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('A');
    expect(messages[1].from).toBe('B');
  });
  it('it should handle in async messages', function () {
    const str = `
sequenceDiagram
Alice-xBob:Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID_CROSS);
  });
  it('it should handle in async dotted messages', function () {
    const str = `
sequenceDiagram
Alice--xBob:Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED_CROSS);
  });
  it('it should handle in sync messages', function () {
    const str = `
sequenceDiagram
Alice-)Bob:Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID_POINT);
  });
  it('it should handle in sync dotted messages', function () {
    const str = `
sequenceDiagram
Alice--)Bob:Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED_POINT);
  });
  it('it should handle in arrow messages', function () {
    const str = `
sequenceDiagram
Alice->>Bob:Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID);
  });
  it('it should handle in arrow messages', function () {
    const str = 'sequenceDiagram\n' + 'Alice-->>Bob:Hello Bob, how are you?';

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
  });
  it('it should handle actor activation', function () {
    const str = `
sequenceDiagram
Alice-->>Bob:Hello Bob, how are you?
activate Bob
Bob-->>Alice:Hello Alice, I'm fine and  you?
deactivate Bob`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[3].from.actor).toBe('Bob');
  });
  it('it should handle actor one line notation activation', function () {
    const str = `
      sequenceDiagram
      Alice-->>+Bob:Hello Bob, how are you?
      Bob-->>- Alice:Hello Alice, I'm fine and  you?`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[3].from.actor).toBe('Bob');
  });
  it('it should handle stacked activations', function () {
    const str = `
      sequenceDiagram
      Alice-->>+Bob:Hello Bob, how are you?
      Bob-->>+Carol:Carol, let me introduce Alice?
      Bob-->>- Alice:Hello Alice, please meet Carol?
      Carol->>- Bob:Oh Bob, I'm so happy to be here!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(8);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[3].from.actor).toBe('Carol');
    expect(messages[5].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[5].from.actor).toBe('Bob');
    expect(messages[7].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[7].from.actor).toBe('Carol');
  });
  it('it should handle fail parsing when activating an inactive participant', function () {
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
      mermaidAPI.parse(str);
    } catch (e) {
      console.log(e.hash);
      error = true;
    }
    expect(error).toBe(true);
  });

  it('it should handle comments in a sequenceDiagram', function () {
    const str = `
      sequenceDiagram
      Alice->Bob: Hello Bob, how are you?
      %% Comment
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle new lines in a sequenceDiagram', function () {
    const str = `
      sequenceDiagram
      Alice->Bob: Hello Bob, how are you?

      %% Comment
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!
      `;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle semicolons', function () {
    const str = `
sequenceDiagram;Alice->Bob: Hello Bob, how are you?;Note right of Bob: Bob thinks;Bob-->Alice: I am good thanks!;`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle one leading space in lines in a sequenceDiagram', function () {
    const str = `
sequenceDiagram
 Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle several leading spaces in lines in a sequenceDiagram', function () {
    const str = `
sequenceDiagram
   Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle several leading spaces in lines in a sequenceDiagram', function () {
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

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(8);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('John');
  });
  it('it should handle different line breaks', function () {
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

    mermaidAPI.parse(str);

    const actors = parser.yy.getActors();
    expect(actors['1'].description).toBe('multiline<br>text');
    expect(actors['2'].description).toBe('multiline<br/>text');
    expect(actors['3'].description).toBe('multiline<br />text');
    expect(actors['4'].description).toBe('multiline<br \t/>text');

    const messages = parser.yy.getMessages();
    expect(messages[0].message).toBe('multiline<br>text');
    expect(messages[1].message).toBe('multiline<br>text');
    expect(messages[2].message).toBe('multiline<br/>text');
    expect(messages[3].message).toBe('multiline<br/>text');
    expect(messages[4].message).toBe('multiline<br />text');
    expect(messages[5].message).toBe('multiline<br />text');
    expect(messages[6].message).toBe('multiline<br \t/>text');
    expect(messages[7].message).toBe('multiline<br \t/>text');
  });
  it('it should handle notes and messages without wrap specified', function () {
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

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
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
  it('it should handle notes and messages with wrap specified', function () {
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

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[0].message).toBe('single-line text');
    expect(messages[1].message).toBe('single-line text');
    expect(messages[2].message).toBe('multiline<br/>text');
    expect(messages[3].message).toBe('multiline<br/>text');
    expect(messages[0].wrap).toBe(true);
    expect(messages[1].wrap).toBe(true);
    expect(messages[2].wrap).toBe(true);
    expect(messages[3].wrap).toBe(true);
  });
  it('it should handle notes and messages with nowrap or line breaks', function () {
    const str = `
sequenceDiagram
participant 1
participant 2
1->>2: single-line text
note right of 2: single-line text
`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[0].message).toBe('single-line text');
    expect(messages[1].message).toBe('single-line text');
    expect(messages[0].wrap).toBe(false);
    expect(messages[1].wrap).toBe(false);
  });
  it('it should handle notes over a single actor', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Bob: Bob thinks
`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].from).toBe('Bob');
    expect(messages[1].to).toBe('Bob');
  });
  it('it should handle notes over multiple actors', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Alice,Bob: confusion
Note over Bob,Alice: resolution
`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].from).toBe('Alice');
    expect(messages[1].to).toBe('Bob');
    expect(messages[2].from).toBe('Bob');
    expect(messages[2].to).toBe('Alice');
  });
  it('it should handle loop statements', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
loop Multiple happy responses

Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should add a rect around sequence', function () {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, how are you?
        %% Comment
        rect rgb(200, 255, 200)
        Note right of Bob: Bob thinks
        Bob-->Alice: I am good thanks
        end
    `;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();
    expect(messages[1].type).toEqual(parser.yy.LINETYPE.RECT_START);
    expect(messages[1].message).toBe('rgb(200, 255, 200)');
    expect(messages[2].type).toEqual(parser.yy.LINETYPE.NOTE);
    expect(messages[3].type).toEqual(parser.yy.LINETYPE.DOTTED_OPEN);
    expect(messages[4].type).toEqual(parser.yy.LINETYPE.RECT_END);
  });

  it('it should allow for nested rects', function () {
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
    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();
    expect(messages[1].type).toEqual(parser.yy.LINETYPE.RECT_START);
    expect(messages[1].message).toBe('rgb(200, 255, 200)');
    expect(messages[2].type).toEqual(parser.yy.LINETYPE.RECT_START);
    expect(messages[2].message).toBe('rgb(0, 0, 0)');
    expect(messages[3].type).toEqual(parser.yy.LINETYPE.NOTE);
    expect(messages[4].type).toEqual(parser.yy.LINETYPE.RECT_END);
    expect(messages[5].type).toEqual(parser.yy.LINETYPE.DOTTED_OPEN);
    expect(messages[6].type).toEqual(parser.yy.LINETYPE.RECT_END);
  });
  it('it should handle opt statements', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
opt Perhaps a happy response

Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should handle alt statements', function () {
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

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();

    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(7);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should handle alt statements with multiple elses', function () {
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
    mermaidAPI.parse(str);
    const messages = parser.yy.getMessages();
    expect(messages.length).toBe(9);
    expect(messages[1].from).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.ALT_START);
    expect(messages[3].from).toBe('Bob');
    expect(messages[4].type).toBe(parser.yy.LINETYPE.ALT_ELSE);
    expect(messages[5].from).toBe('Bob');
    expect(messages[6].type).toBe(parser.yy.LINETYPE.ALT_ELSE);
    expect(messages[7].from).toBe('Bob');
    expect(messages[8].type).toBe(parser.yy.LINETYPE.ALT_END);
  });
  it('it should handle par statements a sequenceDiagram', function () {
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

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();

    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(10);
    expect(messages[0].message).toBe('Parallel one');
    expect(messages[1].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle special characters in signals', function () {
    const str = 'sequenceDiagram\n' + 'Alice->Bob: -:<>,;# comment';

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[0].message).toBe('-:<>,');
  });
  it('it should handle special characters in notes', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note right of Bob: -:<>,;# comment`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('it should handle special characters in loop', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop -:<>,;# comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('it should handle special characters in opt', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
opt -:<>,;# comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('it should handle special characters in alt', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
alt -:<>,;# comment
Bob-->Alice: I am good thanks!
else ,<>:-#; comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
    expect(messages[3].message).toBe(',<>:-');
  });
  it('it should handle special characters in par', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
par -:<>,;# comment
Bob-->Alice: I am good thanks!
and ,<>:-#; comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
    expect(messages[3].message).toBe(',<>:-');
  });
  it('it should handle no-label loop', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
  });
  it('it should handle no-label opt', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
opt # comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
  });
  it('it should handle no-label alt', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
alt;Bob-->Alice: I am good thanks!
else # comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
    expect(messages[3].message).toBe('');
    expect(messages[4].message).toBe('I am good thanks!');
  });
  it('it should handle no-label par', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
par;Bob-->Alice: I am good thanks!
and # comment
Bob-->Alice: I am good thanks!
end`;

    mermaidAPI.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
    expect(messages[3].message).toBe('');
    expect(messages[4].message).toBe('I am good thanks!');
  });

  it('it should handle links', function () {
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
    console.log(str);

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
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

  it('it should handle properties EXPERIMENTAL: USE WITH CAUTION', function () {
    //Be aware that the syntax for "properties" is likely to be changed.
    const str = `
sequenceDiagram
participant a as Alice
participant b as Bob
participant c as Charlie
properties a: {"class": "internal-service-actor", "icon": "@clock"}
properties b: {"class": "external-service-actor", "icon": "@computer"}
`;
    console.log(str);

    mermaidAPI.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.a.properties['class']).toBe('internal-service-actor');
    expect(actors.b.properties['class']).toBe('external-service-actor');
    expect(actors.a.properties['icon']).toBe('@clock');
    expect(actors.b.properties['icon']).toBe('@computer');
    expect(actors.c.properties['class']).toBe(undefined);
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
    parser.yy = sequenceDb;
    parser.yy.clear();
    renderer.bounds.init();
    conf = parser.yy.getConfig();
  });
  it('it should handle a simple bound call', function () {
    renderer.bounds.insert(100, 100, 200, 200);

    const { bounds } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(100);
    expect(bounds.starty).toBe(100);
    expect(bounds.stopx).toBe(200);
    expect(bounds.stopy).toBe(200);
  });
  it('it should handle an expanding bound', function () {
    renderer.bounds.insert(100, 100, 200, 200);
    renderer.bounds.insert(25, 50, 300, 400);

    const { bounds } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('it should handle inserts within the bound without changing the outer bounds', function () {
    renderer.bounds.insert(100, 100, 200, 200);
    renderer.bounds.insert(25, 50, 300, 400);
    renderer.bounds.insert(125, 150, 150, 200);

    const { bounds } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('it should handle a loop without expanding the area', function () {
    renderer.bounds.insert(25, 50, 300, 400);
    renderer.bounds.verticalPos = 150;
    renderer.bounds.newLoop();
    renderer.bounds.insert(125, 150, 150, 200);

    const loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(125 - conf.boxMargin);
    expect(loop.starty).toBe(150 - conf.boxMargin);
    expect(loop.stopx).toBe(150 + conf.boxMargin);
    expect(loop.stopy).toBe(200 + conf.boxMargin);

    // Check bounds of first loop
    const { bounds } = renderer.bounds.getBounds();

    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('it should handle multiple loops withtout expanding the bounds', function () {
    renderer.bounds.insert(100, 100, 1000, 1000);
    renderer.bounds.verticalPos = 200;
    renderer.bounds.newLoop();
    renderer.bounds.newLoop();
    renderer.bounds.insert(200, 200, 300, 300);

    // Check bounds of first loop
    let loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(200 - conf.boxMargin);
    expect(loop.starty).toBe(200 - conf.boxMargin);
    expect(loop.stopx).toBe(300 + conf.boxMargin);
    expect(loop.stopy).toBe(300 + conf.boxMargin);

    // Check bounds of second loop
    loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(200 - 2 * conf.boxMargin);
    expect(loop.starty).toBe(200 - 2 * conf.boxMargin);
    expect(loop.stopx).toBe(300 + 2 * conf.boxMargin);
    expect(loop.stopy).toBe(300 + 2 * conf.boxMargin);

    // Check bounds of first loop
    const { bounds } = renderer.bounds.getBounds();

    expect(bounds.startx).toBe(100);
    expect(bounds.starty).toBe(100);
    expect(bounds.stopx).toBe(1000);
    expect(bounds.stopy).toBe(1000);
  });
  it('it should handle a loop that expands the area', function () {
    renderer.bounds.insert(100, 100, 200, 200);
    renderer.bounds.verticalPos = 200;
    renderer.bounds.newLoop();
    renderer.bounds.insert(50, 50, 300, 300);

    const loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(50 - conf.boxMargin);
    expect(loop.starty).toBe(50 - conf.boxMargin);
    expect(loop.stopx).toBe(300 + conf.boxMargin);
    expect(loop.stopy).toBe(300 + conf.boxMargin);

    // Check bounds after the loop
    const { bounds } = renderer.bounds.getBounds();

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
    parser.yy = sequenceDb;
    parser.yy.clear();
    // conf = parser.yy.getConfig();
  });
  ['tspan', 'fo', 'old', undefined].forEach(function (textPlacement) {
    it(`
it should handle one actor, when textPlacement is ${textPlacement}`, function () {
      const str = `
sequenceDiagram
participant Alice`;

      mermaidAPI.reinitialize({ sequence: { textPlacement: textPlacement } });
      mermaidAPI.parse(str);
      // renderer.setConf(mermaidAPI.getConfig().sequence);
      renderer.draw(str, 'tst');

      const { bounds } = renderer.bounds.getBounds();
      expect(bounds.startx).toBe(0);
      expect(bounds.starty).toBe(0);
      expect(bounds.stopx).toBe(conf.width);
      expect(bounds.stopy).toBe(conf.height);
    });
  });
  it('it should handle same actor with different whitespace properly', function () {
    const str = `
sequenceDiagram
participant Alice
participant Alice
participant Alice
`;

    mermaidAPI.parse(str);

    const actors = parser.yy.getActors();
    expect(Object.keys(actors)).toEqual(['Alice']);
  });
  it('it should handle one actor and a centered note', function () {
    const str = `
sequenceDiagram
participant Alice
Note over Alice: Alice thinks
`;

    expect(mermaidAPI.getConfig().sequence.mirrorActors).toBeFalsy();
    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('it should handle one actor and a note to the left', function () {
    const str = `
sequenceDiagram
participant Alice
Note left of Alice: Alice thinks`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('it should handle one actor and a note to the right', function () {
    const str = `
sequenceDiagram
participant Alice
Note right of Alice: Alice thinks`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width / 2 + conf.actorMargin / 2 + conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('it should handle two actors', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should handle two actors with init directive', function () {
    const str = `
%%{init: {'logLevel': 0}}%%
sequenceDiagram
Alice->Bob: Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should handle two actors with init directive with multiline directive', function () {
    const str = `
%%{init: { 'logLevel': 0}}%%
sequenceDiagram
%%{
wrap
}%%
Alice->Bob: Hello Bob, how are you?`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const msgs = parser.yy.getMessages();
    const { bounds, models } = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
    expect(msgs.every((v) => v.wrap)).toBe(true);
  });
  it('it should handle two actors and two centered shared notes', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Alice,Bob: Looks
Note over Bob,Alice: Looks back
`;
    // mermaidAPI.initialize({logLevel:0})
    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastNote().stopy);
  });
  it('it should draw two actors and two messages', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Bob->Alice: Fine!`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should draw two actors notes to the right', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob->Alice: Fine!`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    const expStopX = conf.actorMargin + conf.width + conf.width / 2 + conf.noteMargin + conf.width;

    expect(bounds.stopx).toBe(expStopX);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should draw two actors notes to the left', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note left of Alice: Bob thinks
Bob->Alice: Fine!`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should draw two actors notes to the left with text wrapped (inline)', function () {
    const str = `
sequenceDiagram
Alice->>Bob:wrap: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(msgs[0].wrap).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should draw two actors notes to the left with text wrapped (directive)', function () {
    const str = `
%%{init: { 'theme': 'dark' } }%%
sequenceDiagram
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(msgs.every((v) => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should draw two actors notes to the left with text wrapped and the init directive sets the theme to dark', function () {
    const str = `
%%{init:{'theme':'dark'}}%%
sequenceDiagram
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(msgs.every((v) => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastMessage().stopy + 10);
  });
  it('it should draw two actors, notes to the left with text wrapped and the init directive sets the theme to dark and fontFamily to Menlo, fontSize to 18, and fontWeight to 800', function () {
    const str = `
    %%{init: { "theme": "dark", 'config': { "fontFamily": "Menlo", "fontSize": 18, "messageFontWeight": 400, "wrap": true }}}%%
sequenceDiagram
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;
    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
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
  it('it should draw two loops', function () {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop Cheers
Bob->Alice: Fine!
end`;
    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastLoop().stopy);
  });
  it('it should draw background rect', function () {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, are you alright?
        rect rgb(0, 0, 0)
          Bob->Alice: I feel surrounded by darkness
        end
    `;
    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');
    const { bounds, models } = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(models.lastLoop().stopy);
  });
});

describe('when rendering a sequenceDiagram with actor mirror activated', function () {
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
    parser.yy = sequenceDb;
    parser.yy.clear();
    conf = parser.yy.getConfig();
    renderer.bounds.init();
  });
  ['tspan', 'fo', 'old', undefined].forEach(function (textPlacement) {
    it('it should handle one actor, when textPlacement is' + textPlacement, function () {
      mermaidAPI.initialize(addConf(conf, 'textPlacement', textPlacement));
      renderer.bounds.init();
      const str = `
sequenceDiagram
participant Alice`;
      renderer.bounds.init();
      mermaidAPI.parse(str);
      renderer.draw(str, 'tst');

      const { bounds, models } = renderer.bounds.getBounds();
      expect(bounds.startx).toBe(0);
      expect(bounds.starty).toBe(0);
      expect(bounds.stopx).toBe(conf.width);
      expect(bounds.stopy).toBe(models.lastActor().y + models.lastActor().height + conf.boxMargin);
    });
  });
});

describe('when rendering a sequenceDiagram with directives', function () {
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
    parser.yy = sequenceDb;
    parser.yy.clear();
    conf = parser.yy.getConfig();
    renderer.bounds.init();
  });

  it('it should handle one actor, when theme is dark and logLevel is 1 DX1', function () {
    const str = `
%%{init: { "theme": "dark", "logLevel": 1 } }%%
sequenceDiagram
%%{wrap}%%
participant Alice
`;

    renderer.bounds.init();
    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.theme).toBe('dark');
    expect(mermaid.logLevel).toBe(1);
    expect(bounds.startx).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopy).toBe(
      models.lastActor().y + models.lastActor().height + mermaid.sequence.boxMargin
    );
  });
  it('it should handle one actor, when logLevel is 3', function () {
    const str = `
%%{initialize: { "logLevel": 3 }}%%
sequenceDiagram
participant Alice
`;

    mermaidAPI.parse(str);
    renderer.draw(str, 'tst');

    const { bounds, models } = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(3);
    expect(bounds.startx).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopy).toBe(
      models.lastActor().y + models.lastActor().height + mermaid.sequence.boxMargin
    );
  });
  it('it should hide sequence numbers when autonumber is removed when autonumber is enabled', function () {
    const str1 = `
sequenceDiagram
autonumber
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str1);
    expect(parser.yy.showSequenceNumbers()).toBe(true);

    const str2 = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    mermaidAPI.parse(str2);
    expect(parser.yy.showSequenceNumbers()).toBe(false);
  });
});
