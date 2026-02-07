import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext, buildFileTree } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { readmePrompt, apiDocsPrompt, setupPrompt, contributingPrompt, changelogPrompt, faqPrompt } from '../prompts/docs.prompts.js';
import { RouteInfo } from '../scanners/route-detector.js';

export interface DocsEngineInput {
  context: PromptContext;
  routes: RouteInfo[];
  recentCommits: string[];
  tags: string[];
  hasReadme: boolean;
}

export async function runDocsEngine(
  input: DocsEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ score: number; details: string }> {
  const steps = [
    { key: 'readme', label: 'README.md', promptFn: readmePrompt, file: 'README.md' },
    { key: 'api', label: 'API.md', promptFn: apiDocsPrompt, file: 'API.md' },
    { key: 'setup', label: 'SETUP.md', promptFn: setupPrompt, file: 'SETUP.md' },
    { key: 'contributing', label: 'CONTRIBUTING.md', promptFn: contributingPrompt, file: 'CONTRIBUTING.md' },
    { key: 'changelog', label: 'CHANGELOG.md', promptFn: changelogPrompt, file: 'CHANGELOG.md' },
    { key: 'faq', label: 'FAQ.md', promptFn: faqPrompt, file: 'FAQ.md' },
  ];

  progress.start('Documentation Engine', steps.length);

  // Enrich context with routes and commits
  const ctx = { ...input.context };
  if (input.routes.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nDetected API routes:\n${input.routes.map(r => `${r.method} ${r.path} (${r.file})`).join('\n')}`;
  }
  if (input.recentCommits.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nRecent commits:\n${input.recentCommits.join('\n')}`;
  }
  if (input.tags.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nVersion tags: ${input.tags.join(', ')}`;
  }

  let filesGenerated = 0;

  for (const step of steps) {
    progress.increment(step.label);
    const prompt = step.promptFn(ctx);
    const result = await askCopilot(prompt);
    await output.write(step.file, result);
    filesGenerated++;
  }

  progress.succeed('Documentation Engine');

  // Calculate score
  let score = 40; // base score for generating docs
  score += filesGenerated * 10;
  if (input.hasReadme) score += 5;
  score = Math.min(100, score);

  return {
    score,
    details: `${filesGenerated} documentation files generated`,
  };
}
