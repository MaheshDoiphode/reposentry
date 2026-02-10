import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function healthSummaryPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a concise health report summary for this project. Based on the analysis results provided in the additional context, create a markdown health dashboard showing: overall grade (A-F), per-category grades and scores, top 3 priority actions, and key statistics (files scanned, languages, contributors).',
    ctx,
  );
}

export function healthScorePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a JSON object with health scores for this project. Include scores (0-100) for: documentation, architecture, security, ci_cd, testing, performance, infrastructure, collaboration. Also include an overall weighted average score and the letter grade.',
    ctx,
    'json',
  );
}
