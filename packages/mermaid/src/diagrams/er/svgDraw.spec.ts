import * as prettier from 'prettier';
import { describe } from 'vitest';
import { draw } from './erRenderer-unified.js';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import erDetector from './erDetector.js';
import { ensureNodeFromSelector, jsdomIt, SVG_NODE_ID } from '../../tests/util.js';
import { setConfig } from '../../config.js';
import { getThemeVariables as getThemeVariablesDark } from '../../themes/theme-dark.js';
import { getThemeVariables as getThemeVariablesLight } from '../../themes/theme-default.js';

const { id, detector, loader } = erDetector;

addDetector(id, detector, loader); // Add ER schemas to Mermaid

const INPUT_DIAGRAM_TEXT = `\
erDiagram
    CUSTOMER ||--o{ ORDER: places
    ORDER ||--|{ ORDER_ITEM: contains
    PRODUCT ||--o{ ORDER_ITEM: includes
    CUSTOMER {
        string id
        string name
        string email
    }
    ORDER {
        string id
        date orderDate
        string status
    }
    PRODUCT {
        string id
        string name
        float price
    }
    ORDER_ITEM {
        int quantity
        float price
    }

    style ORDER fill:#292,stroke:#ccc,stroke-width:4px,color:#dd66dd
    style PRODUCT fill:#bbf,stroke:#f66,stroke-width:2px,stroke-dasharray: 5 5,color:#444400
`;

/**
 * ER boxes are currently **always** drawn in handDrawn mode.
 * To compare SVG outputs, we must use a common seed to filter out the noise.
 */
const TEST_SEED = 666;
const lightThemeVariables = getThemeVariablesLight();
const darkThemeVariables = getThemeVariablesDark();

describe('ER diagram SVGs', () => {
  jsdomIt('should be identical in dark and light themes (classic look)', async () => {
    prepareSvgNode();
    setConfig({ theme: 'default', themeVariables: lightThemeVariables });
    const lightSvgNode = await drawDiagram(INPUT_DIAGRAM_TEXT);
    const lightSvg = await prettier.format(lightSvgNode.outerHTML, { parser: 'html' });

    prepareSvgNode();
    setConfig({ theme: 'dark', themeVariables: darkThemeVariables });
    const darkSvgNode = await drawDiagram(INPUT_DIAGRAM_TEXT);
    const darkSvg = await prettier.format(darkSvgNode.outerHTML, { parser: 'html' });

    expect(lightSvg).toStrictEqual(darkSvg);
  });

  jsdomIt('should be identical in dark and light themes (handDrawn look)', async () => {
    prepareSvgNode();
    setConfig({
      theme: 'default',
      themeVariables: lightThemeVariables,
      look: 'handDrawn',
      handDrawnSeed: TEST_SEED,
    });
    const lightSvgNode = await drawDiagram(INPUT_DIAGRAM_TEXT);
    const lightSvg = await prettier.format(lightSvgNode.outerHTML, { parser: 'html' });

    prepareSvgNode();
    setConfig({
      theme: 'dark',
      themeVariables: darkThemeVariables,
      look: 'handDrawn',
      handDrawnSeed: TEST_SEED,
    });
    const darkSvgNode = await drawDiagram(INPUT_DIAGRAM_TEXT);
    const darkSvg = await prettier.format(darkSvgNode.outerHTML, { parser: 'html' });

    expect(lightSvg).toStrictEqual(darkSvg);
  });
});

/**
 * For some ungodly reason, drawing ER diagrams only works in tests
 * if the `svg` tag contains a `<g/>` tag.
 */
function prepareSvgNode() {
  ensureNodeFromSelector(`#${SVG_NODE_ID}`).innerHTML = '<g/>';
}

async function drawDiagram(diagramText: string): Promise<Element> {
  const diagram = await Diagram.fromText(diagramText, {});
  await draw('NOT_USED', SVG_NODE_ID, '1.0.0', diagram);
  return ensureNodeFromSelector(`#${SVG_NODE_ID}`);
}
