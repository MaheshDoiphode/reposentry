# Missing Tests for RepoSentry Project

## Untested Functions and Routes

### 1. CLI Module (src/cli.ts)

#### Function: `createCLI()`
- **Why test:** Core entry point for the CLI application; responsible for command creation and option parsing
- **Test case:** Should create a Commander program with analyze, serve, badge, compare, and init commands
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { createCLI } from '../../src/cli.js';

describe('CLI', () => {
  describe('createCLI', () => {
    it('should create CLI program with analyze command', () => {
      const program = createCLI();
      const cmd = program.commands.find(c => c.name() === 'analyze');
      expect(cmd).toBeDefined();
      expect(cmd?.description()).toContain('Analyze the current repository');
    });

    it('should create CLI program with serve command', () => {
      const program = createCLI();
      const cmd = program.commands.find(c => c.name() === 'serve');
      expect(cmd).toBeDefined();
    });

    it('should create CLI program with badge command', () => {
      const program = createCLI();
      const cmd = program.commands.find(c => c.name() === 'badge');
      expect(cmd).toBeDefined();
    });

    it('should create CLI program with compare command', () => {
      const program = createCLI();
      const cmd = program.commands.find(c => c.name() === 'compare');
      expect(cmd).toBeDefined();
    });

    it('should have version set from package.json', () => {
      const program = createCLI();
      expect(program.version()).toBeDefined();
    });
  });
});
```

---

### 2. Config Module (src/config.ts)

#### Function: `loadConfig()`
- **Why test:** Loads configuration from cosmiconfig; critical for application startup and defaults handling
- **Test case:** Should return default config when no custom config file exists
- **Code skeleton:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, RepoSentryConfig } from '../../src/config.js';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

describe('config', () => {
  describe('loadConfig', () => {
    const testDir = join(process.cwd(), '.test-config');

    beforeEach(() => {
      process.chdir(testDir);
      mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(testDir, { recursive: true, force: true });
    });

    it('should return default config when no config file exists', async () => {
      const config = await loadConfig();
      expect(config.output).toBe('.reposentry');
      expect(config.format).toBe('markdown');
      expect(config.depth).toBe('standard');
    });

    it('should have all engine defaults enabled', async () => {
      const config = await loadConfig();
      expect(config.engines.docs).toBe(true);
      expect(config.engines.architecture).toBe(true);
      expect(config.engines.security).toBe(true);
    });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', async () => {
      const config = await loadConfig();
      // Deep merge should preserve defaults for undefined properties
      expect(config.format).toBeDefined();
      expect(config.depth).toBeDefined();
    });
  });
});
```

#### Function: `mergeConfig()`
- **Why test:** Handles config merging logic; ensures user config overrides defaults properly
- **Test case:** Should merge nested config objects without losing defaults
- **Code skeleton:** (See above)

---

### 3. Copilot Module (src/core/copilot.ts)

#### Function: `askCopilot()`
- **Why test:** Core AI integration; handles prompt preparation, backend detection, and error handling
- **Test case:** Should handle both copilot-cli and gh copilot backends
- **Code skeleton:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { askCopilot, getAvailableModels, isCopilotAvailable } from '../../src/core/copilot.js';

