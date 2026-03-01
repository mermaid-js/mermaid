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
  it('2: should render a simple gitgraph with commit on main branch with id', () => {
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
       commit id: "Highlight Commit" type: HIGHLIGHT
      `,
      {}
    );
  });
  it('4: should render a simple gitgraph with tags commitTypes on main branch ', () => {
    imgSnapshotTest(
      `gitGraph
       commit id: "Normal Commit with tag" tag: "v1.0.0"
       commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
       commit id: "Highlight Commit" type: HIGHLIGHT  tag: "8.8.4"
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
  it('8: should render a simple gitgraph with more than 8 branches &  overriding variables', () => {
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
  it('11: should render a gitgraph with cherry pick commit with custom tag', () => {
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
       cherry-pick id:"A" tag: "snapshot"
       commit id:"THREE"
       checkout develop
       commit id:"C"
      `,
      {}
    );
  });
  it('11: should render a gitgraph with cherry pick commit with no tag', () => {
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
       cherry-pick id:"A" tag: ""
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
      %% Make sure to manually set the id of all commits, for consistent visual tests
      commit id: "1-abcdefg"
      checkout main
      branch branch1
      commit id: "2-abcdefg"
      checkout main
      merge branch1
      branch branch2
      commit id: "3-abcdefg"
      checkout main
      merge branch2
      branch branch3
      commit id: "4-abcdefg"
      checkout main
      merge branch3
      branch branch4
      commit id: "5-abcdefg"
      checkout main
      merge branch4
      branch branch5
      commit id: "6-abcdefg"
      checkout main
      merge branch5
      branch branch6
      commit id: "7-abcdefg"
      checkout main
      merge branch6
      branch branch7
      commit id: "8-abcdefg"
      checkout main
      merge branch7
      branch branch8
      commit id: "9-abcdefg"
      checkout main
      merge branch8
      branch branch9
      commit id: "10-abcdefg"
      `,
      {}
    );
  });
  it('13: should render a simple gitgraph with three branches,custom merge commit id,tag,type', () => {
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
       merge nice_feature id: "customID" tag: "customTag" type: REVERSE
       checkout very_nice_feature
       commit id: "8"
       checkout main
       commit id: "9"
      `,
      {}
    );
  });
  it('1433: should render a simple gitgraph with a title', () => {
    imgSnapshotTest(
      `---
title: simple gitGraph
---
gitGraph
  commit id: "1-abcdefg"
`,
      {}
    );
  });
  it('15: should render a simple gitgraph with commit on main branch | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
       commit id: "1"
       commit id: "2"
       commit id: "3"
      `,
      {}
    );
  });
  it('16: should render a simple gitgraph with commit on main branch with id | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
       commit id: "One"
       commit id: "Two"
       commit id: "Three"
      `,
      {}
    );
  });
  it('17: should render a simple gitgraph with different commitTypes on main branch | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
       commit id: "Normal Commit"
       commit id: "Reverse Commit" type: REVERSE
       commit id: "Highlight Commit" type: HIGHLIGHT
      `,
      {}
    );
  });
  it('18: should render a simple gitgraph with tags commitTypes on main branch | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
       commit id: "Normal Commit with tag" tag: "v1.0.0"
       commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
       commit id: "Highlight Commit" type: HIGHLIGHT  tag: "8.8.4"
      `,
      {}
    );
  });
  it('19: should render a simple gitgraph with two branches | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
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
  it('20: should render a simple gitgraph with two branches and merge commit | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
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
  it('21: should render a simple gitgraph with three branches and tagged merge commit | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
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
  it('22: should render a simple gitgraph with more than 8 branches &  overriding variables | Vertical Branch', () => {
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
  gitGraph TB:
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
  it('23: should render a simple gitgraph with rotated labels | Vertical Branch', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'gitGraph': {
        'rotateCommitLabel': true
  } } }%%
        gitGraph TB:
        commit id: "75f7219e83b321cd3fdde7dcf83bc7c1000a6828"
        commit id: "0db4784daf82736dec4569e0dc92980d328c1f2e"
        commit id: "7067e9973f9eaa6cd4a4b723c506d1eab598e83e"
        commit id: "66972321ad6c199013b5b31f03b3a86fa3f9817d"
      `,
      {}
    );
  });
  it('24: should render a simple gitgraph with horizontal labels | Vertical Branch', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'gitGraph': {
        'rotateCommitLabel': false
  } } }%%
        gitGraph TB:
        commit id: "Alpha"
        commit id: "Beta"
        commit id: "Gamma"
        commit id: "Delta"
      `,
      {}
    );
  });
  it('25: should render a simple gitgraph with cherry pick commit | Vertical Branch', () => {
    imgSnapshotTest(
      `
    gitGraph TB:
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
  it('26: should render a gitgraph with cherry pick commit with custom tag | Vertical Branch', () => {
    imgSnapshotTest(
      `
    gitGraph TB:
       commit id: "ZERO"
       branch develop
       commit id:"A"
       checkout main
       commit id:"ONE"
       checkout develop
       commit id:"B"
       checkout main
       commit id:"TWO"
       cherry-pick id:"A" tag: "snapshot"
       commit id:"THREE"
       checkout develop
       commit id:"C"
      `,
      {}
    );
  });
  it('27: should render a gitgraph with cherry pick commit with no tag | Vertical Branch', () => {
    imgSnapshotTest(
      `
    gitGraph TB:
       commit id: "ZERO"
       branch develop
       commit id:"A"
       checkout main
       commit id:"ONE"
       checkout develop
       commit id:"B"
       checkout main
       commit id:"TWO"
       cherry-pick id:"A" tag: ""
       commit id:"THREE"
       checkout develop
       commit id:"C"
      `,
      {}
    );
  });
  it('28: should render a simple gitgraph with two cherry pick commit | Vertical Branch', () => {
    imgSnapshotTest(
      `
    gitGraph TB:
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
  it('29: should render commits for more than 8 branches | Vertical Branch', () => {
    imgSnapshotTest(
      `
      gitGraph TB:
      checkout main
      %% Make sure to manually set the id of all commits, for consistent visual tests
      commit id: "1-abcdefg"
      checkout main
      branch branch1
      commit id: "2-abcdefg"
      checkout main
      merge branch1
      branch branch2
      commit id: "3-abcdefg"
      checkout main
      merge branch2
      branch branch3
      commit id: "4-abcdefg"
      checkout main
      merge branch3
      branch branch4
      commit id: "5-abcdefg"
      checkout main
      merge branch4
      branch branch5
      commit id: "6-abcdefg"
      checkout main
      merge branch5
      branch branch6
      commit id: "7-abcdefg"
      checkout main
      merge branch6
      branch branch7
      commit id: "8-abcdefg"
      checkout main
      merge branch7
      branch branch8
      commit id: "9-abcdefg"
      checkout main
      merge branch8
      branch branch9
      commit id: "10-abcdefg"
      `,
      {}
    );
  });
  it('30: should render a simple gitgraph with three branches,custom merge commit id,tag,type | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
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
       merge nice_feature id: "customID" tag: "customTag" type: REVERSE
       checkout very_nice_feature
       commit id: "8"
       checkout main
       commit id: "9"
      `,
      {}
    );
  });
  it('31: should render a simple gitgraph with a title | Vertical Branch', () => {
    imgSnapshotTest(
      `---
title: simple gitGraph
---
gitGraph TB:
  commit id: "1-abcdefg"
`,
      {}
    );
  });
  it('32: should render a simple gitgraph overlapping commits | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
       commit id:"s1"
       commit id:"s2"
       branch branch1
       commit id:"s3"
       commit id:"s4"
       checkout main
       commit id:"s5"
       checkout branch1
       commit id:"s6"
       commit id:"s7"
       merge main
      `,
      {}
    );
  });
  it('33: should render a simple gitgraph overlapping commits', () => {
    imgSnapshotTest(
      `gitGraph
       commit id:"s1"
       commit id:"s2"
       branch branch1
       commit id:"s3"
       commit id:"s4"
       checkout main
       commit id:"s5"
       checkout branch1
       commit id:"s6"
       commit id:"s7"
       merge main
      `,
      {}
    );
  });
  it('34: should render a simple gitgraph with two branches from same commit', () => {
    imgSnapshotTest(
      `gitGraph
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      branch feature-001
      commit id:"3-abcdefg"
      commit id:"4-abcdefg"
      checkout main
      branch feature-002
      commit id:"5-abcdefg"
      checkout feature-001
      merge feature-002
      `,
      {}
    );
  });
  it('35: should render a simple gitgraph with two branches from same commit | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      branch feature-001
      commit id:"3-abcdefg"
      commit id:"4-abcdefg"
      checkout main
      branch feature-002
      commit id:"5-abcdefg"
      checkout feature-001
      merge feature-002
      `,
      {}
    );
  });
  it('36: should render GitGraph with branch that is not used immediately', () => {
    imgSnapshotTest(
      `gitGraph LR:
      commit id:"1-abcdefg"
      branch x
      checkout main
      commit id:"2-abcdefg"
      checkout x
      commit id:"3-abcdefg"
      checkout main
      merge x
      `,
      {}
    );
  });
  it('37: should render GitGraph with branch that is not used immediately | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      commit id:"1-abcdefg"
      branch x
      checkout main
      commit id:"2-abcdefg"
      checkout x
      commit id:"3-abcdefg"
      checkout main
      merge x
      `,
      {}
    );
  });
  it('38: should render GitGraph with branch and sub-branch neither of which used immediately', () => {
    imgSnapshotTest(
      `gitGraph LR:
      commit id:"1-abcdefg"
      branch x
      checkout main
      commit id:"2-abcdefg"
      checkout x
      commit id:"3-abcdefg"
      checkout main
      merge x
      checkout x
      branch y
      checkout x
      commit id:"4-abcdefg"
      checkout y
      commit id:"5-abcdefg"
      checkout x
      merge y
      `,
      {}
    );
  });
  it('39: should render GitGraph with branch and sub-branch neither of which used immediately | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      commit id:"1-abcdefg"
      branch x
      checkout main
      commit id:"2-abcdefg"
      checkout x
      commit id:"3-abcdefg"
      checkout main
      merge x
      checkout x
      branch y
      checkout x
      commit id:"4-abcdefg"
      checkout y
      commit id:"5-abcdefg"
      checkout x
      merge y
      `,
      {}
    );
  });
  it('40: should render a simple gitgraph with cherry pick merge commit', () => {
    imgSnapshotTest(
      `gitGraph
      commit id: "ZERO"
      branch feature
      branch release
      checkout feature
      commit id: "A"
      commit id: "B"
      checkout main
      merge feature id: "M"
      checkout release
      cherry-pick id: "M" parent:"B"`
    );
  });
  it('41: should render default GitGraph with parallelCommits set to false', () => {
    imgSnapshotTest(
      `gitGraph
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      branch develop
      commit id:"3-abcdefg"
      commit id:"4-abcdefg"
      checkout main
      branch feature
      commit id:"5-abcdefg"
      commit id:"6-abcdefg"
      checkout main
      commit id:"7-abcdefg"
      commit id:"8-abcdefg"
      `,
      { gitGraph: { parallelCommits: false } }
    );
  });
  it('42: should render GitGraph with parallel commits', () => {
    imgSnapshotTest(
      `gitGraph
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      branch develop
      commit id:"3-abcdefg"
      commit id:"4-abcdefg"
      checkout main
      branch feature
      commit id:"5-abcdefg"
      commit id:"6-abcdefg"
      checkout main
      commit id:"7-abcdefg"
      commit id:"8-abcdefg"
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('43: should render GitGraph with parallel commits | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      branch develop
      commit id:"3-abcdefg"
      commit id:"4-abcdefg"
      checkout main
      branch feature
      commit id:"5-abcdefg"
      commit id:"6-abcdefg"
      checkout main
      commit id:"7-abcdefg"
      commit id:"8-abcdefg"
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('44: should render GitGraph with unconnected branches and no parallel commits', () => {
    imgSnapshotTest(
      `gitGraph
      branch dev
      branch v2
      branch feat
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      checkout main
      commit id:"3-abcdefg"
      checkout dev
      commit id:"4-abcdefg"
      checkout v2
      commit id:"5-abcdefg"
      checkout main
      commit id:"6-abcdefg"
      `,
      { gitGraph: { parallelCommits: false } }
    );
  });
  it('45: should render GitGraph with unconnected branches and parallel commits', () => {
    imgSnapshotTest(
      `gitGraph
      branch dev
      branch v2
      branch feat
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      checkout main
      commit id:"3-abcdefg"
      checkout dev
      commit id:"4-abcdefg"
      checkout v2
      commit id:"5-abcdefg"
      checkout main
      commit id:"6-abcdefg"
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('46: should render GitGraph with unconnected branches and parallel commits | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      branch dev
      branch v2
      branch feat
      commit id:"1-abcdefg"
      commit id:"2-abcdefg"
      checkout main
      commit id:"3-abcdefg"
      checkout dev
      commit id:"4-abcdefg"
      checkout v2
      commit id:"5-abcdefg"
      checkout main
      commit id:"6-abcdefg"
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('46: should render GitGraph with merge back and merge forward', () => {
    imgSnapshotTest(
      `gitGraph LR:
      commit id:"1-abcdefg"

      branch branch-A
      branch branch-B
      commit id:"2-abcdefg"

      checkout branch-A
      merge branch-B

      checkout branch-B
      merge branch-A
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('47: should render GitGraph with merge back and merge forward | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      commit id:"1-abcdefg"

      branch branch-A
      branch branch-B
      commit id:"2-abcdefg"

      checkout branch-A
      merge branch-B

      checkout branch-B
      merge branch-A
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('48: should render GitGraph with merge on a new branch | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph LR:
      commit id:"1-abcdefg"

      branch branch-B order: 2
      commit id:"2-abcdefg"

      branch branch-A
      merge main

      checkout branch-B
      merge branch-A
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  it('49: should render GitGraph with merge on a new branch | Vertical Branch', () => {
    imgSnapshotTest(
      `gitGraph TB:
      commit id:"1-abcdefg"

      branch branch-B order: 2
      commit id:"2-abcdefg"

      branch branch-A
      merge main

      checkout branch-B
      merge branch-A
      `,
      { gitGraph: { parallelCommits: true } }
    );
  });
  describe('Git-Graph Bottom-to-Top Orientation Tests', () => {
    it('50: should render a simple gitgraph with commit on main branch | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
         commit id: "1"
         commit id: "2"
         commit id: "3"
        `,
        {}
      );
    });
    it('51: should render a simple gitgraph with commit on main branch with id | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
         commit id: "One"
         commit id: "Two"
         commit id: "Three"
        `,
        {}
      );
    });
    it('52: should render a simple gitgraph with different commitTypes on main branch | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
         commit id: "Normal Commit"
         commit id: "Reverse Commit" type: REVERSE
         commit id: "Highlight Commit" type: HIGHLIGHT
        `,
        {}
      );
    });
    it('53: should render a simple gitgraph with tags commitTypes on main branch | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
         commit id: "Normal Commit with tag" tag: "v1.0.0"
         commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
         commit id: "Highlight Commit" type: HIGHLIGHT  tag: "8.8.4"
        `,
        {}
      );
    });
    it('54: should render a simple gitgraph with two branches | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
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
    it('55: should render a simple gitgraph with two branches and merge commit | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
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
    it('56: should render a simple gitgraph with three branches and tagged merge commit | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
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
    it('57: should render a simple gitgraph with more than 8 branches &  overriding variables | Vertical Branch - Bottom-to-top', () => {
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
    gitGraph BT:
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
    it('58: should render a simple gitgraph with rotated labels | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'gitGraph': {
          'rotateCommitLabel': true
    } } }%%
          gitGraph BT:
          commit id: "75f7219e83b321cd3fdde7dcf83bc7c1000a6828"
          commit id: "0db4784daf82736dec4569e0dc92980d328c1f2e"
          commit id: "7067e9973f9eaa6cd4a4b723c506d1eab598e83e"
          commit id: "66972321ad6c199013b5b31f03b3a86fa3f9817d"
        `,
        {}
      );
    });
    it('59: should render a simple gitgraph with horizontal labels | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `%%{init: { 'logLevel': 'debug', 'theme': 'default' , 'gitGraph': {
          'rotateCommitLabel': false
    } } }%%
          gitGraph BT:
          commit id: "Alpha"
          commit id: "Beta"
          commit id: "Gamma"
          commit id: "Delta"
        `,
        {}
      );
    });
    it('60: should render a simple gitgraph with cherry pick commit | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `
      gitGraph BT:
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
    it('61: should render a gitgraph with cherry pick commit with custom tag | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `
      gitGraph BT:
         commit id: "ZERO"
         branch develop
         commit id:"A"
         checkout main
         commit id:"ONE"
         checkout develop
         commit id:"B"
         checkout main
         commit id:"TWO"
         cherry-pick id:"A" tag: "snapshot"
         commit id:"THREE"
         checkout develop
         commit id:"C"
        `,
        {}
      );
    });
    it('62: should render a gitgraph with cherry pick commit with no tag | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `
      gitGraph BT:
         commit id: "ZERO"
         branch develop
         commit id:"A"
         checkout main
         commit id:"ONE"
         checkout develop
         commit id:"B"
         checkout main
         commit id:"TWO"
         cherry-pick id:"A" tag: ""
         commit id:"THREE"
         checkout develop
         commit id:"C"
        `,
        {}
      );
    });
    it('63: should render a simple gitgraph with two cherry pick commit | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `
      gitGraph BT:
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
    it('64: should render commits for more than 8 branches | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `
        gitGraph BT:
        checkout main
        %% Make sure to manually set the id of all commits, for consistent visual tests
        commit id: "1-abcdefg"
        checkout main
        branch branch1
        commit id: "2-abcdefg"
        checkout main
        merge branch1
        branch branch2
        commit id: "3-abcdefg"
        checkout main
        merge branch2
        branch branch3
        commit id: "4-abcdefg"
        checkout main
        merge branch3
        branch branch4
        commit id: "5-abcdefg"
        checkout main
        merge branch4
        branch branch5
        commit id: "6-abcdefg"
        checkout main
        merge branch5
        branch branch6
        commit id: "7-abcdefg"
        checkout main
        merge branch6
        branch branch7
        commit id: "8-abcdefg"
        checkout main
        merge branch7
        branch branch8
        commit id: "9-abcdefg"
        checkout main
        merge branch8
        branch branch9
        commit id: "10-abcdefg"
        `,
        {}
      );
    });
    it('65: should render a simple gitgraph with three branches,custom merge commit id,tag,type | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
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
         merge nice_feature id: "customID" tag: "customTag" type: REVERSE
         checkout very_nice_feature
         commit id: "8"
         checkout main
         commit id: "9"
        `,
        {}
      );
    });
    it('66: should render a simple gitgraph with a title | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `---
  title: simple gitGraph
  ---
  gitGraph BT:
    commit id: "1-abcdefg"
  `,
        {}
      );
    });
    it('67: should render a simple gitgraph overlapping commits | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
         commit id:"s1"
         commit id:"s2"
         branch branch1
         commit id:"s3"
         commit id:"s4"
         checkout main
         commit id:"s5"
         checkout branch1
         commit id:"s6"
         commit id:"s7"
         merge main
        `,
        {}
      );
    });
    it('68: should render a simple gitgraph with two branches from same commit | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
        commit id:"1-abcdefg"
        commit id:"2-abcdefg"
        branch feature-001
        commit id:"3-abcdefg"
        commit id:"4-abcdefg"
        checkout main
        branch feature-002
        commit id:"5-abcdefg"
        checkout feature-001
        merge feature-002
        `,
        {}
      );
    });
    it('69: should render GitGraph with branch that is not used immediately | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
        commit id:"1-abcdefg"
        branch x
        checkout main
        commit id:"2-abcdefg"
        checkout x
        commit id:"3-abcdefg"
        checkout main
        merge x
        `,
        {}
      );
    });
    it('70: should render GitGraph with branch and sub-branch neither of which used immediately | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
        commit id:"1-abcdefg"
        branch x
        checkout main
        commit id:"2-abcdefg"
        checkout x
        commit id:"3-abcdefg"
        checkout main
        merge x
        checkout x
        branch y
        checkout x
        commit id:"4-abcdefg"
        checkout y
        commit id:"5-abcdefg"
        checkout x
        merge y
        `,
        {}
      );
    });
    it('71: should render GitGraph with parallel commits | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
        commit id:"1-abcdefg"
        commit id:"2-abcdefg"
        branch develop
        commit id:"3-abcdefg"
        commit id:"4-abcdefg"
        checkout main
        branch feature
        commit id:"5-abcdefg"
        commit id:"6-abcdefg"
        checkout main
        commit id:"7-abcdefg"
        commit id:"8-abcdefg"
        `,
        { gitGraph: { parallelCommits: true } }
      );
    });
    it('72: should render GitGraph with unconnected branches and parallel commits | Vertical Branch - Bottom-to-top', () => {
      imgSnapshotTest(
        `gitGraph BT:
        branch dev
        branch v2
        branch feat
        commit id:"1-abcdefg"
        commit id:"2-abcdefg"
        checkout main
        commit id:"3-abcdefg"
        checkout dev
        commit id:"4-abcdefg"
        checkout v2
        commit id:"5-abcdefg"
        checkout main
        commit id:"6-abcdefg"
        `,
        { gitGraph: { parallelCommits: true } }
      );
    });
    it('73: should render a simple gitgraph with three branches and tagged merge commit using switch instead of checkout', () => {
      imgSnapshotTest(
        `gitGraph
         commit id: "1"
         commit id: "2"
         branch nice_feature
         switch nice_feature
         commit id: "3"
         switch main
         commit id: "4"
         switch nice_feature
         branch very_nice_feature
         switch very_nice_feature
         commit id: "5"
         switch main
         commit id: "6"
         switch nice_feature
         commit id: "7"
         switch main
         merge nice_feature id: "12345" tag: "my merge commit"
         switch very_nice_feature
         commit id: "8"
         switch main
         commit id: "9"
        `,
        {}
      );
    });
    it('74: should render commits for more than 8 branches using switch instead of checkout', () => {
      imgSnapshotTest(
        `
        gitGraph
        switch main
        %% Make sure to manually set the id of all commits, for consistent visual tests
        commit id: "1-abcdefg"
        switch main
        branch branch1
        commit id: "2-abcdefg"
        switch main
        merge branch1
        branch branch2
        commit id: "3-abcdefg"
        switch main
        merge branch2
        branch branch3
        commit id: "4-abcdefg"
        switch main
        merge branch3
        branch branch4
        commit id: "5-abcdefg"
        switch main
        merge branch4
        branch branch5
        commit id: "6-abcdefg"
        switch main
        merge branch5
        branch branch6
        commit id: "7-abcdefg"
        switch main
        merge branch6
        branch branch7
        commit id: "8-abcdefg"
        switch main
        merge branch7
        branch branch8
        commit id: "9-abcdefg"
        switch main
        merge branch8
        branch branch9
        commit id: "10-abcdefg"
        `,
        {}
      );
    });
    it('75: should render a gitGraph with multiple tags on a merge commit on bottom-to-top orientation', () => {
      imgSnapshotTest(
        `gitGraph BT:
        commit id: "ZERO"
        branch develop
        commit id:"A"
        checkout main
        commit id:"ONE"
        checkout develop
        commit id:"B"
        checkout main
        merge develop id:"Release 1.0" type:HIGHLIGHT tag: "SAML v2.0" tag: "OpenID v1.1"
        commit id:"TWO"
        checkout develop
        commit id:"C"`,
        {}
      );
    });
    it('76: should render a BT gitGraph with branch ordering and merge from right branch | Regression #6593', () => {
      imgSnapshotTest(
        `gitGraph BT:
    commit id: "A"
    branch develop order: 3
    checkout develop
    commit id: "B"
    branch release/1.0.0 order: 2
    checkout release/1.0.0
    commit id: "C"
    commit id: "D"
    checkout main
    merge release/1.0.0 tag: "v1.0.0"
    checkout develop`,
        {}
      );
    });
    it('77: should render a BT gitGraph with three branches and multiple merges | Regression #6593', () => {
      imgSnapshotTest(
        `gitGraph BT:
  commit id: "1"
  commit id: "2"
  branch nice_feature
  checkout main
  commit id: "3"
  checkout nice_feature
  commit id: "4"
  checkout main
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
  merge very_nice_feature`,
        {}
      );
    });
    it('78: should render a BT gitGraph with cherry-pick | Regression #6593', () => {
      imgSnapshotTest(
        `gitGraph BT:
  commit id: "ZERO"
  branch develop
  commit id:"A"
  checkout main
  commit id:"ONE"
  checkout develop
  commit id:"B"
  checkout main
  commit id:"TWO"
  cherry-pick id:"A" tag: "cherry-picked"
  commit id:"THREE"
  checkout develop
  commit id:"C"`,
        {}
      );
    });
    it('79: should render a BT gitGraph with two cherry-picks | Regression #6593', () => {
      imgSnapshotTest(
        `gitGraph BT:
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
  checkout main
  cherry-pick id:"C"
  commit id:"FOUR"`,
        {}
      );
    });
  });
  it('76: should render a gitGraph with multiple tags on a merge commit on left-to-right orientation', () => {
    imgSnapshotTest(
      `gitGraph
    commit id: "ZERO"
    branch develop
    commit id:"A"
    checkout main
    commit id:"ONE"
    checkout develop
    commit id:"B"
    checkout main
    merge develop id:"Release 1.0" type:HIGHLIGHT tag: "SAML v2.0" tag: "OpenID v1.1"
    commit id:"TWO"
    checkout develop
    commit id:"C"`,
      {}
    );
  });

  describe('showBranches and showCommitLabel directives', () => {
    it('77: should show branch lines when showBranches is true (default)', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('78: should hide branch lines when showBranches is false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: false
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('79: should show commit labels when showCommitLabel is true (default)', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('80: should hide commit labels when showCommitLabel is false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: false
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('81: should show both branches and commit labels when both directives are true (default)', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
         ---
          gitGraph
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

    it('82: should hide both branches and commit labels when both directives are false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: false
              showCommitLabel: false
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('83: should show branch lines with merge commits when showBranches is true', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('84: should hide branch lines with merge commits when showBranches is false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: false
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
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

    it('85: should show commit labels with tags when showCommitLabel is true', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
            commit id: "1" tag: "v1.0"
            commit id: "2"
            branch develop
            checkout develop
            commit id: "3" tag: "v1.1"
            commit id: "4"
            checkout main
            merge develop tag: "v2.0"
            commit id: "5"
        `,
        {}
      );
    });

    it('86: should hide commit labels with tags when showCommitLabel is false', () => {
      imgSnapshotTest(
        `---
        config:
          gitGraph:
            showBranches: true
            showCommitLabel: false
            rotateCommitLabel: false
            parallelCommits: false
        ---
        gitGraph
          commit id: "1" tag: "v1.0"
          commit id: "2"
          branch develop
          checkout develop
          commit id: "3" tag: "v1.1"
          commit id: "4"
          checkout main
          merge develop tag: "v2.0"
          commit id: "5"
        `,
        {}
      );
    });

    it('87: should show branches with TB orientation when showBranches is true', () => {
      imgSnapshotTest(
        `---
        config:
          gitGraph:
            showBranches: true
            showCommitLabel: true
            rotateCommitLabel: false
            parallelCommits: false
        ---
        gitGraph TB:
          commit id: "1"
          commit id: "2"
          branch develop
          checkout develop
          commit id: "3"
          commit id: "4"
          checkout main
          commit id: "5"
        `,
        {}
      );
    });

    it('88: should hide branches with TB orientation when showBranches is false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: false
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph TB:
            commit id: "1"
            commit id: "2"
            branch develop
            checkout develop
            commit id: "3"
            commit id: "4"
            checkout main
            commit id: "5"
        `,
        {}
      );
    });

    it('89: should show commit labels with BT orientation when showCommitLabel is true', () => {
      imgSnapshotTest(
        `---
        config:
          gitGraph:
            showBranches: true
            showCommitLabel: true
            rotateCommitLabel: false
            parallelCommits: false
        ---
        gitGraph BT:
          commit id: "1"
          commit id: "2"
          branch develop
          checkout develop
          commit id: "3"
          commit id: "4"
          checkout main
          commit id: "5"
        `,
        {}
      );
    });

    it('90: should hide commit labels with BT orientation when showCommitLabel is false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: false
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph BT:
            commit id: "1"
            commit id: "2"
            branch develop
            checkout develop
            commit id: "3"
            commit id: "4"
            checkout main
            commit id: "5"
        `,
        {}
      );
    });

    it('91: should render with rotateCommitLabel set to true', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: true
              parallelCommits: false
          ---
          gitGraph
            commit id: "Alpha"
            commit id: "Beta"
            branch develop
            checkout develop
            commit id: "Gamma"
            commit id: "Delta"
            checkout main
            commit id: "Epsilon"
        `,
        {}
      );
    });

    it('92: should render with rotateCommitLabel set to false', () => {
      imgSnapshotTest(
        `---
        config:
          gitGraph:
            showBranches: true
            showCommitLabel: true
            rotateCommitLabel: false
            parallelCommits: false
        ---
        gitGraph
          commit id: "Alpha"
          commit id: "Beta"
          branch develop
          checkout develop
          commit id: "Gamma"
          commit id: "Delta"
          checkout main
          commit id: "Epsilon"
        `,
        {}
      );
    });

    it('93: should render with parallelCommits set to true', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: true
          ---
          gitGraph
            commit id: "1"
            commit id: "2"
            branch develop
            branch feature
            checkout develop
            commit id: "3"
            checkout feature
            commit id: "4"
            checkout main
            commit id: "5"
            checkout develop
            commit id: "6"
            checkout feature
            commit id: "7"
        `,
        {}
      );
    });

    it('94: should render with parallelCommits set to false', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
          ---
          gitGraph
            commit id: "1"
            commit id: "2"
            branch develop
            branch feature
            checkout develop
            commit id: "3"
            checkout feature
            commit id: "4"
            checkout main
            commit id: "5"
            checkout develop
            commit id: "6"
            checkout feature
            commit id: "7"
        `,
        {}
      );
    });

    it('95: should render with custom mainBranchName', () => {
      imgSnapshotTest(
        `---
        config:
          gitGraph:
            showBranches: true
            showCommitLabel: true
            rotateCommitLabel: false
            parallelCommits: false
            mainBranchName: 'trunk'
        ---
        gitGraph
          commit id: "1"
          commit id: "2"
          branch develop
          checkout develop
          commit id: "3"
          commit id: "4"
          checkout trunk
          commit id: "5"
          commit id: "6"
        `,
        {}
      );
    });

    it('96: should render with custom mainBranchOrder', () => {
      imgSnapshotTest(
        `---
          config:
            gitGraph:
              showBranches: true
              showCommitLabel: true
              rotateCommitLabel: false
              parallelCommits: false
              mainBranchOrder: 2
          ---
          gitGraph
            commit id: "1"
            branch feature1
            branch feature2
            checkout feature1
            commit id: "2"
            checkout feature2
            commit id: "3"
            checkout main
            commit id: "4"
        `,
        {}
      );
    });
  });
});
