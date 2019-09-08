# End to end tests

These tests are end to end tests in the sense that they actually render a full diagram in the browser. The purpose of these tests is to simplify handling of merge requests and releases by highlighting possible unexpected side-effects.

Apart from beeing rendered in a browser the tests perform image snapshots of the diagrams. The tests is handled in the same way as regular jest snapshots tests with the difference that an image comparison is performed instead of a comparison of the generated code.

## To run the tests
1. Start the dev server by running ***yarn dev***
2. Run yarn e2e to run the tests

## Recomended way of working

If you are working with an issue you wanto to fix. Start with making a e2e test that show the issue.

Add otions for the e2e tests to log the dev server url as in the example below.

```
    await imgSnapshotTest(page, `
      graph LR
        foo-->bar

        style foo fill:#F99,stroke-width:2px,stroke:#F0F
        style bar fill:#999,color: #ffffff, stroke-width:10px,stroke:#0F0
      `,
    {
      listUrl: true,
      listId: 'color'
      logLevel: 0
    })
```

Open the url in the dev server and fix the issue.

This way if working makes it easy to have render a graph you want to work with ands ensures that the e2e suit is expanded.