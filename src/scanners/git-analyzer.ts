import { gitCommand, getContributors, getRecentCommits, getGitTags } from '../utils/git.js';

export interface GitAnalysis {
  contributors: Array<{ name: string; commits: number }>;
  recentCommits: string[];
  totalCommits: number;
  tags: string[];
  activeBranches: string[];
  firstCommitDate: string;
  lastCommitDate: string;
  /** Map of directory → primary contributor */
  directoryOwnership: Map<string, string>;
}

export function analyzeGitHistory(cwd: string): GitAnalysis {
  const contributors = getContributors(cwd);
  const recentCommits = getRecentCommits(cwd, 30);
  const tags = getGitTags(cwd);

  const totalCommitsStr = gitCommand('rev-list --count HEAD', cwd);
  const totalCommits = parseInt(totalCommitsStr, 10) || 0;

  const branches = gitCommand('branch -r --no-merged', cwd)
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && !b.includes('HEAD'))
    .slice(0, 20);

  const firstCommitDate = gitCommand('log --reverse --format=%ci --max-count=1', cwd);
  const lastCommitDate = gitCommand('log -1 --format=%ci', cwd);

  // Directory ownership via shortlog
  const directoryOwnership = new Map<string, string>();
  const topDirs = gitCommand('ls-tree -d --name-only HEAD', cwd)
    .split('\n')
    .filter(Boolean)
    .slice(0, 15);

  for (const dir of topDirs) {
    const ownerOutput = gitCommand(`shortlog -sn --no-merges HEAD -- "${dir}"`, cwd);
    const firstLine = ownerOutput.split('\n')[0] || '';
    const match = firstLine.match(/^\s*\d+\s+(.+)$/);
    if (match) {
      directoryOwnership.set(dir, match[1].trim());
    }
  }

  return {
    contributors,
    recentCommits,
    totalCommits,
    tags,
    activeBranches: branches,
    firstCommitDate,
    lastCommitDate,
    directoryOwnership,
  };
}
