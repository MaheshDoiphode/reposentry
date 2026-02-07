#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('reposentry')
  .description('RepoSentry — AI-powered codebase intelligence platform')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze the current repository and generate reports')
  .option('-o, --output <dir>', 'output directory', '.reposentry')
  .action(async (options) => {
    // Placeholder: real engines will be wired here.
    process.stdout.write(`RepoSentry: analyze (output: ${options.output})\n`);
  });

program
  .command('serve')
  .description('Serve generated reports locally')
  .option('--port <port>', 'port to listen on', '3000')
  .action(async (options) => {
    process.stdout.write(`RepoSentry: serve (port: ${options.port})\n`);
  });

program.parse();
