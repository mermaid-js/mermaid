# End to end tests

These tests are end to end tests in the sense that they actually render a full diagram in the browser. The purpose of these tests is to simplify handling of merge requests and releases by highlighting possible unexpected side-effects.

Apart from beeing rendered in a browser the tests perform image snapshots of the diagrams. The tests is handled in the same way as regular jest snapshots tests with the difference that an image comparison is performed instead of a comparison of the generated code.

## To run the tests
1. Start the dev server by running **yarn dev**
2. Run yarn e2e to run the tests