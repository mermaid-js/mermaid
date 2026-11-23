import { describe, expect, it } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import { MarbleDB } from './marbleDb.js';
import { interpretLane } from './marbleTimeline.js';
import { parser } from './parser/marble.chevrotain.js';

addDiagrams();

/**
 * Marble strings from the RxJS repository (ReactiveX/rxjs, its tests and the marble testing
 * guide), each valid for RxJS's own marble parser. Any of them, pasted as a lane, must parse
 * and render: marble-beta lanes are a superset of RxJS marble syntax.
 */
const RXJS_MARBLES: [marbles: string, source: string][] = [
  ['---(abc)---', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['---(^!)', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['(a|)', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['(^!)', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['-- 9ms a 9ms b 9ms (c|)', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['- 10s (a|)', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['     --(a|)                     ', 'rxjs/test/platform/operators/group-by.spec.ts'],
  ['       a-b---(d|)                 ', 'rxjs/test/platform/operators/group-by.spec.ts'],
  ['             c-------g-(h|)       ', 'rxjs/test/platform/operators/group-by.spec.ts'],
  ['                  e---------j-(k|)', 'rxjs/test/platform/operators/group-by.spec.ts'],
  ['         a-b---(d#)               ', 'rxjs/test/platform/operators/group-by.spec.ts'],
  ['             c-------g-(h#)       ', 'rxjs/test/platform/operators/group-by.spec.ts'],
  ['---^---a---b---|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['---^---!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['---^', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['  - -  - -  ^ -   - !  -- -      ', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['----^--!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['10.2ms ^ 1.2s - 1m !', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['^--!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['---!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['^--------!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['^---------!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['^-----!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['^------!', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['10.2ms a 1.2s b 1m c|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['   10.2ms a 1.2s b 1m c|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['   ------ 4ms c---|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['-1ms', 'test/src/marble-parser.spec.ts'],
  ['2ms a-b#', 'test/src/marble-parser.spec.ts'],
  ['20s (a|)', 'test/src/marble-parser.spec.ts'],
  ['---x---y----|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['--x', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['        x-y-z-|  ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['     -----x-y-z-|  ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['             --x--y--z--|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['     ------------x--y--z--|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['           --a--b--#--d--e--|          ', 'rxjs/test/platform/operators/switch-scan.spec.ts'],
  ['   --w-----#----', 'rxjs/test/platform/operators/zip-with.spec.ts'],
  ['   -----z-----#-', 'rxjs/test/platform/operators/zip-with.spec.ts'],
  [
    '   --x-----------#----                       ',
    'rxjs/test/platform/operators/window-toggle.spec.ts',
  ],
  ['|--|', 'test/src/marble-parser.spec.ts'],
  ['-------a---b---#', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['-a-b-#', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['--#', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['-----#        ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['---a---b---c----#          ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['----------#', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  -a - b -    c |       ', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['  --|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['   ----------c---|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  [' -------a--b--|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  -----|        ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  ^----!        ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['-------a---b---|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['--a--b--|   ', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['--a--b--c--', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['----a', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['--a---b--|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  ['-a-b-|', 'rxjs/test/platform/schedulers/test-scheduler.spec.ts'],
  [' -----|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  [' ----|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  --a--b--c--d--e--|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  --------------------|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  -----|            ', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['  --a--b--c---d--e--|', 'rxjs/test/platform/operators/timeout.spec.ts'],
  ['--a--^--b--|', 'rxjs.dev/guide/testing/marble-testing.md'],
  ['500ms ^ 1s !', 'rxjs.dev/guide/testing/marble-testing.md'],
  ['400ms (a-b|)', 'rxjs.dev/guide/testing/marble-testing.md'],
  ['--^--!-', 'rxjs.dev/guide/testing/marble-testing.md'],
];

describe('RxJS marble strings', () => {
  it.each(RXJS_MARBLES)('reads %j (%s)', (marbles) => {
    expect(() => interpretLane(marbles.trimEnd(), { line: 1 }, 0)).not.toThrow();
  });

  it('parses all of them as lanes of one diagram', async () => {
    const db = new MarbleDB();
    parser.parser!.yy = db;
    const lanes = RXJS_MARBLES.map(([marbles], i) => `  l${i} : ${marbles}`).join('\n');
    await parser.parse(`marble-beta\n${lanes}\n`);
    expect(db.getTimeline().lanes).toHaveLength(RXJS_MARBLES.length);
  });

  jsdomIt('renders all of them', async () => {
    const lanes = RXJS_MARBLES.map(([marbles], i) => `  l${i} : ${marbles}`).join('\n');
    const { svg } = await mermaidAPI.render('marble-rxjs', `marble-beta\n${lanes}\n`);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelectorAll('.marble-lane')).toHaveLength(RXJS_MARBLES.length);
    expect(doc.querySelectorAll('.marble-group').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('.marble-subscribe').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('.marble-time').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('.marble-span').length).toBeGreaterThan(0);
    expect(svg).not.toContain('NaN');
  });
});
