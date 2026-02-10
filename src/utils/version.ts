import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | null = null;

export function getCliVersion(): string {
  if (cachedVersion) return cachedVersion;

  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // dist/utils/version.js -> ../../package.json
    const pkgPath = resolve(here, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
    cachedVersion = pkg.version || '0.0.0';
  } catch {
    cachedVersion = '0.0.0';
  }

  return cachedVersion;
}
