import { describe, expect, test } from 'vitest';
import { Participants } from '../parser/Participants';

describe('Participants', () => {
  test('Get implicitly declared participants', () => {
    const participants = new Participants();
    participants.Add('A');
    expect(participants.ImplicitArray()).toEqual([
      { name: 'A', isStarter: undefined, stereotype: undefined, width: undefined },
    ]);
    expect(participants.Starter()).toBeUndefined();
  });

  test('Test order of participants', () => {
    const participants = new Participants();
    participants.Add('B');
    participants.Add('A');
    expect(participants.ImplicitArray()).toEqual([
      { name: 'B', isStarter: undefined, stereotype: undefined, width: undefined },
      { name: 'A', isStarter: undefined, stereotype: undefined, width: undefined },
    ]);
    expect(participants.Starter()).toBeUndefined();
  });

  test('Get Starter', () => {
    const participants = new Participants();
    participants.Add('A', true);
    expect(participants.Starter()).toEqual({
      name: 'A',
      isStarter: true,
      stereotype: undefined,
      width: undefined,
    });
    participants.Add('A', false, undefined, undefined, undefined, undefined, true);
    expect(participants.Starter()).toEqual({
      name: 'A',
      isStarter: true,
      stereotype: undefined,
      width: undefined,
      explicit: true,
    });
  });
});
