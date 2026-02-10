import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { ScoreCategory, calculateGrade, calculateOverallScore } from '../utils/scoring.js';
import { healthSummaryPrompt } from '../prompts/health.prompts.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface HealthEngineInput {
  context: PromptContext;
  categories: ScoreCategory[];
  filesScanned: number;
  totalFiles: number;
}

interface HistoryEntry {
  analyzedAt: string;
  overallScore: number;
  overallGrade: string;
  categories: Array<{ name: string; score: number; grade: string; details: string }>;
}

function loadHistory(outputDir: string): HistoryEntry[] {
  const historyPath = join(outputDir, 'history.json');
  if (!existsSync(historyPath)) return [];
  try {
    const raw = readFileSync(historyPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveHistory(outputDir: string, history: HistoryEntry[]): void {
  const historyPath = join(outputDir, 'history.json');
  writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

function buildMethodologyDoc(categories: ScoreCategory[]): string {
  const weights: Record<string, number> = {
    'Security': 2.0, 'Testing': 1.5, 'CI/CD': 1.2,
    'Documentation': 1.0, 'Architecture': 1.0,
    'Performance': 1.2, 'Collaboration': 0.8,
  };

  const lines = [
    '# Scoring Methodology',
    '',
    '> **Transparency note:** RepoSentry scores are based on what your project *already has*, not on what RepoSentry generates. Generated files do not inflate your score.',
    '',
    '---',
    '',
    '## Grade Scale',
    '',
    '| Grade | Score Range |',
    '|-------|------------|',
    '| A+    | 97 – 100   |',
    '| A     | 93 – 96    |',
    '| A-    | 90 – 92    |',
    '| B+    | 87 – 89    |',
    '| B     | 83 – 86    |',
    '| B-    | 80 – 82    |',
    '| C+    | 77 – 79    |',
    '| C     | 73 – 76    |',
    '| C-    | 70 – 72    |',
    '| D+    | 67 – 69    |',
    '| D     | 63 – 66    |',
    '| D-    | 60 – 62    |',
    '| F     | 0 – 59     |',
    '',
    '---',
    '',
    '## Overall Score = Weighted Average',
    '',
    'Not all categories weigh equally. Security and Testing carry more weight because they directly affect production readiness.',
    '',
    '| Category | Weight | Reason |',
    '|----------|--------|--------|',
    '| Security | 2.0× | Vulnerabilities directly impact production safety |',
    '| Testing | 1.5× | Test coverage is critical for reliability |',
    '| CI/CD | 1.2× | Automation reduces human error |',
    '| Performance | 1.2× | Anti-patterns affect user experience |',
    '| Documentation | 1.0× | Standard weight |',
    '| Architecture | 1.0× | Standard weight |',
    '| Collaboration | 0.8× | Important but less urgent than code quality |',
    '',
    '**Formula:** `Overall = Σ(category_score × weight) / Σ(weight)`',
    '',
    '---',
    '',
    '## Per-Category Scoring',
    '',
    '### Documentation (weight: 1.0×)',
    '- Base: 20 points',
    '- Has existing README: +25',
    '- Has API routes documented: +10',
    '- Active development (>3 recent commits): +10',
    '- Has version tags: +15',
    '- No README: −10',
    '- No commits: −5',
    '',
    '### Architecture (weight: 1.0×)',
    '- Base: 30 points',
    '- Has module imports (structured codebase): +15',
    '- Has data models: +15',
    '- Has API routes: +15',
    '- 3+ top-level directories (separation of concerns): +10',
    '- 5+ top-level directories: +5',
    '- No imports and no routes (monolithic): −10',
    '',
    '### Security (weight: 2.0×)',
    '- Starts at 100 (clean baseline)',
    '- Per High-severity finding (hardcoded secrets, SQL injection, etc.): −20',
    '- Per Medium-severity finding (eval, CORS, MD5): −10',
    '- Per Low-severity finding (console.log, etc.): −3',
    '- No .gitignore: −15',
    '- .env file committed: −10',
    '- AI-identified critical/high-risk findings: −5 each',
    '- AI-identified medium-risk findings: −2 each',
    '',
    '### CI/CD (weight: 1.2×)',
    '- Base: 15 points',
    '- Has CI/CD pipeline config: +35',
    '- Has Dockerfile: +20',
    '- Has .env.example: +15',
    '- Has docker-compose: +15',
    '',
    '### Testing (weight: 1.5×)',
    '- Base: 10 points',
    '- Has any test files: +20',
    '- Has >5 test files: +10',
    '- Has >10 test files: +10',
    '- Has >20 test files: +10',
    '- Route coverage ratio × 30 (if routes exist)',
    '- Very low test-to-route ratio (<30%): −10',
    '- Zero test files: −5',
    '',
    '### Performance (weight: 1.2×)',
    '- Base: 70 points (if anti-patterns found) / 95 (if clean)',
    '- Per anti-pattern detected: −5',
    '- Scans for: sync I/O, SELECT *, unbounded queries, nested awaits, console.log in hot paths, uncompressed payloads',
    '',
    '### Collaboration (weight: 0.8×)',
    '- Base: 15 points',
    '- Has PR template: +25',
    '- Has issue templates: +20',
    '- Has CODEOWNERS: +20',
    '- Multi-contributor (>1): +10',
    '- Active team (>3 contributors): +10',
    '',
    '---',
    '',
    '*Scoring is deterministic and reproducible. Run the same analysis twice on an unchanged codebase and you will get the same score.*',
    '',
  ];

  return lines.join('\n');
}

function buildHistorySection(history: HistoryEntry[]): string {
  if (history.length <= 1) return '';

  const lines = [
    '',
    '---',
    '',
    '## Score History',
    '',
    '| # | Date | Overall | Grade | Documentation | Architecture | Security | CI/CD | Testing | Performance | Collaboration |',
    '|---|------|---------|-------|---------------|--------------|----------|-------|---------|-------------|---------------|',
  ];

  const recent = history.slice(-10).reverse(); // last 10, newest first
  recent.forEach((entry, i) => {
    const date = new Date(entry.analyzedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const catMap = new Map(entry.categories.map(c => [c.name, c]));
    const cats = ['Documentation', 'Architecture', 'Security', 'CI/CD', 'Testing', 'Performance', 'Collaboration'];
    const scores = cats.map(name => {
      const c = catMap.get(name);
      return c ? `${c.score}` : '—';
    });
    lines.push(`| ${i + 1} | ${date} | **${entry.overallScore}** | ${entry.overallGrade} | ${scores.join(' | ')} |`);
  });

  // Trend
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    const diff = curr.overallScore - prev.overallScore;
    const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
    const sign = diff > 0 ? '+' : '';
    lines.push('');
    lines.push(`**Trend:** ${arrow} ${sign}${diff} points since last analysis`);
  }

  lines.push('');
  return lines.join('\n');
}

export async function runHealthEngine(
  input: HealthEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ overallScore: number; overallGrade: string }> {
  progress.start('Health Report', 5);

  const overallScore = calculateOverallScore(input.categories);
  const overallGrade = calculateGrade(overallScore);

  // Build health context
  const ctx = { ...input.context };
  ctx.additionalContext = (ctx.additionalContext || '') +
    `\nAnalysis Results:\nOverall Score: ${overallScore}/100 (${overallGrade})\n` +
    input.categories.map(c => `${c.name}: ${c.score}/100 (${c.grade}) — ${c.details}`).join('\n');

  // Step 1: Generate health report
  progress.increment('Health report');
  const reportResult = await askCopilot(healthSummaryPrompt(ctx));

  // Step 2: Load history and append current run
  progress.increment('Score history');
  const outputDir = output.getBaseDir();
  const history = loadHistory(outputDir);
  const now = new Date().toUTCString();

  const currentEntry: HistoryEntry = {
    analyzedAt: now,
    overallScore,
    overallGrade,
    categories: input.categories.map(c => ({ name: c.name, score: c.score, grade: c.grade, details: c.details })),
  };
  history.push(currentEntry);
  saveHistory(outputDir, history);

  const historySection = buildHistorySection(history);

  const header = `# RepoSentry Health Report — ${input.context.projectName}

**Overall Grade: ${overallGrade}** (${overallScore}/100)
**Analyzed:** ${now}
**Files Scanned:** ${input.filesScanned} | **Languages:** ${input.context.languages.join(', ')}

| Category | Grade | Score | Details |
|----------|-------|-------|---------|
${input.categories.map(c => `| ${c.name} | ${c.grade} | ${c.score} | ${c.details} |`).join('\n')}

> 📊 See [SCORING_METHODOLOGY.md](./SCORING_METHODOLOGY.md) for how these scores are calculated.
${historySection}
---

`;

  await output.write('HEALTH_REPORT.md', header + reportResult);

  // Step 3: Generate analysis.json
  progress.increment('analysis.json');
  const analysisJson = JSON.stringify({
    project: input.context.projectName,
    analyzedAt: now,
    overallScore,
    overallGrade,
    languages: input.context.languages,
    frameworks: input.context.frameworks,
    filesScanned: input.filesScanned,
    totalFiles: input.totalFiles,
    categories: input.categories.map(c => ({
      name: c.name,
      score: c.score,
      grade: c.grade,
      details: c.details,
    })),
    historyEntries: history.length,
  }, null, 2);
  await output.write('analysis.json', analysisJson);

  // Step 4: Generate scoring methodology
  progress.increment('Scoring methodology');
  const methodology = buildMethodologyDoc(input.categories);
  await output.write('SCORING_METHODOLOGY.md', methodology);

  // Step 5: Generate badge
  progress.increment('Badge');
  const badgeColor = overallScore >= 80 ? 'brightgreen' : overallScore >= 60 ? 'yellow' : 'red';
  const badgeUrl = `https://img.shields.io/badge/RepoSentry-${overallGrade}%20(${overallScore}%25)-${badgeColor}`;
  const badgeMd = `# RepoSentry Badge\n\n[![RepoSentry Score: ${overallGrade}](${badgeUrl})](./HEALTH_REPORT.md)\n\nAdd this to your README:\n\`\`\`markdown\n[![RepoSentry Score: ${overallGrade}](${badgeUrl})](./HEALTH_REPORT.md)\n\`\`\`\n`;
  await output.write('badge.md', badgeMd);

  progress.succeed('Health Report');

  return { overallScore, overallGrade };
}
