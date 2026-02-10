import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { RouteInfo } from '../scanners/route-detector.js';
import {
  apiTestsMarkdownPrompt, postmanCollectionPrompt, testCoveragePrompt,
  missingTestsPrompt, shellTestsPrompt,
} from '../prompts/api-test.prompts.js';

export interface APITestEngineInput {
  context: PromptContext;
  routes: RouteInfo[];
  files: string[];
}

export async function runAPITestEngine(
  input: APITestEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ score: number; details: string }> {
  progress.start('API Testing Engine', 5);

  const ctx = { ...input.context };
  if (input.routes.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nDetected API routes:\n${input.routes.map(r => `${r.method} ${r.path} (${r.file})`).join('\n')}`;
  }

  // Count existing test files
  const testFiles = input.files.filter(f =>
    f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__') || f.includes('test_'),
  );
  ctx.additionalContext = (ctx.additionalContext || '') +
    `\nExisting test files (${testFiles.length}): ${testFiles.slice(0, 20).join(', ')}`;

  // API Tests markdown
  progress.increment('API test documentation');
  const testsDoc = await askCopilot(apiTestsMarkdownPrompt(ctx));
  await output.writeToSubdir('testing', 'API_TESTS.md', testsDoc);

  // Postman collection
  progress.increment('Postman collection');
  const postmanResult = await askCopilot(postmanCollectionPrompt(ctx));
  await output.writeToSubdir('testing', 'api-collection.json', postmanResult);

  // Shell tests
  progress.increment('Shell test script');
  const shellResult = await askCopilot(shellTestsPrompt(ctx));
  await output.writeToSubdir('testing', 'api-tests.sh', shellResult);

  // Test coverage analysis
  progress.increment('Test coverage analysis');
  const coverageResult = await askCopilot(testCoveragePrompt(ctx));
  await output.writeToSubdir('testing', 'TEST_COVERAGE_REPORT.md', coverageResult);

  // Missing tests
  progress.increment('Missing tests analysis');
  const missingResult = await askCopilot(missingTestsPrompt(ctx));
  await output.writeToSubdir('testing', 'MISSING_TESTS.md', missingResult);

  progress.succeed('API Testing Engine');

  // Score based on existing test coverage quality
  let score = 10; // base
  if (testFiles.length > 0) score += 20;
  if (testFiles.length > 5) score += 10;
  if (testFiles.length > 10) score += 10;
  if (testFiles.length > 20) score += 10;

  // Route coverage ratio (if routes exist, penalize low test coverage)
  if (input.routes.length > 0) {
    const ratio = Math.min(testFiles.length / input.routes.length, 1);
    score += Math.round(ratio * 30);
    if (ratio < 0.3) score -= 10; // very low test-to-route ratio
  } else {
    // No routes detected — score purely on test file count
    score += Math.min(testFiles.length * 3, 20);
  }

  // Penalize zero tests
  if (testFiles.length === 0) score -= 5;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    details: `${testFiles.length} test files, ${input.routes.length} routes, coverage ratio: ${input.routes.length > 0 ? Math.round(testFiles.length / input.routes.length * 100) + '%' : 'N/A'}`,
  };
}
