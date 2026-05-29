import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('Ditaa Diagram', () => {
  it('1: should render a single box', () => {
    imgSnapshotTest(
      `ditaa
+----------+
|          |
|  Client  |
|          |
+----------+`,
      {}
    );
  });

  it('2: should render two boxes with a connecting arrow', () => {
    imgSnapshotTest(
      `ditaa
+----------+         +------------+
|          |         |            |
|  Client  | ------> |  Webserver |
|          |         |            |
+----------+         +------------+`,
      {}
    );
  });

  it('3: should render a bidirectional arrow (https example)', () => {
    imgSnapshotTest(
      `ditaa
+----------+         +------------+
|          |  https  |            |
|  Client  | <-----> |  Webserver |
|          |         |            |
+----------+         +------------+`,
      {}
    );
  });

  it('4: should render the full three-box architecture diagram', () => {
    imgSnapshotTest(
      `ditaa
+----------+         +------------+         +-----------+
|          |  https  |            |  http   |   ocis    |
|  Client  | <-----> |  Webserver | <-----> |   proxy   |
|          |         |            |         |  service  |
+----------+         +------------+         +-----------+
                     ^                      ^
                     |                      |
                     |                      |
                 Termination             Unsecured`,
      {}
    );
  });

  it('5: should render a dashed box', () => {
    imgSnapshotTest(
      `ditaa
+======+
|      |
| DB   |
|      |
+======+`,
      {}
    );
  });

  it('6: should render dashed connector lines', () => {
    imgSnapshotTest(
      `ditaa
+------+         +------+
|  A   | ======> |  B   |
+------+         +------+`,
      {}
    );
  });

  it('7: should render free-floating text labels below boxes', () => {
    imgSnapshotTest(
      `ditaa
+----------+         +------------+
|          |         |            |
|  Client  | ------> |  Webserver |
|          |         |            |
+----------+         +------------+
                          |
                      Termination`,
      {}
    );
  });

  it('8: should render with dark theme', () => {
    imgSnapshotTest(
      `---
config:
  theme: dark
---
ditaa
+----------+         +------------+
|          |  https  |            |
|  Client  | <-----> |  Webserver |
|          |         |            |
+----------+         +------------+`,
      {}
    );
  });

  it('9: should render with forest theme', () => {
    imgSnapshotTest(
      `---
config:
  theme: forest
---
ditaa
+----------+         +------------+
|          |         |            |
|  Client  | ------> |  Webserver |
|          |         |            |
+----------+         +------------+`,
      {}
    );
  });

  it('10: should render with neutral theme', () => {
    imgSnapshotTest(
      `---
config:
  theme: neutral
---
ditaa
+----------+
|          |
|  Single  |
|   Box    |
|          |
+----------+`,
      {}
    );
  });

  it('11: should render a multi-row pipeline', () => {
    imgSnapshotTest(
      `ditaa
+-------+    +-------+    +-------+
| Step1 | -> | Step2 | -> | Step3 |
+-------+    +-------+    +-------+
                               |
                               v
                          +-------+
                          | Step4 |
                          +-------+`,
      {}
    );
  });

  it('12: should render a vertical connector', () => {
    imgSnapshotTest(
      `ditaa
+------+
|  Top |
+------+
   |
   |
   v
+------+
| Bot  |
+------+`,
      {}
    );
  });
});
