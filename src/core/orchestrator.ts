import { resolve } from 'node:path';
import chalk from 'chalk';
import boxen from 'boxen';
import { logger, setVerbose } from '../utils/logger.js';
import { isGitRepo, getRepoName } from '../utils/git.js';
import { isCopilotAvailable, getCopilotBackendName } from './copilot.js';
import { OutputManager, OutputOptions } from './output-manager.js';
import { PromptContext, buildFileTree } from './prompt-builder.js';
import { createProgress } from './progress.js';
import { scanFiles, buildDirectoryTree } from '../scanners/file-scanner.js';
import { detectLanguages } from '../scanners/language-detector.js';
import { detectConfigs } from '../scanners/config-detector.js';
import { parseImports } from '../scanners/import-parser.js';
import { detectRoutes } from '../scanners/route-detector.js';
import { detectModels } from '../scanners/model-detector.js';
import { analyzeGitHistory } from '../scanners/git-analyzer.js';
import { runDocsEngine } from '../engines/docs-engine.js';
import { runArchitectureEngine } from '../engines/architecture-engine.js';
import { runSecurityEngine } from '../engines/security-engine.js';
import { runCIEngine } from '../engines/ci-engine.js';
import { runAPITestEngine } from '../engines/api-test-engine.js';
import { runPerformanceEngine } from '../engines/performance-engine.js';
import { runTeamEngine } from '../engines/team-engine.js';
import { runHealthEngine } from '../engines/health-engine.js';
import { ScoreCategory, calculateGrade } from '../utils/scoring.js';

export interface AnalyzeOptions {
  output: string;
  format: 'markdown' | 'html' | 'json';
  depth: 'quick' | 'standard' | 'deep';
  ignore: string[];
  force: boolean;
  verbose: boolean;
  // Engine flags
  docs?: boolean;
  architecture?: boolean;
  security?: boolean;
  ci?: boolean;
  apiTests?: boolean;
  performance?: boolean;
  team?: boolean;
  health?: boolean;
}

function shouldRunAll(opts: AnalyzeOptions): boolean {
  return !opts.docs && !opts.architecture && !opts.security && !opts.ci &&
    !opts.apiTests && !opts.performance && !opts.team && !opts.health;
}

