/* eslint-disable no-undef */
import 'cypress-plugin-snapshots/commands';
describe('Defect 406', function () {
  it('Fragments under Creation', function () {
    cy.visit('http://localhost:8080/cy/defect-406-alt-under-creation.html');
    cy.wait(1500);
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });
});
