import ora, { type Ora } from 'ora';
import chalk from 'chalk';

export class Progress {
  private spinner: Ora;
  private current = 0;
  private total = 0;
  private totalSteps = 0;
  private completedSteps = 0;
  private label = '';
  private engineLabel = '';

  constructor(totalSteps = 0) {
    this.totalSteps = totalSteps;
    this.completedSteps = 0;
    this.spinner = ora({ color: 'cyan', spinner: 'dots' });
  }

  setTotalSteps(total: number): void {
    this.totalSteps = total;
  }

  start(label: string, total: number): void {
    this.label = label;
    this.engineLabel = label;
    this.total = total;
    this.current = 0;
    this.spinner.start(this.formatMessage());
  }

  increment(detail?: string): void {
    this.current++;
    this.spinner.text = this.formatMessage(detail);
  }

  succeed(message?: string): void {
    this.completedSteps++;
    const pct = this.totalSteps > 0 ? Math.round((this.completedSteps / this.totalSteps) * 100) : 0;
    const pctStr = this.totalSteps > 0 ? chalk.dim(` (${pct}% overall)`) : '';
    this.spinner.succeed((message || this.label) + pctStr);
  }

  fail(message?: string): void {
    this.completedSteps++;
    this.spinner.fail(message || `${this.label} failed`);
  }

  update(message: string): void {
    this.spinner.text = message;
  }

  stop(): void {
    this.spinner.stop();
  }

  private formatMessage(detail?: string): string {
    const bar = this.buildBar();
    const pct = Math.round((this.current / Math.max(this.total, 1)) * 100);
    const overallPct = this.totalSteps > 0
      ? Math.round(((this.completedSteps + this.current / Math.max(this.total, 1)) / this.totalSteps) * 100)
      : 0;
    const overallStr = this.totalSteps > 0 ? chalk.dim(` [${overallPct}%]`) : '';
    const msg = `${this.label} ${bar} ${this.current}/${this.total} ${chalk.dim(`(${pct}%)`)}${overallStr}`;
    return detail ? `${msg} — ${chalk.dim(detail)}` : msg;
  }

  private buildBar(): string {
    const width = 16;
    const filled = Math.round((this.current / Math.max(this.total, 1)) * width);
    const empty = width - filled;
    return chalk.cyan('█'.repeat(filled) + '░'.repeat(empty));
  }
}

export function createProgress(): Progress {
  return new Progress();
}
