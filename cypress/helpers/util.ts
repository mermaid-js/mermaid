import type { MermaidConfig } from '../../packages/mermaid/src/config.type.js';

type CypressConfig = {
  listUrl?: boolean;
  listId?: string;
  name?: string;
};
type CypressMermaidConfig = MermaidConfig & CypressConfig;

interface CodeObject {
  code: string;
  mermaid: CypressMermaidConfig;
}

const utf8ToB64 = (str: string): string => {
  return window.btoa(decodeURIComponent(encodeURIComponent(str)));
};

const batchId: string = 'mermaid-batch-' + Cypress.env('CYPRESS_COMMIT') || Date.now().toString();

export const mermaidUrl = (
  graphStr: string,
  options: CypressMermaidConfig,
  api: boolean
): string => {
  const codeObject: CodeObject = {
    code: graphStr,
    mermaid: options,
  };
  const objStr: string = JSON.stringify(codeObject);
  let url = `http://localhost:9000/e2e.html?graph=${utf8ToB64(objStr)}`;
  if (api) {
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
  cy.log(JSON.stringify(_options));
  const options: CypressMermaidConfig = Object.assign(_options);
  if (!options.fontFamily) {
    options.fontFamily = 'courier';
  }
  if (!options.sequence) {
    options.sequence = {};
  }
  if (!options.sequence || (options.sequence && !options.sequence.actorFontFamily)) {
    options.sequence.actorFontFamily = 'courier';
  }
  if (options.sequence && !options.sequence.noteFontFamily) {
    options.sequence.noteFontFamily = 'courier';
  }
  options.sequence.actorFontFamily = 'courier';
  options.sequence.noteFontFamily = 'courier';
  options.sequence.messageFontFamily = 'courier';
  if (options.sequence && !options.sequence.actorFontFamily) {
    options.sequence.actorFontFamily = 'courier';
  }
  if (!options.fontSize) {
    options.fontSize = 16;
  }

  const url: string = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options, validation);
};

export const urlSnapshotTest = (
  url: string,
  _options: CypressMermaidConfig,
  _api = false,
  validation?: any
): void => {
  const options: CypressMermaidConfig = Object.assign(_options);
  openURLAndVerifyRendering(url, options, validation);
};

export const renderGraph = (
  graphStr: string,
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
  const useAppli: boolean = Cypress.env('useAppli');
  const name: string = (options.name || cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

  if (useAppli) {
    cy.log(`Opening eyes ${Cypress.spec.name} --- ${name}`);
    cy.eyesOpen({
      appName: 'Mermaid',
      testName: name,
      batchName: Cypress.spec.name,
      batchId: batchId + Cypress.spec.name,
    });
  }

  cy.visit(url);
  cy.window().should('have.property', 'rendered', true);
  cy.get('svg').should('be.visible');

  if (validation) {
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
