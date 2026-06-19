import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Git Graph diagram', () => {
  test('1: should render a simple gitgraph with commit on main branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph
       commit id: "1"
       commit id: "2"
       commit id: "3"
      `,
      {}
    );
  });
  test('2: should render a simple gitgraph with commit on main branch with id', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph
       commit id: "One"
       commit id: "Two"
       commit id: "Three"
      `,
      {}
    );
  });
  test('3: should render a simple gitgraph with different commitTypes on main branch ', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph
       commit id: "Normal Commit"
       commit id: "Reverse Commit" type: REVERSE
       commit id: "Highlight Commit" type: HIGHLIGHT
      `,
      {}
    );
  });
  test('4: should render a simple gitgraph with tags commitTypes on main branch ', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph
       commit id: "Normal Commit with tag" tag: "v1.0.0"
       commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
       commit id: "Highlight Commit" type: HIGHLIGHT  tag: "8.8.4"
      `,
      {}
    );
  });
  test('5: should render a simple gitgraph with two branches', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('6: should render a simple gitgraph with two branches and merge commit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('7: should render a simple gitgraph with three branches and tagged merge commit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('8: should render a simple gitgraph with more than 8 branches &  overriding variables', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('9: should render a simple gitgraph with rotated labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('10: should render a simple gitgraph with horizontal labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('11: should render a simple gitgraph with cherry pick commit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('11: should render a gitgraph with cherry pick commit with custom tag', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('11: should render a gitgraph with cherry pick commit with no tag', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('11: should render a simple gitgraph with two cherry pick commit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('12: should render commits for more than 8 branches', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('13: should render a simple gitgraph with three branches,custom merge commit id,tag,type', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('1433: should render a simple gitgraph with a title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: simple gitGraph
---
gitGraph
  commit id: "1-abcdefg"
`,
      {}
    );
  });
  test('15: should render a simple gitgraph with commit on main branch | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph TB:
       commit id: "1"
       commit id: "2"
       commit id: "3"
      `,
      {}
    );
  });
  test('16: should render a simple gitgraph with commit on main branch with id | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph TB:
       commit id: "One"
       commit id: "Two"
       commit id: "Three"
      `,
      {}
    );
  });
  test('17: should render a simple gitgraph with different commitTypes on main branch | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph TB:
       commit id: "Normal Commit"
       commit id: "Reverse Commit" type: REVERSE
       commit id: "Highlight Commit" type: HIGHLIGHT
      `,
      {}
    );
  });
  test('18: should render a simple gitgraph with tags commitTypes on main branch | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph TB:
       commit id: "Normal Commit with tag" tag: "v1.0.0"
       commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
       commit id: "Highlight Commit" type: HIGHLIGHT  tag: "8.8.4"
      `,
      {}
    );
  });
  test('19: should render a simple gitgraph with two branches | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('20: should render a simple gitgraph with two branches and merge commit | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('21: should render a simple gitgraph with three branches and tagged merge commit | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('22: should render a simple gitgraph with more than 8 branches &  overriding variables | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('23: should render a simple gitgraph with rotated labels | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('24: should render a simple gitgraph with horizontal labels | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('25: should render a simple gitgraph with cherry pick commit | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('26: should render a gitgraph with cherry pick commit with custom tag | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('27: should render a gitgraph with cherry pick commit with no tag | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('28: should render a simple gitgraph with two cherry pick commit | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('29: should render commits for more than 8 branches | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('30: should render a simple gitgraph with three branches,custom merge commit id,tag,type | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('31: should render a simple gitgraph with a title | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: simple gitGraph
---
gitGraph TB:
  commit id: "1-abcdefg"
`,
      {}
    );
  });
  test('32: should render a simple gitgraph overlapping commits | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('33: should render a simple gitgraph overlapping commits', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('34: should render a simple gitgraph with two branches from same commit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('35: should render a simple gitgraph with two branches from same commit | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('36: should render GitGraph with branch that is not used immediately', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('37: should render GitGraph with branch that is not used immediately | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('38: should render GitGraph with branch and sub-branch neither of which used immediately', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('39: should render GitGraph with branch and sub-branch neither of which used immediately | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('40: should render a simple gitgraph with cherry pick merge commit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('41: should render default GitGraph with parallelCommits set to false', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('42: should render GitGraph with parallel commits', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('43: should render GitGraph with parallel commits | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('44: should render GitGraph with unconnected branches and no parallel commits', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('45: should render GitGraph with unconnected branches and parallel commits', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('46: should render GitGraph with unconnected branches and parallel commits | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('46: should render GitGraph with merge back and merge forward', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('47: should render GitGraph with merge back and merge forward | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('48: should render GitGraph with merge on a new branch | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test('49: should render GitGraph with merge on a new branch | Vertical Branch', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
  test.describe('Git-Graph Bottom-to-Top Orientation Tests', () => {
    test('50: should render a simple gitgraph with commit on main branch | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `gitGraph BT:
         commit id: "1"
         commit id: "2"
         commit id: "3"
        `,
        {}
      );
    });
    test('51: should render a simple gitgraph with commit on main branch with id | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `gitGraph BT:
         commit id: "One"
         commit id: "Two"
         commit id: "Three"
        `,
        {}
      );
    });
    test('52: should render a simple gitgraph with different commitTypes on main branch | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `gitGraph BT:
         commit id: "Normal Commit"
         commit id: "Reverse Commit" type: REVERSE
         commit id: "Highlight Commit" type: HIGHLIGHT
        `,
        {}
      );
    });
    test('53: should render a simple gitgraph with tags commitTypes on main branch | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `gitGraph BT:
         commit id: "Normal Commit with tag" tag: "v1.0.0"
         commit id: "Reverse Commit with tag" type: REVERSE tag: "RC_1"
         commit id: "Highlight Commit" type: HIGHLIGHT  tag: "8.8.4"
        `,
        {}
      );
    });
    test('54: should render a simple gitgraph with two branches | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('55: should render a simple gitgraph with two branches and merge commit | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('56: should render a simple gitgraph with three branches and tagged merge commit | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('57: should render a simple gitgraph with more than 8 branches &  overriding variables | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('58: should render a simple gitgraph with rotated labels | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('59: should render a simple gitgraph with horizontal labels | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('60: should render a simple gitgraph with cherry pick commit | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('61: should render a gitgraph with cherry pick commit with custom tag | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('62: should render a gitgraph with cherry pick commit with no tag | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('63: should render a simple gitgraph with two cherry pick commit | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('64: should render commits for more than 8 branches | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('65: should render a simple gitgraph with three branches,custom merge commit id,tag,type | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('66: should render a simple gitgraph with a title | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `---
  title: simple gitGraph
  ---
  gitGraph BT:
    commit id: "1-abcdefg"
  `,
        {}
      );
    });
    test('67: should render a simple gitgraph overlapping commits | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('68: should render a simple gitgraph with two branches from same commit | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('69: should render GitGraph with branch that is not used immediately | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('70: should render GitGraph with branch and sub-branch neither of which used immediately | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('71: should render GitGraph with parallel commits | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('72: should render GitGraph with unconnected branches and parallel commits | Vertical Branch - Bottom-to-top', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('73: should render a simple gitgraph with three branches and tagged merge commit using switch instead of checkout', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('74: should render commits for more than 8 branches using switch instead of checkout', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('75: should render a gitGraph with multiple tags on a merge commit on bottom-to-top orientation', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('76: should render a BT gitGraph with branch ordering and merge from right branch | Regression #6593', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('77: should render a BT gitGraph with three branches and multiple merges | Regression #6593', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('78: should render a BT gitGraph with cherry-pick | Regression #6593', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
    test('79: should render a BT gitGraph with two cherry-picks | Regression #6593', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
  test('76: should render a gitGraph with multiple tags on a merge commit on left-to-right orientation', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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

  test.describe('showBranches and showCommitLabel directives', () => {
    test('77: should show branch lines when showBranches is true (default)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('78: should hide branch lines when showBranches is false', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('79: should show commit labels when showCommitLabel is true (default)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('80: should hide commit labels when showCommitLabel is false', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('81: should show both branches and commit labels when both directives are true (default)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('82: should hide both branches and commit labels when both directives are false', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('83: should show branch lines with merge commits when showBranches is true', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('84: should hide branch lines with merge commits when showBranches is false', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('85: should show commit labels with tags when showCommitLabel is true', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('86: should hide commit labels with tags when showCommitLabel is false', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('87: should show branches with TB orientation when showBranches is true', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('88: should hide branches with TB orientation when showBranches is false', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('89: should show commit labels with BT orientation when showCommitLabel is true', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('90: should hide commit labels with BT orientation when showCommitLabel is false', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('91: should render with rotateCommitLabel set to true', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('92: should render with rotateCommitLabel set to false', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('93: should render with parallelCommits set to true', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('94: should render with parallelCommits set to false', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('95: should render with custom mainBranchName', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('96: should render with custom mainBranchOrder', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

  test('97: should render branch labels with multi-line text aligned with background in LR layout', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `gitGraph LR:
         commit id: "1"
         branch "Feature A\n(ongoing)"
         commit id: "2"
         commit id: "3"
         checkout main
         commit id: "4"
         commit id: "5"
      `,
      {}
    );
  });
});
