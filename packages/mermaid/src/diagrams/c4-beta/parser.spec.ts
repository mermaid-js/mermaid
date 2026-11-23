import { describe, expect, it } from 'vitest';

import { C4BetaDB } from './db.js';
import { parseC4Beta } from './parser.js';

const parseText = (text: string) => parseC4Beta(text, new C4BetaDB());

describe('c4-beta header', () => {
  it.each(['context', 'container', 'component', 'dynamic', 'deployment'])(
    'should accept the diagram kind %s',
    async (kind) => {
      await expect(parseText(`c4-beta ${kind}\nperson a "A"`)).resolves.toBeUndefined();
    }
  );

  it('should accept a header with no kind', async () => {
    await expect(parseText('c4-beta\nperson a "A"')).resolves.toBeUndefined();
  });

  it('should name an unknown diagram kind and list the kinds', async () => {
    await expect(parseText('c4-beta landscape\nperson a "A"')).rejects.toThrow(
      'c4-beta: unknown diagram kind "landscape"; use "context", "container", "component", "dynamic", "deployment".'
    );
  });

  it('should not read a statement on the header line as a diagram kind', async () => {
    await expect(parseText('c4-beta person a "A"')).rejects.toThrow(
      'c4-beta: unknown diagram kind "person"'
    );
  });

  it.each(['system', 'node'])('should reject %s as an element kind', async (kind) => {
    await expect(parseText(`c4-beta\n${kind} a "A"`)).rejects.toThrow();
  });
});
