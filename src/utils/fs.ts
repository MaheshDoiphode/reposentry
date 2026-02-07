import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';

export async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export function ensureDirSync(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export async function writeOutput(filePath: string, content: string): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
}

export function writeOutputSync(filePath: string, content: string): void {
  ensureDirSync(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

export async function readFileContent(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}

export function readFileContentSync(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/** Recursively walk a directory, returning relative paths */
export async function walkDir(
  dir: string,
  ignorePatterns: string[] = [],
  maxDepth = 10,
): Promise<string[]> {
  const results: string[] = [];
  const defaultIgnore = ['node_modules', '.git', 'dist', 'build', '.reposentry', '__pycache__', '.venv', 'vendor', 'target'];
  const allIgnore = [...defaultIgnore, ...ignorePatterns];

  async function walk(currentDir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (allIgnore.some(p => entry.name === p || entry.name.startsWith('.'))) continue;
      const fullPath = join(currentDir, entry.name);
      const relPath = relative(dir, fullPath);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        results.push(relPath);
      }
    }
  }

  await walk(dir, 0);
  return results;
}

export function getExtension(filePath: string): string {
  return extname(filePath).toLowerCase();
}

/** Read a file, truncating to maxChars if needed */
export async function readFileTruncated(filePath: string, maxChars = 8000): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  if (content.length > maxChars) {
    return content.slice(0, maxChars) + '\n... (truncated)';
  }
  return content;
}
