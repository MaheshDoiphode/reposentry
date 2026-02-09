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
  console.log('  0. ❌ Exit\n');

  const choice = (await ask(chalk.cyan('  Select option (0-11): '))).trim();

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
    console.log(chalk.bold('\n  AI model selection\n'));
    console.log(chalk.dim('  Model support depends on your Copilot backend.'));
    const selectedModel = (await ask(chalk.cyan('  Enter model name (or blank for default): '))).trim();
    if (selectedModel) {
      console.log(chalk.green(`\n  ✓ Model set to: ${selectedModel}`));
      console.log(chalk.dim(`  Run: reposentry analyze --model ${selectedModel}\n`));
    } else {
      console.log(chalk.dim('\n  Using backend default model.\n'));
    }
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