export async function runAnalysis(opts: AnalyzeOptions): Promise<void> {
  const cwd = process.cwd();
  const runAll = shouldRunAll(opts);

  if (opts.verbose) setVerbose(true);

  // Banner
  const banner = boxen(
    `${chalk.bold.cyan('RepoSentry')} ${chalk.dim('v0.1.0')}\n${chalk.dim('AI-Powered Codebase Intelligence Platform')}`,
    { padding: 1, borderColor: 'cyan', borderStyle: 'round' },
  );
  console.log(banner);
  logger.blank();

  // Preflight checks
  const isGit = isGitRepo(cwd);
  if (!isGit) {
    logger.warn('Not a Git repository — git-related analysis will be limited.');
  }

  if (!isCopilotAvailable()) {
    logger.warn('No Copilot CLI detected. Install: npm i -g @github/copilot  OR  winget install GitHub.Copilot');
    logger.warn('Continuing — Copilot-powered analysis will return placeholder results.');
  } else {
    logger.info(`🤖 Copilot backend: ${getCopilotBackendName()}`);
  }

  // ─── Phase 1: Scanning ───
  logger.info('📂 Scanning repository...');
  const scanResult = await scanFiles(cwd, opts.ignore);
  const langInfo = detectLanguages(cwd, scanResult.files);
  const configInfo = detectConfigs(cwd, scanResult.files);
  const projectName = getRepoName(cwd);

  logger.info(`   Detected: ${langInfo.runtime || langInfo.languages[0] || 'Unknown'} (${langInfo.languages.join(', ')}) | ${langInfo.frameworks.join(', ') || 'No frameworks detected'}`);
  logger.info(`   Files: ${scanResult.totalFiles} | Package Manager: ${langInfo.packageManager || 'unknown'}`);
  logger.blank();

  // ─── Phase 2: Deep scanning ───
  logger.info('🔍 Running deep analysis...');
  const imports = parseImports(cwd, scanResult.files);
  const routes = detectRoutes(cwd, scanResult.files);
  const models = detectModels(cwd, scanResult.files);
  const gitAnalysis = analyzeGitHistory(cwd);

  if (routes.length > 0) logger.dim(`   ${routes.length} API routes detected`);
  if (models.length > 0) logger.dim(`   ${models.length} database models detected`);
  if (gitAnalysis.contributors.length > 0) logger.dim(`   ${gitAnalysis.contributors.length} contributors found`);
  logger.blank();

  // Build shared context
  const fileTree = buildDirectoryTree(scanResult.files, 3);
  const context: PromptContext = {
    projectName,
    languages: langInfo.languages,
    frameworks: langInfo.frameworks,
    packageManager: langInfo.packageManager,
    fileTree,
  };

  // ─── Phase 3: Output setup ───
  const outputDir = resolve(cwd, opts.output);
  const outputManager = new OutputManager({
    baseDir: outputDir,
    format: opts.format,
    force: opts.force,
  });
  await outputManager.init();

  // ─── Phase 4: Run engines ───
  const categories: ScoreCategory[] = [];

  if (runAll || opts.docs) {
    const result = await runDocsEngine(
      { context, routes, recentCommits: gitAnalysis.recentCommits, tags: gitAnalysis.tags, hasReadme: configInfo.hasReadme },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'Documentation', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  if (runAll || opts.architecture) {
    const result = await runArchitectureEngine(
      { context, imports, models, routes },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'Architecture', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  if (runAll || opts.security) {
    const result = await runSecurityEngine(
      { context, rootDir: cwd, files: scanResult.files, hasEnvFile: configInfo.hasEnvFile, hasGitignore: configInfo.hasGitignore, hasDockerfile: configInfo.hasDockerfile },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'Security', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  if (runAll || opts.ci) {
    const result = await runCIEngine(
      { context, rootDir: cwd, hasDockerfile: configInfo.hasDockerfile, hasDockerCompose: configInfo.hasDockerCompose, hasCIConfig: configInfo.hasCIConfig, hasEnvExample: configInfo.hasEnvExample },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'CI/CD', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  if (runAll || opts.apiTests) {
    const result = await runAPITestEngine(
      { context, routes, files: scanResult.files },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'Testing', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  if (runAll || opts.performance) {
    const result = await runPerformanceEngine(
      { context, rootDir: cwd, files: scanResult.files },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'Performance', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  if (runAll || opts.team) {
    const result = await runTeamEngine(
      { context, gitAnalysis, hasPRTemplate: configInfo.hasPRTemplate, hasIssueTemplates: configInfo.hasIssueTemplates, hasCodeowners: configInfo.hasCodeowners },
      outputManager,
      createProgress(),
    );
    categories.push({ name: 'Collaboration', score: result.score, grade: calculateGrade(result.score), details: result.details });
  }

  // Always run health if doing full analysis or explicitly requested
  if (runAll || opts.health) {
    const healthResult = await runHealthEngine(
      { context, categories, filesScanned: scanResult.files.length, totalFiles: scanResult.totalFiles },
      outputManager,
      createProgress(),
    );

    logger.blank();
    // Final summary
    const emojiMap: Record<string, string> = {
      'Documentation': '📝', 'Architecture': '🏗️', 'Security': '🔒',
      'CI/CD': '🔄', 'Testing': '🧪', 'Performance': '⚡',
      'Infrastructure': '🏢', 'Collaboration': '🤝',
    };

    const summaryLines = categories.map(c => {
      const emoji = emojiMap[c.name] || '📊';
      return `   ${emoji} ${c.name.padEnd(16)} ${c.grade.padEnd(4)} (${c.score}/100)`;
    });

    const summaryBox = boxen(
      [
        `${chalk.bold('Analysis Complete!')}`,
        '',
        `${chalk.bold('Overall Grade:')} ${chalk.bold.cyan(healthResult.overallGrade)} (${healthResult.overallScore}/100)`,
        '',
        ...summaryLines,
        '',
        `${chalk.dim(`Output: ${opts.output}/ (${outputManager.getFileCount()} files generated)`)}`,
        `${chalk.dim('Run `reposentry serve` to preview')}`,
      ].join('\n'),
      { padding: 1, borderColor: 'green', borderStyle: 'round' },
    );
    console.log(summaryBox);
  }
}
