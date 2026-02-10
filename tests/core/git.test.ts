import { describe, it, expect } from 'vitest';
import { isGitRepo, getRepoName, getCurrentBranch } from '../../src/utils/git.js';

describe('git utils', () => {
  const cwd = process.cwd();

  it('should detect current directory as a git repo', () => {
    expect(isGitRepo(cwd)).toBe(true);
  });

  it('should get repo name', () => {
    const name = getRepoName(cwd);
    expect(name).toBe('reposentry');
  });

  it('should get current branch', () => {
    const branch = getCurrentBranch(cwd);
    expect(typeof branch).toBe('string');
    expect(branch.length).toBeGreaterThan(0);
  });
});
