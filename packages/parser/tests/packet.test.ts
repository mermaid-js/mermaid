import { describe, expect, it } from 'vitest';

import { Packet } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, packetParse as parse } from './test-util.js';

describe('packet', () => {
  it.each([
    `packet-beta`,
    `  packet-beta  `,
    `\tpacket-beta\t`,
    `
    \tpacket-beta
    `,
    `packet`,
    `  packet  `,
    `\tpacket\t`,
    `
    \tpacket
    `,
  ])('should handle regular packet', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Packet.$type);
  });
});
