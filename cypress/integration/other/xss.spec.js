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
    // cy.percySnapshot()

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
    // cy.get('svg')
    // cy.percySnapshot()
    cy.get('.malware').should('not.exist');

  })
})
