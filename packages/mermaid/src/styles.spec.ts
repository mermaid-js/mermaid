import { vi } from 'vitest';

// @ts-expect-error This module has no TypeScript types
import { validate } from 'csstree-validator';
import { compile, serialize, stringify } from 'stylis';

import { getConfig } from '@mermaid-js/core/config.js';
import { detectors } from '@mermaid-js/core/diagram-api/detectType.js';
import getStyles, { addStylesForDiagram } from '@mermaid-js/core/styles.js';
import themes from '@mermaid-js/core/themes/index.js';
import './mermaid.js';

function checkValidStylisCSSStyleSheet(stylisString: string) {
  const cssString = serialize(compile(`#my-svg-id{${stylisString}}`), stringify);
  const errors = validate(cssString, 'this-file-was-created-by-tests.css') as Error[];

  const unexpectedErrors = errors.filter((error) => {
    const cssErrorsToIgnore = [
      // Valid in SVG2, see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx
      // Ideally, we'd remove this, since some browsers do not support SVG2.
      'Unknown property `rx`',
      // Valid in SVG2, see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry
      'Unknown property `ry`',
      // TODO: I'm pretty sure that even in SVG2, this isn't allowed to be a CSS
      // attribute.
      'Unknown property `dy`',
    ];
    return !cssErrorsToIgnore.some((cssErrorToIgnore) => error.message.match(cssErrorToIgnore));
  });

  if (unexpectedErrors.length > 0) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `The given CSS string was invalid: ${errors}.\n\n` +
        'Copy the below CSS into https://jigsaw.w3.org/css-validator/validator to help debug where the invalid CSS is:\n\n' +
        `Original CSS value was ${cssString}`
    );
  }
}

// TODO: ishikawa uses `dominant-baseline: baseline`, which isn't valid CSS.
const lazyDiagrams = Object.entries(detectors).flatMap(([id, { loader }]) =>
  loader && id !== 'ishikawa' ? [{ id, loader }] : []
);

describe('getStyles', () => {
  test('should return a valid style for an empty type', () => {
    const diagramType = 'my-custom-mocked-type-with-no-styles';
    addStylesForDiagram(diagramType, vi.fn().mockReturnValue(''));

    const styles = getStyles(diagramType, '', getConfig().themeVariables, '');

    checkValidStylisCSSStyleSheet(styles);
  });

  /**
   * Test CSS for each diagram type and each theme.
   */
  describe.each(lazyDiagrams)('for diagram $id', ({ id, loader }) => {
    beforeAll(async () => {
      const { diagram } = await loader();
      addStylesForDiagram(id, diagram.styles);
    });

    test.each(Object.keys(themes) as (keyof typeof themes)[])(
      'should return a valid style for theme %s',
      (themeId) => {
        const styles = getStyles(id, '', themes[themeId].getThemeVariables(), '');

        checkValidStylisCSSStyleSheet(styles);
      }
    );
  });
});
