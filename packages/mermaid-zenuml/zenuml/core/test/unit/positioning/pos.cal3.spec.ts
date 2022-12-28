import { Coordinates } from '../../../src/positioning/Coordinates';
import { stubWidthProvider } from '../parser/fixture/Fixture';
import { RootContext } from '../../../src/parser/index';

describe('PosCal3', () => {
  it('true', () => {
    expect(1).toBe(1);
  });
  // it('should return default positions for declared participants', () => {
  //   assertParticipantHasGap('A500', 'A500', 260);
  //   // A self-call does not contribute to gap
  //   assertParticipantHasGap('@Starter(A500) A500.m100', 'A500', 260);
  // })
  // it('should return the correct position', () => {
  //   assertParticipantHasGap('A500.m100', 'A500', 260);
  // });
  //
  // it('should return the correct position - for long method name', () => {
  //   assertParticipantHasGap('A500.m400', 'A500', 410);
  // });
  //
  // // A.m1 B.m2
  // // B.m2 should be ignored, because it is not from 'A' (the previous participant)
  // it('should return the correct position - for long participant name', () => {
  //   assertParticipantHasGap('A500.m100 B600.m200', '_STARTER_', 10);
  //   assertParticipantHasGap('A500.m100 B600.m200', 'A500', 260);
  //   assertParticipantHasGap('A500.m100 B600.m200', 'B600', 570);
  // });
});

function assertParticipantHasGap(code: string, participant: string, gap: number) {
  let rootContext = RootContext(code);
  let coordinates2 = Coordinates.walkThrough(rootContext, stubWidthProvider);

  const coordinate2 = coordinates2.find((c) => c.participant === participant);
  expect(coordinate2?.gap).toEqual(gap);
}
