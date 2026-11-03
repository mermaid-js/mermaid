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

  describe('indented data-block closing brace', () => {
    it('should accept the closing brace indented with spaces', () => {
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
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.frames).toHaveLength(1);
      expect(result.value.dataEntities).toHaveLength(1);
      expect(result.value.dataEntities[0].name).toBe('D');
      expect(result.value.dataEntities[0].dataBlockValue).toContain('name: string');
    });

    it('should accept the closing brace indented with a tab', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  name: string
\t}
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.dataEntities[0].dataBlockValue).toContain('name: string');
    });

    it('should accept an indented closing brace on a note', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
note 01 {
  remembered later
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
      expect(result.value.noteEntities).toHaveLength(1);
      expect(result.value.noteEntities[0].dataBlockValue).toContain('remembered later');
    });

    it('should still accept a closing brace at column 0', () => {
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
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.dataEntities[0].dataBlockValue).toContain('name: string');
    });

    it('should accept a closing brace when the rest of the line is whitespace', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  name: string
  }${'\t  '}
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.dataEntities).toHaveLength(1);
      expect(result.value.dataEntities[0].dataBlockValue).toContain('name: string');
    });

    it('should accept a closing brace at end of input', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem [[D]]
data D {
  name: string
  }`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.dataEntities[0].dataBlockValue).toContain('name: string');
    });

    it('should not end a block when text follows the brace on the same line', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
note 01 {
  remembered later
  } more text
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
      expect(result.value.noteEntities).toHaveLength(1);
      expect(result.value.noteEntities[0].dataBlockValue).toContain('remembered later');
      expect(result.value.noteEntities[0].dataBlockValue).toContain('} more text');
    });
  });

  describe('GWT scenario label', () => {
    it('should accept a double-quoted label before given', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 "Add an item" given evt ItemAdded then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.gwtEntities).toHaveLength(1);
      expect(result.value.gwtEntities[0].label).toBe('"Add an item"');
      expect(result.value.gwtEntities[0].givenStatements).toHaveLength(1);
      expect(result.value.gwtEntities[0].thenStatements).toHaveLength(1);
    });

    it('should accept a single-quoted label before given', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 'Add an item' given evt ItemAdded then evt ItemAdded
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.gwtEntities[0].label).toBe("'Add an item'");
    });

    it('should stop a double-quoted label at the first closing quote', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 "Add item" given evt ItemAdded then evt ItemAdded %% "comment"
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.gwtEntities).toHaveLength(1);
      expect(result.value.gwtEntities[0].label).toBe('"Add item"');
      expect(result.value.gwtEntities[0].givenStatements).toHaveLength(1);
      expect(result.value.gwtEntities[0].thenStatements).toHaveLength(1);
    });

    it('should stop a single-quoted label at the first closing quote', () => {
      const result = parse(`eventmodeling
tf 01 cmd AddItem
gwt 01 'Add item' given evt ItemAdded then evt ItemAdded %% 'comment'
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.gwtEntities[0].label).toBe("'Add item'");
      expect(result.value.gwtEntities[0].givenStatements).toHaveLength(1);
      expect(result.value.gwtEntities[0].thenStatements).toHaveLength(1);
    });

    it('should still accept quoted inline data that contains quotes', () => {
      const result = parse(`eventmodeling
tf 01 evt ProductCountIncrementedEvent \`json\`" { "a": { "c": true } } "
`);
      assert(
        result.lexerErrors.length === 0,
        `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
      );
      assert(
        result.parserErrors.length === 0,
        `parser errors ${JSON.stringify(result.parserErrors, null, 2)}`
      );
      expect(result.value.frames).toHaveLength(1);
      expect(result.value.frames[0].dataInlineValue).toBe('" { "a": { "c": true } } "');
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
