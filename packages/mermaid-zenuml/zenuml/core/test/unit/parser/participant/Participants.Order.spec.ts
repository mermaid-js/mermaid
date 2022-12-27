/**
 * There three sources of participants:
 * 1. Explicit participants from participant declarations
 * 2. @Starter
 * 3. Implicit participants from messages
 *
 * Let's first decide when we are not using @Starter:
 * The order will be _STARTER_, declared participants, implicit participants
 *
 * If we are using @Starter, and the `starter` is included in the declared participants,
 * the order will be declared participants (starter will be at the declared position), implicit participants.
 * If the `starter` is not included in the declared participants, the order will be
 * `starter`, declared participants, implicit participants.
 *
 * Examples:
 * A B C.m                => _STARTER_(invisible), A, B, C
 * A B @Starter(C) C.m    => C, A, B
 * A B @Starter(B) C.m    => A, B, C
 *
 * The concept is that declarations are for explicit positioning.
 * @Starter explicitly declare but still using implicit positioning (left-most).
 *
 * A participant can be either explicitly positioned or implicit positioned.
 *
 * @Starter does NOT explicitly position a participant. It works like `absolute`
 * in CSS. It pulls the participant out of the flow.
 *
 * Participant declaration works like `#id {display: relative}` in CSS. It puts
 * the participants back in the flow and a fixed flow decided by itself.
 */

/**
 * Examples:
 * A B C.m                => _STARTER_(invisible), A, B, C
 * A B @Starter(C) C.m    => C, A, B
 * A B @Starter(B) C.m    => A, B, C
 */
import { describe, expect, it } from 'vitest';
import { RootContext } from '../../../../src/parser/index';
import { OrderedParticipants } from '../../../../src/positioning/OrderedParticipants';

function getFlattenedParticipants(code: string) {
  const rootContext = RootContext(code);
  return OrderedParticipants(rootContext);
}

describe('Participants.Order', () => {
  it('should return the order of participants', () => {
    expect(getFlattenedParticipants('A as A1 B C.m')).toEqual([
      { name: '_STARTER_', left: '' },
      { name: 'A', label: 'A1', left: '_STARTER_' },
      { name: 'B', label: undefined, left: 'A' },
      { name: 'C', left: 'B' },
    ]);
  });

  it('should return the order of participants - Starter', () => {
    expect(getFlattenedParticipants('A B @Starter(C) C.m')).toEqual([
      { name: 'C', left: '' },
      { name: 'A', left: 'C' },
      { name: 'B', left: 'A' },
    ]);

    expect(getFlattenedParticipants('A B->A.m C->D.m')).toEqual([
      { name: 'B', left: '' },
      { name: 'A', left: 'B' },
      { name: 'C', left: 'A' },
      { name: 'D', left: 'C' },
    ]);
  });

  it('should return the order of participants', () => {
    const flattenedParticipants = getFlattenedParticipants('A B @Starter(B) A.m C.m');
    expect(flattenedParticipants).toEqual([
      { name: 'A', left: '' },
      { name: 'B', left: 'A' },
      { name: 'C', left: 'B' },
    ]);
  });

  it('should return the order of participants', () => {
    expect(getFlattenedParticipants('A.m')).toEqual([
      { left: '', name: '_STARTER_' },
      { left: '_STARTER_', name: 'A' },
    ]);
  });

  it('should return the order of participants - ignore expression in parameters', () => {
    expect(getFlattenedParticipants('A.m(B.m)')).toEqual([
      { left: '', name: '_STARTER_' },
      { left: '_STARTER_', name: 'A' },
    ]);
  });

  it('should return the order of participants - ignore expression in condition', () => {
    expect(getFlattenedParticipants('if(B.m1){A.m2}')).toEqual([
      { left: '', name: '_STARTER_' },
      { left: '_STARTER_', name: 'A' },
    ]);
  });
});
