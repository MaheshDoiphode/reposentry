import { readFileContentSync, fileExists } from '../utils/fs.js';
import { join } from 'node:path';

export interface ImportInfo {
  file: string;
  imports: string[];
}

/** Parse imports/requires from JS/TS files */
export function parseImports(rootDir: string, files: string[]): ImportInfo[] {
  const jsFiles = files.filter(f =>
    f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'),
  );

  const results: ImportInfo[] = [];

  for (const file of jsFiles.slice(0, 100)) {
    try {
      const content = readFileContentSync(join(rootDir, file));
      const imports: string[] = [];

      // ES imports
      const esImports = content.matchAll(/import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g);
      for (const match of esImports) {
        imports.push(match[1]);
      }

      // CommonJS requires
      const cjsRequires = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
      for (const match of cjsRequires) {
        imports.push(match[1]);
      }

      // Python imports
      if (file.endsWith('.py')) {
        const pyImports = content.matchAll(/(?:from\s+(\S+)\s+import|import\s+(\S+))/g);
        for (const match of pyImports) {
          imports.push(match[1] || match[2]);
        }
      }

      // Go imports
      if (file.endsWith('.go')) {
        const goImports = content.matchAll(/import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g);
        for (const match of goImports) {
          if (match[2]) {
            imports.push(match[2]);
          } else if (match[1]) {
            const goLines = match[1].matchAll(/"([^"]+)"/g);
            for (const l of goLines) imports.push(l[1]);
          }
        }
      }

      if (imports.length > 0) {
        results.push({ file, imports });
      }
    } catch { /* ignore */ }
  }

  return results;
}

/** Get external (non-relative) dependencies */
export function getExternalDependencies(importInfos: ImportInfo[]): string[] {
  const deps = new Set<string>();
  for (const info of importInfos) {
    for (const imp of info.imports) {
      if (!imp.startsWith('.') && !imp.startsWith('/') && !imp.startsWith('node:')) {
        // Get the package name (handle scoped packages)
        const parts = imp.split('/');
        const pkgName = imp.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
        deps.add(pkgName);
      }
    }
  }
  return [...deps].sort();
}

/** Build a dependency graph showing which files import which */
export function buildDependencyGraph(importInfos: ImportInfo[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const info of importInfos) {
    const localImports = info.imports.filter(i => i.startsWith('.'));
    if (localImports.length > 0) {
      graph.set(info.file, localImports);
    }
  }
  return graph;
}
