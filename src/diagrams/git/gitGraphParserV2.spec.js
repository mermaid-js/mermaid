/* eslint-env jasmine */
// Todo reintroduce without cryptoRandomString
import gitGraphAst from './gitGraphAst';
import { parser } from './parser/gitGraph';
//import randomString from 'crypto-random-string';
//import cryptoRandomString from 'crypto-random-string';
import { logger } from '../../logger';

//jest.mock('crypto-random-string');

describe('when parsing a gitGraph', function () {
  let randomNumber;
  beforeEach(function () {
    parser.yy = gitGraphAst;
    parser.yy.clear();
    randomNumber = 0;
  });
  // afterEach(function() {
  //   cryptoRandomString.mockReset();
  // });
  it('should handle a gitGraph commit with NO pararms, get auto-genrated reandom ID', function () {
    const str = `gitGraph:
    commit
    `;
    parser.parse(str);
    const commits = parser.yy.getCommits();
    //console.info(commits);
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    //console.log(str);
    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
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
    expect(parser.yy.getCurrentBranch()).toBe('master');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
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
    expect(commits[commit1].branch).toBe('master');
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
    checkout master
    merge testBranch
    `;

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(Object.keys(commits).length).toBe(4);
    expect(parser.yy.getCurrentBranch()).toBe('master');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    const commit1 = Object.keys(commits)[0];
    const commit2 = Object.keys(commits)[1];
    const commit3 = Object.keys(commits)[2];
    const commit4 = Object.keys(commits)[3];
    expect(commits[commit1].branch).toBe('master');
    console.log(commits);

    console.log(commits[commit1].parents);
    expect(commits[commit1].parents).toStrictEqual([]);
    expect(commits[commit2].branch).toBe('testBranch');
    expect(commits[commit2].parents).toStrictEqual([commits[commit1].id]);
    expect(commits[commit3].branch).toBe('testBranch');
    expect(commits[commit3].parents).toStrictEqual([commits[commit2].id]);
    expect(commits[commit4].branch).toBe('master');
    expect(commits[commit4].parents).toStrictEqual([commits[commit1].id, commits[commit3].id]);
    expect(parser.yy.getBranchesAsObjArray()).toStrictEqual([
      { name: 'master' },
      { name: 'testBranch' },
    ]);
  });
});