describe('copilot', () => {
  describe('askCopilot', () => {
    it('should return placeholder when Copilot not available', async () => {
      const result = await askCopilot('test prompt');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should prepare prompt with maximum length', async () => {
      const longPrompt = 'x'.repeat(10000);
      const result = await askCopilot(longPrompt);
      expect(result).toBeDefined();
    });
  });

  describe('getAvailableModels', () => {
    it('should return array of model strings', () => {
      const models = getAvailableModels();
      expect(Array.isArray(models)).toBe(true);
    });
  });

  describe('isCopilotAvailable', () => {
    it('should return boolean', () => {
      const available = isCopilotAvailable();
      expect(typeof available).toBe('boolean');
    });
  });
});
```

#### Function: `getAvailableModels()`
- **Why test:** Parses available models from Copilot CLI help output; models list must be accurate
- **Test case:** Should parse model names from help text correctly
- **Code skeleton:** (See above)

#### Function: `detectBackend()`
- **Why test:** Backend detection (copilot-cli vs gh copilot) affects command execution
- **Test case:** Should detect available Copilot backend
- **Code skeleton:** (See above)

#### Function: `preparePrompt()`
- **Why test:** Sanitizes prompts for CLI; enforces length limits and format detection
- **Test case:** Should detect output format from prompt content
- **Code skeleton:** (See above)

#### Function: `cleanCopilotOutput()`
- **Why test:** Strips narration from Copilot responses; critical for clean output
- **Test case:** Should remove conversational narration while preserving markdown content
- **Code skeleton:** (See above)

#### Function: `batchCopilotCalls()`
- **Why test:** Rate-limited batch processing; handles multiple prompts sequentially
- **Test case:** Should make sequential calls with delays between them
- **Code skeleton:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { batchCopilotCalls } from '../../src/core/copilot.js';

describe('copilot batch processing', () => {
  describe('batchCopilotCalls', () => {
    it('should process multiple prompts sequentially', async () => {
      const prompts = [
        { key: 'p1', prompt: 'test 1' },
        { key: 'p2', prompt: 'test 2' },
      ];
      const results = await batchCopilotCalls(prompts, 100);
      expect(results.size).toBe(2);
      expect(results.has('p1')).toBe(true);
      expect(results.has('p2')).toBe(true);
    });

    it('should respect delay between calls', async () => {
      const start = Date.now();
      const prompts = [
        { key: 'p1', prompt: 'test 1' },
        { key: 'p2', prompt: 'test 2' },
      ];
      await batchCopilotCalls(prompts, 50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });
  });
});
```

---

### 4. Orchestrator Module (src/core/orchestrator.ts)

#### Function: `runAnalysis()`
- **Why test:** Main analysis pipeline; orchestrates all scanning and engine phases
- **Test case:** Should detect git repo and run scanning phase
- **Code skeleton:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { runAnalysis, AnalyzeOptions } from '../../src/core/orchestrator.js';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('orchestrator', () => {
  describe('runAnalysis', () => {
    const testOutputDir = join(process.cwd(), '.test-analysis-output');

    beforeEach(() => {
      rmSync(testOutputDir, { recursive: true, force: true });
    });

    it('should create output directory structure', async () => {
      const opts: AnalyzeOptions = {
        output: testOutputDir,
        format: 'markdown',
        depth: 'quick',
        ignore: [],
        force: true,
        verbose: false,
      };
      // Note: This would call real engines, so may need mocking
      // or a quick depth mode that returns fast
    });

    it('should run all engines when no flags specified', async () => {
      const opts: AnalyzeOptions = {
        output: testOutputDir,
        format: 'markdown',
        depth: 'quick',
        ignore: [],
        force: true,
        verbose: false,
      };
      // Should detect all engines enabled
    });
  });

  describe('shouldRunAll', () => {
    it('should return true when no engine flags set', () => {
      const opts: AnalyzeOptions = {
        output: '.reposentry',
        format: 'markdown',
        depth: 'standard',
        ignore: [],
        force: false,
        verbose: false,
      };
      // Should return true (all engines run by default)
    });

    it('should return false when at least one engine flag set', () => {
      const opts: AnalyzeOptions = {
        output: '.reposentry',
        format: 'markdown',
        depth: 'standard',
        ignore: [],
        force: false,
        verbose: false,
        docs: true,
      };
      // Should return false (specific engines only)
    });
  });
});
```

#### Function: `shouldRunAll()`
- **Why test:** Logic for determining whether to run all engines or specific ones
- **Test case:** Should return true only when all engine flags are falsy
- **Code skeleton:** (See above)

---

### 5. Progress Module (src/core/progress.ts)

#### Class: `Progress`
- **Why test:** Manages CLI progress display; tracks completion across engines
- **Test case:** Should calculate progress percentages correctly and format messages
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { Progress } from '../../src/core/progress.js';

describe('Progress', () => {
  describe('constructor and setters', () => {
    it('should initialize with optional totalSteps', () => {
      const progress = new Progress(10);
      expect(progress['totalSteps']).toBe(10);
    });

    it('should set total steps', () => {
      const progress = new Progress();
      progress.setTotalSteps(8);
      expect(progress['totalSteps']).toBe(8);
    });
  });

  describe('start', () => {
    it('should set label and reset current count', () => {
      const progress = new Progress();
      progress.start('Testing', 5);
      expect(progress['label']).toBe('Testing');
      expect(progress['total']).toBe(5);
      expect(progress['current']).toBe(0);
    });
  });

  describe('increment', () => {
    it('should increase current count', () => {
      const progress = new Progress();
      progress.start('Test', 10);
      progress.increment();
      progress.increment();
      expect(progress['current']).toBe(2);
    });
  });

  describe('succeed', () => {
    it('should increment completed steps', () => {
      const progress = new Progress(10);
      progress.succeed('Done');
      expect(progress['completedSteps']).toBe(1);
    });
  });

  describe('fail', () => {
    it('should increment completed steps on failure', () => {
      const progress = new Progress(10);
      progress.fail('Failed');
      expect(progress['completedSteps']).toBe(1);
    });
  });
});
```

