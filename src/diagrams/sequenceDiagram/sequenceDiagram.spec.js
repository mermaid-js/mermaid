/* eslint-env jasmine */
import { parser } from './parser/sequenceDiagram'
import sequenceDb from './sequenceDb'
import MyModuleInjector from 'inject-loader!./sequenceRenderer' // eslint-disable-line import/no-webpack-loader-syntax

let NewD3

const d3 = {
  select: function () {
    return new NewD3()
  },
  selectAll: function () {
    return new NewD3()
  }
}

const renderer = MyModuleInjector({
  '../../d3': d3
})

function addConf (conf, key, value) {
  if (value !== undefined) {
    conf[key] = value
  }
  return conf
}

describe('when parsing a sequenceDiagram', function () {
  beforeEach(function () {
    parser.yy = sequenceDb
    parser.yy.clear()
  })
  it('it should handle a sequenceDiagram defintion', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob:Hello Bob, how are you?\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob-->Alice: I am good thanks!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle a sequenceDiagram definition with a title', function () {
    const str = 'sequenceDiagram\n' +
      'title: Diagram Title\n' +
      'Alice->Bob:Hello Bob, how are you?\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob-->Alice: I am good thanks!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()
    const title = parser.yy.getTitle()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
    expect(title).toBe('Diagram Title')
  })
  it('it should space in actor names', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob:Hello Bob, how are - you?\n' +
      'Bob-->Alice: I am good thanks!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(2)
    expect(messages[0].from).toBe('Alice')
    expect(messages[1].from).toBe('Bob')
  })
  it('it should alias participants', function () {
    const str = 'sequenceDiagram\n' +
      'participant A as Alice\n' +
      'participant B as Bob\n' +
      'A->B:Hello Bob, how are you?\n' +
      'B-->A: I am good thanks!'

    parser.parse(str)

    const actors = parser.yy.getActors()
    expect(Object.keys(actors)).toEqual(['A', 'B'])
    expect(actors.A.description).toBe('Alice')
    expect(actors.B.description).toBe('Bob')

    const messages = parser.yy.getMessages()
    expect(messages.length).toBe(2)
    expect(messages[0].from).toBe('A')
    expect(messages[1].from).toBe('B')
  })
  it('it should handle in async messages', function () {
    const str = 'sequenceDiagram\n' +
      'Alice-xBob:Hello Bob, how are you?'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(1)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID_CROSS)
  })
  it('it should handle in async dotted messages', function () {
    const str = 'sequenceDiagram\n' +
      'Alice--xBob:Hello Bob, how are you?'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(1)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED_CROSS)
  })
  it('it should handle in arrow messages', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->>Bob:Hello Bob, how are you?'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(1)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID)
  })
  it('it should handle in arrow messages', function () {
    const str = 'sequenceDiagram\n' +
      'Alice-->>Bob:Hello Bob, how are you?'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(1)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED)
  })
  it('it should handle actor activation', function () {
    const str = 'sequenceDiagram\n' +
      'Alice-->>Bob:Hello Bob, how are you?\n' +
      'activate Bob\n' +
      'Bob-->>Alice:Hello Alice, I\'m fine and  you?\n' +
      'deactivate Bob'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(4)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED)
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START)
    expect(messages[1].from.actor).toBe('Bob')
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED)
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_END)
    expect(messages[3].from.actor).toBe('Bob')
  })
  it('it should handle actor one line notation activation', function () {
    const str = 'sequenceDiagram\n' +
      'Alice-->>+Bob:Hello Bob, how are you?\n' +
      'Bob-->>- Alice:Hello Alice, I\'m fine and  you?'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(4)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED)
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START)
    expect(messages[1].from.actor).toBe('Bob')
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED)
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_END)
    expect(messages[3].from.actor).toBe('Bob')
  })
  it('it should handle stacked activations', function () {
    const str = 'sequenceDiagram\n' +
      'Alice-->>+Bob:Hello Bob, how are you?\n' +
      'Bob-->>+Carol:Carol, let me introduce Alice?\n' +
      'Bob-->>- Alice:Hello Alice, please meet Carol?\n' +
      'Carol->>- Bob:Oh Bob, I\'m so happy to be here!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(8)
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED)
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START)
    expect(messages[1].from.actor).toBe('Bob')
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED)
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_START)
    expect(messages[3].from.actor).toBe('Carol')
    expect(messages[5].type).toBe(parser.yy.LINETYPE.ACTIVE_END)
    expect(messages[5].from.actor).toBe('Bob')
    expect(messages[7].type).toBe(parser.yy.LINETYPE.ACTIVE_END)
    expect(messages[7].from.actor).toBe('Carol')
  })
  it('it should handle comments in a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob-->Alice: I am good thanks!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle new lines in a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob-->Alice: I am good thanks!\n'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle semicolons', function () {
    const str = 'sequenceDiagram;' +
      'Alice->Bob: Hello Bob, how are you?;' +
      'Note right of Bob: Bob thinks;' +
      'Bob-->Alice: I am good thanks!;'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle one leading space in lines in a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      ' Alice->Bob: Hello Bob, how are you?\n\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob-->Alice: I am good thanks!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle several leading spaces in lines in a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      '   Alice->Bob: Hello Bob, how are you?\n\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob-->Alice: I am good thanks!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(3)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle several leading spaces in lines in a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'participant Alice\n' +
      'participant Bob\n' +
      'Alice->John: Hello John, how are you?\n' +
      '    loop Healthcheck\n' +
      'John->John: Fight against hypochondria\n' +
      ' end\n' +
      'Note right of John: Rational thoughts<br/>prevail...\n' +
      '    John-->Alice: Great!\n' +
      '    John->Bob: How about you?\n' +
      'Bob-->John: Jolly good!'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(8)
    expect(messages[0].from).toBe('Alice')
    expect(messages[2].from).toBe('John')
  })
  it('it should handle notes over a single actor', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Note over Bob: Bob thinks\n'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].from).toBe('Bob')
    expect(messages[1].to).toBe('Bob')
  })
  it('it should handle notes over multiple actors', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Note over Alice,Bob: confusion\n' +
      'Note over Bob,Alice: resolution\n'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].from).toBe('Alice')
    expect(messages[1].to).toBe('Bob')
    expect(messages[2].from).toBe('Bob')
    expect(messages[2].to).toBe('Alice')
  })
  it('it should handle loop statements a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'loop Multiple happy responses\n\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(5)
    expect(messages[0].from).toBe('Alice')
    expect(messages[1].from).toBe('Bob')
  })
  it('it should handle opt statements a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'opt Perhaps a happy response\n\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)
    const actors = parser.yy.getActors()
    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(5)
    expect(messages[0].from).toBe('Alice')
    expect(messages[1].from).toBe('Bob')
  })
  it('it should handle alt statements a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n\n' +
      '%% Comment\n' +
      'Note right of Bob: Bob thinks\n' +
      'alt isWell\n\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'else isSick\n' +
      'Bob-->Alice: Feel sick...\n' +
      'end'

    parser.parse(str)
    const actors = parser.yy.getActors()

    expect(actors.Alice.description).toBe('Alice')
    actors.Bob.description = 'Bob'

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(7)
    expect(messages[0].from).toBe('Alice')
    expect(messages[1].from).toBe('Bob')
  })
  it('it should handle par statements a sequenceDiagram', function () {
    const str = 'sequenceDiagram\n' +
      'par Parallel one\n' +
      'Alice->>Bob: Hello Bob, how are you?\n' +
      'Bob-->>Alice: I am good thanks!\n' +
      'and Parallel two\n' +
      'Alice->>Bob: Are you OK?\n' +
      'Bob-->>Alice: Fine!\n' +
      'and Parallel three\n' +
      'Alice->>Bob: What do you think about it?\n' +
      'Bob-->>Alice: It\'s good!\n' +
      'end'

    parser.parse(str)
    const actors = parser.yy.getActors()

    expect(actors.Alice.description).toBe('Alice')
    expect(actors.Bob.description).toBe('Bob')

    const messages = parser.yy.getMessages()

    expect(messages.length).toBe(10)
    expect(messages[0].message).toBe('Parallel one')
    expect(messages[1].from).toBe('Alice')
    expect(messages[2].from).toBe('Bob')
  })
  it('it should handle special characters in signals', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: -:<>,;# comment'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[0].message).toBe('-:<>,')
  })
  it('it should handle special characters in notes', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Note right of Bob: -:<>,;# comment'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('-:<>,')
  })
  it('it should handle special characters in loop', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'loop -:<>,;# comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('-:<>,')
  })
  it('it should handle special characters in opt', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'opt -:<>,;# comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('-:<>,')
  })
  it('it should handle special characters in alt', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'alt -:<>,;# comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'else ,<>:-#; comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('-:<>,')
    expect(messages[3].message).toBe(',<>:-')
  })
  it('it should handle special characters in par', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'par -:<>,;# comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'and ,<>:-#; comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('-:<>,')
    expect(messages[3].message).toBe(',<>:-')
  })
  it('it should handle no-label loop', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'loop\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('')
    expect(messages[2].message).toBe('I am good thanks!')
  })
  it('it should handle no-label opt', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'opt # comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('')
    expect(messages[2].message).toBe('I am good thanks!')
  })
  it('it should handle no-label alt', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'alt;' +
      'Bob-->Alice: I am good thanks!\n' +
      'else # comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('')
    expect(messages[2].message).toBe('I am good thanks!')
    expect(messages[3].message).toBe('')
    expect(messages[4].message).toBe('I am good thanks!')
  })
  it('it should handle no-label par', function () {
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'par;' +
      'Bob-->Alice: I am good thanks!\n' +
      'and # comment\n' +
      'Bob-->Alice: I am good thanks!\n' +
      'end'

    parser.parse(str)

    const messages = parser.yy.getMessages()
    expect(messages[1].message).toBe('')
    expect(messages[2].message).toBe('I am good thanks!')
    expect(messages[3].message).toBe('')
    expect(messages[4].message).toBe('I am good thanks!')
  })
})

