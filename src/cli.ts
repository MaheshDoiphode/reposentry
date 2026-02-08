import { Command } from 'commander';
import { runAnalysis, AnalyzeOptions } from './core/orchestrator.js';
import chalk from 'chalk';

const AVAILABLE_MODELS = [
  'claude-sonnet-4.5', 'claude-haiku-4.5', 'claude-opus-4.6', 'claude-opus-4.6-fast',
  'claude-opus-4.5', 'claude-sonnet-4', 'gemini-3-pro-preview',
  'gpt-5.2-codex', 'gpt-5.2', 'gpt-5.1-codex-max', 'gpt-5.1-codex', 'gpt-5.1',
  'gpt-5', 'gpt-5.1-codex-mini', 'gpt-5-mini', 'gpt-4.1',
];

export function createCLI(): Command {
  const program = new Command();

  program
    .name('reposentry')
    .description('RepoSentry — AI-powered codebase intelligence platform')
    .version('0.1.0');

  const analyze = program
    .command('analyze')
    .description('Analyze the current repository and generate reports')
    .option('-o, --output <dir>', 'Output directory', '.reposentry')
    .option('-f, --format <type>', 'Output format: markdown | html | json', 'markdown')
    .option('--depth <level>', 'Analysis depth: quick | standard | deep', 'standard')
    .option('--ignore <patterns...>', 'Glob patterns to ignore')
    .option('--force', 'Overwrite existing output', false)
    .option('-v, --verbose', 'Show detailed analysis progress', false)
    .option('-m, --model <model>', `AI model to use (default: claude-haiku-4.5)`)
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

${chalk.bold('Available Models:')}
  ${AVAILABLE_MODELS.join(', ')}

${chalk.bold('Examples:')}
  $ reposentry analyze                    Full analysis with all engines
  $ reposentry analyze --docs --ci        Only docs + CI/CD
  $ reposentry analyze --model gpt-5      Use GPT-5 model
  $ reposentry analyze --security -v      Security audit with verbose output
`)
    .action(async (options) => {
      const opts: AnalyzeOptions = {
        output: options.output,
        format: options.format as 'markdown' | 'html' | 'json',
        depth: options.depth as 'quick' | 'standard' | 'deep',
        ignore: options.ignore || [],
        force: options.force,
        verbose: options.verbose,
        model: options.model,
        docs: options.docs,
        architecture: options.architecture,
        security: options.security,
        ci: options.ci,
        apiTests: options.apiTests,
        performance: options.performance,
        team: options.team,
        health: options.health,
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
    .option('-o, --output <dir>', 'Output directory to serve', '.reposentry')
    .action(async (options) => {
      const { startServer } = await import('./server/index.js');
      await startServer({
        port: parseInt(options.port, 10),
        outputDir: options.output,
      });
    });

  program
    .command('badge')
    .description('Generate health/security badge for README')
    .option('-o, --output <dir>', 'Output directory', '.reposentry')
    .action(async (options) => {
      const { resolve } = await import('node:path');
      const { readFileContent } = await import('./utils/fs.js');
      try {
        const analysisPath = resolve(process.cwd(), options.output, 'analysis.json');
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
    console.log(chalk.bold('\n  Available models:\n'));
    AVAILABLE_MODELS.forEach((m, i) => {
      const marker = m === 'claude-haiku-4.5' ? chalk.green(' (default)') : '';
      console.log(`  ${chalk.dim(`${(i + 1).toString().padStart(2)}.`)} ${m}${marker}`);
    });
    const modelChoice = (await ask(chalk.cyan('\n  Select model number: '))).trim();
    const idx = parseInt(modelChoice, 10) - 1;
    if (idx >= 0 && idx < AVAILABLE_MODELS.length) {
      const selectedModel = AVAILABLE_MODELS[idx];
      console.log(chalk.green(`\n  ✓ Model set to: ${selectedModel}`));
      console.log(chalk.dim(`  Run: reposentry analyze --model ${selectedModel}\n`));
    } else {
      console.log(chalk.red('\n  Invalid selection.\n'));
    }
    rl.close();
    return;
  }

  if (choice === '11') {
    rl.close();
    const { startServer } = await import('./server/index.js');
    await startServer({ port: 3000, outputDir: '.reposentry' });
    return;
  }

  const engineOpts = engineMap[choice];
  if (!engineOpts) {
    console.log(chalk.red('\n  Invalid selection.\n'));
    rl.close();
    return;
  }

  rl.close();

  const opts: AnalyzeOptions = {
    output: '.reposentry',
    format: 'markdown',
    depth: 'standard',
    ignore: [],
    force: false,
    verbose: false,
    ...engineOpts,
  };

  await runAnalysis(opts);
}