#### Method: `formatMessage()`
- **Why test:** Formats progress display text with percentage calculations
- **Test case:** Should calculate correct progress percentages
- **Code skeleton:** (See above)

---

### 6. Output Manager (src/core/output-manager.ts)

#### Method: `stripCodeFences()`
- **Why test:** Removes markdown fences from config file content; critical for clean output
- **Test case:** Should strip fences only from config files, preserve markdown
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { OutputManager } from '../../src/core/output-manager.js';

describe('OutputManager', () => {
  describe('stripCodeFences', () => {
    it('should strip fences from Dockerfile content', () => {
      const content = '```dockerfile\nFROM node:18\nRUN npm install\n```';
      const manager = new OutputManager({ baseDir: '.', format: 'markdown', force: false });
      const result = manager['stripCodeFences'](content, 'Dockerfile');
      expect(result).toContain('FROM node:18');
      expect(result).not.toContain('```dockerfile');
    });

    it('should preserve markdown headers in .md files', () => {
      const content = '# Title\n\n## Section\nContent here';
      const manager = new OutputManager({ baseDir: '.', format: 'markdown', force: false });
      const result = manager['stripCodeFences'](content, 'README.md');
      expect(result).toContain('# Title');
    });

    it('should handle YAML files', () => {
      const content = '```yaml\nname: Test\nversion: 1.0.0\n```';
      const manager = new OutputManager({ baseDir: '.', format: 'markdown', force: false });
      const result = manager['stripCodeFences'](content, 'config.yml');
      expect(result).toContain('name: Test');
    });
  });

  describe('getFileCount', () => {
    it('should return count of files written', async () => {
      const testDir = '.test-output-files';
      const manager = new OutputManager({ baseDir: testDir, format: 'markdown', force: true });
      await manager.init();
      await manager.write('test1.md', '# Test');
      await manager.write('test2.md', '# Test2');
      expect(manager.getFileCount()).toBe(2);
    });
  });

  describe('getFilesWritten', () => {
    it('should return array of file paths', async () => {
      const testDir = '.test-output-files-2';
      const manager = new OutputManager({ baseDir: testDir, format: 'markdown', force: true });
      await manager.init();
      await manager.write('file1.md', 'content');
      const files = manager.getFilesWritten();
      expect(files).toContain('file1.md');
    });
  });
});
```

#### Method: `finalize()`
- **Why test:** Generates JSON/HTML exports and history tracking
- **Test case:** Should export analysis data and update history
- **Code skeleton:** (See above)

---

### 7. Scanner Modules

#### Function: `parseImports()` (src/scanners/import-parser.ts)
- **Why test:** Extracts dependencies from code; essential for dependency analysis
- **Test case:** Should extract ES6 imports, CommonJS requires, and language-specific imports
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { parseImports, getExternalDependencies, buildDependencyGraph } from '../../src/scanners/import-parser.js';

describe('import-parser', () => {
  describe('parseImports', () => {
    it('should parse ES6 imports', () => {
      const files = ['src/index.ts'];
      const results = parseImports(process.cwd(), files);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should parse CommonJS requires', () => {
      // Would need a file with require() for realistic test
    });
  });

  describe('getExternalDependencies', () => {
    it('should extract package names from imports', () => {
      const importInfos = [
        { file: 'src/index.ts', imports: ['express', 'chalk', './utils/logger'] },
      ];
      const deps = getExternalDependencies(importInfos);
      expect(deps).toContain('express');
      expect(deps).toContain('chalk');
      expect(deps).not.toContain('./utils/logger');
    });

    it('should handle scoped packages', () => {
      const importInfos = [
        { file: 'src/index.ts', imports: ['@nestjs/core', '@angular/common'] },
      ];
      const deps = getExternalDependencies(importInfos);
      expect(deps).toContain('@nestjs/core');
      expect(deps).toContain('@angular/common');
    });
  });

  describe('buildDependencyGraph', () => {
    it('should map files to local imports', () => {
      const importInfos = [
        { file: 'src/cli.ts', imports: ['./utils/logger', './core/orchestrator'] },
        { file: 'src/index.ts', imports: ['./cli'] },
      ];
      const graph = buildDependencyGraph(importInfos);
      expect(graph.get('src/cli.ts')).toContain('./utils/logger');
    });
  });
});
```

