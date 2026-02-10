import { describe, it, expect } from 'vitest';
import { scanFiles, buildDirectoryTree, getFilesByExtension } from '../../src/scanners/file-scanner.js';

describe('file-scanner', () => {
  describe('scanFiles', () => {
    it('should scan the current project and find TypeScript files', async () => {
      const result = await scanFiles(process.cwd());
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files.some(f => f.endsWith('.ts'))).toBe(true);
    });

    it('should ignore node_modules by default', async () => {
      const result = await scanFiles(process.cwd());
      expect(result.files.every(f => !f.includes('node_modules'))).toBe(true);
    });

    it('should track extensions', async () => {
      const result = await scanFiles(process.cwd());
      expect(result.extensions.has('.ts')).toBe(true);
    });
  });

  describe('getFilesByExtension', () => {
    it('should filter files by extension', () => {
      const files = ['a.ts', 'b.js', 'c.ts', 'd.json'];
      expect(getFilesByExtension(files, '.ts')).toEqual(['a.ts', 'c.ts']);
    });

    it('should support multiple extensions', () => {
      const files = ['a.ts', 'b.js', 'c.tsx', 'd.json'];
      expect(getFilesByExtension(files, '.ts', '.tsx')).toEqual(['a.ts', 'c.tsx']);
    });
  });

  describe('buildDirectoryTree', () => {
    it('should build a tree from file paths', () => {
      const files = ['src/index.ts', 'src/cli.ts', 'tests/foo.test.ts', 'package.json'];
      const tree = buildDirectoryTree(files);
      expect(tree).toContain('src');
      expect(tree).toContain('index.ts');
    });
  });
});
