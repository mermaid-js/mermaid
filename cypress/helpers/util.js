/* eslint-env jest */
import { Base64 } from 'js-base64';

export const mermaidUrl = (graphStr, options, api) => {
  const obj = {
    code: graphStr,
    mermaid: options
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

export const imgSnapshotTest = (graphStr, options, api) => {
  const url = mermaidUrl(graphStr, options, api);

  cy.visit(url);
  cy.get('svg');
  cy.percySnapshot();
};

export const renderGraph = (graphStr, options, api) => {
  const url = mermaidUrl(graphStr, options, api);

  cy.visit(url);
};
