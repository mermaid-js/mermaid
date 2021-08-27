/* eslint-env jest */
import { mermaidUrl } from '../../helpers/util.js';

/* eslint-disable */
describe('XSS', () => {
  it('should handle xss in tags', () => {
    const str = 'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19';

    const url = mermaidUrl(str,{}, true);

    cy.visit(url);
    cy.wait(1000).then(()=>{
      cy.get('.mermaid').should('exist');
    });
    cy.get('svg')
  })

  it('should not allow tags in the css', () => {
    const str = 'eyJjb2RlIjoiJSV7aW5pdDogeyAnZm9udEZhbWlseSc6ICdcXFwiPjwvc3R5bGU-PGltZyBzcmM9eCBvbmVycm9yPXhzc0F0dGFjaygpPid9IH0lJVxuZ3JhcGggTFJcbiAgICAgQSAtLT4gQiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwiZmxvd2NoYXJ0Ijp7Imh0bWxMYWJlbHMiOmZhbHNlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9';

    const url = mermaidUrl(str,{
      "theme": "default",
      "flowchart": {
        "htmlMode": false
      }
    }, true);

    cy.visit(url);
    cy.wait(1000).then(()=>{
      cy.get('#the-malware').should('not.exist');
    });

  })

  it('should handle xss in tags in non-html mode', () => {
    const str = 'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwiZmxvd2NoYXJ0Ijp7Imh0bWxMYWJlbHMiOmZhbHNlfX19';

    const url = mermaidUrl(str,{
      "theme": "default",
      "flowchart": {
        "htmlMode": false
      }
    }, true);

    cy.visit(url);
    cy.wait(1000)

    cy.get('#the-malware').should('not.exist');
  })

  it('should not allow changing the __proto__ attribute using config', () => {
    cy.visit('http://localhost:9000/xss2.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  })
  it('should not allow maniplulating htmlLabels into a false positive', () => {
    cy.visit('http://localhost:9000/xss4.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  })
  it('should not allow maniplulating antiscript to run javascript', () => {
    cy.visit('http://localhost:9000/xss5.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  })
  it('should not allow maniplulating antiscript to run javascript using onerror', () => {
    cy.visit('http://localhost:9000/xss6.html');
    cy.wait(1000);
    cy.get('#the-malware').should('not.exist');
  })

})
