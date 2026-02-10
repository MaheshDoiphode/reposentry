import chalk from 'chalk';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug' | 'dim';

let verbose = false;

export function setVerbose(v: boolean): void {
  verbose = v;
}

export const logger = {
  info(msg: string): void {
    console.log(chalk.blue('ℹ'), msg);
  },
  success(msg: string): void {
    console.log(chalk.green('✅'), msg);
  },
  warn(msg: string): void {
    console.log(chalk.yellow('⚠'), msg);
  },
  error(msg: string): void {
    console.error(chalk.red('✖'), msg);
  },
  debug(msg: string): void {
    if (verbose) console.log(chalk.gray('🔍'), chalk.gray(msg));
  },
  dim(msg: string): void {
    console.log(chalk.dim(msg));
  },
  blank(): void {
    console.log();
  },
};