describe('when checking the bounds in a sequenceDiagram', function () {
  let conf
  beforeEach(function () {
    parser.yy = sequenceDb
    parser.yy.clear()
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
      noteMargin: 25
    }
    renderer.setConf(conf)
  })
  it('it should handle a simple bound call', function () {
    renderer.bounds.init()

    renderer.bounds.insert(100, 100, 200, 200)

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(100)
    expect(bounds.starty).toBe(100)
    expect(bounds.stopx).toBe(200)
    expect(bounds.stopy).toBe(200)
  })
  it('it should handle an expanding bound', function () {
    renderer.bounds.init()

    renderer.bounds.insert(100, 100, 200, 200)
    renderer.bounds.insert(25, 50, 300, 400)

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(25)
    expect(bounds.starty).toBe(50)
    expect(bounds.stopx).toBe(300)
    expect(bounds.stopy).toBe(400)
  })
  it('it should handle inserts within the bound without changing the outer bounds', function () {
    renderer.bounds.init()

    renderer.bounds.insert(100, 100, 200, 200)
    renderer.bounds.insert(25, 50, 300, 400)
    renderer.bounds.insert(125, 150, 150, 200)

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(25)
    expect(bounds.starty).toBe(50)
    expect(bounds.stopx).toBe(300)
    expect(bounds.stopy).toBe(400)
  })
  it('it should handle a loop without expanding the area', function () {
    renderer.bounds.init()

    renderer.bounds.insert(25, 50, 300, 400)
    renderer.bounds.verticalPos = 150
    renderer.bounds.newLoop()
    renderer.bounds.insert(125, 150, 150, 200)

    const loop = renderer.bounds.endLoop()

    expect(loop.startx).toBe(125 - conf.boxMargin)
    expect(loop.starty).toBe(150 - conf.boxMargin)
    expect(loop.stopx).toBe(150 + conf.boxMargin)
    expect(loop.stopy).toBe(200 + conf.boxMargin)

    // Check bounds of first loop
    const bounds = renderer.bounds.getBounds()

    expect(bounds.startx).toBe(25)
    expect(bounds.starty).toBe(50)
    expect(bounds.stopx).toBe(300)
    expect(bounds.stopy).toBe(400)
  })
  it('it should handle multiple loops withtout expanding the bounds', function () {
    renderer.bounds.init()

    renderer.bounds.insert(100, 100, 1000, 1000)
    renderer.bounds.verticalPos = 200
    renderer.bounds.newLoop()
    renderer.bounds.newLoop()
    renderer.bounds.insert(200, 200, 300, 300)

    // Check bounds of first loop
    let loop = renderer.bounds.endLoop()

    expect(loop.startx).toBe(200 - conf.boxMargin)
    expect(loop.starty).toBe(200 - conf.boxMargin)
    expect(loop.stopx).toBe(300 + conf.boxMargin)
    expect(loop.stopy).toBe(300 + conf.boxMargin)

    // Check bounds of second loop
    loop = renderer.bounds.endLoop()

    expect(loop.startx).toBe(200 - 2 * conf.boxMargin)
    expect(loop.starty).toBe(200 - 2 * conf.boxMargin)
    expect(loop.stopx).toBe(300 + 2 * conf.boxMargin)
    expect(loop.stopy).toBe(300 + 2 * conf.boxMargin)

    // Check bounds of first loop
    const bounds = renderer.bounds.getBounds()

    expect(bounds.startx).toBe(100)
    expect(bounds.starty).toBe(100)
    expect(bounds.stopx).toBe(1000)
    expect(bounds.stopy).toBe(1000)
  })
  it('it should handle a loop that expands the area', function () {
    renderer.bounds.init()

    renderer.bounds.insert(100, 100, 200, 200)
    renderer.bounds.verticalPos = 200
    renderer.bounds.newLoop()
    renderer.bounds.insert(50, 50, 300, 300)

    const loop = renderer.bounds.endLoop()

    expect(loop.startx).toBe(50 - conf.boxMargin)
    expect(loop.starty).toBe(50 - conf.boxMargin)
    expect(loop.stopx).toBe(300 + conf.boxMargin)
    expect(loop.stopy).toBe(300 + conf.boxMargin)

    // Check bounds after the loop
    const bounds = renderer.bounds.getBounds()

    expect(bounds.startx).toBe(loop.startx)
    expect(bounds.starty).toBe(loop.starty)
    expect(bounds.stopx).toBe(loop.stopx)
    expect(bounds.stopy).toBe(loop.stopy)
  })
})

