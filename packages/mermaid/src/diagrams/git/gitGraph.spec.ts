import { rejects } from 'assert';
import { db } from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('when parsing a gitGraph', function () {
  beforeEach(function () {
    db.clear();
  });
  describe('when parsing basic gitGraph', function () {
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
      if (branchCommit) {
        expect(commits.get(branchCommit)?.parents).not.toBeNull();
      }
    });
    it('should handle commit with args', async () => {
      const str = 'gitGraph:\n' + 'commit "a commit"\n';

      await parser.parse(str);
      const commits = db.getCommits();

      expect(commits.size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('a commit');
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
      expect(db.getHead()?.id).toEqual(db.getBranches().get('newbranch'));
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
      const branch = db.getBranches().get('main');
      const main = commits.get(branch ?? '');
      expect(db.getHead()?.id).toEqual(main?.parents);
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
      expect(db.getHead()?.id).toEqual(db.getBranches().get('newbranch'));
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
      expect(db.getHead()?.id).toEqual(db.getBranches().get('newbranch'));
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
      expect(db.getHead()?.id).toEqual(db.getBranches().get('main'));
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
      expect(db.getHead()?.id).toEqual(db.getBranches().get('main'));

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

  describe('when parsing more advanced gitGraphs', () => {
    it('should handle a gitGraph commit with NO params, get auto-generated read-only ID', async () => {
      const str = `gitGraph:
        commit
        `;
      await parser.parse(str);
      const commits = db.getCommits();
      //console.info(commits);
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit id only', async () => {
      const str = `gitGraph:
        commit id:"1111"
        `;
      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit tag only', async () => {
      const str = `gitGraph:
        commit tag:"test"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual(['test']);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit type HIGHLIGHT only', async () => {
      const str = `gitGraph:
        commit type: HIGHLIGHT
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(2);
    });

    it('should handle a gitGraph commit with custom commit type REVERSE only', async () => {
      const str = `gitGraph:
        commit type: REVERSE
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(1);
    });

    it('should handle a gitGraph commit with custom commit type NORMAL only', async () => {
      const str = `gitGraph:
        commit type: NORMAL
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit msg only', async () => {
      const str = `gitGraph:
        commit "test commit"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('test commit');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit "msg:" key only', async () => {
      const str = `gitGraph:
        commit msg: "test commit"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('test commit');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual([]);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit id, tag  only', async () => {
      const str = `gitGraph:
        commit id:"1111" tag: "test tag"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(0);
    });

    it('should handle a gitGraph commit with custom commit type, tag  only', async () => {
      const str = `gitGraph:
        commit type:HIGHLIGHT tag: "test tag"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(2);
    });

    it('should handle a gitGraph commit with custom commit tag and type only', async () => {
      const str = `gitGraph:
        commit tag: "test tag" type:HIGHLIGHT
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).not.toBeNull();
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(2);
    });

    it('should handle a gitGraph commit with custom commit id, type and tag only', async () => {
      const str = `gitGraph:
        commit id:"1111" type:REVERSE tag: "test tag"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(1);
    });

    it('should handle a gitGraph commit with custom commit id, type,  tag and msg', async () => {
      const str = `gitGraph:
        commit id:"1111" type:REVERSE tag: "test tag" msg:"test msg"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('test msg');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(1);
    });

    it('should handle a gitGraph commit with custom  type,tag, msg, commit id,', async () => {
      const str = `gitGraph:
        commit type:REVERSE tag: "test tag" msg: "test msg" id: "1111"
    
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('test msg');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(1);
    });

    it('should handle a gitGraph commit with custom  tag, msg, commit id, type,', async () => {
      const str = `gitGraph:
        commit  tag: "test tag" msg:"test msg" id:"1111" type:REVERSE
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('test msg');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(1);
    });

    it('should handle a gitGraph commit with custom msg, commit id, type,tag', async () => {
      const str = `gitGraph:
        commit msg:"test msg" id:"1111" type:REVERSE tag: "test tag"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
      const key = commits.keys().next().value;
      expect(commits.get(key)?.message).toBe('test msg');
      expect(commits.get(key)?.id).toBe('1111');
      expect(commits.get(key)?.tags).toStrictEqual(['test tag']);
      expect(commits.get(key)?.type).toBe(1);
    });

    it('should handle 3 straight commits', async () => {
      const str = `gitGraph:
        commit
        commit
        commit
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(3);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(1);
    });

    it('should handle new branch creation', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('testBranch');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
    });

    it('should allow quoted branch names', async () => {
      const str = `gitGraph:
        commit
        branch "branch"
        checkout "branch"
        commit
        checkout main
        merge "branch"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(3);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
      const [commit1, commit2, commit3] = commits.keys();
      expect(commits.get(commit1)?.branch).toBe('main');
      expect(commits.get(commit2)?.branch).toBe('branch');
      expect(commits.get(commit3)?.branch).toBe('main');
      expect(db.getBranchesAsObjArray()).toStrictEqual([{ name: 'main' }, { name: 'branch' }]);
    });

    it('should allow _-./ characters in branch names', async () => {
      const str = `gitGraph:
        commit
        branch azAZ_-./test
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('azAZ_-./test');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
    });

    it('should allow branch names starting with numbers', async () => {
      const str = `gitGraph:
        commit
        %% branch names starting with numbers are not recommended, but are supported by git
        branch 1.0.1
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('1.0.1');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
    });

    it('should allow branch names starting with unusual prefixes', async () => {
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

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('A');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(7);
      expect([...db.getBranches().keys()]).toEqual(
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

    it('should handle new branch checkout', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        checkout testBranch
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('testBranch');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
    });
    it('should handle new branch checkout with order', async () => {
      const str = `gitGraph:
        commit
        branch test1 order: 3
        branch test2 order: 2
        branch test3 order: 1
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('test3');
      expect(db.getBranches().size).toBe(4);
      expect(db.getBranchesAsObjArray()).toStrictEqual([
        { name: 'main' },
        { name: 'test3' },
        { name: 'test2' },
        { name: 'test1' },
      ]);
    });
    it('should handle new branch checkout with and without order', async () => {
      const str = `gitGraph:
        commit
        branch test1 order: 1
        branch test2
        branch test3
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('test3');
      expect(db.getBranches().size).toBe(4);
      expect(db.getBranchesAsObjArray()).toStrictEqual([
        { name: 'main' },
        { name: 'test2' },
        { name: 'test3' },
        { name: 'test1' },
      ]);
    });

    it('should handle new branch checkout & commit', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        checkout testBranch
        commit
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(2);
      expect(db.getCurrentBranch()).toBe('testBranch');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
      const [commit1, commit2] = commits.keys();
      expect(commits.get(commit1)?.branch).toBe('main');
      expect(commits.get(commit1)?.parents).toStrictEqual([]);
      expect(commits.get(commit2)?.branch).toBe('testBranch');
      expect(commits.get(commit2)?.parents).toStrictEqual([commit1]);
    });

    it('should handle new branch checkout & commit and merge', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        checkout testBranch
        commit
        commit
        checkout main
        merge testBranch
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(4);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
      const [commit1, commit2, commit3, commit4] = commits.keys();
      expect(commits.get(commit1)?.branch).toBe('main');
      expect(commits.get(commit1)?.parents).toStrictEqual([]);
      expect(commits.get(commit2)?.branch).toBe('testBranch');
      expect(commits.get(commit2)?.parents).toStrictEqual([commits.get(commit1)?.id]);
      expect(commits.get(commit3)?.branch).toBe('testBranch');
      expect(commits.get(commit3)?.parents).toStrictEqual([commits.get(commit2)?.id]);
      expect(commits.get(commit4)?.branch).toBe('main');
      expect(commits.get(commit4)?.parents).toStrictEqual([
        commits.get(commit1)?.id,
        commits.get(commit3)?.id,
      ]);
      expect(db.getBranchesAsObjArray()).toStrictEqual([{ name: 'main' }, { name: 'testBranch' }]);
    });

    it('should handle new branch switch', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        switch testBranch
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(1);
      expect(db.getCurrentBranch()).toBe('testBranch');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
    });

    it('should handle new branch switch & commit', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        switch testBranch
        commit
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(2);
      expect(db.getCurrentBranch()).toBe('testBranch');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
      const [commit1, commit2] = commits.keys();
      expect(commits.get(commit1)?.branch).toBe('main');
      expect(commits.get(commit1)?.parents).toStrictEqual([]);
      expect(commits.get(commit2)?.branch).toBe('testBranch');
      expect(commits.get(commit2)?.parents).toStrictEqual([commit1]);
    });

    it('should handle new branch switch & commit and merge', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        switch testBranch
        commit
        commit
        switch main
        merge testBranch
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(4);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
      const [commit1, commit2, commit3, commit4] = commits.keys();
      expect(commits.get(commit1)?.branch).toBe('main');
      expect(commits.get(commit1)?.parents).toStrictEqual([]);
      expect(commits.get(commit2)?.branch).toBe('testBranch');
      expect(commits.get(commit2)?.parents).toStrictEqual([commits.get(commit1)?.id]);
      expect(commits.get(commit3)?.branch).toBe('testBranch');
      expect(commits.get(commit3)?.parents).toStrictEqual([commits.get(commit2)?.id]);
      expect(commits.get(commit4)?.branch).toBe('main');
      expect(commits.get(commit4)?.parents).toStrictEqual([
        commits.get(commit1)?.id,
        commits.get(commit3)?.id,
      ]);
      expect(db.getBranchesAsObjArray()).toStrictEqual([{ name: 'main' }, { name: 'testBranch' }]);
    });

    it('should handle merge tags', async () => {
      const str = `gitGraph:
        commit
        branch testBranch
        checkout testBranch
        commit
        checkout main
        merge testBranch tag: "merge-tag"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(3);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');
      expect(db.getBranches().size).toBe(2);
      const [commit1, commit2, commit3] = commits.keys();
      expect(commits.get(commit1)?.branch).toBe('main');
      expect(commits.get(commit1)?.parents).toStrictEqual([]);

      expect(commits.get(commit2)?.branch).toBe('testBranch');
      expect(commits.get(commit2)?.parents).toStrictEqual([commits.get(commit1)?.id]);

      expect(commits.get(commit3)?.branch).toBe('main');
      expect(commits.get(commit3)?.parents).toStrictEqual([
        commits.get(commit1)?.id,
        commits.get(commit2)?.id,
      ]);
      expect(commits.get(commit3)?.tags).toStrictEqual(['merge-tag']);
      expect(db.getBranchesAsObjArray()).toStrictEqual([{ name: 'main' }, { name: 'testBranch' }]);
    });

    it('should handle merge with custom ids, tags and type', async () => {
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

      await parser.parse(str);
      const commits = db.getCommits();
      expect(commits.size).toBe(7);
      expect(db.getCurrentBranch()).toBe('main');
      expect(db.getDirection()).toBe('LR');

      // The order of these commits is in alphabetical order of IDs
      const [
        mainCommit,
        testBranchCommit,
        testBranchMerge,
        testBranch2Commit,
        testBranch2Merge,
        testBranch3Commit,
        testBranch3Merge,
      ] = [...commits.values()];

      expect(mainCommit.branch).toBe('main');
      expect(mainCommit.parents).toStrictEqual([]);

      expect(testBranchCommit.branch).toBe('testBranch');
      expect(testBranchCommit.parents).toStrictEqual([mainCommit.id]);

      expect(testBranchMerge.branch).toBe('main');
      expect(testBranchMerge.parents).toStrictEqual([mainCommit.id, testBranchCommit.id]);
      expect(testBranchMerge.tags).toStrictEqual(['merge-tag']);
      expect(testBranchMerge.id).toBe('2-222');

      expect(testBranch2Merge.branch).toBe('main');
      expect(testBranch2Merge.parents).toStrictEqual([testBranchMerge.id, testBranch2Commit.id]);
      expect(testBranch2Merge.tags).toStrictEqual(['merge-tag2']);
      expect(testBranch2Merge.id).toBe('4-444');
      expect(testBranch2Merge.customType).toBe(2);
      expect(testBranch2Merge.customId).toBe(true);

      expect(testBranch3Merge.branch).toBe('main');
      expect(testBranch3Merge.parents).toStrictEqual([testBranch2Merge.id, testBranch3Commit.id]);
      expect(testBranch3Merge.id).toBe('6-666');

      expect(db.getBranchesAsObjArray()).toStrictEqual([
        { name: 'main' },
        { name: 'testBranch' },
        { name: 'testBranch2' },
        { name: 'testBranch3' },
      ]);
    });

    it('should support cherry-picking commits', async () => {
      const str = `gitGraph
        commit id: "ZERO"
        branch develop
        commit id:"A"
        checkout main
        cherry-pick id:"A"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][2];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual(['cherry-pick:A']);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('main');
    });

    it('should support cherry-picking commits with custom tag', async () => {
      const str = `gitGraph
        commit id: "ZERO"
        branch develop
        commit id:"A"
        checkout main
        cherry-pick id:"A" tag:"MyTag"
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][2];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual(['MyTag']);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('main');
    });

    it('should support cherry-picking commits with no tag', async () => {
      const str = `gitGraph
        commit id: "ZERO"
        branch develop
        commit id:"A"
        checkout main
        cherry-pick id:"A" tag:""
        `;

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][2];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual([]);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('main');
    });

    it('should support cherry-picking of merge commits', async () => {
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

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][4];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual(['cherry-pick:M|parent:B']);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('release');
    });

    it('should support cherry-picking of merge commits with tag', async () => {
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

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][4];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual(['v1.0']);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('release');
    });

    it('should support cherry-picking of merge commits with additional commit', async () => {
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

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][5];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual(['v2.1:ZERO']);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('release');
    });

    it('should support cherry-picking of merge commits with empty tag', async () => {
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

      await parser.parse(str);
      const commits = db.getCommits();
      const cherryPickCommitID = [...commits.keys()][5];
      const cherryPickCommitID2 = [...commits.keys()][7];
      expect(commits.get(cherryPickCommitID)?.tags).toStrictEqual([]);
      expect(commits.get(cherryPickCommitID2)?.tags).toStrictEqual([]);
      expect(commits.get(cherryPickCommitID)?.branch).toBe('release');
    });

    it('should fail cherry-picking of merge commits if the parent of merge commits is not specified', async () => {
      await expect(
        parser.parse(
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
      ).rejects.toThrow(
        'Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.'
      );
    });

    it('should fail cherry-picking of merge commits when the parent provided is not an immediate parent of cherry picked commit', async () => {
      await expect(
        parser.parse(
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
      ).rejects.toThrow(
        'Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.'
      );
    });

    it('should throw error when try to branch existing branch: main', async () => {
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
        await parser.parse(str);
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe(
          'Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout main")'
        );
      }
    });
    it('should throw error when try to branch existing branch: testBranch', async () => {
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
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe(
          'Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout testBranch")'
        );
      }
    });
    it('should throw error when try to checkout unknown branch: testBranch', async () => {
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
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe(
          'Trying to checkout branch which is not yet created. (Help try using "branch testBranch")'
        );
      }
    });
    it('should throw error when trying to merge, when current branch has no commits', async () => {
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
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe('Incorrect usage of "merge". Current branch (main)has no commits');
      }
    });
    it('should throw error when trying to merge unknown branch', async () => {
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
        await parser.parse(str);
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe(
          'Incorrect usage of "merge". Branch to be merged (testBranch) does not exist'
        );
      }
    });
    it('should throw error when trying to merge branch to itself', async () => {
      const str = `gitGraph
        commit
        branch testBranch
        merge testBranch
        `;

      try {
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe('Incorrect usage of "merge". Cannot merge a branch to itself');
      }
    });

    it('should throw error when using existing id as merge ID', async () => {
      const str = `gitGraph
        commit id: "1-111"
        branch testBranch
        commit id: "2-222"
        commit id: "3-333"
        checkout main
        merge testBranch id: "1-111"
        `;

      try {
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe(
          'Incorrect usage of "merge". Commit with id:1-111 already exists, use different custom Id'
        );
      }
    });
    it('should throw error when trying to merge branches having same heads', async () => {
      const str = `gitGraph
        commit
        branch testBranch
        checkout main
        merge testBranch
        `;

      try {
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe('Incorrect usage of "merge". Both branches have same head');
      }
    });
    it('should throw error when trying to merge branch which has no commits', async () => {
      const str = `gitGraph
        branch test1
    
        checkout main
        commit
        merge test1
        `;

      try {
        await parser.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe(
          'Incorrect usage of "merge". Branch to be merged (test1) has no commits'
        );
      }
    });
    describe('accessibility', () => {
      it('should handle a title and a description (accDescr)', async () => {
        const str = `gitGraph:
          accTitle: This is a title
          accDescr: This is a description
        commit
        `;
        await parser.parse(str);
        expect(db.getAccTitle()).toBe('This is a title');
        expect(db.getAccDescription()).toBe('This is a description');
      });
      it('should handle a title and a multiline description (accDescr)', async () => {
        const str = `gitGraph:
          accTitle: This is a title
          accDescr {
            This is a description
            using multiple lines
          }
        commit
        `;
        await parser.parse(str);
        expect(db.getAccTitle()).toBe('This is a title');
        expect(db.getAccDescription()).toBe('This is a description\nusing multiple lines');
      });
    });

    describe('unsafe properties', () => {
      for (const prop of ['__proto__', 'constructor']) {
        it(`should work with custom commit id or branch name ${prop}`, async () => {
          const str = `gitGraph
        commit id:"${prop}"
        branch ${prop}
        checkout ${prop}
        commit
        checkout main
        merge ${prop}
        `;
          await parser.parse(str);
          const commits = db.getCommits();
          expect(commits.size).toBe(3);
          expect(commits.keys().next().value).toBe(prop);
          expect(db.getCurrentBranch()).toBe('main');
          expect(db.getBranches().size).toBe(2);
          expect(db.getBranchesAsObjArray()[1].name).toBe(prop);
        });
      }
    });
  });
});
