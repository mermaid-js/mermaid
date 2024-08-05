import db from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('when parsing a gitGraph', function () {
  beforeEach(function () {
    db.clear();
  });

  it('should handle a gitGraph definition', async () => {
    const str = `gitGraph:\n commit\n`;

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(1);
    expect(db.getCurrentBranch()).toBe('main');
    expect(db.getDirection()).toBe('LR');
    expect(db.getBranches().size).toBe(1);
  });

  it('should handle set direction top to bottom', async () => {
    const str = 'gitGraph TB:\n' + 'commit\n';

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(1);
    expect(db.getCurrentBranch()).toBe('main');
    expect(db.getDirection()).toBe('TB');
    expect(db.getBranches().size).toBe(1);
  });

  it('should handle set direction bottom to top', async () => {
    const str = 'gitGraph BT:\n' + 'commit\n';

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(1);
    expect(db.getCurrentBranch()).toBe('main');
    expect(db.getDirection()).toBe('BT');
    expect(db.getBranches().size).toBe(1);
  });

  it('should checkout a branch', async () => {
    const str = 'gitGraph:\n' + 'branch new\n' + 'checkout new\n';

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(0);
    expect(db.getCurrentBranch()).toBe('new');
  });

  it('should switch a branch', async () => {
    const str = 'gitGraph:\n' + 'branch new\n' + 'switch new\n';

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(0);
    expect(db.getCurrentBranch()).toBe('new');
  });

  it('should add commits to checked out branch', async () => {
    const str = 'gitGraph:\n' + 'branch new\n' + 'checkout new\n' + 'commit\n' + 'commit\n';

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(2);
    expect(db.getCurrentBranch()).toBe('new');
    const branchCommit = db.getBranches().get('new');
    expect(branchCommit).not.toBeNull();
    expect(commits.get(branchCommit).parent).not.toBeNull();
  });
  it('should handle commit with args', async () => {
    const str = 'gitGraph:\n' + 'commit "a commit"\n';

    await parser.parse(str);
    const commits = db.getCommits();

    expect(commits.size).toBe(1);
    const key = commits.keys().next().value;
    expect(commits.get(key).message).toBe('a commit');
    expect(db.getCurrentBranch()).toBe('main');
  });

  it.skip('should reset a branch', async () => {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'reset main\n';

    await parser.parse(str);

    const commits = db.getCommits();
    expect(commits.size).toBe(3);
    expect(db.getCurrentBranch()).toBe('newbranch');
    expect(db.getBranches().get('newbranch')).toEqual(db.getBranches().get('main'));
    expect(db.getHead().id).toEqual(db.getBranches().get('newbranch'));
  });

  it.skip('reset can take an argument', async () => {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'reset main^\n';

    await parser.parse(str);

    const commits = db.getCommits();
    expect(commits.size).toBe(3);
    expect(db.getCurrentBranch()).toBe('newbranch');
    const main = commits.get(db.getBranches().get('main'));
    expect(db.getHead().id).toEqual(main.parent);
  });

  it.skip('should handle fast forwardable merges', async () => {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'checkout main\n' +
      'merge newbranch\n';

    await parser.parse(str);

    const commits = db.getCommits();
    expect(commits.size).toBe(4);
    expect(db.getCurrentBranch()).toBe('main');
    expect(db.getBranches().get('newbranch')).toEqual(db.getBranches().get('main'));
    expect(db.getHead().id).toEqual(db.getBranches().get('newbranch'));
  });

  it('should handle cases when merge is a noop', async () => {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch newbranch\n' +
      'checkout newbranch\n' +
      'commit\n' +
      'commit\n' +
      'merge main\n';

    await parser.parse(str);

    const commits = db.getCommits();
    expect(commits.size).toBe(4);
    expect(db.getCurrentBranch()).toBe('newbranch');
    expect(db.getBranches().get('newbranch')).not.toEqual(db.getBranches().get('main'));
    expect(db.getHead().id).toEqual(db.getBranches().get('newbranch'));
  });

  it('should handle merge with 2 parents', async () => {
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

    await parser.parse(str);

    const commits = db.getCommits();
    expect(commits.size).toBe(5);
    expect(db.getCurrentBranch()).toBe('main');
    expect(db.getBranches().get('newbranch')).not.toEqual(db.getBranches().get('main'));
    expect(db.getHead().id).toEqual(db.getBranches().get('main'));
  });

  it.skip('should handle ff merge when history walk has two parents (merge commit)', async () => {
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

    await parser.parse(str);

    const commits = db.getCommits();
    expect(commits.size).toBe(7);
    expect(db.getCurrentBranch()).toBe('newbranch');
    expect(db.getBranches().get('newbranch')).toEqual(db.getBranches().get('main'));
    expect(db.getHead().id).toEqual(db.getBranches().get('main'));

    db.prettyPrint();
  });

  it('should generate an array of known branches', async () => {
    const str =
      'gitGraph:\n' +
      'commit\n' +
      'branch b1\n' +
      'checkout b1\n' +
      'commit\n' +
      'commit\n' +
      'branch b2\n';

    await parser.parse(str);
    const branches = db.getBranchesAsObjArray();

    expect(branches).toHaveLength(3);
    expect(branches[0]).toHaveProperty('name', 'main');
    expect(branches[1]).toHaveProperty('name', 'b1');
    expect(branches[2]).toHaveProperty('name', 'b2');
  });
});
