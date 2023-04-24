const utf8ToB64 = (str) => {
  return btoa(unescape(encodeURIComponent(str)));
};

const batchId = 'mermaid-batch' + Date.now();

export const mermaidUrl = (graphStr, options, api) => {
  const obj = {
    code: graphStr,
    mermaid: options,
  };
  const objStr = JSON.stringify(obj);
  let url = `http://localhost:9000/${api ? 'xss.html' : 'e2e.html'}?graph=${utf8ToB64(objStr)}`;

  if (options.listUrl) {
    cy.log(options.listId, ' ', url);
  }

  return url;
};

export const imgSnapshotTest = (graphStr, _options = {}, api = false, validation) => {
  const options = {
    ..._options,
    fontFamily: _options.fontFamily || 'courier',
    fontSize: _options.fontSize || '16px',
    sequence: {
      ...(options.sequence || {}),
      actorFontFamily: 'courier',
      noteFontFamily: _options.sequence?.noteFontFamily || 'courier',
      messageFontFamily: 'courier',
    },
  };

  const url = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options, validation);
};

export const urlSnapshotTest = (url, options = {}, api = false, validation) => {
  openURLAndVerifyRendering(url, options, validation);
};

export const renderGraph = (graphStr, options, api) => {
  const url = mermaidUrl(graphStr, options, api);
  openURLAndVerifyRendering(url, options);
};

const openURLAndVerifyRendering = (url, options, validation) => {
  const useAppli = Cypress.env('useAppli');
  const name = (options.name || cy.state('runnable').fullTitle()).replace(/\s+/g, '-');

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
