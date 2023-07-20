/* eslint-disable @typescript-eslint/no-explicit-any */
import { Buffer } from 'buffer';
import type { MermaidConfig } from '../../packages/mermaid/src/config.type.js';

interface CypressConfig {
  listUrl?: boolean;
  listId?: string;
  name?: string;
}
type CypressMermaidConfig = MermaidConfig & CypressConfig;

interface CodeObject {
  code: string;
  mermaid: CypressMermaidConfig;
}

const batchId: string = 'mermaid-batch-' + Cypress.env('CYPRESS_COMMIT') || Date.now().toString();

/**
 * encodes, then decodes, then converts the `utf-8` {@link str} into `base64`.
 *
 * @param str -
 * @returns converted `utf-8` into `base64`.
 */
const convertUtf8ToBase64 = (str: string): string => {
  return Buffer.from(decodeURIComponent(encodeURIComponent(str))).toString('base64');
};

/**
 *
 * @param diagramStr -
 * @param options -
 * @param api -
 * @returns url
 */
export const createMermaidUrl = (
  diagramStr: string,
  options?: CypressMermaidConfig,
  api?: boolean
): string => {
  const codeObject: CodeObject = {
    code: diagramStr,
    mermaid: options || {},
  };
  const objStr: string = JSON.stringify(codeObject);
  const url = `http://localhost:9000/${api ? 'xss' : 'e2e'}.html?graph=${convertUtf8ToBase64(
    objStr
  )}`;

  if (options.listUrl) {
    cy.log(options.listId, ' ', url);
  }

  return url;
};

/**
 * opens the {@link url}, then verifies that the `window` is rendered,
 * and the `svg` is visible.
 *
 * @param url -
 * @param options -
 * @param validation -
 */
export const openUrlAndVerifyRendering = (
  url: string,
  options?: CypressMermaidConfig,
  validation?: any
): void => {
  const useAppli: boolean = Cypress.env('useAppli');
  const name: string = (options.name || cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

  if (useAppli) {
    cy.log(`Opening eyes ${Cypress.spec.name} --- ${name}`);
    cy.eyesOpen({
      appName: 'Mermaid',
      testName: name,
      batchName: Cypress.spec.name,
      batchId: `${batchId}-${Cypress.spec.name}`,
    });
  }

  cy.visit(url);
  cy.window().should('have.property', 'rendered', true);
  cy.get('svg').should('be.visible');

  if (validation !== undefined) {
    cy.get('svg').should(validation);
  }

  if (useAppli) {
    cy.log(`Check eyes ${Cypress.spec.name}`);
    cy.eyesCheckWindow('Click!');
    cy.log(`Closing eyes ${Cypress.spec.name}`);
    cy.eyesClose();
  } else {
    cy.matchImageSnapshot(name);
  }
};

/**
 *
 * @param diagramStr -
 * @param _options -
 * @param api -
 * @param validation -
 */
export const imgSnapshotTest = (
  diagramStr: string,
  _options?: CypressMermaidConfig,
  api?: boolean,
  validation?: any
): void => {
  cy.log(JSON.stringify(_options));
  const options: CypressMermaidConfig = {
    ..._options,
    fontFamily: _options.fontFamily || 'courier',
    fontSize: _options.fontSize || 16,
    sequence: {
      actorFontFamily: 'courier',
      noteFontFamily: 'courier',
      messageFontFamily: 'courier',
    },
  };

  const url: string = createMermaidUrl(diagramStr, options, api);
  openUrlAndVerifyRendering(url, options, validation);
};

/**
 *
 * @param url -
 * @param _options -
 * @param _api -
 * @param validation -
 */
export const urlSnapshotTest = (
  url: string,
  _options?: CypressMermaidConfig,
  _api?: boolean,
  validation?: any
): void => {
  const options: CypressMermaidConfig = Object.assign(_options);
  openUrlAndVerifyRendering(url, options, validation);
};
