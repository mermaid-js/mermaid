import { imgSnapshotTest } from '../../../helpers/util.ts';

const neoThemes = ['neo', 'neo-dark', 'redux', 'redux-dark', 'redux-color', 'redux-dark-color'];

const examples = [
  {
    // Covers: all three commit types (NORMAL/REVERSE/HIGHLIGHT); id+type+tag combined on one commit;
    // merge with id/tag/type override; cherry-pick with tag; rotateCommitLabel: false (horizontal labels)
    name: 'all commit types id tag and merge-override attributes with cherry-pick tag (LR)',
    diagram: `
gitGraph
  commit id: "init" tag: "v0.1"
  branch develop
  checkout develop
  commit id: "feat" type: HIGHLIGHT tag: "feature-done"
  commit id: "fix" type: REVERSE
  checkout main
  commit id: "hotfix" tag: "patch"
  merge develop id: "merge-dev" type: REVERSE tag: "v1.0"
  commit id: "post-merge"
  cherry-pick id: "feat" tag: "cherry"
    `,
  },
  {
    // Covers: showBranches: false (hides branch lines and labels);
    // showCommitLabel: false (hides all commit ID labels); NORMAL/HIGHLIGHT/REVERSE commits still present
    name: 'showBranches false and showCommitLabel false hiding branch lines and commit labels (LR)',
    diagram: `
gitGraph
  commit id: "1"
  branch develop
  checkout develop
  commit id: "2" type: HIGHLIGHT
  commit id: "3" type: REVERSE
  checkout main
  commit id: "4" tag: "v1.0"
  merge develop id: "merge-1"
  commit id: "5"
    `,
  },
  {
    // Covers: TB direction; parallelCommits: true (temporal spacing disabled);
    // custom mainBranchName ("production"); quoted branch name "hotfix/v1.1";
    // rotateCommitLabel: false
    name: 'TB direction with parallelCommits custom mainBranchName and quoted branch name',
    diagram: `---
config:
  gitGraph:
    parallelCommits: true
    mainBranchName: "production"
---
gitGraph TB:
  commit id: "init" tag: "v0.1"
  branch staging
  checkout staging
  commit id: "s1"
  commit id: "s2" type: HIGHLIGHT
  checkout production
  commit id: "p1"
  merge staging id: "deploy-1" tag: "v1.0"
  commit id: "p2" type: REVERSE
  branch "hotfix/v1.1"
  checkout "hotfix/v1.1"
  commit id: "hf1"
  checkout production
  merge "hotfix/v1.1" id: "deploy-2" tag: "v1.1"
    `,
  },
  {
    // Covers: BT direction; branch order: keyword for custom ordering;
    // mainBranchOrder: 2 (main not first); cherry-pick with tag; quoted branch names
    name: 'BT direction with branch order keyword mainBranchOrder and cherry-pick with tag',
    diagram: `---
config:
  gitGraph:
    mainBranchOrder: 2
---
  gitGraph BT:
    commit id: "1"
    branch "feature/auth" order: 1
    branch "hotfix/bug" order: 3
    branch "release/v2" order: 0
    checkout "feature/auth"
    commit id: "auth-1" type: HIGHLIGHT
    commit id: "auth-2"
    checkout "hotfix/bug"
    commit id: "hf-1" type: REVERSE tag: "bugfix"
    checkout "release/v2"
    commit id: "rel-1" tag: "v2.0-rc1"
    checkout main
    merge "release/v2" id: "release-merge" tag: "v2.0"
    cherry-pick id: "hf-1" tag: "hf-cherry"
    `,
  },
  {
    // Covers: 5+ branches cycling THEME_COLOR_LIMIT (b1-b5 + b2-sub = 6 branches);
    // cherry-pick of a merge commit using parent: attribute (mandatory for merge cherry-pick)
    name: 'multiple branches cycling THEME_COLOR_LIMIT and cherry-pick merge commit with parent',
    diagram: `gitGraph
  commit id: "1"
  branch b1
  branch b2
  branch b3
  branch b4
  branch b5
  checkout b1
  commit id: "b1c" type: HIGHLIGHT
  checkout b2
  commit id: "b2c1"
  branch "b2-sub"
  checkout "b2-sub"
  commit id: "b2s"
  checkout b2
  merge "b2-sub" id: "b2m" tag: "sub-merged"
  checkout b3
  commit id: "b3c" type: REVERSE
  checkout b4
  commit id: "b4c" tag: "b4-release"
  checkout b5
  commit id: "b5c"
  checkout main
  merge b1 id: "m1" tag: "v1.0"
  cherry-pick id: "b2m" parent: "b2c1"
  merge b3 tag: "v2.0"
  commit id: "final"
    `,
  },
];

neoThemes.forEach((theme) => {
  describe(`neo look gitGraph - ${theme} theme`, () => {
    examples.forEach((example) => {
      it(example.name, () => {
        imgSnapshotTest(example.diagram, { look: 'neo', theme });
      });
    });
  });
});