#### Function: `getExternalDependencies()` (src/scanners/import-parser.ts)
- **Why test:** Filters external packages from local imports; used for dependency analysis
- **Test case:** Should exclude relative imports and handle scoped packages
- **Code skeleton:** (See above)

#### Function: `buildDependencyGraph()` (src/scanners/import-parser.ts)
- **Why test:** Maps file relationships; important for architecture analysis
- **Test case:** Should only include local imports in the graph
- **Code skeleton:** (See above)

#### Function: `detectRoutes()` (src/scanners/route-detector.ts)
- **Why test:** Extracts API routes from multiple frameworks; must handle Express, Fastify, FastAPI, etc.
- **Test case:** Should detect Express.js routes with correct method and path
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { detectRoutes, getDetectedFramework, RouteInfo } from '../../src/scanners/route-detector.js';
import { join } from 'node:path';

describe('route-detector', () => {
  describe('detectRoutes', () => {
    it('should detect Express.js routes', () => {
      const files = ['src/server/index.ts'];
      const routes = detectRoutes(process.cwd(), files);
      // Should find actual routes from the project
      expect(Array.isArray(routes)).toBe(true);
    });

    it('should extract method and path correctly', () => {
      // Manual test with code content
      const routes = detectRoutes(process.cwd(), ['src/server/index.ts']);
      if (routes.length > 0) {
        expect(routes[0]).toHaveProperty('method');
        expect(routes[0]).toHaveProperty('path');
        expect(routes[0]).toHaveProperty('file');
      }
    });
  });

  describe('getDetectedFramework', () => {
    it('should return framework name from routes', () => {
      const routes: RouteInfo[] = [
        { method: 'GET', path: '/', file: 'src/server.ts' },
      ];
      const framework = getDetectedFramework(routes);
      expect(framework).toBe('Express.js');
    });

    it('should return null when no routes detected', () => {
      const framework = getDetectedFramework([]);
      expect(framework).toBeNull();
    });
  });
});
```

#### Function: `getDetectedFramework()` (src/scanners/route-detector.ts)
- **Why test:** Identifies web framework from routes; supports multiple frameworks
- **Test case:** Should return framework name or null
- **Code skeleton:** (See above)

#### Function: `detectModels()` (src/scanners/model-detector.ts)
- **Why test:** Extracts database models from ORM code; supports Prisma, Mongoose, TypeORM, etc.
- **Test case:** Should detect Prisma models with correct name and fields
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { detectModels, ModelInfo } from '../../src/scanners/model-detector.js';

describe('model-detector', () => {
  describe('detectModels', () => {
    it('should return array of models', () => {
      const files = ['src/**/*.ts'];
      const models = detectModels(process.cwd(), files);
      expect(Array.isArray(models)).toBe(true);
    });

    it('should extract model name and ORM type', () => {
      const models = detectModels(process.cwd(), ['prisma/schema.prisma']);
      // If prisma schema exists, should find models
      models.forEach(m => {
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('orm');
        expect(m).toHaveProperty('file');
      });
    });
  });
});
```

#### Function: `analyzeGitHistory()` (src/scanners/git-analyzer.ts)
- **Why test:** Extracts git metadata; provides project history context
- **Test case:** Should extract contributors, commits, tags from git repository
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { analyzeGitHistory, GitAnalysis } from '../../src/scanners/git-analyzer.js';

