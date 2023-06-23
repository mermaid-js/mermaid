const utf8ToB64 = (str) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const batchId = 'mermaid-batch' + new Date().getTime();

export const mermaidUrl = (graphStr, options, api) => {
  const obj = {
    code: graphStr,
    mermaid: options,
  };
  const objStr = JSON.stringify(obj);
  let url = 'http://localhost:9000/e2e.html?graph=' + utf8ToB64(objStr);
  if (api) {
    url = 'http://localhost:9000/xss.html?graph=' + graphStr;
  }

  if (options.listUrl) {
    cy.log(options.listId, ' ', url);
  }

  return url;
};

export const imgSnapshotTest = (graphStr, _options = {}, api = false, validation = undefined) => {
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
  const url = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options, validation);
};

export const urlSnapshotTest = (url, _options, api = false, validation) => {
  const options = Object.assign(_options);
  openURLAndVerifyRendering(url, options, validation);
};

export const renderGraph = (graphStr, options, api) => {
  const url = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options);
};

export const openURLAndVerifyRendering = (url, options, validation = undefined) => {
  const useAppli = Cypress.env('useAppli');
  const name = (options.name || cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

  if (useAppli) {
    cy.log('Opening eyes ' + Cypress.spec.name + ' --- ' + name);
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
    cy.log('Check eyes' + Cypress.spec.name);
    cy.eyesCheckWindow('Click!');
    cy.log('Closing eyes' + Cypress.spec.name);
    cy.eyesClose();
  } else {
    cy.matchImageSnapshot(name);
  }
};
