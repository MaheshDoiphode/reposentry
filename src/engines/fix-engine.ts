import { resolve, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { detectConfigs, ConfigInfo } from '../scanners/config-detector.js';
import { scanFiles } from '../scanners/file-scanner.js';
import { detectLanguages } from '../scanners/language-detector.js';
import { detectRoutes } from '../scanners/route-detector.js';
import { PromptContext, buildFileTree } from '../core/prompt-builder.js';
import { buildDirectoryTree } from '../scanners/file-scanner.js';

export type Priority = 'P0' | 'P1' | 'P2';
export type FixCategory = 'Documentation' | 'CI/CD' | 'Security' | 'Testing' | 'Collaboration' | 'Infrastructure';

export interface FixableIssue {
  id: string;
  priority: Priority;
  category: FixCategory;
  title: string;
  description: string;
  /** The file(s) that will be created or modified */
  files: string[];
  /** Prompt to send to Copilot to fix this issue */
  promptBuilder: (ctx: FixContext) => string;
}

export interface FixContext {
  projectName: string;
  languages: string[];
  frameworks: string[];
  packageManager: string;
  fileTree: string;
  rootDir: string;
  ciProvider?: string;
}

export interface FixScanResult {
  issues: FixableIssue[];
  context: FixContext;
  configInfo: ConfigInfo;
}

/**
 * Scan the project and return all fixable issues sorted by priority.
 */
export async function scanForFixableIssues(rootDir: string, ignore: string[]): Promise<FixScanResult> {
  const scanResult = await scanFiles(rootDir, ignore);
  const langInfo = detectLanguages(rootDir, scanResult.files);
  const configInfo = detectConfigs(rootDir, scanResult.files);
  const routes = detectRoutes(rootDir, scanResult.files);
  const fileTree = buildDirectoryTree(scanResult.files, 3);

  const context: FixContext = {
    projectName: resolveProjectName(rootDir),
    languages: langInfo.languages,
    frameworks: langInfo.frameworks,
    packageManager: langInfo.packageManager || 'unknown',
    fileTree,
    rootDir,
  };

  const issues: FixableIssue[] = [];

  // ─── P0: Critical missing files ───

  if (!configInfo.hasReadme) {
    issues.push({
      id: 'readme',
      priority: 'P0',
      category: 'Documentation',
      title: 'Missing README.md',
      description: 'No README.md found. This is the first thing developers see.',
      files: ['README.md'],
      promptBuilder: (ctx) =>
        `Create a professional README.md for the "${ctx.projectName}" project. ` +
        `Languages: ${ctx.languages.join(', ')}. Frameworks: ${ctx.frameworks.join(', ')}. ` +
        `Package manager: ${ctx.packageManager}. ` +
        `Project structure:\n${ctx.fileTree}\n\n` +
        `Include: project description, features, installation, usage, contributing section, license. ` +
        `Write the file to README.md in the project root.`,
    });
  }

  if (!configInfo.hasGitignore) {
    issues.push({
      id: 'gitignore',
      priority: 'P0',
      category: 'Security',
      title: 'Missing .gitignore',
      description: 'No .gitignore — sensitive files or build artifacts may be committed.',
      files: ['.gitignore'],
      promptBuilder: (ctx) =>
        `Create a comprehensive .gitignore file for a ${ctx.languages.join('/')} project using ${ctx.packageManager}. ` +
        `Frameworks: ${ctx.frameworks.join(', ')}. ` +
        `Include entries for: IDE files, OS files, build output, dependencies, env files, logs. ` +
        `Write the file to .gitignore in the project root.`,
    });
  }

  if (!configInfo.hasLicense) {
    issues.push({
      id: 'license',
      priority: 'P0',
      category: 'Documentation',
      title: 'Missing LICENSE',
      description: 'No LICENSE file — the project has no explicit license.',
      files: ['LICENSE'],
      promptBuilder: (_ctx) =>
        `Create a MIT LICENSE file with the current year and "Contributors" as the copyright holder. ` +
        `Write the file to LICENSE in the project root.`,
    });
  }

  if (!configInfo.hasCIConfig) {
    issues.push({
      id: 'ci-pipeline',
      priority: 'P0',
      category: 'CI/CD',
      title: 'No CI/CD pipeline',
      description: 'No continuous integration configuration found.',
      files: [], // determined at fix time based on provider selection
      promptBuilder: (ctx) => {
        const provider = ctx.ciProvider || 'GitHub Actions';
        const fileMap: Record<string, string> = {
          'GitHub Actions': '.github/workflows/ci.yml',
          'GitLab CI': '.gitlab-ci.yml',
          'CircleCI': '.circleci/config.yml',
          'Jenkins': 'Jenkinsfile',
          'Travis CI': '.travis.yml',
        };
        const ciFile = fileMap[provider] || '.github/workflows/ci.yml';
        return `Create a ${provider} CI/CD pipeline for a ${ctx.languages.join('/')} project. ` +
          `Package manager: ${ctx.packageManager}. Frameworks: ${ctx.frameworks.join(', ')}. ` +
          `Include: install dependencies, lint/typecheck, run tests, build. ` +
          `Use latest LTS Node.js versions if applicable. ` +
          `Write the file to ${ciFile} in the project root.`;
      },
    });
  }

  // ─── P1: Important missing files ───

  if (!configInfo.hasContributing) {
    issues.push({
      id: 'contributing',
      priority: 'P1',
      category: 'Documentation',
      title: 'Missing CONTRIBUTING.md',
      description: 'No contributing guide for potential contributors.',
      files: ['CONTRIBUTING.md'],
      promptBuilder: (ctx) =>
        `Create a CONTRIBUTING.md guide for the "${ctx.projectName}" project. ` +
        `Languages: ${ctx.languages.join(', ')}. Package manager: ${ctx.packageManager}. ` +
        `Include: how to set up dev environment, coding standards, PR process, issue reporting. ` +
        `Write the file to CONTRIBUTING.md in the project root.`,
    });
  }

  if (!configInfo.hasDockerfile) {
    issues.push({
      id: 'dockerfile',
      priority: 'P1',
      category: 'Infrastructure',
      title: 'Missing Dockerfile',
      description: 'No Dockerfile for containerized deployment.',
      files: ['Dockerfile'],
      promptBuilder: (ctx) =>
        `Create a production-ready multi-stage Dockerfile for a ${ctx.languages.join('/')} project. ` +
        `Package manager: ${ctx.packageManager}. Frameworks: ${ctx.frameworks.join(', ')}. ` +
        `Use slim base images, non-root user, proper layer caching. ` +
        `Write the file to Dockerfile in the project root.`,
    });
  }

  if (!configInfo.hasEnvExample) {
    issues.push({
      id: 'env-example',
      priority: 'P1',
      category: 'Infrastructure',
      title: 'Missing .env.example',
      description: 'No .env.example — developers don\'t know what environment variables are needed.',
      files: ['.env.example'],
      promptBuilder: (ctx) =>
        `Analyze the "${ctx.projectName}" project source code and create a .env.example file. ` +
        `Look for environment variable usage (process.env, os.environ, etc.) in the source files. ` +
        `List all required variables with placeholder values and comments explaining each. ` +
        `Write the file to .env.example in the project root.`,
    });
  }

  if (!configInfo.hasPRTemplate) {
    issues.push({
      id: 'pr-template',
      priority: 'P1',
      category: 'Collaboration',
      title: 'Missing PR template',
      description: 'No pull request template — PRs lack consistent structure.',
      files: ['.github/pull_request_template.md'],
      promptBuilder: (_ctx) =>
        `Create a pull request template with sections: Description, Type of Change (checkboxes), ` +
        `How Has This Been Tested, Checklist (code review items). ` +
        `Write the file to .github/pull_request_template.md.`,
    });
  }

  if (!configInfo.hasIssueTemplates) {
    issues.push({
      id: 'issue-templates',
      priority: 'P1',
      category: 'Collaboration',
      title: 'Missing issue templates',
      description: 'No issue templates — bug reports and feature requests lack structure.',
      files: ['.github/ISSUE_TEMPLATE/bug_report.md', '.github/ISSUE_TEMPLATE/feature_request.md'],
      promptBuilder: (_ctx) =>
        `Create GitHub issue templates: ` +
        `1. Bug report template at .github/ISSUE_TEMPLATE/bug_report.md with sections: Describe the Bug, To Reproduce, Expected Behavior, Screenshots, Environment. ` +
        `2. Feature request template at .github/ISSUE_TEMPLATE/feature_request.md with sections: Problem, Proposed Solution, Alternatives, Additional Context. ` +
        `Write both files.`,
    });
  }

  if (!configInfo.hasCodeowners) {
    issues.push({
      id: 'codeowners',
      priority: 'P1',
      category: 'Collaboration',
      title: 'Missing CODEOWNERS',
      description: 'No CODEOWNERS file — no automatic review assignments.',
      files: ['CODEOWNERS'],
      promptBuilder: (ctx) =>
        `Create a CODEOWNERS file for the "${ctx.projectName}" project. ` +
        `Project structure:\n${ctx.fileTree}\n\n` +
        `Add a default owner (* @owner) and section-specific owners based on the directory structure. ` +
        `Add helpful comments explaining the format. ` +
        `Write the file to CODEOWNERS in the project root.`,
    });
  }

  // ─── P2: Nice-to-have ───

  if (!configInfo.hasChangelog) {
    issues.push({
      id: 'changelog',
      priority: 'P2',
      category: 'Documentation',
      title: 'Missing CHANGELOG.md',
      description: 'No changelog to track version history.',
      files: ['CHANGELOG.md'],
      promptBuilder: (ctx) =>
        `Create a CHANGELOG.md for the "${ctx.projectName}" project using the Keep a Changelog format. ` +
        `Read the git log to determine what changes have been made. ` +
        `Group by version tags if any exist, otherwise by date. ` +
        `Categorize as: Added, Changed, Deprecated, Removed, Fixed, Security. ` +
        `Write the file to CHANGELOG.md in the project root.`,
    });
  }

  if (!configInfo.hasDockerCompose) {
    issues.push({
      id: 'docker-compose',
      priority: 'P2',
      category: 'Infrastructure',
      title: 'Missing docker-compose.yml',
      description: 'No Docker Compose for local development environment.',
      files: ['docker-compose.yml'],
      promptBuilder: (ctx) =>
        `Create a docker-compose.yml for local development of the "${ctx.projectName}" project. ` +
        `Languages: ${ctx.languages.join(', ')}. Frameworks: ${ctx.frameworks.join(', ')}. ` +
        `Include the app service and any likely database/cache services based on the project dependencies. ` +
        `Use proper networking, volumes for hot reload, and environment variable references. ` +
        `Write the file to docker-compose.yml in the project root.`,
    });
  }

  if (!configInfo.hasEditorConfig) {
    issues.push({
      id: 'editorconfig',
      priority: 'P2',
      category: 'Collaboration',
      title: 'Missing .editorconfig',
      description: 'No .editorconfig — inconsistent formatting across editors.',
      files: ['.editorconfig'],
      promptBuilder: (ctx) =>
        `Create a .editorconfig file for a ${ctx.languages.join('/')} project. ` +
        `Set sensible defaults: utf-8, lf line endings, trim trailing whitespace, ` +
        `insert final newline, indent with spaces (2 for JS/TS/JSON/YAML, 4 for Python). ` +
        `Write the file to .editorconfig in the project root.`,
    });
  }

  // Check for missing test files
  const testFiles = scanResult.files.filter(f =>
    f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__') || f.includes('test_'),
  );
  if (testFiles.length === 0 && routes.length > 0) {
    issues.push({
      id: 'test-scaffold',
      priority: 'P1',
      category: 'Testing',
      title: 'No test files found',
      description: `${routes.length} API routes detected but zero test files.`,
      files: [], // Copilot will determine based on framework
      promptBuilder: (ctx) =>
        `The "${ctx.projectName}" project has API routes but no test files. ` +
        `Languages: ${ctx.languages.join(', ')}. Frameworks: ${ctx.frameworks.join(', ')}. ` +
        `Create a basic test setup: install the appropriate test framework if needed, ` +
        `create a sample test file that tests at least one route or component. ` +
        `Use the project's package manager (${ctx.packageManager}). ` +
        `Write the test file(s) in the conventional location for this project type.`,
    });
  }

  // Check for missing security policy
  const hasSecurityMd = existsSync(join(rootDir, 'SECURITY.md'));
  if (!hasSecurityMd) {
    issues.push({
      id: 'security-policy',
      priority: 'P2',
      category: 'Security',
      title: 'Missing SECURITY.md',
      description: 'No security policy — no clear way to report vulnerabilities.',
      files: ['SECURITY.md'],
      promptBuilder: (ctx) =>
        `Create a SECURITY.md file for the "${ctx.projectName}" project. ` +
        `Include: supported versions table, how to report vulnerabilities, ` +
        `expected response time, disclosure policy. ` +
        `Write the file to SECURITY.md in the project root.`,
    });
  }

  // Sort: P0 first, then P1, then P2
  const priorityOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
  issues.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return { issues, context, configInfo };
}

function resolveProjectName(rootDir: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
    if (pkg.name) return pkg.name;
  } catch { /* ignore */ }
  return rootDir.split(/[\\/]/).pop() || 'project';
}

