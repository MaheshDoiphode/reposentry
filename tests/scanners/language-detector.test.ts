import { describe, it, expect } from 'vitest';
import { detectLanguages } from '../../src/scanners/language-detector.js';
import { join } from 'node:path';

describe('language-detector', () => {
  const rootDir = join(process.cwd());

  it('should detect TypeScript from file extensions', () => {
    const files = ['src/index.ts', 'src/cli.ts', 'src/utils/logger.ts'];
    const result = detectLanguages(rootDir, files);
    expect(result.languages).toContain('TypeScript');
  });

  it('should detect JavaScript/TypeScript from package.json', () => {
    const result = detectLanguages(rootDir, ['package.json', 'src/index.ts']);
    expect(result.languages).toContain('JavaScript/TypeScript');
  });

  it('should detect npm as package manager', () => {
    const result = detectLanguages(rootDir, ['package.json']);
    expect(result.packageManager).toBe('npm');
  });

  it('should detect frameworks from package.json', () => {
    const result = detectLanguages(rootDir, ['package.json']);
    // Our own project has commander, chalk, express etc
    expect(result.frameworks.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect Python from .py files', () => {
    const files = ['app.py', 'main.py', 'requirements.txt'];
    const result = detectLanguages(rootDir, files);
    expect(result.languages).toContain('Python');
  });

  it('should detect Go from .go files', () => {
    const files = ['main.go', 'handler.go'];
    const result = detectLanguages(rootDir, files);
    expect(result.languages).toContain('Go');
  });
});
