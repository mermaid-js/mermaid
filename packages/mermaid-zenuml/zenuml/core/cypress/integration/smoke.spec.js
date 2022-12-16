/* eslint-disable no-undef */
import 'cypress-plugin-snapshots/commands';
describe('Smoke test', function () {
  it('should load the home page', function () {
    cy.visit('http://localhost:8080/cy/smoke.html');
    cy.wait(500);
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });

  it('interaction', function () {
    cy.visit('http://localhost:8080/cy/smoke-interaction.html');
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });

  it('return', function () {
    cy.visit('http://localhost:8080/cy/smoke-return.html');
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });

  it('creation', function () {
    cy.visit('http://localhost:8080/cy/smoke-creation.html');
    cy.wait(1500);
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });

  it('fragmentIssue', function () {
    cy.visit('http://localhost:8080/cy/smoke-fragment-issue.html');
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });

  it('fragment', function () {
    cy.visit('http://localhost:8080/cy/smoke-fragment.html');
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.005 },
      capture: 'viewport',
    });
  });
});
