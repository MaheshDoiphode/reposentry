import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function readmePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a complete README.md for this project. Include: project description, features, installation instructions, usage examples, configuration options, and contributing section. Make it professional and comprehensive.',
    ctx,
  );
}

export function apiDocsPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate API documentation (API.md). For each detected endpoint/function, document: method, path/signature, parameters, request body schema, response format, and example usage with curl commands or code snippets.',
    ctx,
  );
}

export function setupPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a SETUP.md development environment setup guide. Include step-by-step instructions for macOS, Linux, and Windows. Cover: prerequisites, dependency installation, environment variables, database setup (if applicable), and running the project locally.',
    ctx,
  );
}

export function contributingPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a CONTRIBUTING.md guide. Include: how to fork and clone, branch naming conventions, commit message format, code style guidelines, PR process, testing requirements, and code review expectations.',
    ctx,
  );
}

export function changelogPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a CHANGELOG.md from the git commit history provided. Group changes by version tags (if any) or by date. Categorize entries as: Features, Bug Fixes, Documentation, Refactoring, and Other. Use Keep a Changelog format.',
    ctx,
  );
}

export function faqPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate an FAQ.md based on the codebase analysis. Infer common questions from: TODO/FIXME/HACK comments found in code, complex setup requirements, common pitfalls, and configuration options. Provide clear answers for each.',
    ctx,
  );
}
