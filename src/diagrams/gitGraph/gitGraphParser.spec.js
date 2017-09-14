/* eslint-env jasmine */
import gitGraphAst from './gitGraphAst'
import { parser } from './parser/gitGraph'

describe('when parsing a gitGraph', function () {
  beforeEach(function () {
    parser.yy = gitGraphAst
    parser.yy.clear()
  })
  it('should handle a gitGraph defintion', function () {
    const str = 'gitGraph:\n' +
      'commit\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()

    expect(Object.keys(commits).length).toBe(1)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getDirection()).toBe('LR')
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1)
  })

  it('should handle a gitGraph defintion with empty options', function () {
    const str = 'gitGraph:\n' +
      'options\n' +
      'end\n' +
      'commit\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()

    expect(parser.yy.getOptions()).toEqual({})
    expect(Object.keys(commits).length).toBe(1)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getDirection()).toBe('LR')
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1)
  })

  it('should handle a gitGraph defintion with valid options', function () {
    const str = 'gitGraph:\n' +
      'options\n' +
      '{"key": "value"}\n' +
      'end\n' +
      'commit\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()
    expect(parser.yy.getOptions()['key']).toBe('value')
    expect(Object.keys(commits).length).toBe(1)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getDirection()).toBe('LR')
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1)
  })

  it('should not fail on a gitGraph with malformed json', function () {
    const str = 'gitGraph:\n' +
      'options\n' +
      '{"key": "value"\n' +
      'end\n' +
      'commit\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(1)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getDirection()).toBe('LR')
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1)
  })

  it('should handle set direction', function () {
    const str = 'gitGraph BT:\n' +
      'commit\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()

    expect(Object.keys(commits).length).toBe(1)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getDirection()).toBe('BT')
    expect(Object.keys(parser.yy.getBranches()).length).toBe(1)
  })

  it('should checkout a branch', function () {
    const str = 'gitGraph:\n' +
      'branch new\n' +
      'checkout new\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()

    expect(Object.keys(commits).length).toBe(0)
    expect(parser.yy.getCurrentBranch()).toBe('new')
  })

  it('should add commits to checked out branch', function () {
    const str = 'gitGraph:\n' +
      'branch new\n' +
      'checkout new\n' +
      'commit\n' +
      'commit\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()

    expect(Object.keys(commits).length).toBe(2)
    expect(parser.yy.getCurrentBranch()).toBe('new')
    const branchCommit = parser.yy.getBranches()['new']
    expect(branchCommit).not.toBeNull()
    expect(commits[branchCommit].parent).not.toBeNull()
  })
  it('should handle commit with args', function () {
    const str = 'gitGraph:\n' +
      'commit "a commit"\n'

    parser.parse(str)
    const commits = parser.yy.getCommits()

    expect(Object.keys(commits).length).toBe(1)
    const key = Object.keys(commits)[0]
    expect(commits[key].message).toBe('a commit')
    expect(parser.yy.getCurrentBranch()).toBe('master')
  })

  it('it should reset a branch', function () {
    const str = 'gitGraph:\n' +
      'commit\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'reset master\n'

    parser.parse(str)

    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(3)
    expect(parser.yy.getCurrentBranch()).toBe('newbranch')
    expect(parser.yy.getBranches()['newbranch']).toEqual(parser.yy.getBranches()['master'])
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()['newbranch'])
  })

  it('reset can take an argument', function () {
    const str = 'gitGraph:\n' +
      'commit\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'reset master^\n'

    parser.parse(str)

    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(3)
    expect(parser.yy.getCurrentBranch()).toBe('newbranch')
    const master = commits[parser.yy.getBranches()['master']]
    expect(parser.yy.getHead().id).toEqual(master.parent)
  })

  it('it should handle fast forwardable merges', function () {
    const str = 'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout master\n' +
      'merge newbranch\n'

    parser.parse(str)

    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(3)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getBranches()['newbranch']).toEqual(parser.yy.getBranches()['master'])
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()['newbranch'])
  })

  it('it should handle cases when merge is a noop', function () {
    const str = 'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'merge master\n'

    parser.parse(str)

    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(3)
    expect(parser.yy.getCurrentBranch()).toBe('newbranch')
    expect(parser.yy.getBranches()['newbranch']).not.toEqual(parser.yy.getBranches()['master'])
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()['newbranch'])
  })

  it('it should handle merge with 2 parents', function () {
    const str = 'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout master\n' +
      'commit\n' +
      'merge newbranch\n'

    parser.parse(str)

    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(5)
    expect(parser.yy.getCurrentBranch()).toBe('master')
    expect(parser.yy.getBranches()['newbranch']).not.toEqual(parser.yy.getBranches()['master'])
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()['master'])
  })

  it('it should handle ff merge when history walk has two parents (merge commit)', function () {
    const str = 'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout master\n' +
      'commit\n' +
      'merge newbranch\n' +
      'commit\n' +
      'checkout newbranch\n' +
      'merge master\n'

    parser.parse(str)

    const commits = parser.yy.getCommits()
    expect(Object.keys(commits).length).toBe(6)
    expect(parser.yy.getCurrentBranch()).toBe('newbranch')
    expect(parser.yy.getBranches()['newbranch']).toEqual(parser.yy.getBranches()['master'])
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()['master'])

    parser.yy.prettyPrint()
  })
})
