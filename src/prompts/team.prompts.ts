import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function prTemplatePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a pull request template (PULL_REQUEST_TEMPLATE.md) tailored to this project. Include: description section, type of change checkboxes, checklist specific to the tech stack (e.g., "Did you run tests?", "Did you update types?"), screenshots section for UI changes, and related issues section.',
    ctx,
  );
}

export function bugReportPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a GitHub issue template for bug reports (bug_report.md) in YAML frontmatter format. Include fields: description, steps to reproduce, expected behavior, actual behavior, environment (with options detected from the project), screenshots, and additional context.',
    ctx,
  );
}

export function featureRequestPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a GitHub issue template for feature requests (feature_request.md) in YAML frontmatter format. Include fields: feature description, problem it solves, proposed solution, alternatives considered, and additional context.',
    ctx,
  );
}

export function codeReviewChecklistPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a code review checklist (CODE_REVIEW_CHECKLIST.md) specific to this project stack. Include checks for: code quality, type safety, error handling, testing, security, performance, accessibility (if frontend), database (if applicable), and documentation.',
    ctx,
  );
}

export function onboardingPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate an ONBOARDING.md guide for new contributors. Include: architecture overview, key files and what they do, development workflow, how to run/test locally, common tasks walkthrough, coding conventions, and a "start here" path for first contributions.',
    ctx,
  );
}

export function developmentWorkflowPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a DEVELOPMENT_WORKFLOW.md describing the recommended Git workflow. Include: branching strategy (feature branches, release branches), commit conventions, PR process, code review expectations, release process, and hotfix procedure.',
    ctx,
  );
}
