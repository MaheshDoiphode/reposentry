import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { ScoreCategory, calculateGrade, calculateOverallScore } from '../utils/scoring.js';
import { healthSummaryPrompt } from '../prompts/health.prompts.js';

export interface HealthEngineInput {
  context: PromptContext;
  categories: ScoreCategory[];
  filesScanned: number;
  totalFiles: number;
}

export async function runHealthEngine(
  input: HealthEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ overallScore: number; overallGrade: string }> {
  progress.start('Health Report', 3);

  const overallScore = calculateOverallScore(input.categories);
  const overallGrade = calculateGrade(overallScore);

  // Build health context
  const ctx = { ...input.context };
  ctx.additionalContext = (ctx.additionalContext || '') +
    `\nAnalysis Results:\nOverall Score: ${overallScore}/100 (${overallGrade})\n` +
    input.categories.map(c => `${c.name}: ${c.score}/100 (${c.grade}) — ${c.details}`).join('\n');

  // Generate health report
  progress.increment('Health report');
  const reportResult = await askCopilot(healthSummaryPrompt(ctx));

  const now = new Date().toUTCString();
  const header = `# RepoSentry Health Report — ${input.context.projectName}

**Overall Grade: ${overallGrade}** (${overallScore}/100)
**Analyzed:** ${now}
**Files Scanned:** ${input.filesScanned} | **Languages:** ${input.context.languages.join(', ')}

| Category | Grade | Score | Details |
|----------|-------|-------|---------|
${input.categories.map(c => `| ${c.name} | ${c.grade} | ${c.score} | ${c.details} |`).join('\n')}

---

`;

  await output.write('HEALTH_REPORT.md', header + reportResult);

  // Generate analysis.json
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
  }, null, 2);
  await output.write('analysis.json', analysisJson);

  // Generate badge
  progress.increment('Badge');
  const badgeColor = overallScore >= 80 ? 'brightgreen' : overallScore >= 60 ? 'yellow' : 'red';
  const badgeUrl = `https://img.shields.io/badge/RepoSentry-${overallGrade}%20(${overallScore}%25)-${badgeColor}`;
  const badgeMd = `# RepoSentry Badge\n\n[![RepoSentry Score: ${overallGrade}](${badgeUrl})](./HEALTH_REPORT.md)\n\nAdd this to your README:\n\`\`\`markdown\n[![RepoSentry Score: ${overallGrade}](${badgeUrl})](./HEALTH_REPORT.md)\n\`\`\`\n`;
  await output.write('badge.md', badgeMd);

  progress.succeed('Health Report');

  return { overallScore, overallGrade };
}
