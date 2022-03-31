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
  it('2: should render a simple gitgraph with commit on main branch with Id', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "One"
       commit id: "Two"
       commit id: "Three"
      `,
      {}
    );
  });
  it('3: should render a simple gitgraph with different commitTypes on main branch ', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "Normal Commit"
       commit id: "Reverse Commit" type: REVERSE
       commit id: "Hightlight Commit" type: HIGHLIGHT
      `,
      {}
    );
  });
  it('4: should render a simple gitgraph with tags commitTypes on main branch ', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "Normal Commit with tag" tag: "v1.0.0"
       commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
       commit id: "Hightlight Commit" type: HIGHLIGHT  tag: "8.8.4"
      `,
      {}
    );
  });
  it('5: should render a simple gitgraph with two branches', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "1"
       commit id: "2"
       branch develop
       checkout develop
       commit id: "3"
       commit id: "4"
       checkout main
       commit id: "5"
       commit id: "6"
      `,
      {}
    );
  });
  it('6: should render a simple gitgraph with two branches and merge commit', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "1"
       commit id: "2"
       branch develop
       checkout develop
       commit id: "3"
       commit id: "4"
       checkout main
       merge develop
       commit id: "5"
       commit id: "6"
      `,
      {}
    );
  });
  it('7: should render a simple gitgraph with three branches and merge commit', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "1"
       commit id: "2"
       branch nice_feature
       checkout nice_feature
       commit id: "3"
       checkout main
       commit id: "4"
       checkout nice_feature
       branch very_nice_feature
       checkout very_nice_feature
       commit id: "5"
       checkout main
       commit id: "6"
       checkout nice_feature
       commit id: "7"
       checkout main
       merge nice_feature
       checkout very_nice_feature
       commit id: "8"
       checkout main
       commit id: "9"
      `,
      {}
    );
  });
});