describe('when rendering a sequenceDiagram', function () {
  let conf
  beforeEach(function () {
    parser.yy = sequenceDb
    parser.yy.clear()

    delete global.mermaid_config

    NewD3 = function () {
      const o = {
        append: function () {
          return NewD3()
        },
        attr: function () {
          return this
        },
        style: function () {
          return this
        },
        text: function () {
          return this
        },
        0: {
          0: {
            getBBox: function () {
              return {
                height: 10,
                width: 20
              }
            }
          }

        }
      }

      return o
    }

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
      noteMargin: 25
    }
    renderer.setConf(conf)
  });
  ['tspan', 'fo', 'old', undefined].forEach(function (textPlacement) {
    it('it should handle one actor, when textPlacement is ' + textPlacement, function () {
      renderer.setConf(addConf(conf, 'textPlacement', textPlacement))
      renderer.bounds.init()
      const str = 'sequenceDiagram\n' +
        'participant Alice'

      parser.parse(str)
      renderer.draw(str, 'tst')

      const bounds = renderer.bounds.getBounds()
      expect(bounds.startx).toBe(0)
      expect(bounds.starty).toBe(0)
      expect(bounds.stopx).toBe(conf.width)
      expect(bounds.stopy).toBe(conf.height)
    })
  })
  it('it should handle one actor and a centered note', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'participant Alice\n' +
      'Note over Alice: Alice thinks\n'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)
    expect(bounds.stopx).toBe(conf.width)
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(conf.height + conf.boxMargin + 2 * conf.noteMargin + 10)
  })
  it('it should handle one actor and a note to the left', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'participant Alice\n' +
      'Note left of Alice: Alice thinks'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(-(conf.width / 2) - (conf.actorMargin / 2))
    expect(bounds.starty).toBe(0)
    expect(bounds.stopx).toBe(conf.width)
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(conf.height + conf.boxMargin + 2 * conf.noteMargin + 10)
  })
  it('it should handle one actor and a note to the right', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'participant Alice\n' +
      'Note right of Alice: Alice thinks'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)
    expect(bounds.stopx).toBe((conf.width / 2) + (conf.actorMargin / 2) + conf.width)
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(conf.height + conf.boxMargin + 2 * conf.noteMargin + 10)
  })
  it('it should handle two actors', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin)
    expect(bounds.stopy).toBe(0 + conf.messageMargin + conf.height)
  })
  it('it should handle two actors and two centered shared notes', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Note over Alice,Bob: Looks\n' +
      'Note over Bob,Alice: Looks back\n'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin)
    expect(bounds.stopy).toBe(conf.height + conf.messageMargin + 2 * (conf.boxMargin + 2 * conf.noteMargin + 10))
  })
  it('it should draw two actors and two messages', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Bob->Alice: Fine!'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)
    expect(bounds.stopx).toBe(0 + conf.width * 2 + conf.actorMargin)
    expect(bounds.stopy).toBe(0 + 2 * conf.messageMargin + conf.height)
  })
  it('it should draw two actors notes to the right', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Note right of Bob: Bob thinks\n' +
      'Bob->Alice: Fine!'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)

    const expStopX = conf.actorMargin + conf.width + (conf.width / 2) + conf.noteMargin + conf.width

    expect(bounds.stopx).toBe(expStopX)
    expect(bounds.stopy).toBe(2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin)
  })
  it('it should draw two actors notes to the left', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'Note left of Alice: Bob thinks\n' +
      'Bob->Alice: Fine!'

    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(-(conf.width / 2) - (conf.actorMargin / 2))
    expect(bounds.starty).toBe(0)

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin)
    expect(bounds.stopy).toBe(2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin)
  })
  it('it should draw two loops', function () {
    renderer.bounds.init()
    const str = 'sequenceDiagram\n' +
      'Alice->Bob: Hello Bob, how are you?\n' +
      'loop Cheers\n' +
      'Bob->Alice: Fine!\n' +
      'end'
    parser.parse(str)
    renderer.draw(str, 'tst')

    const bounds = renderer.bounds.getBounds()
    expect(bounds.startx).toBe(0)
    expect(bounds.starty).toBe(0)

    expect(bounds.stopx).toBe(0 + conf.width * 2 + conf.actorMargin)
    expect(bounds.stopy).toBe(0 + 2 * conf.messageMargin + conf.height + 3 * conf.boxMargin + conf.boxTextMargin)
  })
})

