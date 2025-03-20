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
  code: string | string[];
  mermaid: CypressMermaidConfig;
}

const utf8ToB64 = (str: string): string => {
  return Buffer.from(decodeURIComponent(encodeURIComponent(str))).toString('base64');
};

const batchId: string =
  'mermaid-batch-' +
  (Cypress.env('useAppli')
    ? Date.now().toString()
    : Cypress.env('CYPRESS_COMMIT') || Date.now().toString());

export const mermaidUrl = (
  graphStr: string | string[],
  options: CypressMermaidConfig,
  api: boolean
): string => {
  options.handDrawnSeed = 1;
  const codeObject: CodeObject = {
    code: graphStr,
    mermaid: options,
  };
  const objStr: string = JSON.stringify(codeObject);
  let url = `http://localhost:9000/e2e.html?graph=${utf8ToB64(objStr)}`;
  if (api && typeof graphStr === 'string') {
    url = `http://localhost:9000/xss.html?graph=${graphStr}`;
  }

  if (options.listUrl) {
    cy.log(options.listId, ' ', url);
  }

  return url;
};

export const imgSnapshotTest = (
  graphStr: string,
  _options: CypressMermaidConfig = {},
  api = false,
  validation?: any
): void => {
  const options: CypressMermaidConfig = {
    ..._options,
    fontFamily: _options.fontFamily ?? 'courier',
    // @ts-ignore TODO: Fix type of fontSize
    fontSize: _options.fontSize ?? '16px',
    sequence: {
      ...(_options.sequence ?? {}),
      actorFontFamily: 'courier',
      noteFontFamily: _options.sequence?.noteFontFamily
        ? _options.sequence.noteFontFamily
        : 'courier',
      messageFontFamily: 'courier',
    },
  };

  const url: string = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options, validation);
};

export const urlSnapshotTest = (
  url: string,
  options: CypressMermaidConfig = {},
  _api = false,
  validation?: any
): void => {
  openURLAndVerifyRendering(url, options, validation);
};

export const renderGraph = (
  graphStr: string | string[],
  options: CypressMermaidConfig = {},
  api = false
): void => {
  const url: string = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options);
};

export const openURLAndVerifyRendering = (
  url: string,
  options: CypressMermaidConfig,
  validation?: any
): void => {
  const name: string = (options.name ?? cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

  cy.visit(url);
  cy.window().should('have.property', 'rendered', true);
  cy.get('svg').should('be.visible');

  if (validation) {
    cy.get('svg').should(validation);
  }

  verifyScreenshot(name);
};

export const verifyScreenshot = (name: string): void => {
  const useAppli: boolean = Cypress.env('useAppli');
  const useArgos: boolean = Cypress.env('useArgos');

  if (useAppli) {
    cy.log(`Opening eyes ${Cypress.spec.name} --- ${name}`);
    cy.eyesOpen({
      appName: 'Mermaid',
      testName: name,
      batchName: Cypress.spec.name,
      batchId: batchId + Cypress.spec.name,
    });
    cy.log(`Check eyes ${Cypress.spec.name}`);
    cy.eyesCheckWindow('Click!');
    cy.log(`Closing eyes ${Cypress.spec.name}`);
    cy.eyesClose();
  } else if (useArgos) {
    cy.argosScreenshot(name, {
      threshold: 0.01,
    });
  } else {
    cy.matchImageSnapshot(name);
  }
};

export const verifyNumber = (value: number, expected: number, deltaPercent = 10): void => {
  expect(value).to.be.within(
    expected * (1 - deltaPercent / 100),
    expected * (1 + deltaPercent / 100)
  );
};