describe('git-analyzer', () => {
  describe('analyzeGitHistory', () => {
    it('should return git analysis object', () => {
      const analysis = analyzeGitHistory(process.cwd());
      expect(analysis).toHaveProperty('contributors');
      expect(analysis).toHaveProperty('recentCommits');
      expect(analysis).toHaveProperty('totalCommits');
      expect(analysis).toHaveProperty('tags');
    });

    it('should extract contributors', () => {
      const analysis = analyzeGitHistory(process.cwd());
      expect(Array.isArray(analysis.contributors)).toBe(true);
      if (analysis.contributors.length > 0) {
        expect(analysis.contributors[0]).toHaveProperty('name');
        expect(analysis.contributors[0]).toHaveProperty('commits');
      }
    });

    it('should extract recent commits', () => {
      const analysis = analyzeGitHistory(process.cwd());
      expect(Array.isArray(analysis.recentCommits)).toBe(true);
    });
  });
});
```

---

### 8. Utility Modules

#### Function: `walkDir()` (src/utils/fs.ts)
- **Why test:** Recursively traverses directories; respects ignore patterns
- **Test case:** Should walk directory and exclude ignored paths
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { walkDir, getExtension, readFileTruncated } from '../../src/utils/fs.js';

describe('file system utils', () => {
  describe('walkDir', () => {
    it('should return array of files', async () => {
      const files = await walkDir(process.cwd(), ['node_modules']);
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should exclude node_modules by default', async () => {
      const files = await walkDir(process.cwd());
      expect(files.every(f => !f.includes('node_modules'))).toBe(true);
    });

    it('should respect maxDepth parameter', async () => {
      const files = await walkDir(process.cwd(), [], 2);
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('getExtension', () => {
    it('should extract file extension', () => {
      expect(getExtension('file.ts')).toBe('.ts');
      expect(getExtension('path/to/file.tsx')).toBe('.tsx');
      expect(getExtension('config.json')).toBe('.json');
    });

    it('should return lowercase extension', () => {
      expect(getExtension('FILE.TS')).toBe('.ts');
    });
  });

  describe('readFileTruncated', () => {
    it('should read file within max length', async () => {
      const content = await readFileTruncated('package.json', 1000);
      expect(content.length).toBeLessThanOrEqual(1000);
    });

    it('should append truncation marker if file too large', async () => {
      const content = await readFileTruncated('package.json', 1);
      if (content.includes('truncated')) {
        expect(content).toContain('... (truncated)');
      }
    });
  });
});
```

#### Function: `getExtension()` (src/utils/fs.ts)
- **Why test:** Extracts file extensions for file type classification
- **Test case:** Should return lowercase extension including the dot
- **Code skeleton:** (See above)

#### Function: `readFileTruncated()` (src/utils/fs.ts)
- **Why test:** Safely reads files with size limits; prevents memory issues
- **Test case:** Should truncate large files and add marker
- **Code skeleton:** (See above)

#### Function: `ensureDir()` and `ensureDirSync()` (src/utils/fs.ts)
- **Why test:** Creates directories recursively; used for output setup
- **Test case:** Should create nested directory structure
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { ensureDir, ensureDirSync } from '../../src/utils/fs.js';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('ensureDir functions', () => {
  const testPath = join(process.cwd(), '.test-ensure-dir');

  it('should create directory recursively', async () => {
    const dir = join(testPath, 'nested/deep/path');
    await ensureDir(dir);
    expect(existsSync(dir)).toBe(true);
    rmSync(testPath, { recursive: true, force: true });
  });

  it('should create directory synchronously', () => {
    const dir = join(testPath, 'sync/path');
    ensureDirSync(dir);
    expect(existsSync(dir)).toBe(true);
    rmSync(testPath, { recursive: true, force: true });
  });
});
```

#### Function: `calculateGrade()` is already tested, but missing test coverage for:

#### Function: `calculateOverallScore()` - Already tested

#### Function: `clampScore()` - Already tested

#### Function: `wrapMermaid()` (src/utils/mermaid.ts)
- **Why test:** Constructs Mermaid diagram syntax; formatting must be correct
- **Test case:** Should wrap diagram type and content correctly
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { wrapMermaid, mermaidFlowchart, mermaidErDiagram, mermaidSequence } from '../../src/utils/mermaid.js';

describe('mermaid helpers - additional tests', () => {
  describe('wrapMermaid', () => {
    it('should wrap type and content', () => {
      const result = wrapMermaid('classDiagram', 'class User');
      expect(result).toBe('classDiagram\nclass User');
    });
  });

  describe('mermaidSequence', () => {
    it('should create sequence diagram', () => {
      const result = mermaidSequence('Alice->>Bob: Hello');
      expect(result).toContain('sequenceDiagram');
      expect(result).toContain('Alice->>Bob: Hello');
    });
  });
});
```

