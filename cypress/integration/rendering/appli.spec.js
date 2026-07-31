import { imgSnapshotTest } from '../../helpers/util.ts';

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
  it('Should render subgraphs with title margins and edge labels', () => {
    imgSnapshotTest(
      `flowchart LR

          subgraph TOP
              direction TB
              subgraph B1
                  direction RL
                  i1 --lb1-->f1
              end
              subgraph B2
                  direction BT
                  i2 --lb2-->f2
              end
          end
          A --lb3--> TOP --lb4--> B
          B1 --lb5--> B2
        `,
      { flowchart: { subGraphTitleMargin: { top: 10, bottom: 5 } } }
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
