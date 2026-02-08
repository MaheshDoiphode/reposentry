import { join, extname } from 'node:path';
import { writeOutput, ensureDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/** File extensions where code fences should be stripped (non-markdown raw files) */
const RAW_EXTENSIONS = new Set([
  '.yml', '.yaml', '.json', '.toml', '.ini', '.cfg', '.conf',
  '.env', '.sh', '.bash', '.ps1', '.bat', '.cmd',
  '.tf', '.hcl', '.dockerfile', '.mmd',
]);

/**
 * Strip markdown code fences from content intended for raw config files.
 * Handles ```yaml, ```dockerfile, ```json, etc. and nested fences.
 */
function stripCodeFences(content: string, filename: string): string {
  const ext = extname(filename).toLowerCase();
  const baseName = filename.toLowerCase();

  // Only strip fences for non-markdown raw files
  const isRaw = RAW_EXTENSIONS.has(ext) ||
    baseName.startsWith('dockerfile') ||
    baseName === '.env.example' ||
    baseName.endsWith('.suggested');

  if (!isRaw) return content;

  let result = content;

  // Remove opening ```lang and closing ``` fences
  // Handle multiple fence blocks — extract inner content
  const fencePattern = /^```[\w.-]*\s*\n([\s\S]*?)^```\s*$/gm;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(result)) !== null) {
    blocks.push(match[1]);
  }

  if (blocks.length > 0) {
    // Use the largest block (the main content), skip tiny explanation blocks
    const mainBlock = blocks.reduce((a, b) => a.length >= b.length ? a : b);
    result = mainBlock;
  }

  // Remove any remaining standalone fence markers
  result = result.replace(/^```[\w.-]*\s*$/gm, '').replace(/^```\s*$/gm, '');

  // Remove markdown-only header lines before the actual content (e.g., "# GitHub Actions CI/CD Workflow")
  // Only for YAML/Dockerfile/env files where markdown headers make no sense
  if (['.yml', '.yaml'].includes(ext) || baseName.startsWith('dockerfile') || baseName === '.env.example') {
    result = result.replace(/^#\s+[A-Z].*\n+/gm, (match, offset) => {
      // Keep YAML comments (lines starting with # inside YAML content)
      // Remove markdown-style headers only at the very start
      if (offset === 0 || result.slice(0, offset).trim() === '') return '';
      return match;
    });
  }

  return result.trim() + '\n';
}

export interface OutputOptions {
  baseDir: string;
  format: 'markdown' | 'html' | 'json';
  force: boolean;
}

export class OutputManager {
  private baseDir: string;
  private filesWritten: string[] = [];

  constructor(private options: OutputOptions) {
    this.baseDir = options.baseDir;
  }

  async init(): Promise<void> {
    await ensureDir(this.baseDir);
  }

  async write(relativePath: string, content: string): Promise<void> {
    const fullPath = join(this.baseDir, relativePath);
    const cleaned = stripCodeFences(content, relativePath);
    await writeOutput(fullPath, cleaned);
    this.filesWritten.push(relativePath);
    logger.debug(`Written: ${relativePath}`);
  }

  async writeToSubdir(subdir: string, filename: string, content: string): Promise<void> {
    await this.write(join(subdir, filename), content);
  }

  getFilesWritten(): string[] {
    return [...this.filesWritten];
  }

  getFileCount(): number {
    return this.filesWritten.length;
  }

  getBaseDir(): string {
    return this.baseDir;
  }
}
