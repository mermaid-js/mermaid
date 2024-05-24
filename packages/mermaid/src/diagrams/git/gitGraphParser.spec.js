import gitGraphAst from './gitGraphAst.js';
import { parser } from './parser/gitGraph.jison';

describe('when parsing a gitGraph', function () {
  beforeEach(function () {
    parser.yy = gitGraphAst;
    parser.yy.clear();
  });
  it('should handle a gitGraph definition', function () {
    const str = 'gitGraph:\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(parser.yy.getBranches().size).toBe(1);
  });

  it('should handle a gitGraph definition with empty options', function () {
    const str = 'gitGraph:\n' + 'options\n' + ' end\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(parser.yy.getOptions()).toEqual({});
    expect(commits.size).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(parser.yy.getBranches().size).toBe(1);
  });

  it('should handle a gitGraph definition with valid options', function () {
    const str = 'gitGraph:\n' + 'options\n' + '{"key": "value"}\n' + 'end\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(parser.yy.getOptions()['key']).toBe('value');
    expect(commits.size).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(parser.yy.getBranches().size).toBe(1);
  });

  it('should not fail on a gitGraph with malformed json', function () {
    const str = 'gitGraph:\n' + 'options\n' + '{"key": "value"\n' + 'end\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('LR');
    expect(parser.yy.getBranches().size).toBe(1);
  });

  it('should handle set direction top to bottom', function () {
    const str = 'gitGraph TB:\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('TB');
    expect(parser.yy.getBranches().size).toBe(1);
  });

  it('should handle set direction bottom to top', function () {
    const str = 'gitGraph BT:\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(1);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getDirection()).toBe('BT');
    expect(parser.yy.getBranches().size).toBe(1);
  });

  it('should checkout a branch', function () {
    const str = 'gitGraph:\n' + 'branch new\n' + 'checkout new\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(0);
    expect(parser.yy.getCurrentBranch()).toBe('new');
  });

  it('should switch a branch', function () {
    const str = 'gitGraph:\n' + 'branch new\n' + 'switch new\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(0);
    expect(parser.yy.getCurrentBranch()).toBe('new');
  });

  it('should add commits to checked out branch', function () {
    const str = 'gitGraph:\n' + 'branch new\n' + 'checkout new\n' + 'commit\n' + 'commit\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(2);
    expect(parser.yy.getCurrentBranch()).toBe('new');
    const branchCommit = parser.yy.getBranches().get('new');
    expect(branchCommit).not.toBeNull();
    expect(commits.get(branchCommit).parent).not.toBeNull();
  });
  it('should handle commit with args', function () {
    const str = 'gitGraph:\n' + 'commit "a commit"\n';

    parser.parse(str);
    const commits = parser.yy.getCommits();

    expect(commits.size).toBe(1);
    const key = commits.keys().next().value;
    expect(commits.get(key).message).toBe('a commit');
    expect(parser.yy.getCurrentBranch()).toBe('main');
  });

  // Reset has been commented out in JISON
  it.skip('should reset a branch', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'reset main\n';

    parser.parse(str);

    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(3);
    expect(parser.yy.getCurrentBranch()).toBe('newbranch');
    expect(parser.yy.getBranches().get('newbranch')).toEqual(parser.yy.getBranches().get('main'));
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches().get('newbranch'));
  });

  it.skip('reset can take an argument', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'reset main^\n';

    parser.parse(str);

    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(3);
    expect(parser.yy.getCurrentBranch()).toBe('newbranch');
    const main = commits.get(parser.yy.getBranches().get('main'));
    expect(parser.yy.getHead().id).toEqual(main.parent);
  });

  it.skip('should handle fast forwardable merges', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout main\n' +
      'merge newbranch\n';

    parser.parse(str);

    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(4);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getBranches().get('newbranch')).toEqual(parser.yy.getBranches().get('main'));
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches().get('newbranch'));
  });

  it('should handle cases when merge is a noop', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'merge main\n';

    parser.parse(str);

    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(4);
    expect(parser.yy.getCurrentBranch()).toBe('newbranch');
    expect(parser.yy.getBranches().get('newbranch')).not.toEqual(
      parser.yy.getBranches().get('main')
    );
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches().get('newbranch'));
  });

  it('should handle merge with 2 parents', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout main\n' +
      'commit\n' +
      'merge newbranch\n';

    parser.parse(str);

    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(5);
    expect(parser.yy.getCurrentBranch()).toBe('main');
    expect(parser.yy.getBranches().get('newbranch')).not.toEqual(
      parser.yy.getBranches().get('main')
    );
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches().get('main'));
  });

  it.skip('should handle ff merge when history walk has two parents (merge commit)', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout main\n' +
      'commit\n' +
      'merge newbranch\n' +
      'commit\n' +
      'checkout newbranch\n' +
      'merge main\n';

    parser.parse(str);

    const commits = parser.yy.getCommits();
    expect(commits.size).toBe(7);
    expect(parser.yy.getCurrentBranch()).toBe('newbranch');
    expect(parser.yy.getBranches().get('newbranch')).toEqual(parser.yy.getBranches().get('main'));
    expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches().get('main'));

    parser.yy.prettyPrint();
  });

  it('should generate an array of known branches', function () {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch b1\n' +
      'checkout b1\n' +
      'commit\n' +
      'commit\n' +
      'branch b2\n';

    parser.parse(str);
    const branches = gitGraphAst.getBranchesAsObjArray();

    expect(branches).toHaveLength(3);
    expect(branches[0]).toHaveProperty('name', 'main');
    expect(branches[1]).toHaveProperty('name', 'b1');
    expect(branches[2]).toHaveProperty('name', 'b2');
  });
});
