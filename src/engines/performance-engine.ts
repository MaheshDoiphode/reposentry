import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { readFileContentSync } from '../utils/fs.js';
import { join } from 'node:path';
import { performanceAuditPrompt, performanceScorePrompt } from '../prompts/performance.prompts.js';

export interface PerformanceEngineInput {
  context: PromptContext;
  rootDir: string;
  files: string[];
}

/** Quick regex-based performance anti-pattern detection */
function quickPerformanceScan(rootDir: string, files: string[]): string[] {
  const findings: string[] = [];
  const patterns: Array<{ name: string; pattern: RegExp; impact: string }> = [
    { name: 'Sync file I/O in async context', pattern: /readFileSync|writeFileSync/g, impact: 'Blocks event loop' },
    { name: 'SELECT * query', pattern: /SELECT\s+\*/gi, impact: 'Fetches unnecessary data' },
    { name: 'Missing LIMIT clause', pattern: /\.find\(\s*\{[^}]*\}\s*\)(?!.*\.limit)/g, impact: 'Unbounded query results' },
    { name: 'Nested await in loop', pattern: /for\s*\([^)]*\)\s*\{[^}]*await\s/g, impact: 'Sequential async operations' },
    { name: 'console.log in hot path', pattern: /console\.log/g, impact: 'I/O overhead in production' },
    { name: 'Large JSON.stringify', pattern: /JSON\.stringify\s*\([^)]*\)/g, impact: 'CPU-intensive for large objects' },
    { name: 'No compression middleware', pattern: /compression/g, impact: 'Check: compression middleware' },
  ];

  const codeFiles = files.filter(f =>
    f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.py') || f.endsWith('.go'),
  ).slice(0, 80);

  for (const file of codeFiles) {
    try {
      const content = readFileContentSync(join(rootDir, file));
      for (const { name, pattern, impact } of patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
          findings.push(`${name} in ${file} (${matches.length} occurrence(s)) — ${impact}`);
        }
      }
    } catch { /* ignore */ }
  }

  return findings;
}

export async function runPerformanceEngine(
  input: PerformanceEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ score: number; details: string }> {
  progress.start('Performance Engine', 3);

  // Quick scan
  progress.increment('Pattern scanning');
  const quickFindings = quickPerformanceScan(input.rootDir, input.files);

  const ctx = { ...input.context };
  if (quickFindings.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nPerformance scan findings:\n${quickFindings.join('\n')}`;
  }

  // Full audit
  progress.increment('Performance audit');
  const auditResult = await askCopilot(performanceAuditPrompt(ctx));
  await output.writeToSubdir('performance', 'PERFORMANCE_AUDIT.md', auditResult);

  // Score
  progress.increment('Performance scoring');
  const scoreResult = await askCopilot(performanceScorePrompt(ctx));
  await output.writeToSubdir('performance', 'performance-score.json', scoreResult);

  progress.succeed('Performance Engine');

  // Calculate score
  let score = 90 - (quickFindings.length * 3);
  score = Math.max(20, Math.min(100, score));

  return {
    score,
    details: `${quickFindings.length} performance anti-patterns detected`,
  };
}
