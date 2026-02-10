import { walkDir, getExtension } from '../utils/fs.js';
import { join } from 'node:path';

export interface ScanResult {
  files: string[];
  totalFiles: number;
  extensions: Map<string, number>;
  directories: Set<string>;
}

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.exe', '.dll', '.so', '.dylib',
  '.mp3', '.mp4', '.avi', '.mov', '.wav',
  '.lock',
]);

export async function scanFiles(
  rootDir: string,
  ignorePatterns: string[] = [],
): Promise<ScanResult> {
  const allFiles = await walkDir(rootDir, ignorePatterns);

  const extensions = new Map<string, number>();
  const directories = new Set<string>();

  const sourceFiles = allFiles.filter(f => {
    const ext = getExtension(f);
    if (BINARY_EXTENSIONS.has(ext)) return false;

    // Track extensions
    extensions.set(ext, (extensions.get(ext) || 0) + 1);

    // Track directories
    const parts = f.split(/[/\\]/);
    if (parts.length > 1) {
      directories.add(parts[0]);
    }

    return true;
  });

  return {
    files: sourceFiles,
    totalFiles: allFiles.length,
    extensions,
    directories,
  };
}

export function getFilesByExtension(files: string[], ...extensions: string[]): string[] {
  const extSet = new Set(extensions);
  return files.filter(f => extSet.has(getExtension(f)));
}

export function buildDirectoryTree(files: string[], maxDepth = 3): string {
  const tree = new Map<string, Set<string>>();

  for (const file of files) {
    const parts = file.split(/[/\\]/);
    let current = '';
    for (let i = 0; i < Math.min(parts.length, maxDepth); i++) {
      const parent = current;
      current = current ? `${current}/${parts[i]}` : parts[i];
      if (!tree.has(parent)) tree.set(parent, new Set());
      tree.get(parent)!.add(parts[i]);
    }
  }

  function render(prefix: string, indent: string): string[] {
    const children = tree.get(prefix);
    if (!children) return [];
    const lines: string[] = [];
    const arr = [...children].sort();
    arr.forEach((child, idx) => {
      const isLast = idx === arr.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const fullPath = prefix ? `${prefix}/${child}` : child;
      lines.push(`${indent}${connector}${child}`);
      if (tree.has(fullPath)) {
        const nextIndent = indent + (isLast ? '    ' : '│   ');
        lines.push(...render(fullPath, nextIndent));
      }
    });
    return lines;
  }

  return render('', '').join('\n');
}