describe('when rendering a sequenceDiagram with actor mirror activated', function () {
  let conf
  beforeEach(function () {
    parser.yy = sequenceDb
    parser.yy.clear()

    NewD3 = function () {
      const o = {
        append: function () {
          return NewD3()
        },
        attr: function () {
          return this
        },
        style: function () {
          return this
        },
        text: function () {
          return this
        },
        0: {
          0: {
            getBBox: function () {
              return {
                height: 10,
                width: 20
              }
            }
          }

        }
      }

      return o
    }

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
      mirrorActors: true,
      // Depending on css styling this might need adjustment
      // Prolongs the edge of the diagram downwards
      bottomMarginAdj: 1
    }
    renderer.setConf(conf)
  });
  ['tspan', 'fo', 'old', undefined].forEach(function (textPlacement) {
    it('it should handle one actor, when textPlacement is' + textPlacement, function () {
      renderer.setConf(addConf(conf, 'textPlacement', textPlacement))
      renderer.bounds.init()
      const str = 'sequenceDiagram\n' +
        'participant Alice'

      parser.parse(str)
      renderer.draw(str, 'tst')

      const bounds = renderer.bounds.getBounds()
      expect(bounds.startx).toBe(0)
      expect(bounds.starty).toBe(0)
      expect(bounds.stopx).toBe(conf.width)
      expect(bounds.stopy).toBe(2 * conf.height + 2 * conf.boxMargin)
    })
  })
})
