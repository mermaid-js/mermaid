import { Base64 } from 'js-base64';

export const mermaidUrl = (graphStr, options, api) => {
  const obj = {
    code: graphStr,
    mermaid: options,
  };
  const objStr = JSON.stringify(obj);
  let url = 'http://localhost:9000/e2e.html?graph=' + Base64.encodeURI(objStr);
  if (api) {
    url = 'http://localhost:9000/xss.html?graph=' + graphStr;
  }

  if (options.listUrl) {
    cy.log(options.listId, ' ', url);
  }

  return url;
};

export const imgSnapshotTest = (graphStr, _options, api = false, validation) => {
  cy.log(_options);
  const options = Object.assign(_options);
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
    options.fontSize = '16px';
  }
  const useAppli = Cypress.env('useAppli');
  const branch = Cypress.env('codeBranch');
  cy.log('Hello ' + useAppli ? 'Appli' : 'image-snapshot');
  const name = (options.name || cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

  if (useAppli) {
    cy.eyesOpen({
      appName: 'Mermaid-' + branch,
      testName: name,
      batchName: branch,
    });
  }

  const url = mermaidUrl(graphStr, options, api);

  cy.visit(url);
  if (validation) cy.get('svg').should(validation);
  cy.get('svg');
  // Default name to test title

  if (useAppli) {
    cy.eyesCheckWindow('Click!');
    cy.eyesClose();
  } else {
    cy.matchImageSnapshot(name);
  }
};

export const urlSnapshotTest = (url, _options, api = false, validation) => {
  cy.log(_options);
  const options = Object.assign(_options);
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
    options.fontSize = '16px';
  }
  const useAppli = Cypress.env('useAppli');
  const branch = Cypress.env('codeBranch');
  cy.log('Hello ' + useAppli ? 'Appli' : 'image-snapshot');
  const name = (options.name || cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

  if (useAppli) {
    cy.eyesOpen({
      appName: 'Mermaid-' + branch,
      testName: name,
      batchName: branch,
    });
  }

  cy.visit(url);
  if (validation) cy.get('svg').should(validation);
  cy.get('body');
  // Default name to test title

  if (useAppli) {
    cy.eyesCheckWindow('Click!');
    cy.eyesClose();
  } else {
    cy.matchImageSnapshot(name);
  }
};

export const renderGraph = (graphStr, options, api) => {
  const url = mermaidUrl(graphStr, options, api);

  cy.visit(url);
};
