import { Command } from 'commander';
import { runAnalysis, AnalyzeOptions } from './core/orchestrator.js';

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
    .option('--docs', 'Documentation suite only', false)
    .option('--architecture', 'Architecture + dependency diagrams only', false)
    .option('--security', 'Security audit + threat model only', false)
    .option('--ci', 'Generate CI/CD pipeline only', false)
    .option('--api-tests', 'Generate API test collection only', false)
    .option('--performance', 'Performance anti-pattern detection only', false)
    .option('--team', 'Collaboration templates only', false)
    .option('--health', 'Health report + grade only', false)
    .option('--no-color', 'Disable colored output')
    .action(async (options) => {
      const opts: AnalyzeOptions = {
        output: options.output,
        format: options.format as 'markdown' | 'html' | 'json',
        depth: options.depth as 'quick' | 'standard' | 'deep',
        ignore: options.ignore || [],
        force: options.force,
        verbose: options.verbose,
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
      console.log('🚀 Interactive setup coming soon. Use `reposentry analyze` for full analysis.');
    });

  return program;
}
