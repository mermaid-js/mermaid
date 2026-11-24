/**
 * `docs:build` regenerates the committed `docs/` directory, and it has to delete the old
 * contents first so that pages whose source was removed do not linger.
 *
 * The order of those steps matters. `rimraf ../../docs` used to run *first*, before
 * `docs:code` (typedoc) and `docs:spellcheck` — so any failure in either left the whole
 * committed `docs/` tree deleted and never regenerated. A contributor whose typedoc run
 * errored, or who added one unrecognised word to a doc, was handed ~150 staged deletions
 * with no obvious cause.
 *
 * This is a property of a package.json script rather than of any module, so there is
 * nothing else to hang a test on — but it is exactly the kind of thing that gets
 * reintroduced by someone tidying the script into what looks like a more natural order
 * (clean, then build).
 */
import { describe, expect, it } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };

const stepsOf = (script: string) => script.split('&&').map((step) => step.trim());

const indexOfStep = (steps: string[], needle: string) =>
  steps.findIndex((step) => step.includes(needle));

describe('docs:build step order', () => {
  const script: string = packageJson.scripts['docs:build'];
  const steps = stepsOf(script);

  it('still deletes the docs directory, so removed pages do not linger', () => {
    expect(indexOfStep(steps, 'rimraf ../../docs')).toBeGreaterThanOrEqual(0);
  });

  it('regenerates the docs directory in the same run', () => {
    expect(indexOfStep(steps, 'docs.cli.mts')).toBeGreaterThanOrEqual(0);
  });

  it.each(['docs:code', 'docs:spellcheck'])(
    'runs %s before deleting the docs directory',
    (fallibleStep) => {
      const deleteAt = indexOfStep(steps, 'rimraf ../../docs');
      const stepAt = indexOfStep(steps, fallibleStep);
      expect(stepAt).toBeGreaterThanOrEqual(0);
      expect(stepAt).toBeLessThan(deleteAt);
    }
  );

  it('deletes the docs directory immediately before regenerating it', () => {
    const deleteAt = indexOfStep(steps, 'rimraf ../../docs');
    const generateAt = indexOfStep(steps, 'docs.cli.mts');
    expect(generateAt).toBe(deleteAt + 1);
  });
});
