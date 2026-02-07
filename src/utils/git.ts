import { execSync } from 'node:child_process';

export function gitCommand(cmd: string, cwd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: 'utf-8', timeout: 15000 }).trim();
  } catch {
    return '';
  }
}

export function isGitRepo(cwd: string): boolean {
  return gitCommand('rev-parse --is-inside-work-tree', cwd) === 'true';
}

export function getRepoRoot(cwd: string): string {
  return gitCommand('rev-parse --show-toplevel', cwd) || cwd;
}

export function getRemoteUrl(cwd: string): string {
  return gitCommand('remote get-url origin', cwd);
}

export function getRepoName(cwd: string): string {
  const remote = getRemoteUrl(cwd);
  if (remote) {
    const match = remote.match(/\/([^/]+?)(?:\.git)?$/);
    if (match) return match[1];
  }
  const root = getRepoRoot(cwd);
  return root.split(/[/\\]/).pop() || 'unknown';
}

export function getCurrentBranch(cwd: string): string {
  return gitCommand('branch --show-current', cwd) || 'main';
}

export function getContributors(cwd: string, limit = 10): Array<{ name: string; commits: number }> {
  const output = gitCommand(`shortlog -sn --no-merges HEAD`, cwd);
  if (!output) return [];
  return output
    .split('\n')
    .slice(0, limit)
    .map(line => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { name: match[2].trim(), commits: parseInt(match[1], 10) };
    })
    .filter(Boolean) as Array<{ name: string; commits: number }>;
}

export function getRecentCommits(cwd: string, count = 20): string[] {
  const output = gitCommand(`log --oneline -${count} --no-merges`, cwd);
  return output ? output.split('\n') : [];
}

export function getFileBlame(cwd: string, filePath: string): string {
  return gitCommand(`blame --line-porcelain "${filePath}" 2>/dev/null | grep "^author " | sort | uniq -c | sort -rn`, cwd);
}

export function getGitTags(cwd: string): string[] {
  const output = gitCommand('tag --sort=-v:refname', cwd);
  return output ? output.split('\n').filter(Boolean) : [];
}
