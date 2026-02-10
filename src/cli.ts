import { Command } from 'commander';
import { runAnalysis, AnalyzeOptions } from './core/orchestrator.js';
import chalk from 'chalk';
import { loadConfig } from './config.js';
import { getCliVersion } from './utils/version.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('reposentry')
    .description('RepoSentry — AI-powered codebase intelligence platform')
    .version(getCliVersion());

  const analyze = program
    .command('analyze')
    .description('Analyze the current repository and generate reports')
    .option('--all', 'Run all engines (overrides config engine selection)', false)
    .option('-o, --output <dir>', 'Output directory (default: from config or .reposentry)')
    .option('-f, --format <type>', 'Output format: markdown | html | json (default: from config or markdown)')
    .option('--depth <level>', 'Analysis depth: quick | standard | deep (default: from config or standard)')
    .option('--ignore <patterns...>', 'Glob patterns to ignore')
    .option('--force', 'Overwrite existing output', false)
    .option('-v, --verbose', 'Show detailed analysis progress', false)
    .option('-m, --model <model>', 'AI model to use (backend-specific)')
    .option('--docs', 'Generate documentation suite only')
    .option('--architecture', 'Generate architecture diagrams only')
    .option('--security', 'Run security audit + threat model only')
    .option('--ci', 'Generate CI/CD pipeline + infrastructure only')
    .option('--api-tests', 'Generate API test collection only')
    .option('--performance', 'Run performance anti-pattern detection only')
    .option('--team', 'Generate collaboration templates only')
    .option('--health', 'Generate health report + grade only')
    .option('--no-color', 'Disable colored output')
    .addHelpText('after', `
${chalk.bold('Engine Flags:')}
  Run specific engines instead of the full analysis:
    --docs          README, API docs, SETUP, CONTRIBUTING, CHANGELOG, FAQ
    --architecture  Mermaid diagrams + ARCHITECTURE.md
    --security      Vulnerability scan, threat model, security report
    --ci            GitHub Actions, Dockerfile, Docker Compose, .env
    --api-tests     API test docs, Postman collection, test scripts
    --performance   Anti-pattern detection + performance audit
    --team          PR templates, issue templates, CODEOWNERS, onboarding
    --health        Aggregate health score + grade badge

${chalk.bold('Examples:')}
  $ reposentry analyze                    Full analysis with all engines
  $ reposentry analyze --docs --ci        Only docs + CI/CD
  $ reposentry analyze --model <name>     Use a specific model (if supported)
  $ reposentry analyze --security -v      Security audit with verbose output
`)
    .action(async (options) => {
      const config = await loadConfig();

      const hasAnyEngineFlag = Boolean(
        options.docs || options.architecture || options.security || options.ci ||
        options.apiTests || options.performance || options.team || options.health,
      );
      const useConfigEngines = !options.all && !hasAnyEngineFlag;

      const opts: AnalyzeOptions = {
        output: options.output ?? config.output,
        format: (options.format ?? config.format) as 'markdown' | 'html' | 'json',
        depth: (options.depth ?? config.depth) as 'quick' | 'standard' | 'deep',
        ignore: (options.ignore && options.ignore.length > 0) ? options.ignore : config.ignore,
        force: options.force,
        verbose: options.verbose,
        model: options.model,
        ...(useConfigEngines ? {
          docs: config.engines.docs,
          architecture: config.engines.architecture,
          security: config.engines.security,
          ci: config.engines.ci,
          apiTests: config.engines.apiTests,
          performance: config.engines.performance,
          team: config.engines.team,
          health: config.engines.health,
        } : {
          docs: options.docs,
          architecture: options.architecture,
          security: options.security,
          ci: options.ci,
          apiTests: options.apiTests,
          performance: options.performance,
          team: options.team,
          health: options.health,
        }),
      };

      try {
        await runAnalysis(opts);
      } catch (err: any) {
        console.error(`\n❌ Analysis failed: ${err.message}`);
        if (options.verbose) console.error(err.stack);
        process.exit(1);
      }
    });

  program
    .command('serve')
    .description('Preview generated reports in browser')
    .option('--port <port>', 'Port to listen on', '3000')
    .option('-o, --output <dir>', 'Output directory to serve (default: from config or .reposentry)')
    .action(async (options) => {
      const { startServer } = await import('./server/index.js');
      const config = await loadConfig();
      await startServer({
        port: parseInt(options.port, 10),
        outputDir: options.output ?? config.output,
      });
    });

  program
    .command('badge')
    .description('Generate health/security badge for README')
    .option('-o, --output <dir>', 'Output directory (default: from config or .reposentry)')
    .action(async (options) => {
      const { resolve } = await import('node:path');
      const { readFileContent } = await import('./utils/fs.js');
      try {
        const config = await loadConfig();
        const outputDir = options.output ?? config.output;
        const analysisPath = resolve(process.cwd(), outputDir, 'analysis.json');
        const data = JSON.parse(await readFileContent(analysisPath));
        console.log(`\n📛 RepoSentry Badge for ${data.project}:`);
        console.log(`   Grade: ${data.overallGrade} (${data.overallScore}/100)`);
        const color = data.overallScore >= 80 ? 'brightgreen' : data.overallScore >= 60 ? 'yellow' : 'red';
        const url = `https://img.shields.io/badge/RepoSentry-${data.overallGrade}%20(${data.overallScore}%25)-${color}`;
        console.log(`\n   Markdown:\n   [![RepoSentry Score: ${data.overallGrade}](${url})](./HEALTH_REPORT.md)\n`);
      } catch {
        console.error('❌ No analysis found. Run `reposentry analyze` first.');
      }
    });

  program
    .command('compare')
    .description('Compare current score against a previous analysis run')
    .option('-o, --output <dir>', 'Output directory (default: from config or .reposentry)')
    .action(async (options) => {
      const { resolve } = await import('node:path');
      const { readFileSync: readFS, existsSync: existsFS } = await import('node:fs');
      const readline = await import('node:readline');

      const config = await loadConfig();
      const outputDir = options.output ?? config.output;

      const historyPath = resolve(process.cwd(), outputDir, 'history.json');
      if (!existsFS(historyPath)) {
        console.error('❌ No scoring history found. Run `reposentry analyze` first.');
        process.exit(1);
      }

      let history: Array<{
        analyzedAt: string;
        overallScore: number;
        overallGrade: string;
        categories: Array<{ name: string; score: number; grade: string; details: string }>;
      }>;
      try {
        history = JSON.parse(readFS(historyPath, 'utf-8'));
      } catch {
        console.error('❌ Could not parse history.json.');
        process.exit(1);
      }

      if (history.length < 2) {
        console.error('❌ Need at least 2 analysis runs to compare. Run `reposentry analyze` again after making changes.');
        process.exit(1);
      }

      const latest = history[history.length - 1];
      const latestId = history.length;

      // Show table of past runs
      console.log(`\n${chalk.bold.cyan('🛡️  RepoSentry Score History')}\n`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────'));
      console.log(`  ${chalk.bold('ID'.padEnd(5))}${chalk.bold('Date'.padEnd(28))}${chalk.bold('Grade'.padEnd(8))}${chalk.bold('Score'.padEnd(8))}${chalk.bold('Categories')}`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────'));

      for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        const id = (i + 1).toString();
        const date = new Date(entry.analyzedAt).toLocaleString();
        const isLatest = i === history.length - 1;
        const label = isLatest ? chalk.dim(' (latest)') : '';

        const catSummary = entry.categories
          .map(c => `${c.name.substring(0, 3)}:${c.score}`)
          .join(' ');

        const gradeColor = entry.overallScore >= 80 ? chalk.green : entry.overallScore >= 60 ? chalk.yellow : chalk.red;

        console.log(
          `  ${chalk.cyan(id.padEnd(5))}${date.padEnd(28)}${gradeColor(entry.overallGrade.padEnd(8))}${gradeColor(entry.overallScore.toString().padEnd(8))}${chalk.dim(catSummary)}${label}`,
        );
      }

      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────'));
      console.log(chalk.dim(`\n  Latest run: #${latestId}. Select an older run to compare against.\n`));

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

      const input = (await ask(chalk.cyan(`  Enter ID to compare (1-${latestId - 1}): `))).trim();
      rl.close();

      const selectedId = parseInt(input, 10);
      if (isNaN(selectedId) || selectedId < 1 || selectedId >= latestId) {
        console.error(chalk.red(`\n  ❌ Invalid ID. Must be between 1 and ${latestId - 1}.\n`));
        process.exit(1);
      }

      const older = history[selectedId - 1];

      // Build comparison
      console.log(`\n${chalk.bold('  Comparing Run #' + selectedId + ' → Run #' + latestId + ' (latest)')}\n`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────'));
      console.log(`  ${chalk.bold('Category'.padEnd(20))}${chalk.bold('Before'.padEnd(14))}${chalk.bold('After'.padEnd(14))}${chalk.bold('Change')}`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────'));

      const olderMap = new Map(older.categories.map(c => [c.name, c]));
      const latestMap = new Map(latest.categories.map(c => [c.name, c]));
      const allCats = [...new Set([...olderMap.keys(), ...latestMap.keys()])];

      for (const cat of allCats) {
        const o = olderMap.get(cat);
        const l = latestMap.get(cat);
        const before = o ? `${o.grade} (${o.score})` : '—';
        const after = l ? `${l.grade} (${l.score})` : '—';
        const diff = (l?.score ?? 0) - (o?.score ?? 0);
        const arrow = diff > 0 ? chalk.green(`+${diff}`) : diff < 0 ? chalk.red(`${diff}`) : chalk.dim(' 0');

        console.log(`  ${cat.padEnd(20)}${before.padEnd(14)}${after.padEnd(14)}${arrow}`);
      }

      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────'));

      const overallDiff = latest.overallScore - older.overallScore;
      const overallArrow = overallDiff > 0 ? chalk.green(`+${overallDiff}`) : overallDiff < 0 ? chalk.red(`${overallDiff}`) : chalk.dim(' 0');
      const overallBefore = `${older.overallGrade} (${older.overallScore})`;
      const overallAfter = `${latest.overallGrade} (${latest.overallScore})`;
      console.log(`  ${chalk.bold('OVERALL'.padEnd(20))}${overallBefore.padEnd(14)}${overallAfter.padEnd(14)}${overallArrow}`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────\n'));

      if (overallDiff > 0) {
        console.log(chalk.green.bold('  📈 Great progress! Your codebase health improved.\n'));
      } else if (overallDiff < 0) {
        console.log(chalk.red.bold('  📉 Score decreased. Check the category breakdown above.\n'));
      } else {
        console.log(chalk.dim('  ➡️  No change in overall score.\n'));
      }
    });

  program
    .command('fix')
    .description('Auto-fix detected issues in your project (creates missing files)')
    .option('-o, --output <dir>', 'RepoSentry output directory', '.reposentry')
    .option('-m, --model <model>', 'AI model to use')
    .option('--all', 'Fix all issues without prompting', false)
    .option('--dry-run', 'Show what would be fixed without making changes', false)
    .action(async (options) => {
      const { resolve: resolvePath } = await import('node:path');
      const readline = await import('node:readline');
      const { scanForFixableIssues, CI_PROVIDERS, buildDeployGuidePrompt } = await import('./engines/fix-engine.js');
      const { askCopilotWithWrite, isCopilotAvailable, setCopilotModel, checkCopilotAuth } = await import('./core/copilot.js');
      const { createProgress } = await import('./core/progress.js');

      const cwd = process.cwd();

      // Banner
      console.log(`\n${chalk.bold.cyan('🛡️  RepoSentry Fix')} ${chalk.dim('— Auto-fix detected issues')}\n`);

      if (!isCopilotAvailable()) {
        console.error(chalk.red('  ❌ Copilot CLI not found. Install: npm i -g @github/copilot'));
        process.exit(1);
      }

      const auth = checkCopilotAuth();
      if (!auth.ok) {
        console.error(chalk.red(`  ❌ ${auth.message}`));
        process.exit(1);
      }

      if (options.model) setCopilotModel(options.model);

      // Scan for issues
      console.log(chalk.dim('  Scanning project for fixable issues...\n'));
      const { issues, context } = await scanForFixableIssues(cwd, ['node_modules', 'dist', '.git']);

      if (issues.length === 0) {
        console.log(chalk.green('  ✅ No fixable issues found! Your project looks great.\n'));
        return;
      }

      // Display issues grouped by priority
      const priorityColors: Record<string, (s: string) => string> = {
        P0: chalk.red.bold,
        P1: chalk.yellow.bold,
        P2: chalk.dim,
      };
      const priorityLabels: Record<string, string> = {
        P0: '🔴 Critical',
        P1: '🟡 Important',
        P2: '🔵 Nice-to-have',
      };

      console.log(chalk.bold(`  Found ${issues.length} fixable issue${issues.length > 1 ? 's' : ''}:\n`));
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'));
      console.log(`  ${chalk.bold('#'.padEnd(4))}${chalk.bold('Pri'.padEnd(6))}${chalk.bold('Category'.padEnd(18))}${chalk.bold('Issue')}`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'));

      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        const color = priorityColors[issue.priority] || chalk.dim;
        const num = (i + 1).toString().padEnd(4);
        console.log(`  ${chalk.cyan(num)}${color(issue.priority.padEnd(6))}${issue.category.padEnd(18)}${issue.title}`);
        console.log(chalk.dim(`      ${issue.description}`));
      }

      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'));

      const p0Count = issues.filter(i => i.priority === 'P0').length;
      const p1Count = issues.filter(i => i.priority === 'P1').length;
      const p2Count = issues.filter(i => i.priority === 'P2').length;
      console.log(chalk.dim(`\n  ${priorityLabels.P0}: ${p0Count}  ${priorityLabels.P1}: ${p1Count}  ${priorityLabels.P2}: ${p2Count}\n`));

      if (options.dryRun) {
        console.log(chalk.dim('  --dry-run: No changes made.\n'));
        return;
      }

      // Ask mode
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

      let mode: 'all' | 'step' | 'select' = 'step';
      if (options.all) {
        mode = 'all';
      } else {
        console.log(chalk.bold('  How would you like to proceed?\n'));
        console.log('  1. 🚀 Fix all issues automatically');
        console.log('  2. 🔄 Step-by-step (confirm each fix)');
        console.log('  3. 🎯 Select specific issues to fix');
        console.log('  0. ❌ Cancel\n');

        const choice = (await ask(chalk.cyan('  Select mode (0-3): '))).trim();
        if (choice === '0') {
          console.log(chalk.dim('\n  Cancelled.\n'));
          rl.close();
          return;
        }
        mode = choice === '1' ? 'all' : choice === '3' ? 'select' : 'step';
      }

      // Determine which issues to fix
      let toFix = [...issues];

      if (mode === 'select') {
        const input = (await ask(chalk.cyan(`  Enter issue numbers to fix (e.g., 1,3,5): `))).trim();
        const nums = input.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= issues.length);
        if (nums.length === 0) {
          console.log(chalk.red('\n  No valid issues selected.\n'));
          rl.close();
          return;
        }
        toFix = nums.map(n => issues[n - 1]);
      }

      // CI/CD provider selection if fixing CI
      const ciIssue = toFix.find(i => i.id === 'ci-pipeline');
      if (ciIssue) {
        console.log(chalk.bold('\n  🔧 CI/CD Provider Selection\n'));
        for (let i = 0; i < CI_PROVIDERS.length; i++) {
          const rec = i === 0 ? chalk.dim(' (Recommended)') : '';
          console.log(`  ${chalk.cyan((i + 1).toString().padStart(2))}. ${CI_PROVIDERS[i].name}${rec}`);
        }
        const ciChoice = (await ask(chalk.cyan(`\n  Select CI provider (1-${CI_PROVIDERS.length}): `))).trim();
        const ciIdx = parseInt(ciChoice, 10) - 1;
        const provider = CI_PROVIDERS[ciIdx >= 0 && ciIdx < CI_PROVIDERS.length ? ciIdx : 0];
        context.ciProvider = provider.name;
        ciIssue.files = [provider.file];
        console.log(chalk.green(`  ✓ Selected: ${provider.name}\n`));
      }

      rl.close();

      // Execute fixes
      console.log(chalk.bold(`\n  Fixing ${toFix.length} issue${toFix.length > 1 ? 's' : ''}...\n`));
      console.log(chalk.dim('  ⏳ Each fix may take 30-60s — Copilot is generating project-aware files.\n'));

      const progress = createProgress();
      progress.setTotalSteps(toFix.length);

      let fixed = 0;
      let failed = 0;
      const fixResults: Array<{ issue: typeof toFix[0]; success: boolean; output: string; filesCreated: string[] }> = [];

      for (const issue of toFix) {
        if (mode === 'step') {
          const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise<string>(r => rl2.question(
            chalk.cyan(`  Fix "${issue.title}"? (y/n/skip): `), r,
          ));
          rl2.close();

          if (answer.trim().toLowerCase() !== 'y') {
            progress.increment(`Skipped: ${issue.title}`);
            fixResults.push({ issue, success: false, output: 'Skipped by user', filesCreated: [] });
            continue;
          }
        }

        progress.increment(issue.title);
        const prompt = issue.promptBuilder(context);

        console.log(chalk.dim(`\n     🤖 Asking Copilot to fix: ${issue.title}`));
        console.log(chalk.dim(`     📁 Expected files: ${issue.files.length > 0 ? issue.files.join(', ') : '(Copilot decides)'}`));

        try {
          const { existsSync: checkExists } = await import('node:fs');
          const { join: joinPath } = await import('node:path');

          const result = await askCopilotWithWrite(prompt, { projectDir: cwd, timeoutMs: 240000 });
          const isFailed = result.startsWith('[Fix failed');

          // Verify which files were actually created
          const filesCreated: string[] = [];
          for (const f of issue.files) {
            const fullPath = joinPath(cwd, f);
            if (checkExists(fullPath)) {
              filesCreated.push(f);
            }
          }

          // Also check Copilot output for file paths it mentions
          const mentionedPaths = result.match(/(?:created|wrote|written|writing)\s+[`"']?([^\s`"']+\.\w+)/gi) || [];
          for (const match of mentionedPaths) {
            const pathMatch = match.match(/[`"']?([^\s`"']+\.\w+)/);
            if (pathMatch) {
              const mentioned = pathMatch[1];
              const fullPath = joinPath(cwd, mentioned);
              if (checkExists(fullPath) && !filesCreated.includes(mentioned)) {
                filesCreated.push(mentioned);
              }
            }
          }

          if (isFailed) {
            failed++;
            console.log(chalk.red(`     ❌ Failed: ${result.slice(0, 120)}`));
            fixResults.push({ issue, success: false, output: result.slice(0, 200), filesCreated });
          } else if (filesCreated.length > 0) {
            fixed++;
            for (const f of filesCreated) {
              console.log(chalk.green(`     ✅ Created: ${f}`));
            }
            fixResults.push({ issue, success: true, output: result.slice(0, 200), filesCreated });
          } else if (issue.files.length === 0) {
            // Issues where Copilot decides the files (test scaffold, etc.)
            fixed++;
            console.log(chalk.green(`     ✅ Copilot applied fix`));
            console.log(chalk.dim(`     📝 ${result.slice(0, 150)}`));
            fixResults.push({ issue, success: true, output: result.slice(0, 200), filesCreated });
          } else {
            failed++;
            console.log(chalk.yellow(`     ⚠️  Copilot responded but files not found on disk`));
            console.log(chalk.dim(`     📝 ${result.slice(0, 200)}`));
            fixResults.push({ issue, success: false, output: 'Files not created on disk', filesCreated });
          }
        } catch (err: any) {
          failed++;
          console.log(chalk.red(`     ❌ Error: ${err?.message?.slice(0, 120) || 'Unknown error'}`));
          fixResults.push({ issue, success: false, output: err?.message?.slice(0, 200) || 'Unknown error', filesCreated: [] });
        }
      }

      progress.succeed('All fixes');

      // Summary
      console.log(`\n${chalk.bold('  Fix Summary')}\n`);
      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'));

      for (const r of fixResults) {
        const icon = r.success ? chalk.green('✅') : r.output === 'Skipped by user' ? chalk.dim('⏭️') : chalk.red('❌');
        const fileInfo = r.filesCreated.length > 0 ? chalk.dim(` → ${r.filesCreated.join(', ')}`) : '';
        const failReason = !r.success && r.output !== 'Skipped by user' ? chalk.dim(` (${r.output.slice(0, 60)})`) : '';
        console.log(`  ${icon} ${r.issue.title}${fileInfo}${failReason}`);
      }

      console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'));
      console.log(`  ${chalk.green.bold(`${fixed} fixed`)} | ${chalk.red(`${failed} failed`)} | ${chalk.dim(`${toFix.length - fixed - failed} skipped`)}\n`);

      // Offer deployment guide if CI was fixed
      if (ciIssue && fixResults.find(r => r.issue.id === 'ci-pipeline' && r.success)) {
        const rl3 = readline.createInterface({ input: process.stdin, output: process.stdout });
        const wantDeploy = await new Promise<string>(r =>
          rl3.question(chalk.cyan('  Generate production deployment guide? (y/n): '), r),
        );
        rl3.close();

        if (wantDeploy.trim().toLowerCase() === 'y') {
          console.log(chalk.dim('\n  Generating take-it-to-prod.md...\n'));
          const deployPrompt = buildDeployGuidePrompt(context);
          await askCopilotWithWrite(deployPrompt, { projectDir: cwd, timeoutMs: 240000 });
          console.log(chalk.green('  ✅ take-it-to-prod.md created!\n'));
        }
      }

      // Secrets/env notification
      if (ciIssue && context.ciProvider) {
        console.log(chalk.bold.yellow('  ⚠️  CI/CD Setup Reminders:\n'));
        const envHints: Record<string, string[]> = {
          'GitHub Actions': [
            'Go to Settings → Secrets and variables → Actions',
            'Add required secrets (API keys, deploy tokens, etc.)',
            'Review the generated workflow file before pushing',
          ],
          'GitLab CI': [
            'Go to Settings → CI/CD → Variables',
            'Add required CI/CD variables',
            'Review .gitlab-ci.yml before committing',
          ],
          'CircleCI': [
            'Go to Project Settings → Environment Variables',
            'Add required environment variables',
            'Review .circleci/config.yml before pushing',
          ],
          'Jenkins': [
            'Configure credentials in Jenkins → Manage Credentials',
            'Set up the pipeline in Jenkins dashboard',
            'Review Jenkinsfile before committing',
          ],
          'Travis CI': [
            'Go to Travis CI settings for this repo',
            'Add required environment variables',
            'Review .travis.yml before pushing',
          ],
          'Azure Pipelines': [
            'Go to Azure DevOps → Pipelines → Library',
            'Add required variable groups and secrets',
            'Review azure-pipelines.yml before committing',
          ],
        };

        const hints = envHints[context.ciProvider] || envHints['GitHub Actions'];
        for (const hint of hints) {
          console.log(chalk.dim(`     → ${hint}`));
        }
        console.log('');
      }

      if (fixed > 0) {
        console.log(chalk.green.bold('  📈 Run `reposentry analyze` again to see your improved scores!\n'));
      }
    });

  program
    .command('init')
    .description('Interactive setup — choose what to generate')
    .action(async () => {
      await runInteractiveMode();
    });

  // Default action — show interactive menu when no command given
  program.action(async () => {
    await runInteractiveMode();
  });

  return program;
}

async function runInteractiveMode(): Promise<void> {
  const readline = await import('node:readline');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

  console.log(`\n${chalk.bold.cyan('🛡️  RepoSentry')} ${chalk.dim('— AI-Powered Codebase Intelligence')}\n`);
  console.log(chalk.bold('  What would you like to do?\n'));
  console.log('  1. 🚀 Full Analysis          Run all engines');
  console.log('  2. 📝 Documentation           README, API, Setup, Changelog');
  console.log('  3. 🏗️  Architecture            Mermaid diagrams + docs');
  console.log('  4. 🔒 Security Audit          Vulnerability scan + threat model');
  console.log('  5. 🔧 CI/CD & Infrastructure  Pipelines, Docker, deploy guide');
  console.log('  6. 🧪 API Testing             Test docs + Postman collection');
  console.log('  7. ⚡ Performance             Anti-pattern detection');
  console.log('  8. 🤝 Team & Collaboration    Templates + onboarding');
  console.log('  9. ❤️  Health Report           Score + grade badge');
  console.log(' 10. 🧠 Change AI Model         Select model for analysis');
  console.log(' 11. 📁 Preview Reports          Start preview server');
  console.log(' 12. 🔨 Fix Issues              Auto-fix detected project issues');
  console.log('  0. ❌ Exit\n');

  const choice = (await ask(chalk.cyan('  Select option (0-12): '))).trim();

  const engineMap: Record<string, Partial<AnalyzeOptions>> = {
    '1': {},
    '2': { docs: true },
    '3': { architecture: true },
    '4': { security: true },
    '5': { ci: true },
    '6': { apiTests: true },
    '7': { performance: true },
    '8': { team: true },
    '9': { health: true },
  };

  if (choice === '0') {
    console.log(chalk.dim('\n  Goodbye! 👋\n'));
    rl.close();
    return;
  }

  if (choice === '10') {
    const { getAvailableModels, isCopilotAvailable } = await import('./core/copilot.js');

    if (!isCopilotAvailable()) {
      console.log(chalk.red('\n  ❌ No Copilot CLI detected. Install via: npm i -g @github/copilot\n'));
      rl.close();
      return;
    }

    console.log(chalk.bold('\n  🧠 Fetching available models from Copilot CLI...\n'));
    const models = getAvailableModels();

    if (models.length === 0) {
      console.log(chalk.yellow('  Could not fetch models. Enter a model name manually.'));
      const selectedModel = (await ask(chalk.cyan('\n  Enter model name (or blank for default): '))).trim();
      if (selectedModel) {
        console.log(chalk.green(`\n  ✓ Model set to: ${selectedModel}`));
        console.log(chalk.dim(`  Run: reposentry analyze --model ${selectedModel}\n`));
      } else {
        console.log(chalk.dim('\n  Using backend default model.\n'));
      }
      rl.close();
      return;
    }

    console.log(chalk.dim('  ─────────────────────────────────────────'));
    for (let i = 0; i < models.length; i++) {
      const num = (i + 1).toString().padStart(2, ' ');
      const current = models[i] === 'claude-haiku-4.5' ? chalk.dim(' (current default)') : '';
      console.log(`  ${chalk.cyan(num)}. ${models[i]}${current}`);
    }
    console.log(chalk.dim('  ─────────────────────────────────────────'));
    console.log(chalk.dim(`\n  ${models.length} models available.`));

    const input = (await ask(chalk.cyan(`\n  Select model (1-${models.length}) or name: `))).trim();

    const idx = parseInt(input, 10);
    let selectedModel: string;
    if (!isNaN(idx) && idx >= 1 && idx <= models.length) {
      selectedModel = models[idx - 1];
    } else if (input) {
      selectedModel = input;
    } else {
      console.log(chalk.dim('\n  Using backend default model.\n'));
      rl.close();
      return;
    }

    console.log(chalk.green(`\n  ✓ Model set to: ${selectedModel}`));
    console.log(chalk.dim(`  Run: reposentry analyze --model ${selectedModel}\n`));
    rl.close();
    return;
  }

  if (choice === '11') {
    rl.close();
    const { startServer } = await import('./server/index.js');
    const config = await loadConfig();
    await startServer({ port: 3000, outputDir: config.output });
    return;
  }

  if (choice === '12') {
    rl.close();
    // Delegate to the fix command programmatically
    const { createCLI } = await import('./cli.js');
    const fixProgram = createCLI();
    await fixProgram.parseAsync(['node', 'reposentry', 'fix']);
    return;
  }

  const engineOpts = engineMap[choice];
  if (!engineOpts) {
    console.log(chalk.red('\n  Invalid selection.\n'));
    rl.close();
    return;
  }

  rl.close();

  const config = await loadConfig();

  const opts: AnalyzeOptions = {
    output: config.output,
    format: config.format,
    depth: config.depth,
    ignore: config.ignore,
    force: false,
    verbose: false,
    // Choice #1 is full analysis: omit engine flags so orchestrator runs everything
    ...(choice === '1' ? {} : engineOpts),
  };

  await runAnalysis(opts);
}
