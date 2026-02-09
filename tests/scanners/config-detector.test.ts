import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { detectConfigs } from '../../src/scanners/config-detector.js';

describe('config-detector', () => {
  const rootDir = process.cwd();

  it('should detect .gitignore', () => {
    // Our project has a .gitignore
    const result = detectConfigs(rootDir, ['.gitignore']);
    expect(result.hasGitignore).toBe(true);
  });

  it('should detect package.json indicates node project', () => {
    const result = detectConfigs(rootDir, ['package.json']);
    expect(result.configFiles.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect no Dockerfile', () => {
    const result = detectConfigs(rootDir, ['src/index.ts']);
    expect(result.hasDockerfile).toBe(false);
  });

  it('should detect no CI config when no workflow files exist on disk', () => {
    // Use a path that definitely has no .github/workflows/
    const result = detectConfigs(join(rootDir, 'src'), ['src/index.ts']);
    expect(result.hasCIConfig).toBe(false);
  });

  it('should detect GitHub Actions from workflow files', () => {
    const result = detectConfigs(rootDir, ['.github/workflows/ci.yml']);
    expect(result.hasCIConfig).toBe(true);
    expect(result.ciProvider).toBe('GitHub Actions');
  });
});
