/* eslint-env jest */
import { mermaidUrl } from '../../helpers/util.js';

/* eslint-disable */
describe('XSS', () => {
  it('should handle xss in tags', () => {
    const str = 'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19';

    const url = mermaidUrl(str,{}, true);

    cy.visit(url);
    cy.get('svg')
    cy.percySnapshot()

  })
})
