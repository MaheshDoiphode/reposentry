import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function performanceAuditPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Perform a performance audit of this codebase. Detect anti-patterns: N+1 queries, missing database indexes, blocking I/O in async code, memory leak patterns, unbounded queries, missing caching, inefficient algorithms, large payload responses, missing compression, bundle size issues. For each finding: describe the issue, its performance impact, location, and provide an optimized solution.',
    ctx,
  );
}

export function performanceScorePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a performance score (0-100) for this codebase as JSON. Include scores for: backend performance, frontend performance (if applicable), database efficiency, caching strategy, and infrastructure optimization. Provide an overall weighted score.',
    ctx,
    'json',
  );
}
