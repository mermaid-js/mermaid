import { imgSnapshotTest, mermaidUrl, utf8ToB64 } from '../../helpers/util.ts';
describe('XSS', () => {
  it('should handle xss in tags', () => {
    const str =
      'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19';

    const url = mermaidUrl(str, {}, true);

    cy.visit(url);
    cy.wait(1000).then(() => {
      cy.get('.mermaid').should('exist');
    });
  });

  it('should not allow tags in the css', () => {
    const str =
      'eyJjb2RlIjoiJSV7aW5pdDogeyAnZm9udEZhbWlseSc6ICdcXFwiPjwvc3R5bGU+PGltZyBzcmM9eCBvbmVycm9yPXhzc0F0dGFjaygpPid9IH0lJVxuZ3JhcGggTFJcbiAgICAgQSAtLT4gQiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwiZmxvd2NoYXJ0Ijp7Imh0bWxMYWJlbHMiOmZhbHNlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9';

    const url = mermaidUrl(
      str,
      {
        theme: 'default',
        flowchart: {
          htmlMode: false,
        },
      },
      true
    );

    cy.visit(url);
    cy.wait(1000).then(() => {
      cy.get('#the-malware').should('not.exist');
    });
  });

  it('should handle xss in tags in non-html mode', () => {
    const str =
      'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwiZmxvd2NoYXJ0Ijp7Imh0bWxMYWJlbHMiOmZhbHNlfX19';

    const url = mermaidUrl(
      str,
      {
        theme: 'default',
        flowchart: {
          htmlMode: false,
        },
      },
      true
    );

    cy.visit(url);
    cy.wait(1000);

    cy.get('#the-malware').should('not.exist');
  });

  it('should not allow changing the __proto__ attribute using config', () => {
    cy.visit('/xss2.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating htmlLabels into a false positive', () => {
    cy.visit('/xss4.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript', () => {
    cy.visit('/xss5.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror', () => {
    cy.visit('/xss6.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre wrapper', () => {
    cy.visit('/xss8.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.on('uncaught:exception', (_err, _runnable) => {
      return false; // continue rendering even if there if mermaid throws an error
    });
    cy.visit('/xss9.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('/xss10.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('/xss11.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('/xss12.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('/xss13.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript iframes in class diagrams', () => {
    cy.visit('/xss14.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize cardinalities properly in class diagrams', () => {
    cy.visit('/xss18.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize colons properly', () => {
    cy.visit('/xss20.html');
    cy.wait(1000);
    cy.get('a').click('');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize colons properly', () => {
    cy.visit('/xss21.html');
    cy.wait(1000);
    cy.get('a').click('');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize backticks in class names properly', () => {
    cy.visit('/xss24.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize backticks block diagram labels properly', () => {
    cy.visit('/xss25.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });

  it('should sanitize icon labels in architecture diagrams', () => {
    const str = JSON.stringify({
      code: `architecture-beta
    group api(cloud)[API]
    service db "<img src=x onerror=\\"xssAttack()\\">" [Database] in api`,
    });
    imgSnapshotTest(utf8ToB64(str), {}, true);
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });

  it('should sanitize katex blocks', () => {
    const str = JSON.stringify({
      code: `sequenceDiagram
    participant A as Alice<img src="x" onerror="xssAttack()">$$\\text{Alice}$$
    A->>John: Hello John, how are you?`,
    });
    imgSnapshotTest(utf8ToB64(str), {}, true);
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });

  it('should sanitize labels', () => {
    const str = JSON.stringify({
      code: `erDiagram
    "<img src=x onerror=xssAttack()>" ||--|| ENTITY2 : "<img src=x onerror=xssAttack()>"
    `,
    });
    imgSnapshotTest(utf8ToB64(str), {}, true);
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
});
