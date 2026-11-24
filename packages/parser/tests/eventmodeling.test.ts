import { describe, expect, it, assert } from 'vitest';
import { eventModelingParse as parse } from './test-util.js';
import {
  EventModelingValidator,
  registerValidationChecks,
} from '../src/language/eventmodeling/event-modeling-validator.js';
import type { EventModelingServices } from '../src/language/eventmodeling/module.js';
import type { EmModelEntityType, EmTimeFrame } from '../src/language/generated/ast.js';

describe('Parse Event Model', () => {
  it('should parse complex model', () => {
    const result = parse(`eventmodeling
tf 01 cmd UpdateCartCommand
tf 02 evt CartUpdatedEvent ->> 01 \`jsobj\`{ a: b }
tf 03 rmo CartItemsReadModel ->> 02 [[CartItemsReadModel03]]
tf 04 evt ProductDescriptionUpdatedEvent ->> 01 \`jsobj\`{ a: { c: d } }
tf 05 evt ProductTitleUpdatedEvent ->> 01 { "a": { "c": true } }
tf 06 evt ProductCountIncrementedEvent ->> 01 \`json\`" { "a": { "c": true } } "

data CartItemsReadModel03 {
  { a: b }
}

data NotAssignedData02 \`jsobj\` {
  { a: {
    d: true
  }}
}

data AnotherNotAssignedData06 {
  a: 'abc'
}

note 02 \`md\` {
    # head 1
    this is markdown note
}

note 05 {
  This is whatever <b>you</b> want
  On multiple lines
}

gwt 01
  given
    evt CartUpdatedEvent
    evt CartUpdatedEvent
  when
    evt ProductDescriptionUpdatedEvent
    evt ProductTitleUpdatedEvent
  then
    evt ProductTitleUpdatedEvent


gwt 03
  given
    evt CartUpdatedEvent
    evt ProductTitleUpdatedEvent
  then
    evt ProductTitleUpdatedEvent
    evt CartUpdatedEvent
`);
    // console.error('Eventmodeling', result.value);
    assert(
      result.lexerErrors.length === 0,
      `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
    );
    expect(result.value.frames.length).toBe(6);
    expect(result.value.dataEntities.length).toBe(3);
    expect(result.value.noteEntities.length).toBe(2);
    expect(result.value.gwtEntities.length).toBe(2);
  });

  it('should parse simple model with full syntax', () => {
    const result = parse(`eventmodeling
timeframe 01 event Start

  `);
    // console.error('Eventmodeling', result.value);
    assert(
      result.lexerErrors.length === 0,
      `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
    );
    expect(result.value.frames.length).toBe(1);
    const frame = result.value.frames[0];
    expect(frame.name).toBe('01');
    expect(frame.modelEntityType).toBe('event');
    expect(frame.entityIdentifier).toBe('Start');
  });

  it('should parse qualified names in model', () => {
    const result = parse(`eventmodeling

timeframe 02 ui UI
tf 01 evt Product.PriceChanged
tf 03 evt Cart.ItemAdded

  `);
    // console.error('Eventmodeling', result.value);
    assert(
      result.lexerErrors.length === 0,
      `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
    );
    expect(result.value.frames.length).toBe(3);
    const frame = result.value.frames[1];
    expect(frame.name).toBe('01');
    expect(frame.modelEntityType).toBe('evt');
    expect(frame.entityIdentifier).toBe('Product.PriceChanged');
  });

  it('should parse both types of frames in model', () => {
    const result = parse(`eventmodeling

tf 02 ui UI
resetframe 01 evt Product.PriceChanged
tf 03 evt Cart.ItemAdded

  `);
    // console.error('Eventmodeling', result.value);
    assert(
      result.lexerErrors.length === 0,
      `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
    );
    expect(result.value.frames.length).toBe(3);
    const frame = result.value.frames[1];
    // console.error('Eventmodeling', frame);
    expect(frame.$type).toBe('EmResetFrame');
    expect(frame.name).toBe('01');
    expect(frame.modelEntityType).toBe('evt');
    expect(frame.entityIdentifier).toBe('Product.PriceChanged');
  });

  describe('Validation', () => {
    describe('registerValidationChecks', () => {
      it('registers checks against the validation registry', () => {
        const registered: unknown[] = [];
        const mockServices = {
          validation: {
            EventModelingValidator: new EventModelingValidator(),
            ValidationRegistry: { register: (...args: unknown[]) => registered.push(args) },
          },
        };
        registerValidationChecks(mockServices as unknown as EventModelingServices);
        expect(registered).toHaveLength(1);
      });
    });

    const validator = new EventModelingValidator();

    function makeFrame(modelEntityType: EmModelEntityType): EmTimeFrame {
      return {
        $type: 'EmTimeFrame',
        $container: undefined as unknown as EmTimeFrame['$container'],
        $containerProperty: undefined,
        $containerIndex: undefined,
        $cstNode: undefined,
        name: '00',
        entityIdentifier: 'Test',
        modelEntityType,
        sourceFrames: [],
      };
    }

    function collectErrors(frame: EmTimeFrame, sources: EmTimeFrame[]): string[] {
      const errors: string[] = [];
      const frameWithSources: EmTimeFrame = {
        ...frame,
        sourceFrames: sources.map((s) => ({ $refText: s.name, ref: s, error: undefined })),
      };
      validator.checkSourceFrameTypes(frameWithSources, (_, message) => errors.push(message));
      return errors;
    }

    it('should allow evt sourced from cmd', () => {
      const errors = collectErrors(makeFrame('evt'), [makeFrame('cmd')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow event sourced from command', () => {
      const errors = collectErrors(makeFrame('event'), [makeFrame('command')]);
      expect(errors).toHaveLength(0);
    });

    it('should reject evt sourced from rmo', () => {
      const errors = collectErrors(makeFrame('evt'), [makeFrame('rmo')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('event');
      expect(errors[0]).toContain('command');
    });

    it('should reject evt sourced from pcr', () => {
      const errors = collectErrors(makeFrame('evt'), [makeFrame('pcr')]);
      expect(errors).toHaveLength(1);
    });

    it('should allow cmd sourced from ui', () => {
      const errors = collectErrors(makeFrame('cmd'), [makeFrame('ui')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow command sourced from ui', () => {
      const errors = collectErrors(makeFrame('command'), [makeFrame('ui')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow cmd sourced from pcr', () => {
      const errors = collectErrors(makeFrame('cmd'), [makeFrame('pcr')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow command sourced from processor', () => {
      const errors = collectErrors(makeFrame('command'), [makeFrame('processor')]);
      expect(errors).toHaveLength(0);
    });

    it('should reject cmd sourced from cmd', () => {
      const errors = collectErrors(makeFrame('cmd'), [makeFrame('cmd')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('command');
      expect(errors[0]).toContain('ui or processor');
    });

    it('should reject cmd sourced from evt', () => {
      const errors = collectErrors(makeFrame('cmd'), [makeFrame('evt')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('command');
      expect(errors[0]).toContain('ui or processor');
    });

    it('should reject ui sourced from evt', () => {
      const errors = collectErrors(makeFrame('ui'), [makeFrame('evt')]);
      expect(errors).toHaveLength(1);
    });

    it('should allow ui sourced from rmo', () => {
      const errors = collectErrors(makeFrame('ui'), [makeFrame('rmo')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow ui sourced from readmodel', () => {
      const errors = collectErrors(makeFrame('ui'), [makeFrame('readmodel')]);
      expect(errors).toHaveLength(0);
    });

    it('should reject ui sourced from cmd', () => {
      const errors = collectErrors(makeFrame('ui'), [makeFrame('cmd')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('ui');
      expect(errors[0]).toContain('read model');
    });

    it('should reject cmd sourced from rmo', () => {
      const errors = collectErrors(makeFrame('cmd'), [makeFrame('rmo')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('command');
      expect(errors[0]).toContain('ui or processor');
    });

    it('should allow rmo sourced from evt', () => {
      const errors = collectErrors(makeFrame('rmo'), [makeFrame('evt')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow readmodel sourced from event', () => {
      const errors = collectErrors(makeFrame('readmodel'), [makeFrame('event')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow pcr sourced from rmo', () => {
      const errors = collectErrors(makeFrame('pcr'), [makeFrame('rmo')]);
      expect(errors).toHaveLength(0);
    });

    it('should allow processor sourced from readmodel', () => {
      const errors = collectErrors(makeFrame('processor'), [makeFrame('readmodel')]);
      expect(errors).toHaveLength(0);
    });

    it('should reject rmo sourced directly from pcr', () => {
      const errors = collectErrors(makeFrame('rmo'), [makeFrame('pcr')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('read model');
      expect(errors[0]).toContain('event');
    });

    it('should reject pcr sourced directly from evt', () => {
      const errors = collectErrors(makeFrame('pcr'), [makeFrame('evt')]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('processor');
      expect(errors[0]).toContain('read model');
    });

    it('should reject pcr sourced from cmd', () => {
      const errors = collectErrors(makeFrame('pcr'), [makeFrame('cmd')]);
      expect(errors).toHaveLength(1);
    });

    it('should reject rmo sourced from ui', () => {
      const errors = collectErrors(makeFrame('rmo'), [makeFrame('ui')]);
      expect(errors).toHaveLength(1);
    });

    it('should report an error for each invalid source', () => {
      const errors = collectErrors(makeFrame('pcr'), [makeFrame('evt'), makeFrame('cmd')]);
      expect(errors).toHaveLength(2);
    });

    it('should not validate frames with no sources', () => {
      const errors = collectErrors(makeFrame('rmo'), []);
      expect(errors).toHaveLength(0);
    });
  });

  describe('issue #8653', () => {
    it('should read a data block with an inner `}` at the start of a line', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  outer: {
  id: 1
}
}
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.dataEntities.length).toBe(1);
      expect(result.value.dataEntities[0].dataBlockValue).toContain('outer');
    });

    it('should parse two frames with inline data on one line', () => {
      const result = parse(
        `eventmodeling\ntf 01 cmd AddItem { id: 1 } tf 02 evt ItemAdded { id: 1 }\n`
      );
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.frames.length).toBe(2);
      expect(result.value.frames[0].dataInlineValue).toBe('{ id: 1 }');
      expect(result.value.frames[1].entityIdentifier).toBe('ItemAdded');
    });

    it('should reject inline data with an unclosed outer brace', () => {
      const result = parse(`eventmodeling\ntf 01 cmd AddItem { item: { id: 1 }\n`);
      expect(result.lexerErrors.length).toBeGreaterThan(0);
    });

    it('should parse a GWT scenario label', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 "Add an item" given evt ItemAdded then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.gwtEntities.length).toBe(1);
      expect(result.value.gwtEntities[0].label).toBe('"Add an item"');
    });

    it('should parse a qualified entity name in a GWT statement', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 given evt Cart.ItemAdded then evt Cart.ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      const gwt = result.value.gwtEntities[0];
      expect(gwt.givenStatements[0].entityIdentifier.$refText).toBe('Cart.ItemAdded');
      expect(gwt.thenStatements[0].entityIdentifier.$refText).toBe('Cart.ItemAdded');
    });

    it('should parse an inline payload in a GWT statement', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 given evt ItemAdded { id: 1 } then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      const gwt = result.value.gwtEntities[0];
      expect(gwt.givenStatements[0].dataInlineValue).toBe('{ id: 1 }');
    });

    it('should parse a block payload in a GWT statement', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 given evt ItemAdded {
  id: 1
} then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      const gwt = result.value.gwtEntities[0];
      expect(gwt.givenStatements[0].dataBlockValue).toContain('id: 1');
      expect(gwt.thenStatements[0].entityIdentifier.$refText).toBe('ItemAdded');
    });

    it('should keep a `}` inside a quoted string from closing an inline payload', () => {
      const result = parse(`eventmodeling\ntf 01 cmd AddItem \`json\`{"text":"}"}\n`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.frames[0].dataInlineValue).toBe('{"text":"}"}');
    });

    it('should keep a `}` inside a quoted string from closing a data block', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  text: "}"
  id: 1
}
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.dataEntities.length).toBe(1);
      expect(result.value.dataEntities[0].dataBlockValue).toContain('id: 1');
    });

    it('should capture a quoted payload that contains quotes and braces', () => {
      const result = parse(
        `eventmodeling\ntf 01 evt X ->> 01 \`json\`" { "a": { "c": true } } "\n`
      );
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.frames[0].dataInlineValue).toBe('" { "a": { "c": true } } "');
    });

    it('should reject an unclosed outer brace hidden inside a quoted section', () => {
      const result = parse(`eventmodeling\ntf 01 cmd AddItem \`json\`{"a":{"b":1}\n`);
      // `":{"` must not be reinterpreted as a string hiding the inner `{`.
      expect(result.lexerErrors.length).toBeGreaterThan(0);
    });

    it('should reject an unclosed outer brace in a data block', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  a: {
    b: 1
`);
      expect(result.lexerErrors.length).toBeGreaterThan(0);
    });

    it('should require the closing brace of a data block on its own line', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
abc}
`);
      // `}` must start a line: `calculateTextProps` strips the char before it.
      expect(result.lexerErrors.length + result.parserErrors.length).toBeGreaterThan(0);
    });

    it('should keep prose apostrophes inside data payloads', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem \`jsobj\`{note: Don't stop}
data D {
  text: Don't stop
}
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.frames[0].dataInlineValue).toBe("{note: Don't stop}");
      expect(result.value.dataEntities[0].dataBlockValue).toContain("Don't stop");
    });

    it('should keep a literal `{` inside a standalone quoted value', () => {
      const result = parse(`eventmodeling\ntf 01 cmd AddItem \`jsobj\`"Type {"\n`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.frames[0].dataInlineValue).toBe('"Type {"');
    });

    it('should allow a literal `{` inside a gwt scenario label', () => {
      const result = parse(`eventmodeling
gwt 01 "Type {" given cmd AddItem then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.gwtEntities[0].label).toBe('"Type {"');
    });

    it('should end a gwt scenario label at its closing quote', () => {
      const result = parse(`eventmodeling
gwt 01 "Scenario" given cmd AddItem {"id":"123"} then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      const gwt = result.value.gwtEntities[0];
      expect(gwt.label).toBe('"Scenario"');
      expect(gwt.givenStatements[0].dataInlineValue).toBe('{"id":"123"}');
      expect(gwt.thenStatements[0].entityIdentifier.$refText).toBe('ItemAdded');
    });

    it('should parse an empty data block', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
}
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.dataEntities.length).toBe(1);
      expect(result.value.dataEntities[0].dataBlockValue).toBe('{\n}\n');
    });

    it('should parse an indented closing brace in a data block', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  name: string
  }
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      expect(result.value.dataEntities.length).toBe(1);
    });
  });

  it('should parse multiple source frames model', () => {
    const result = parse(`eventmodeling
tf 01 evt Start
tf 02 evt End
rf 03 readmodel ReadModel01 ->> 01 ->> 02 { a: true }
rf 04 rmo ReadModel02 ->> 01 ->> 02
  `);
    // console.error('Eventmodeling', result.value);
    assert(
      result.lexerErrors.length === 0,
      `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
    );
    expect(result.value.frames.length).toBe(4);
    let frame = result.value.frames[2];
    // console.error('Eventmodeling', frame);
    expect(frame.name).toBe('03');
    expect(frame.modelEntityType).toBe('readmodel');
    expect(frame.sourceFrames.length).toBe(2);

    frame = result.value.frames[3];
    expect(frame.name).toBe('04');
    expect(frame.modelEntityType).toBe('rmo');
    expect(frame.sourceFrames.length).toBe(2);
  });
});
