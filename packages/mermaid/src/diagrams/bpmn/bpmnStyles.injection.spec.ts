import { describe, expect, it } from 'vitest';
import { sanitizeDirective } from '../../utils/sanitizeDirective.js';
import { getThemeVariables } from '../../themes/theme-base.js';
import getStyles from './styles.js';

const LEAK = 'https://evil.example/leak';
const PAYLOAD = [`red}#x{background:url(${LEAK})}`];

// themeVariables.bpmn.* values are written into the diagram's stylesheet as text, and a
// template literal turns an array into a string the sanitiser's string check never saw.
describe('bpmn theme variables reaching the stylesheet', () => {
  const stylesheet = (bpmn: Record<string, unknown>, sanitize: boolean) => {
    const args = { themeVariables: { bpmn } };
    if (sanitize) {
      sanitizeDirective(args);
    }
    const theme = getThemeVariables(args.themeVariables);
    return getStyles({ ...theme, bpmn: theme.bpmn });
  };

  it('writes a string payload as it is, which is why the sanitiser blanks unsafe strings', () => {
    // The control: a string is a legitimate value for the stylesheet, so the payload is written
    // out unless the sanitiser has blanked it. This shows the assertions below can fail.
    expect(stylesheet({ laneFill: PAYLOAD[0] }, false)).toContain(LEAK);
    expect(stylesheet({ laneFill: PAYLOAD[0] }, true)).not.toContain(LEAK);
  });

  it('keeps an array out of the stylesheet from diagram text', () => {
    expect(stylesheet({ laneFill: PAYLOAD }, true)).not.toContain(LEAK);
  });

  it('keeps an array out of the stylesheet even when the sanitiser is bypassed', () => {
    expect(stylesheet({ laneFill: PAYLOAD }, false)).not.toContain(LEAK);
  });

  it('still writes a colour the author set', () => {
    expect(stylesheet({ laneFill: '#abcdef' }, true)).toContain('#abcdef');
  });
});
