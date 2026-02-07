import ora, { type Ora } from 'ora';
import chalk from 'chalk';

export class Progress {
  private spinner: Ora;
  private current = 0;
  private total = 0;
  private label = '';

  constructor() {
    this.spinner = ora({ color: 'cyan' });
  }

  start(label: string, total: number): void {
    this.label = label;
    this.total = total;
    this.current = 0;
    this.spinner.start(this.formatMessage());
  }

  increment(detail?: string): void {
    this.current++;
    this.spinner.text = this.formatMessage(detail);
  }

  succeed(message?: string): void {
    this.spinner.succeed(message || `${this.label} ${chalk.dim(`[${this.current}/${this.total}]`)}`);
  }

  fail(message?: string): void {
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
    const msg = `${this.label} ${bar} ${this.current}/${this.total}`;
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
