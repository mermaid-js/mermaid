import { imgSnapshotTest } from '../../helpers/util.js';

describe('Git Graph diagram', () => {
  it('1: should render a simple gitgraph with commit on main branch', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "1"
       commit id: "2"
       commit id: "3"
      `,
      {}
    );
  });
  // it(`ultraFastTest`, function () {
  //   // Navigate to the url we want to test
  //   // ⭐️ Note to see visual bugs, run the test using the above URL for the 1st run.
  //   // but then change the above URL to https://demo.applitools.com/index_v2.html
  //   // (for the 2nd run)
  //   cy.visit('https://demo.applitools.com');

  //   // Call Open on eyes to initialize a test session
  //   cy.eyesOpen({
  //     appName: 'Demo App',
  //     testName: 'UltraFast grid demo',
  //   });

  //   // check the login page with fluent api, see more info here
  //   // https://applitools.com/docs/topics/sdk/the-eyes-sdk-check-fluent-api.html
  //   cy.eyesCheckWindow({
  //     tag: 'Login Window',
  //     target: 'window',
  //     fully: true,
  //   });

  //   cy.get('#log-in').click();

  //   // Check the app page
  //   cy.eyesCheckWindow({
  //     tag: 'App Window',
  //     target: 'window',
  //     fully: true,
  //   });

  //   // Call Close on eyes to let the server know it should display the results
  //   cy.eyesClose();
  // });
  // it('works', () => {
  //   cy.visit('https://applitools.com/helloworld');
  //   cy.eyesOpen({
  //     appName: 'Hello World!',
  //     testName: 'My first JavaScript test!',
  //     browser: { width: 800, height: 600 },
  //   });
  //   cy.eyesCheckWindow('Main Page');
  //   cy.get('button').click();
  //   cy.eyesCheckWindow('Click!');
  //   cy.eyesClose();
  // });
});
