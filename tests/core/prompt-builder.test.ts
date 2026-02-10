import { describe, it, expect } from 'vitest';
import { buildPrompt, buildFileTree, PromptContext } from '../../src/core/prompt-builder.js';

describe('prompt-builder', () => {
  const baseContext: PromptContext = {
    projectName: 'test-project',
    languages: ['TypeScript', 'JavaScript'],
    frameworks: ['Express.js'],
    packageManager: 'npm',
  };

  describe('buildPrompt', () => {
    it('should include project name', () => {
      const prompt = buildPrompt('Analyze this project', baseContext);
      expect(prompt).toContain('test-project');
    });

    it('should include languages', () => {
      const prompt = buildPrompt('Analyze this project', baseContext);
      expect(prompt).toContain('TypeScript/JavaScript');
    });

    it('should include frameworks', () => {
      const prompt = buildPrompt('Analyze this project', baseContext);
      expect(prompt).toContain('Express.js');
    });

    it('should include package manager', () => {
      const prompt = buildPrompt('Analyze this project', baseContext);
      expect(prompt).toContain('npm');
    });

    it('should include the task', () => {
      const prompt = buildPrompt('Generate documentation', baseContext);
      expect(prompt).toContain('Generate documentation');
    });

    it('should request mermaid output when specified', () => {
      const prompt = buildPrompt('Generate diagram', baseContext, 'mermaid');
      expect(prompt).toContain('Mermaid');
    });

    it('should request JSON output when specified', () => {
      const prompt = buildPrompt('Generate scores', baseContext, 'json');
      expect(prompt).toContain('JSON');
    });

    it('should include file tree when provided', () => {
      const ctx = { ...baseContext, fileTree: 'src/\n  index.ts\n  cli.ts' };
      const prompt = buildPrompt('Analyze', ctx);
      expect(prompt).toContain('index.ts');
    });

    it('should include code context when provided', () => {
      const ctx = { ...baseContext, codeContext: 'const app = express();' };
      const prompt = buildPrompt('Analyze', ctx);
      expect(prompt).toContain('const app = express()');
    });
  });

  describe('buildFileTree', () => {
    it('should join files with newlines', () => {
      const tree = buildFileTree(['src/index.ts', 'src/cli.ts', 'package.json']);
      expect(tree).toContain('src/index.ts');
      expect(tree).toContain('package.json');
    });

    it('should truncate when exceeding maxLines', () => {
      const files = Array.from({ length: 100 }, (_, i) => `file${i}.ts`);
      const tree = buildFileTree(files, 10);
      expect(tree).toContain('file0.ts');
      expect(tree).toContain('90 more files');
    });
  });
});
