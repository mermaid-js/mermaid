import { mermaidUrl } from '../../helpers/util.ts';
describe('XSS', () => {
  it('should handle xss in tags', () => {
    const str =
      'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19';

    const url = mermaidUrl(str, {}, true);

    cy.visit(url);
    cy.wait(1000).then(() => {
      cy.get('.mermaid').should('exist');
    });
    cy.get('svg');
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
    cy.visit('http://localhost:9000/xss2.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating htmlLabels into a false positive', () => {
    cy.visit('http://localhost:9000/xss4.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript', () => {
    cy.visit('http://localhost:9000/xss5.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror', () => {
    cy.visit('http://localhost:9000/xss6.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre wrapper', () => {
    cy.visit('http://localhost:9000/xss8.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.on('uncaught:exception', (_err, _runnable) => {
      return false; // continue rendering even if there if mermaid throws an error
    });
    cy.visit('http://localhost:9000/xss9.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('http://localhost:9000/xss10.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('http://localhost:9000/xss11.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('http://localhost:9000/xss12.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript using onerror in state diagrams with dagre d3', () => {
    cy.visit('http://localhost:9000/xss13.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should not allow manipulating antiscript to run javascript iframes in class diagrams', () => {
    cy.visit('http://localhost:9000/xss14.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize cardinalities properly in class diagrams', () => {
    cy.visit('http://localhost:9000/xss18.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize colons properly', () => {
    cy.visit('http://localhost:9000/xss20.html');
    cy.wait(1000);
    cy.get('a').click('');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize colons properly', () => {
    cy.visit('http://localhost:9000/xss21.html');
    cy.wait(1000);
    cy.get('a').click('');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
  it('should sanitize backticks in class names properly', () => {
    cy.visit('http://localhost:9000/xss24.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  });
});
