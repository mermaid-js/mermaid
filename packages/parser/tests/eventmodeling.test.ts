import { describe, expect, it, assert } from 'vitest';
import { eventModelingParse as parse } from './test-util.js';

describe('Parse Event Model', () => {
  it('should parse complex model', () => {
    const result = parse(`eventmodeling
tf 01 cmd UpdateCartCommand
tf 02 evt CartUpdatedEvent >f 01 \`jsobj\`{ a: b }
tf 03 rmo CartItemsReadModel >f 02 [[CartItemsReadModel03]]
tf 04 evt ProductDescriptionUpdatedEvent >f 01 \`jsobj\`{ a: { c: d } }
tf 05 evt ProductTitleUpdatedEvent >f 01 { "a": { "c": true } }
tf 06 evt ProductCountIncrementedEvent >f 01 \`json\`" { "a": { "c": true } } "

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

  it('should parse simple model', () => {
    const result = parse(`eventmodeling
tf 01 evt Start

  `);
    // console.error('Eventmodeling', result.value);
    assert(
      result.lexerErrors.length === 0,
      `lexer errors ${JSON.stringify(result.lexerErrors, null, 2)}`
    );
    expect(result.value.frames.length).toBe(1);
    const frame = result.value.frames[0];
    expect(frame.name).toBe('01');
    expect(frame.modelEntityType).toBe('evt');
    expect(frame.entityIdentifier).toBe('Start');
  });

  it('should parse qualified names in model', () => {
    const result = parse(`eventmodeling

tf 02 scn Screen
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

tf 02 scn Screen
rf 01 evt Product.PriceChanged
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

  it('should parse multiple source frames model', () => {
    const result = parse(`eventmodeling
tf 01 evt Start
tf 02 evt End
rf 03 rmo ReadModel01 >f 01 >f 02 { a: true }
rf 04 rmo ReadModel02 >f 01 >f 02
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
    expect(frame.modelEntityType).toBe('rmo');
    expect(frame.sourceFrames.length).toBe(2);

    frame = result.value.frames[3];
    expect(frame.name).toBe('04');
    expect(frame.modelEntityType).toBe('rmo');
    expect(frame.sourceFrames.length).toBe(2);
  });
});
