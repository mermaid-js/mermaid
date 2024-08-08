import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parser } from './gitGraphParser.js';
import { db } from './gitGraphAst.js';

const parseInput = async (input: string) => {
  await parser.parse(input);
};

const spyOn = vi.spyOn;

describe('GitGraph Parsing', function () {
  beforeEach(() => {
    db.clear();
  });
  it('should parse a default commit statement', async () => {
    const input = `gitGraph:
    commit
    `;
    const commitSpy = spyOn(db, 'commit');
    await parseInput(input);

    expect(commitSpy).toHaveBeenCalledWith('', undefined, 0, []);
    commitSpy.mockRestore();
  });

  it('should parse a basic branch statement with just a name', async () => {
    const input = `gitGraph:
    branch newBranch
    `;
    const branchSpy = spyOn(db, 'branch');
    await parseInput(input);
    expect(branchSpy).toHaveBeenCalledWith('newBranch', 0);
    branchSpy.mockRestore();
  });

  it('should parse a basic checkout statement', async () => {
    const input = `gitGraph:
    branch newBranch
    checkout newBranch
    `;
    const checkoutSpy = spyOn(db, 'checkout');
    await parseInput(input);
    expect(checkoutSpy).toHaveBeenCalledWith('newBranch');
    checkoutSpy.mockRestore();
  });

  it('should parse a basic merge statement', async () => {
    const input = `gitGraph:
    commit
    branch newBranch
    checkout newBranch
    commit
    checkout main
    merge newBranch`;
    const mergeSpy = spyOn(db, 'merge');
    await parseInput(input);
    expect(mergeSpy).toHaveBeenCalledWith('newBranch', '', undefined, []);
    mergeSpy.mockRestore();
  });

  it('should parse cherry-picking', async () => {
    const input = `gitGraph
    commit id: "ZERO"
    branch develop
    commit id:"A"
    checkout main
    cherry-pick id:"A"
    `;
    const cherryPickSpy = spyOn(db, 'cherryPick');
    await parseInput(input);
    expect(cherryPickSpy).toHaveBeenCalledWith('A', '', undefined, undefined);
    cherryPickSpy.mockRestore();
  });
});
