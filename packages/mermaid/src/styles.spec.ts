import { vi } from 'vitest';

// @ts-expect-error This module has no TypeScript types
import { validate } from 'csstree-validator';
import { compile, serialize, stringify } from 'stylis';

import { getConfig } from './config.js';
import theme from './themes/index.js';

/**
 * Import the getStyles function from each diagram.
 *
 * Unfortunately, we can't use the `diagrams/*?/*Detector.ts` functions,
 * because many of the diagrams have a circular dependency import error
 * (they import mermaidAPI.js, which imports diagramOrchestrator.js, which causes a loop)
 */
import c4 from './diagrams/c4/styles.js';
import classDiagram from './diagrams/class/styles.js';
import flowchart from './diagrams/flowchart/styles.js';
import flowchartElk from './diagrams/flowchart/elk/styles.js';
import er from './diagrams/er/styles.js';
import error from './diagrams/error/styles.js';
import git from './diagrams/git/styles.js';
import gantt from './diagrams/gantt/styles.js';
import pie from './diagrams/pie/styles.js';
import requirement from './diagrams/requirement/styles.js';
import sequence from './diagrams/sequence/styles.js';
import state from './diagrams/state/styles.js';
import journey from './diagrams/user-journey/styles.js';
import timeline from './diagrams/timeline/styles.js';
import mindmap from './diagrams/mindmap/styles.js';
import themes from './themes/index.js';

async function checkValidStylisCSSStyleSheet(stylisString: string) {
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
      `The given CSS string was invalid: ${errors}.\n\n` +
        'Copy the below CSS into https://jigsaw.w3.org/css-validator/validator to help debug where the invalid CSS is:\n\n' +
        `Original CSS value was ${cssString}`
    );
  }
}

describe('styles', () => {
  beforeEach(() => {
    // resets the styles added to addStylesForDiagram()
    vi.resetModules();
  });

  describe('getStyles', () => {
    test('should return a valid style for an empty type', async () => {
      const { default: getStyles, addStylesForDiagram } = await import('./styles.js');

      const diagramType = 'my-custom-mocked-type-with-no-styles';
      const myTypeGetStylesFunc = vi.fn().mockReturnValue('');

      addStylesForDiagram(diagramType, myTypeGetStylesFunc);

      const styles = getStyles(diagramType, '', getConfig().themeVariables);

      await checkValidStylisCSSStyleSheet(styles);
    });

    /**
     * Test CSS for each diagram type and each theme.
     */
    for (const themeId of Object.keys(theme) as (keyof typeof theme)[]) {
      for (const [diagramId, getDiagramStyles] of Object.entries({
        c4,
        classDiagram,
        er,
        error,
        flowchart,
        flowchartElk,
        gantt,
        git,
        journey,
        mindmap,
        pie,
        requirement,
        sequence,
        state,
        timeline,
        sankey: () => {},
      })) {
        test(`should return a valid style for diagram ${diagramId} and theme ${themeId}`, async () => {
          const { default: getStyles, addStylesForDiagram } = await import('./styles.js');

          addStylesForDiagram(diagramId, getDiagramStyles);
          const styles = getStyles(
            diagramId,
            '',
            // @ts-expect-error This will probably be broken until we create a proper Themes type.
            themes[themeId].getThemeVariables()
          );

          await checkValidStylisCSSStyleSheet(styles);
        });
      }
    }
  });
});