#### Function: `getCliVersion()` (src/utils/version.ts)
- **Why test:** Reads package.json for version; used in CLI output
- **Test case:** Should return version string from package.json
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { getCliVersion } from '../../src/utils/version.js';

describe('version utils', () => {
  describe('getCliVersion', () => {
    it('should return version string', () => {
      const version = getCliVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should cache version after first call', () => {
      const v1 = getCliVersion();
      const v2 = getCliVersion();
      expect(v1).toBe(v2);
    });
  });
});
```

---

### 9. Server Routes (src/server/index.ts)

#### Route: `GET /` (Root index route)
- **Why test:** Renders home page with file list; initial server entry point
- **Test case:** Should return HTML with file list and sidebar
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { startServer, ServerOptions } from '../../src/server/index.js';

describe('Server routes', () => {
  describe('GET /', () => {
    it('should return HTML page', async () => {
      // Note: would need to mock or start actual server
      // This is an integration test pattern
      const response = { status: 200, type: 'text/html' };
      expect(response.status).toBe(200);
    });

    it('should include file list in response', async () => {
      // Should render file collection results
    });
  });

  describe('GET /view/:filepath', () => {
    it('should serve markdown files as HTML', () => {
      // Should convert .md to HTML
    });

    it('should handle path traversal safely', () => {
      // Should not allow ../ in paths
    });
  });

  describe('GET /compare', () => {
    it('should redirect to home if no multiple analyses', () => {
      // Should handle missing comparison data
    });
  });
});
```

#### Route: `GET /view/:filepath` (File viewer route)
- **Why test:** Serves files as HTML; must sanitize HTML and handle paths safely
- **Test case:** Should convert markdown to HTML and escape raw HTML content
- **Code skeleton:** (See above)

#### Route: `GET /compare` (Comparison page route)
- **Why test:** Compares analysis runs; displays progress over time
- **Test case:** Should render comparison table if multiple analyses exist
- **Code skeleton:** (See above)

#### Helper: `escapeHtml()`
- **Why test:** Sanitizes HTML; prevents XSS vulnerabilities
- **Test case:** Should escape dangerous characters
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';

describe('HTML escaping', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      // Server module has escapeHtml
      // Test separately or via route testing
    });

    it('should escape angle brackets', () => {
      // Should convert < to &lt;
    });

    it('should escape quotes', () => {
      // Should convert " to &quot;
    });
  });
});
```

#### Helper: `collectFiles()`
- **Why test:** Recursively collects files from output directory
- **Test case:** Should build file tree with paths and names
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';

describe('Server helpers', () => {
  describe('collectFiles', () => {
    it('should return array of file objects', () => {
      // Should collect files from directory
    });

    it('should include relative paths and names', () => {
      // Each file should have path and name
    });

    it('should recurse into subdirectories', () => {
      // Should find nested files
    });
  });
});
```

#### Function: `startServer()`
- **Why test:** Starts Express server; critical for preview functionality
- **Test case:** Should listen on specified port
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import { startServer, ServerOptions } from '../../src/server/index.js';

describe('startServer', () => {
  it('should start server on specified port', async () => {
    // Would need to start actual server or mock Express
    const options: ServerOptions = { port: 3001, outputDir: '.reposentry' };
    // Test would be integration test
  });

  it('should exit gracefully on error', async () => {
    // Should handle startup errors
  });
});
```

---

### 10. Engine Modules (src/engines/*.ts)

All engine modules follow the same pattern and are **completely untested**. Each needs tests for:

#### Function: `runDocsEngine()` (src/engines/docs-engine.ts)
- **Why test:** Generates documentation suite; core delivery component
- **Test case:** Should call Copilot for each doc type and return score/details
- **Code skeleton:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { runDocsEngine, DocsEngineInput } from '../../src/engines/docs-engine.js';
import { OutputManager } from '../../src/core/output-manager.js';
import { Progress } from '../../src/core/progress.js';

describe('docs-engine', () => {
  describe('runDocsEngine', () => {
    it('should return result with score and details', async () => {
      const input: DocsEngineInput = {
        context: { projectName: 'test', languages: ['TypeScript'], frameworks: [] },
        routes: [],
        recentCommits: [],
        tags: [],
        hasReadme: true,
      };
      const output = new OutputManager({ baseDir: '.', format: 'markdown', force: true });
      const progress = new Progress();
      
      const result = await runDocsEngine(input, output, progress);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('details');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
```

