# Contributing Code

Code it the heart of every software project. We strive to make it better. Who if not us?

## Where is the Code Located?

The core of Mermaid is located under `packages/mermaid/src`.

## Running Mermaid Locally

**Host**

```bash
npx pnpm run dev
```

**Docker**

```bash
./run dev
```

After starting the dev server open <http://localhost:9000> in your browser.

Now you are ready to make your changes!

## Make Changes

Have a look at <http://localhost:9000>. There is a list of demos that can be used to see and test your changes.

If you need a specific diagram, you can duplicate the `example.html` file in `/demos/dev` and add your own mermaid code to your copy.

That will be served at <http://localhost:9000/dev/your-file-name.html>.
After making code changes, the dev server will rebuild the mermaid library. You will need to reload the browser page yourself to see the changes. (PRs for auto reload are welcome!)

Edit files in `packages/mermaid/src` as required.

## Write Tests

Tests ensure that each function, module, or part of code does what it says it will do. This is critically
important when other changes are made to ensure that existing code is not broken (no regression).

Just as important, the tests act as _specifications:_ they specify what the code does (or should do).
Whenever someone is new to a section of code, they should be able to read the tests to get a thorough understanding of what it does and why.

If you are fixing a bug, you should add tests to ensure that your code has actually fixed the bug, to specify/describe what the code is doing, and to ensure the bug doesn't happen again.
(If there had been a test for the situation, the bug never would have happened in the first place.)
You may need to change existing tests if they were inaccurate.

If you are adding a feature, you will definitely need to add tests. Depending on the size of your feature, you may need to add integration tests.

### Unit Tests

Unit tests are tests that test a single function or module. They are the easiest to write and the fastest to run.

Unit tests are mandatory all code except the renderers. (The renderers are tested with integration tests.)

We use [Vitest](https://vitest.dev) to run unit tests.

You can use the following command to run the unit tests:

```sh
pnpm test
```

When writing new tests, it's easier to have the tests automatically run as you make changes. You can do this by running the following command:

```sh
pnpm test:watch
```

### Integration/End-to-End (e2e) tests

These test the rendering and visual appearance of the diagrams.
This ensures that the rendering of that feature in the e2e will be reviewed in the release process going forward. Less chance that it breaks!

To start working with the e2e tests:

1. Run `pnpm dev` to start the dev server
2. Start **Cypress** by running `pnpm cypress:open`.

The rendering tests are very straightforward to create. There is a function `imgSnapshotTest`, which takes a diagram in text form and the mermaid options, and it renders that diagram in Cypress.

When running in CI it will take a snapshot of the rendered diagram and compare it with the snapshot from last build and flag it for review if it differs.

This is what a rendering test looks like:

```js
it('should render forks and joins', () => {
  imgSnapshotTest(
    `
    stateDiagram
    state fork_state &lt;&lt;fork&gt;&gt;
      [*] --> fork_state
      fork_state --> State2
      fork_state --> State3

      state join_state &lt;&lt;join&gt;&gt;
      State2 --> join_state
      State3 --> join_state
      join_state --> State4
      State4 --> [*]
    `,
    { logLevel: 0 }
  );
  cy.get('svg');
});
```

<!-- **_[TODO - running the tests against what is expected in development. ]_** -->
<!-- **_[TODO - how to generate new screenshots]_** -->

## Update Documentation

```tip
Our documentation is managed in `packages/mermaid/src/docs`. Details on how to edit is in the [documentation section](documentation)
```

If the users have no way to know that things have changed, then you haven't really _fixed_ anything for the users; you've just added to making Mermaid feel broken.
Likewise, if users don't know that there is a new feature that you've implemented, it will forever remain unknown and unused.

The documentation has to be updated to users know that things have changed and added!
If you are adding a new feature, add `(v<MERMAID_RELEASE_VERSION>+)` in the title or description. It will be replaced automatically with the current version number when the release happens.

eg: `# Feature Name (v<MERMAID_RELEASE_VERSION>+)`

We know it can sometimes be hard to code _and_ write user documentation.

Create another issue specifically for the documentation.  
You will need to help with the PR, but definitely ask for help if you feel stuck.
When it feels hard to write stuff out, explaining it to someone and having that person ask you clarifying questions can often be 80% of the work!

When in doubt, write up and submit what you can. It can be clarified and refined later. (With documentation, something is better than nothing!)
