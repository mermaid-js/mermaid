import { imgSnapshotTest } from '../../helpers/util.js';

describe('Git Graph diagram', () => {
  it('1: should render a simple gitgraph with commit on main branch', () => {
    imgSnapshotTest(
      `gitGraph
       commit
       commit
       commit
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
       commit id: "Reverse Commit" commitType: REVERSE
       commit id: "Hightlight Commit" commitType: HIGHLIGHT
      `,
      {}
    );
  });
  it('4: should render a simple gitgraph with tags commitTypes on main branch ', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "Normal Commit with tag" teg: "v1.0.0"
       commit id: "Reverse Commit with tag" commitType: REVERSE tag: "RC_1"
       commit id: "Hightlight Commit" commitType: HIGHLIGHT  tag: "8.8.4"
      `,
      {}
    );
  });
  it('5: should render a simple gitgraph with two branches', () => {
    imgSnapshotTest(
      `gitGraph
       commit 
       commit
       branch develop
       checkout develop
       commit
       commit
       checkout main
       commit 
       commit 
      `,
      {}
    );
  });
  it('6: should render a simple gitgraph with two branches and merge commit', () => {
    imgSnapshotTest(
      `gitGraph
       commit 
       commit
       branch develop
       checkout develop
       commit
       commit
       checkout main
       merge develop
       commit 
       commit 
      `,
      {}
    );
  });
  it('7: should render a simple gitgraph with three branches and merge commit', () => {
    imgSnapshotTest(
      `gitGraph
       commit 
       commit
       branch nice_feature
       checkout nice_feature
       commit
       checkout main
       commit
       checkout nice_feature
       branch very_nice_feature
       checkout very_nice_feature
       commit
       checkout main
       commit
       checkout nice_feature
       commit
       checkout main
       merge nice_feature
       checkout very_nice_feature
       commit
       checkout main
       commit 
      `,
      {}
    );
  });
});