Similar tests needed for:
- `runArchitectureEngine()` (src/engines/architecture-engine.ts)
- `runSecurityEngine()` (src/engines/security-engine.ts)
- `runCIEngine()` (src/engines/ci-engine.ts)
- `runAPITestEngine()` (src/engines/api-test-engine.ts)
- `runPerformanceEngine()` (src/engines/performance-engine.ts)
- `runTeamEngine()` (src/engines/team-engine.ts)
- `runHealthEngine()` (src/engines/health-engine.ts)

---

### 11. Prompt Builders (src/prompts/*.prompts.ts)

All prompt modules export functions that construct prompts. Each needs unit tests:

#### Module: `docs.prompts.ts`
- **Why test:** Prompt generation for documentation; must include correct context
- **Test cases:**
  - `readmePrompt()` - Should include project info
  - `apiDocsPrompt()` - Should include routes
  - `setupPrompt()` - Should include frameworks
  - `contributingPrompt()` - Should include repo info
  - `changelogPrompt()` - Should include commit history
  - `faqPrompt()` - Should include common patterns
- **Code skeleton:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  readmePrompt,
  apiDocsPrompt,
  setupPrompt,
  contributingPrompt,
  changelogPrompt,
  faqPrompt,
} from '../../src/prompts/docs.prompts.js';
import { PromptContext } from '../../src/core/prompt-builder.js';

describe('docs prompts', () => {
  const context: PromptContext = {
    projectName: 'test-app',
    languages: ['TypeScript'],
    frameworks: ['Express.js'],
  };

  describe('readmePrompt', () => {
    it('should include project name', () => {
      const prompt = readmePrompt(context, [], []);
      expect(prompt).toContain('test-app');
    });

    it('should include frameworks', () => {
      const prompt = readmePrompt(context, [], []);
      expect(prompt).toContain('Express.js');
    });
  });

  describe('apiDocsPrompt', () => {
    it('should include API routes when present', () => {
      const routes = [{ method: 'GET', path: '/', file: 'index.ts' }];
      const prompt = apiDocsPrompt(context, routes);
      expect(prompt).toContain('GET');
      expect(prompt).toContain('/');
    });
  });

  describe('setupPrompt', () => {
    it('should be generated successfully', () => {
      const prompt = setupPrompt(context);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });
});
```

Similar structure for all prompt modules:
- `architecture.prompts.ts`
- `ci.prompts.ts`
- `security.prompts.ts`
- `api-test.prompts.ts`
- `performance.prompts.ts`
- `health.prompts.ts`
- `team.prompts.ts`

---

## Summary Table

| Category | Count | Status |
|----------|-------|--------|
| Tested Modules | 5 | ✅ Covered |
| Untested Core Modules | 8 | ❌ Needs Tests |
| Untested Scanner Functions | 6 | ❌ Needs Tests |
| Untested Utility Functions | 6 | ❌ Needs Tests |
| Untested Engine Functions | 8 | ❌ Needs Tests |
| Untested Prompt Modules | 8 | ❌ Needs Tests |
| Untested Routes | 3 | ❌ Needs Tests |
| **Total Functions/Routes** | **~52** | **15% Covered** |

---

## Priority Testing Recommendations

**High Priority (Core Logic):**
1. `askCopilot()` - AI integration is critical
2. `runAnalysis()` - Main orchestration pipeline
3. Engine functions - All 8 engines
4. Route handlers - Server endpoints

**Medium Priority (Data Processing):**
1. `parseImports()`, `detectRoutes()`, `detectModels()`
2. Config loading and merging
3. File system operations

**Low Priority (Utility):**
1. Logger and version functions
2. Mermaid helpers
3. Scoring calculations (already mostly tested)