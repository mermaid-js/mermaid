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
  it('7: should render a simple gitgraph with three branches and tagged merge commit', () => {
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
       merge nice_feature id: "12345" tag: "my merge commit"
       checkout very_nice_feature
       commit id: "8"
       checkout main
       commit id: "9"
      `,
      {}
    );
  });
  it('8: should render a simple gitgraph with more than 8 branchs &  overriding variables', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {
        'gitBranchLabel0': '#ffffff',
        'gitBranchLabel1': '#ffffff',
        'gitBranchLabel2': '#ffffff',
        'gitBranchLabel3': '#ffffff',
        'gitBranchLabel4': '#ffffff',
        'gitBranchLabel5': '#ffffff',
        'gitBranchLabel6': '#ffffff',
        'gitBranchLabel7': '#ffffff',
  } } }%%
  gitGraph
    checkout main
    branch branch1
    branch branch2
    branch branch3
    branch branch4
    branch branch5
    branch branch6
    branch branch7
    branch branch8
    branch branch9
    checkout branch1
    commit id: "1"
      `,
      {}
    );
  });
  it('9: should render a simple gitgraph with rotated labels', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'gitGraph': {
        'rotateCommitLabel': true
  } } }%%
        gitGraph
        commit id: "75f7219e83b321cd3fdde7dcf83bc7c1000a6828"
        commit id: "0db4784daf82736dec4569e0dc92980d328c1f2e"
        commit id: "7067e9973f9eaa6cd4a4b723c506d1eab598e83e"
        commit id: "66972321ad6c199013b5b31f03b3a86fa3f9817d"
      `,
      {}
    );
  });
  it('10: should render a simple gitgraph with horizontal labels', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'gitGraph': {
        'rotateCommitLabel': false
  } } }%%
        gitGraph
        commit id: "Alpha"
        commit id: "Beta"
        commit id: "Gamma"
        commit id: "Delta"
      `,
      {}
    );
  });
  it('11: should render a simple gitgraph with cherry pick commit', () => {
    imgSnapshotTest(
      `
    gitGraph
       commit id: "ZERO"
       branch develop
       commit id:"A"
       checkout main
       commit id:"ONE"
       checkout develop
       commit id:"B"
       checkout main
       commit id:"TWO"
       cherry-pick id:"A"
       commit id:"THREE"
       checkout develop
       commit id:"C"
      `,
      {}
    );
  });

  it('11: should render a simple gitgraph with two cherry pick commit', () => {
    imgSnapshotTest(
      `
    gitGraph
       commit id: "ZERO"
       branch develop
       commit id:"A"
       checkout main
       commit id:"ONE"
       checkout develop
       commit id:"B"
       branch featureA
       commit id:"FIX"
       commit id: "FIX-2"
       checkout main
       commit id:"TWO"
       cherry-pick id:"A"
       commit id:"THREE"
       cherry-pick id:"FIX"
       checkout develop
       commit id:"C"
       merge featureA
      `,
      {}
    );
  });

  it('12: should render commits for more than 8 branches', () => {
    imgSnapshotTest(
      `
      gitGraph
      checkout main
      commit
      checkout main
      branch branch1
      commit
      checkout main
      merge branch1
      branch branch2
      commit
      checkout main
      merge branch2
      branch branch3
      commit
      checkout main
      merge branch3
      branch branch4
      commit
      checkout main
      merge branch4
      branch branch5
      commit
      checkout main
      merge branch5
      branch branch6
      commit
      checkout main
      merge branch6
      branch branch7
      commit
      checkout main
      merge branch7
      branch branch8
      commit
      checkout main
      merge branch8
      branch branch9
      commit
      `,
      {}
    );
  });
});
