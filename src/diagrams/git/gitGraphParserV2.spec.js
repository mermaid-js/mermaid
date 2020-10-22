/* eslint-env jasmine */
// Todo reintroduce without cryptoRandomString
import gitGraphAst from './gitGraphAst';
import { parser } from './parser/gitGraph';
//import randomString from 'crypto-random-string';
//import cryptoRandomString from 'crypto-random-string';
import { logger } from '../../logger';

//jest.mock('crypto-random-string');

describe('when parsing a gitGraph', function() {
  let randomNumber;
  beforeEach(function() {
    parser.yy = gitGraphAst;
    parser.yy.clear();
    randomNumber = 0;
  
  });
  // afterEach(function() {
  //   cryptoRandomString.mockReset();
  // });
  it('should handle a gitGraph commit with NO pararms, get auto-genrated reandom ID', function() {
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

  it('should handle a gitGraph commit with custom commit id only', function() {
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

  it('should handle a gitGraph commit with custom commit tag only', function() {
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

  it('should handle a gitGraph commit with custom commit type HIGHLIGHT only', function() {
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

  it('should handle a gitGraph commit with custom commit type REVERSE only', function() {
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

  it('should handle a gitGraph commit with custom commit type NORMAL only', function() {
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

  it('should handle a gitGraph commit with custom commit msg only', function() {
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

  it('should handle a gitGraph commit with custom commit id, tag  only', function() {
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

  it('should handle a gitGraph commit with custom commit type, tag  only', function() {
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

  it('should handle a gitGraph commit with custom commit tag and type only', function() {
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

  it('should handle a gitGraph commit with custom commit id, type and tag only', function() {
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



});