/**
 * Build the CI/CD provider selection prompt for fix-engine.
 */
export const CI_PROVIDERS = [
  { name: 'GitHub Actions', file: '.github/workflows/ci.yml' },
  { name: 'GitLab CI', file: '.gitlab-ci.yml' },
  { name: 'CircleCI', file: '.circleci/config.yml' },
  { name: 'Jenkins', file: 'Jenkinsfile' },
  { name: 'Travis CI', file: '.travis.yml' },
  { name: 'Azure Pipelines', file: 'azure-pipelines.yml' },
] as const;

/**
 * Build a production deployment guide prompt.
 */
export function buildDeployGuidePrompt(ctx: FixContext): string {
  return `Create a comprehensive "take-it-to-prod.md" deployment guide for the "${ctx.projectName}" project. ` +
    `Languages: ${ctx.languages.join(', ')}. Frameworks: ${ctx.frameworks.join(', ')}. ` +
    `Package manager: ${ctx.packageManager}. CI provider: ${ctx.ciProvider || 'not configured'}. ` +
    `Project structure:\n${ctx.fileTree}\n\n` +
    `Include sections:\n` +
    `1. Pre-Production Checklist (env vars, secrets, database migrations)\n` +
    `2. Deployment Options (cloud providers suitable for this stack)\n` +
    `3. Step-by-step deployment for the top 2 recommended platforms\n` +
    `4. Environment Variables & Secrets to configure (list what the CI/CD pipeline needs)\n` +
    `5. Post-Deployment Verification (health checks, smoke tests)\n` +
    `6. Rollback Procedures\n` +
    `7. Monitoring & Observability recommendations\n\n` +
    `Write the file to take-it-to-prod.md in the project root.`;
}
