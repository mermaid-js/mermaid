import gitGraphAst from './gitGraphAst.js';
import { parser } from './parser/gitGraph.jison';

describe('when parsing a gitGraph', function () {
  beforeEach(function () {
    parser.yy = gitGraphAst;
    parser.yy.clear();
  });
  it('should handle a gitGraph commit with NO pararms, get auto-generated reandom ID', function () {
    const str = `gitGraph:
    commit
    `;
    parser.parse(str);
    const commits = parser.yy.getCommits();
    //console.info(commits);
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit id only', function () {
    const str = `gitGraph:
    commit id:"1111"
    `;
    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit tag only', function () {
    const str = `gitGraph:
    commit tag:"test"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('test');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit type HIGHLIGHT only', function () {
    const str = `gitGraph:
    commit type: HIGHLIGHT
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(2);
  });

  it('should handle a gitGraph commit with custom commit type REVERSE only', function () {
    const str = `gitGraph:
    commit type: REVERSE
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(1);
  });

  it('should handle a gitGraph commit with custom commit type NORMAL only', function () {
    const str = `gitGraph:
    commit type: NORMAL
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit msg only', function () {
    const str = `gitGraph:
    commit "test commit"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('test commit');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit "msg:" key only', function () {
    const str = `gitGraph:
    commit msg: "test commit"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('test commit');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit id, tag  only', function () {
    const str = `gitGraph:
    commit id:"1111" tag: "test tag"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(0);
  });

  it('should handle a gitGraph commit with custom commit type, tag  only', function () {
    const str = `gitGraph:
    commit type:HIGHLIGHT tag: "test tag"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(2);
  });

  it('should handle a gitGraph commit with custom commit tag and type only', function () {
    const str = `gitGraph:
    commit tag: "test tag" type:HIGHLIGHT
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).not.toBeNull();
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(2);
  });

  it('should handle a gitGraph commit with custom commit id, type and tag only', function () {
    const str = `gitGraph:
    commit id:"1111" type:REVERSE tag: "test tag"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(1);
  });

  it('should handle a gitGraph commit with custom commit id, type,  tag and msg', function () {
    const str = `gitGraph:
    commit id:"1111" type:REVERSE tag: "test tag" msg:"test msg"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('test msg');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(1);
  });

  it('should handle a gitGraph commit with custom  type,tag, msg, commit id,', function () {
    const str = `gitGraph:
    commit type:REVERSE tag: "test tag" msg: "test msg" id: "1111"

    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('test msg');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(1);
  });

  it('should handle a gitGraph commit with custom  tag, msg, commit id, type,', function () {
    const str = `gitGraph:
    commit  tag: "test tag" msg:"test msg" id:"1111" type:REVERSE
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('test msg');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(1);
  });

  it('should handle a gitGraph commit with custom msg, commit id, type,tag', function () {
    const str = `gitGraph:
    commit msg:"test msg" id:"1111" type:REVERSE tag: "test tag"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    const key = Object.keys(commits)[0];
    expect(commits[key].message).toBe('test msg');
    expect(commits[key].id).toBe('1111');
    expect(commits[key].tag).toBe('test tag');
    expect(commits[key].type).toBe(1);
  });

  it('should handle 3 straight commits', function () {
    const str = `gitGraph:
    commit
    commit
    commit
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(3);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
  });

  it('should handle new branch creation', function () {
    const str = `gitGraph:
    commit
    branch testBranch
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('testBranch');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
  });

  it('should allow quoted branch names', function () {
    const str = `gitGraph:
    commit
    branch "branch"
    checkout "branch"
    commit
    checkout main
    merge "branch"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(3);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    const commit1 = Object.keys(commits)[0];
    const commit2 = Object.keys(commits)[1];
    const commit3 = Object.keys(commits)[2];
    expect(commits[commit1].branch).toBe('main');
    expect(commits[commit2].branch).toBe('branch');
    expect(commits[commit3].branch).toBe('main');
    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([{ name: 'main' }, { name: 'branch' }]);
  });

  it('should allow _-./ characters in branch names', function () {
    const str = `gitGraph:
    commit
    branch azAZ_-./test
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('azAZ_-./test');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
  });

  it('should allow branch names starting with numbers', function () {
    const str = `gitGraph:
    commit
    %% branch names starting with numbers are not recommended, but are supported by git
    branch 1.0.1
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('1.0.1');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
  });

  it('should allow branch names starting with unusual prefixes', function () {
    const str = `gitGraph:
    commit
    %% branch names starting with numbers are not recommended, but are supported by git
    branch branch01
    branch checkout02
    branch cherry-pick03
    branch branch/example-branch
    branch merge/test_merge
    %% single character branch name
    branch A
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('A');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(7);
    expect(Object.keys(parser.yy.getBranches())).toEqual(
      expect.arrayContaining([
        'branch01',
        'checkout02',
        'cherry-pick03',
        'branch/example-branch',
        'merge/test_merge',
        'A',
      ])
    );
  });

  it('should handle new branch checkout', function () {
    const str = `gitGraph:
    commit
    branch testBranch
    checkout testBranch
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('testBranch');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
  });
  it('should handle new branch checkout with order', function () {
    const str = `gitGraph:
    commit
    branch test1 order: 3
    branch test2 order: 2
    branch test3 order: 1
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('test3');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(4);
    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([
      { name: 'main' },
      { name: 'test3' },
      { name: 'test2' },
      { name: 'test1' },
    ]);
  });
  it('should handle new branch checkout with and without order', function () {
    const str = `gitGraph:
    commit
    branch test1 order: 1
    branch test2
    branch test3
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('test3');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(4);
    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([
      { name: 'main' },
      { name: 'test2' },
      { name: 'test3' },
      { name: 'test1' },
    ]);
  });

  it('should handle new branch checkout & commit', function () {
    const str = `gitGraph:
    commit
    branch testBranch
    checkout testBranch
    commit
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(2);
    expect(parser.yy.getCurrentBranch()).toBe('testBranch');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    const commit1 = Object.keys(commits)[0];
    const commit2 = Object.keys(commits)[1];
    expect(commits[commit1].branch).toBe('main');
    expect(commits[commit1].parents).toStrictEqual([]);
    expect(commits[commit2].branch).toBe('testBranch');
    expect(commits[commit2].parents).toStrictEqual([commit1]);
  });

  it('should handle new branch checkout & commit and merge', function () {
    const str = `gitGraph:
    commit
    branch testBranch
    checkout testBranch
    commit
    commit
    checkout main
    merge testBranch
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(4);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    const commit1 = Object.keys(commits)[0];
    const commit2 = Object.keys(commits)[1];
    const commit3 = Object.keys(commits)[2];
    const commit4 = Object.keys(commits)[3];
    expect(commits[commit1].branch).toBe('main');
    expect(commits[commit1].parents).toStrictEqual([]);
    expect(commits[commit2].branch).toBe('testBranch');
    expect(commits[commit2].parents).toStrictEqual([commits[commit1].id]);
    expect(commits[commit3].branch).toBe('testBranch');
    expect(commits[commit3].parents).toStrictEqual([commits[commit2].id]);
    expect(commits[commit4].branch).toBe('main');
    expect(commits[commit4].parents).toStrictEqual([commits[commit1].id, commits[commit3].id]);
    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([
      { name: 'main' },
      { name: 'testBranch' },
    ]);
  });

  it('should handle merge tags', function () {
    const str = `gitGraph:
    commit
    branch testBranch
    checkout testBranch
    commit
    checkout main
    merge testBranch tag: "merge-tag"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(3);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    const commit1 = Object.keys(commits)[0];
    const commit2 = Object.keys(commits)[1];
    const commit3 = Object.keys(commits)[2];

    expect(commits[commit1].branch).toBe('main');
    expect(commits[commit1].parents).toStrictEqual([]);

    expect(commits[commit2].branch).toBe('testBranch');
    expect(commits[commit2].parents).toStrictEqual([commits[commit1].id]);

    expect(commits[commit3].branch).toBe('main');
    expect(commits[commit3].parents).toStrictEqual([commits[commit1].id, commits[commit2].id]);
    expect(commits[commit3].tag).toBe('merge-tag');
    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([
      { name: 'main' },
      { name: 'testBranch' },
    ]);
  });

  it('should handle merge with custom ids, tags and typr', function () {
    const str = `gitGraph:
      commit
      branch testBranch
      checkout testBranch
      commit
      checkout main
      %% Merge Tag and ID
      merge testBranch tag: "merge-tag" id: "2-222"
      branch testBranch2
      checkout testBranch2
      commit
      checkout main
      %% Merge ID and Tag (reverse order)
      merge testBranch2 id: "4-444" tag: "merge-tag2" type:HIGHLIGHT
      branch testBranch3
      checkout testBranch3
      commit
      checkout main
      %% just Merge ID
      merge testBranch3 id: "6-666"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(7);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');

    // The order of these commits is in alphabetical order of IDs
    const [
      mainCommit,
      testBranchCommit,
      testBranchMerge,
      testBranch2Commit,
      testBranch2Merge,
      testBranch3Commit,
      testBranch3Merge,
    ] = Object.values(commits);

    expect(mainCommit.branch).toBe('main');
    expect(mainCommit.parents).toStrictEqual([]);

    expect(testBranchCommit.branch).toBe('testBranch');
    expect(testBranchCommit.parents).toStrictEqual([mainCommit.id]);

    expect(testBranchMerge.branch).toBe('main');
    expect(testBranchMerge.parents).toStrictEqual([mainCommit.id, testBranchCommit.id]);
    expect(testBranchMerge.tag).toBe('merge-tag');
    expect(testBranchMerge.id).toBe('2-222');

    expect(testBranch2Merge.branch).toBe('main');
    expect(testBranch2Merge.parents).toStrictEqual([testBranchMerge.id, testBranch2Commit.id]);
    expect(testBranch2Merge.tag).toBe('merge-tag2');
    expect(testBranch2Merge.id).toBe('4-444');
    expect(testBranch2Merge.customType).toBe(2);
    expect(testBranch2Merge.customId).toBe(true);

    expect(testBranch3Merge.branch).toBe('main');
    expect(testBranch3Merge.parents).toStrictEqual([testBranch2Merge.id, testBranch3Commit.id]);
    expect(testBranch3Merge.id).toBe('6-666');

    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([
      { name: 'main' },
      { name: 'testBranch' },
      { name: 'testBranch2' },
      { name: 'testBranch3' },
    ]);
  });

  it('should support cherry-picking commits', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch develop
    commit id:"A"
    checkout main
    cherry-pick id:"A"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[2];
    expect(commits[cherryPickCommitID].tag).toBe('cherry-pick:A');
    expect(commits[cherryPickCommitID].branch).toBe('main');
  });

  it('should support cherry-picking commits with custom tag', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch develop
    commit id:"A"
    checkout main
    cherry-pick id:"A" tag:"MyTag"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[2];
    expect(commits[cherryPickCommitID].tag).toBe('MyTag');
    expect(commits[cherryPickCommitID].branch).toBe('main');
  });

  it('should support cherry-picking commits with no tag', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch develop
    commit id:"A"
    checkout main
    cherry-pick id:"A" tag:""
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[2];
    expect(commits[cherryPickCommitID].tag).toBe('');
    expect(commits[cherryPickCommitID].branch).toBe('main');
  });

  it('should support cherry-picking of merge commits', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch feature
    branch release
    checkout feature
    commit id: "A"
    commit id: "B"
    checkout main
    merge feature id: "M"
    checkout release
    cherry-pick id: "M" parent:"B"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[4];
    expect(commits[cherryPickCommitID].tag).toBe('cherry-pick:M|parent:B');
    expect(commits[cherryPickCommitID].branch).toBe('release');
  });

  it('should support cherry-picking of merge commits with tag', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch feature
    branch release
    checkout feature
    commit id: "A"
    commit id: "B"
    checkout main
    merge feature id: "M"
    checkout release
    cherry-pick id: "M" parent:"ZERO" tag: "v1.0"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[4];
    expect(commits[cherryPickCommitID].tag).toBe('v1.0');
    expect(commits[cherryPickCommitID].branch).toBe('release');
  });

  it('should support cherry-picking of merge commits with additional commit', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch feature
    branch release
    checkout feature
    commit id: "A"
    commit id: "B"
    checkout main
    merge feature id: "M"
    checkout release
    commit id: "C"
    cherry-pick id: "M" tag: "v2.1:ZERO" parent:"ZERO"
    commit id: "D"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[5];
    expect(commits[cherryPickCommitID].tag).toBe('v2.1:ZERO');
    expect(commits[cherryPickCommitID].branch).toBe('release');
  });

  it('should support cherry-picking of merge commits with empty tag', function () {
    const str = `gitGraph
    commit id: "ZERO"
    branch feature
    branch release
    checkout feature
    commit id: "A"
    commit id: "B"
    checkout main
    merge feature id: "M"
    checkout release
    commit id: "C"
    cherry-pick id:"M" parent: "ZERO" tag:""
    commit id: "D"
    cherry-pick id:"M" tag:"" parent: "B"
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    const cherryPickCommitID = Object.keys(commits)[5];
    const cherryPickCommitID2 = Object.keys(commits)[7];
    expect(commits[cherryPickCommitID].tag).toBe('');
    expect(commits[cherryPickCommitID2].tag).toBe('');
    expect(commits[cherryPickCommitID].branch).toBe('release');
  });

  it('should fail cherry-picking of merge commits if the parent of merge commits is not specified', function () {
    expect(() =>
      parser
        .parse(
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
    commit id: "C"
    cherry-pick id:"M"
    `
        )
        .toThrow(
          'Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.'
        )
    );
  });

  it('should fail cherry-picking of merge commits when the parent provided is not an immediate parent of cherry picked commit', function () {
    expect(() =>
      parser
        .parse(
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
    commit id: "C"
    cherry-pick id:"M" parent: "A"
    `
        )
        .toThrow(
          'Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.'
        )
    );
  });

  it('should throw error when try to branch existing branch: main', function () {
    const str = `gitGraph
    commit
    branch testBranch
    commit
    branch main
    commit
    checkout main
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(
        'Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout main")'
      );
    }
  });
  it('should throw error when try to branch existing branch: testBranch', function () {
    const str = `gitGraph
    commit
    branch testBranch
    commit
    branch testBranch
    commit
    checkout main
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(
        'Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout testBranch")'
      );
    }
  });
  it('should throw error when try to checkout unknown branch: testBranch', function () {
    const str = `gitGraph
    commit
    checkout testBranch
    commit
    branch testBranch
    commit
    checkout main
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(
        'Trying to checkout branch which is not yet created. (Help try using "branch testBranch")'
      );
    }
  });
  it('should throw error when trying to merge, when current branch has no commits', function () {
    const str = `gitGraph
    merge testBranch
    commit
    checkout testBranch
    commit
    branch testBranch
    commit
    checkout main
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe('Incorrect usage of "merge". Current branch (main)has no commits');
    }
  });
  it('should throw error when trying to merge unknown branch', function () {
    const str = `gitGraph
    commit
    merge testBranch
    commit
    checkout testBranch
    commit
    branch testBranch
    commit
    checkout main
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(
        'Incorrect usage of "merge". Branch to be merged (testBranch) does not exist'
      );
    }
  });
  it('should throw error when trying to merge branch to itself', function () {
    const str = `gitGraph
    commit
    branch testBranch
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe('Incorrect usage of "merge". Cannot merge a branch to itself');
    }
  });

  it('should throw error when using existing id as merge ID', function () {
    const str = `gitGraph
    commit id: "1-111"
    branch testBranch
    commit id: "2-222"
    commit id: "3-333"
    checkout main
    merge testBranch id: "1-111"
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(
        'Incorrect usage of "merge". Commit with id:1-111 already exists, use different custom Id'
      );
    }
  });
  it('should throw error when trying to merge branches having same heads', function () {
    const str = `gitGraph
    commit
    branch testBranch
    checkout main
    merge testBranch
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe('Incorrect usage of "merge". Both branches have same head');
    }
  });
  it('should throw error when trying to merge branch which has no commits', function () {
    const str = `gitGraph
    branch test1

    checkout main
    commit
    merge test1
    `;

    try {
      parser.parse(str);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(
        'Incorrect usage of "merge". Branch to be merged (test1) has no commits'
      );
    }
  });
  describe('accessibility', () => {
    it('should handle a title and a description (accDescr)', () => {
      const str = `gitGraph:
      accTitle: This is a title
      accDescr: This is a description
    commit
    `;
      parser.parse(str);
      expect(parser.yy.getAccTitle()).toBe('This is a title');
      expect(parser.yy.getAccDescription()).toBe('This is a description');
    });
    it('should handle a title and a multiline description (accDescr)', () => {
      const str = `gitGraph:
      accTitle: This is a title
      accDescr {
        This is a description
        using multiple lines
      }
    commit
    `;
      parser.parse(str);
      expect(parser.yy.getAccTitle()).toBe('This is a title');
      expect(parser.yy.getAccDescription()).toBe('This is a description\nusing multiple lines');
    });
  });
});
