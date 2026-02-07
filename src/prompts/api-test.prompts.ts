import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function apiTestsMarkdownPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate API test documentation (API_TESTS.md). For each detected endpoint, provide: method, path, description, example request (curl command), expected response, and edge case tests (missing fields, invalid types, unauthorized access).',
    ctx,
  );
}

export function postmanCollectionPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Postman collection JSON (v2.1 format) for all detected API endpoints. Include: request method, URL, headers, request body examples, and test scripts for response validation. Use {{baseUrl}} variable.',
    ctx,
    'json',
  );
}

export function testCoveragePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Analyze the existing test coverage of this project. Report: which files/functions have tests, which ones are missing tests, overall estimated coverage percentage, and the test-to-code ratio. Identify the most critical untested areas.',
    ctx,
  );
}

export function missingTestsPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a list of missing tests for this project. For each untested function/route/component, provide: the file and function name, why it should be tested, a suggested test case description, and a code skeleton for the test.',
    ctx,
  );
}

export function shellTestsPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a shell script (api-tests.sh) that tests all detected API endpoints sequentially. Use curl commands with proper headers. Include success/failure checking, colored output, and a summary at the end.',
    ctx,
  );
}
