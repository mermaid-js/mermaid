import { urlSnapshotTest, openURLAndVerifyRendering, imgSnapshotTest } from '../../helpers/util.ts';

describe('CSS injections', () => {
  it('should not allow CSS injections outside of the diagram', () => {
    urlSnapshotTest('/ghsa1.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  it('should not allow adding styletags affecting the page', () => {
    urlSnapshotTest('/ghsa3.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  it('should not allow manipulating styletags using arrowheads', () => {
    openURLAndVerifyRendering('/xss23-css.html', {
      logLevel: 1,
      arrowMarkerAbsolute: false,
      flowchart: { htmlLabels: true },
    });
  });
  it('should sanitize CSS in class definitions', () => {
    urlSnapshotTest('/css-injection.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
    cy.get('.otp-3').should(
      'not.have.css',
      'background-image',
      'url("https://example.test/3.png")'
    );
  });
  it('should prevent HTML injection via class definitions', () => {
    imgSnapshotTest(
      `stateDiagram-v2
  classDef xss fill:red</style></svg><style>*{x:x;y:y;overflow:visible!important;contain:none!important;transform:none!important;filter:none!important;clip-path:none!important}</style><div id="pwned" style="x:x;y:y;color:red;font:5em/1 monospace;display:grid;place-items:center;z-index:2147483647;width:100vw;height:100vh;position:fixed;top:0;left:0;background:black">HACKED</div><svg><style>a:b
  [*] --> A:::xss
     `,
      { logLevel: 1 }
    );
    cy.get('body > div #pwned').should('not.exist');
  });
  it('should prevent CSS namespace injection via :not(&)', () => {
    imgSnapshotTest(
      `---
title: Green background CSS should not be able to escape the diagram using :not(&)
config:
  themeCSS: ':not(&){background:green !important}'
---
flowchart
  A --> B
     `,
      { logLevel: 1 }
    );
    cy.get('body').should('not.have.css', 'background-color', 'rgb(0, 128, 0)');
  });
});
