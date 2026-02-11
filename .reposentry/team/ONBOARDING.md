---

# ONBOARDING.md

## RepoSentry Contributor Onboarding Guide

Welcome to RepoSentry! This guide will help you get started contributing to our AI-powered codebase intelligence platform.

## 🚀 Quick Start Path for First Contributions

**Estimated time: 30 minutes**

1. **Setup your environment** (5 min)
2. **Understand the project** (10 min)
3. **Run tests locally** (5 min)
4. **Make your first contribution** (10 min)

---

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Project Architecture Overview](#project-architecture-overview)
- [Key Files and Their Purposes](#key-files-and-their-purposes)
- [Development Workflow](#development-workflow)
- [Running and Testing Locally](#testing)
- [Common Tasks Walkthrough](#common-tasks-walkthrough)
- [Coding Conventions](#coding-conventions)
- [Your First Contribution](#your-first-contribution)
- [Getting Help](#getting-help)

---

## Environment Setup

### Prerequisites

- **Node.js** ≥ 18 (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **Git** (for cloning and working with repositories)
- **GitHub Copilot CLI** (optional but recommended for testing AI features)
  - Install: `npm install -g @github/copilot` or `winget install GitHub.Copilot`

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/MaheshDoiphode/reposentry.git
cd reposentry

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI globally (optional, for testing commands)
npm link
```

### Verify Installation

```bash
# Check the build works
npm run build

# Run tests
npm run test

# Type check
npm run typecheck

# Watch mode for development
npm run dev
```

---

## Project Architecture Overview

RepoSentry is a **modular, engine-based analysis platform** that transforms any codebase into actionable insights through orchestrated AI analysis.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│  (cli.ts - command parsing, user interaction)               │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   Orchestrator (orchestrator.ts)             │
│  - Coordinates analysis flow                                │
│  - Manages engines & scanners                               │
│  - Handles output generation                                │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┬─────────────────┐
        │                 │              │                 │
┌───────▼─────┐  ┌────────▼────┐  ┌────▼──────┐  ┌──────▼─────┐
│  Scanners   │  │  Copilot    │  │  Engines  │  │  Output    │
│ (detect     │  │  (AI brain) │  │ (8 types) │  │  Manager   │
│  structure) │  │ (LLM calls) │  │ (analysis)│  │ (files)    │
└─────────────┘  └─────────────┘  └───────────┘  └────────────┘
```

### Core Concepts

1. **Scanners** - Analyze the codebase to gather information
   - Detect languages, frameworks, project structure
   - Extract imports, routes, models, configs
   - Analyze Git history

2. **Copilot Integration** - Executes AI analysis
   - Sends structured prompts to GitHub Copilot CLI
   - Handles retries and error recovery
   - Supports multiple AI models

3. **Engines** - Specialized analysis modules
   - Each engine focuses on one aspect (docs, security, performance, etc.)
   - Takes scanner data + Copilot responses
   - Generates formatted output files

4. **Output Manager** - Handles file generation
   - Writes markdown, HTML, JSON formats
   - Manages directory structure
   - Handles overwrite protection

---

## Key Files and Their Purposes

### Core System Files

| File | Purpose |
|------|---------|
| **src/cli.ts** | CLI command definitions, argument parsing, help text. Entry point for user commands. |
| **src/config.ts** | Configuration loading from `reposentry.config.js`, `reposentry.config.json`, or `package.json`. |
| **src/index.ts** | Main entry point; exports CLI creator and main functions. |

### Core Analysis Logic

| File | Purpose |
|------|---------|
| **src/core/orchestrator.ts** | Main orchestration logic. Coordinates scanners, engines, and Copilot. Runs the analysis flow. |
| **src/core/copilot.ts** | Wrapper around GitHub Copilot CLI. Executes prompts, handles retries, model selection. |
| **src/core/prompt-builder.ts** | Builds structured prompts from scanner data. Includes template context management. |
| **src/core/output-manager.ts** | Handles file writing in markdown/HTML/JSON formats. Creates output directory structure. |
| **src/core/progress.ts** | Progress tracking and display for long-running analysis. |

### Scanners (Data Collection)

| File | Purpose |
|------|---------|
| **src/scanners/file-scanner.ts** | Walks the directory tree, identifies files to analyze. |
| **src/scanners/language-detector.ts** | Detects programming languages and frameworks (TypeScript, Node.js, etc.). |
| **src/scanners/config-detector.ts** | Identifies configuration files (package.json, tsconfig.json, docker-compose.yml, etc.). |
| **src/scanners/import-parser.ts** | Extracts imports/requires from source files. |
| **src/scanners/route-detector.ts** | Detects API routes (Express.js, etc.). |
| **src/scanners/model-detector.ts** | Identifies data models and schemas. |
| **src/scanners/git-analyzer.ts** | Analyzes Git history (commits, contributors, branches). |

### Analysis Engines (Specialized Modules)

Each engine generates a specific type of analysis. All follow the same pattern: take scanner data → use Copilot to analyze → generate output.

| Engine | Output Files |
|--------|--------------|
| **docs-engine.ts** | README.md, API.md, SETUP.md, CONTRIBUTING.md, CHANGELOG.md, FAQ.md |
| **architecture-engine.ts** | ARCHITECTURE.md + Mermaid diagrams in `diagrams/` |
| **security-engine.ts** | SECURITY_AUDIT.md, VULNERABILITY_REPORT.md, threat-model.mmd |
| **ci-engine.ts** | GitHub Actions workflows, Dockerfile, docker-compose.yml, .env suggestions |
| **api-test-engine.ts** | API_TESTS.md, api-collection.json (Postman), test scripts |
| **performance-engine.ts** | PERFORMANCE_AUDIT.md, performance-score.json |
| **team-engine.ts** | PR_TEMPLATE.md, CODEOWNERS, issue templates, CONTRIBUTING.md |
| **health-engine.ts** | HEALTH_REPORT.md, analysis.json (aggregated scores) |

### Prompt Templates

| File | Purpose |
|------|---------|
| **src/prompts/*.prompts.ts** | Pre-built prompt templates for each engine. Maps scanner data to Copilot prompts. |

### Utilities

| File | Purpose |
|------|---------|
| **src/utils/logger.ts** | Logging with color and level support (info, success, warn, error, debug). |
| **src/utils/git.ts** | Git operations (check if repo, get repo name, analyze commits). |
| **src/utils/fs.ts** | File system operations (safe reads/writes, path handling). |
| **src/utils/mermaid.ts** | Mermaid diagram generation and validation. |
| **src/utils/scoring.ts** | Health score calculation and grading logic. |
| **src/utils/version.ts** | Version management from package.json. |

### Server

| File | Purpose |
|------|---------|
| **src/server/index.ts** | Express.js server for `reposentry serve` command. Serves generated reports in browser. |

### Tests

| Directory | Purpose |
|-----------|---------|
| **tests/core/** | Unit tests for orchestrator, prompt building, output management, scoring. |
| **tests/scanners/** | Unit tests for file scanning, language detection, config detection. |
| **tests/fixtures/** | Mock data and test files for unit tests. |

---

## Development Workflow

### Typical Development Cycle

```bash
# 1. Create a feature branch
git checkout -b feature/my-feature

# 2. Watch for changes (TypeScript compilation in real-time)
npm run dev

# 3. In another terminal, run tests in watch mode
npm run test -- --watch

# 4. Make changes in src/ directory
# Files automatically compile to dist/

# 5. Before committing, run full checks
npm run typecheck
npm run test
npm run build

# 6. Commit your changes
git add .
git commit -m "feat: add my new feature"

# 7. Push and open a Pull Request
git push origin feature/my-feature
```

### Branch Naming Convention

- **feature/** - New features (`feature/email-validation`)
- **fix/** - Bug fixes (`fix/memory-leak`)
- **refactor/** - Code refactoring (`refactor/scanner-utils`)
- **docs/** - Documentation changes (`docs/api-guide`)
- **chore/** - Maintenance tasks (`chore/update-deps`)

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `docs` - Documentation
- `test` - Test additions/changes
- `chore` - Dependencies, config changes

**Examples:**
```
feat(docs-engine): add FAQ generation from TODOs
fix(copilot): retry on timeout with exponential backoff
refactor(scanners): consolidate path utilities
docs: update architecture overview
test(prompt-builder): add context merging tests
```

---

## Testing

### Run All Tests

```bash
# Single run
npm run test

# Watch mode (re-runs on file changes)
npm run test -- --watch

# Run specific test file
npm run test -- prompt-builder.test.ts

# Run with coverage
npm run test -- --coverage
```

### Write Tests

Tests are in `tests/` using **Vitest** (similar to Jest).

**Example test structure:**

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../../src/path/to/module.js';

describe('your-module', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => yourFunction(null)).toThrow();
  });
});
```

### Test File Locations

Place test files next to source files or in `tests/` directory matching the structure:

```
src/
  core/
    prompt-builder.ts
tests/
  core/
    prompt-builder.test.ts
```

---

## Common Tasks Walkthrough

### Task 1: Add a New Scanner

**Goal:** Create a scanner that detects environment files in a project.

```typescript
// src/scanners/env-detector.ts
import { readFileSync } from 'fs';
import { glob } from 'glob';

export async function detectEnvironmentFiles(cwd: string): Promise<string[]> {
  const patterns = ['.env*', '*.env.*'];
  const files = await glob(patterns, { cwd, dot: true });
  
  const envFiles: string[] = [];
  for (const file of files) {
    try {
      const content = readFileSync(`${cwd}/${file}`, 'utf-8');
      envFiles.push({ path: file, hasSecrets: detectSecrets(content) });
    } catch {
      // Skip unreadable files
    }
  }
  
  return envFiles;
}

function detectSecrets(content: string): boolean {
  return /API_KEY|PASSWORD|SECRET|TOKEN/i.test(content);
}
```

**Add to orchestrator:**

```typescript
// In src/core/orchestrator.ts, add to scanners section
const envFiles = await detectEnvironmentFiles(cwd);
context.envFiles = envFiles;
```

**Write tests:**

```typescript
// tests/scanners/env-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectEnvironmentFiles } from '../../src/scanners/env-detector.js';

describe('env-detector', () => {
  it('should find .env files', async () => {
    const files = await detectEnvironmentFiles('./test-project');
    expect(files.length).toBeGreaterThan(0);
  });
});
```

### Task 2: Create a New Engine

**Goal:** Create an engine that generates a database schema documentation file.

```typescript
// src/engines/db-schema-engine.ts
import { callCopilot } from '../core/copilot.js';
import { buildPrompt } from '../core/prompt-builder.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';

export async function runDatabaseSchemaEngine(
  context: PromptContext,
  output: OutputManager,
): Promise<void> {
  const prompt = buildPrompt(
    'Generate database schema documentation including all tables, columns, relationships, and indexes. Format as markdown with code blocks for SQL.',
    context,
    'markdown'
  );

  const response = await callCopilot(prompt, {
    projectDir: context.cwd,
  });

  await output.writeFile('DATABASE_SCHEMA.md', response);
}
```

**Add to orchestrator:**

```typescript
// In src/core/orchestrator.ts
import { runDatabaseSchemaEngine } from '../engines/db-schema-engine.js';

// In runAnalysis function, add:
if (runAll || opts.dbSchema) {
  progress.start('Database Schema');
  await runDatabaseSchemaEngine(context, outputManager);
  progress.succeed('Database Schema');
}
```

**Add CLI option:**

```typescript
// In src/cli.ts
analyze.option('--db-schema', 'Generate database schema documentation only')
```

### Task 3: Fix a Bug in a Scanner

**Scenario:** The language detector incorrectly identifies TypeScript files as JavaScript.

```typescript
// Original code (buggy)
function detectLanguages(files: string[]): string[] {
  const languages = new Set<string>();
  for (const file of files) {
    if (file.endsWith('.ts')) languages.add('JavaScript'); // BUG!
    if (file.endsWith('.js')) languages.add('JavaScript');
  }
  return Array.from(languages);
}

// Fixed code
function detectLanguages(files: string[]): string[] {
  const languages = new Set<string>();
  for (const file of files) {
    if (file.endsWith('.ts')) languages.add('TypeScript');    // FIXED
    if (file.endsWith('.tsx')) languages.add('TypeScript');   // Added
    if (file.endsWith('.js')) languages.add('JavaScript');
    if (file.endsWith('.jsx')) languages.add('JavaScript');   // Added
  }
  return Array.from(languages);
}
```

**Test your fix:**

```typescript
// Add test in tests/scanners/language-detector.test.ts
it('should detect TypeScript separately from JavaScript', () => {
  const files = ['src/index.ts', 'src/config.js'];
  const languages = detectLanguages(files);
  
  expect(languages).toContain('TypeScript');
  expect(languages).toContain('JavaScript');
  expect(languages.length).toBe(2);
});
```

**Steps to fix:**
1. Write a failing test first
2. Make your code change
3. Verify the test passes
4. Run full test suite: `npm run test`
5. Commit with `fix(language-detector): ...`

### Task 4: Update Prompts for Better Output

**Scenario:** The docs engine's README prompt needs to request better examples.

```typescript
// src/prompts/docs.prompts.ts
export const README_PROMPT = `
Generate a professional README.md for a {{language}} project named "{{projectName}}".

Requirements:
1. Include a concise project description
2. Add a features list with emojis
3. Provide installation instructions for {{packageManager}}
4. Include at least 3 detailed usage examples with code blocks  // IMPROVED
5. Add a contributing section
6. Include badges (build status, license, version)

Project context:
{{projectDescription}}

Format as clean, valid Markdown.
`;
```

**Test by running:**

```bash
npm run build
npm run test  # Ensure no regressions
```

---

## Coding Conventions

### TypeScript & Code Style

#### Naming Conventions

- **Functions & variables:** `camelCase`
  ```typescript
  const getUserData = () => { };
  let maxRetries = 3;
  ```

- **Classes & types:** `PascalCase`
  ```typescript
  class OutputManager { }
  interface AnalyzeOptions { }
  type LogLevel = 'info' | 'error';
  ```

- **Constants:** `SCREAMING_SNAKE_CASE` (only for truly constant values)
  ```typescript
  const DEFAULT_TIMEOUT = 30000;
  const MAX_RETRIES = 3;
  ```

- **Private members:** prefix with underscore or use `private` keyword
  ```typescript
  class Service {
    private _config: Config;
    #secret: string; // or use # syntax
  }
  ```

#### Code Organization

```typescript
// 1. Imports (group by: node stdlib, dependencies, local modules)
import { readFileSync } from 'node:fs';
import { logger } from './logger.js';
import type { Config } from './types.js';

// 2. Type definitions
export interface EngineOptions {
  verbose: boolean;
  output: string;
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Helper functions (private)
function formatOutput(raw: string): string {
  return raw.trim();
}

// 5. Main functions (public)
export async function runEngine(options: EngineOptions): Promise<void> {
  // implementation
}
```

#### File Size & Complexity

- Keep files under **300 lines** (split if larger)
- Keep functions under **50 lines** (refactor if larger)
- Use descriptive function names instead of comments
- Only comment *why*, not *what*

```typescript
// BAD: Comment explains what it does
// Get the count of items
const count = items.length;

// GOOD: Clear function name
const itemCount = items.length;

// GOOD: Comment explains non-obvious logic
// Cache strategy: only store items with TTL > 1 hour to avoid stale data
const cachedItems = items.filter(i => i.ttl > 3600);
```

#### Async/Await & Error Handling

- Always use async/await over Promise chains
- Handle errors explicitly
- Propagate errors up the stack (don't silently fail)

```typescript
// ✅ GOOD
export async function analyzeRepo(path: string): Promise<Analysis> {
  try {
    const files = await scanFiles(path);
    const languages = await detectLanguages(files);
    return { files, languages };
  } catch (error) {
    logger.error(`Failed to analyze ${path}: ${error.message}`);
    throw error; // Re-throw for caller to handle
  }
}

// ❌ AVOID
export async function analyzeRepo(path: string): Promise<Analysis> {
  const files = await scanFiles(path); // No error handling
  return { files };
}
```

#### Type Safety

- Always use strict type checking (enabled in `tsconfig.json`)
- Use `unknown` before `any`
- Avoid implicit `any`

```typescript
// ✅ GOOD
function processData(data: unknown): void {
  if (typeof data === 'object' && data !== null) {
    // safe to use data as object
  }
}

// ❌ AVOID
function processData(data: any): void { }

// ✅ GOOD
interface Config {
  output: string;
  verbose?: boolean;  // optional
}

// ❌ AVOID
interface Config {
  output: any;
  [key: string]: any;
}
```

### Module Imports

- Use ES modules (already configured in `package.json`)
- Use explicit `.js` extensions for imports

```typescript
// ✅ GOOD
import { logger } from '../utils/logger.js';
import type { Config } from '../types.js';

// ❌ AVOID
import { logger } from '../utils/logger';  // missing .js
import * as all from '../utils/logger.js'; // use named imports
```

### Testing Conventions

- Test file names match source: `module.ts` → `module.test.ts`
- One `describe` per function/class
- Descriptive test names that read like sentences

```typescript
describe('scoreCalculator', () => {
  describe('calculateGrade', () => {
    it('should return A for scores 90-100', () => {
      expect(calculateGrade(95)).toBe('A');
    });

    it('should return B for scores 80-89', () => {
      expect(calculateGrade(85)).toBe('B');
    });

    it('should throw for invalid scores', () => {
      expect(() => calculateGrade(-1)).toThrow();
    });
  });
});
```

### Comments & Documentation

- Write self-documenting code (clear names, obvious logic)
- Add JSDoc comments for public functions

```typescript
/**
 * Analyzes a Git repository and generates comprehensive reports.
 * 
 * @param repoPath - Path to the Git repository
 * @param options - Analysis options (depth, output format, etc.)
 * @returns Structured analysis results
 * @throws {GitError} If the path is not a valid Git repository
 * @throws {CopilotError} If GitHub Copilot CLI is not available
 * 
 * @example
 * const analysis = await analyzeRepository('./my-project', {
 *   depth: 'standard',
 *   output: '.reposentry'
 * });
 */
export async function analyzeRepository(
  repoPath: string,
  options: AnalyzeOptions,
): Promise<Analysis> {
  // implementation
}
```

---

## Your First Contribution

### Step 1: Pick an Issue

- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue: "I'd like to work on this"
- Ask clarifying questions if needed

**No issue to work on? Here are ideas:**
1. Add tests for untested modules
2. Improve error messages
3. Add new scanner (env files, Docker configs, etc.)
4. Write missing JSDoc comments
5. Refactor a long function

### Step 2: Set Up Your Branch

```bash
# Get latest code
git fetch origin
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Step 3: Make Your Changes

```bash
# Compile in watch mode
npm run dev

# Run tests in another terminal
npm run test -- --watch

# Make your changes...

# Type check before committing
npm run typecheck
```

### Step 4: Test Your Changes

```bash
# Run all tests
npm run test

# Run specific test
npm run test -- my-feature.test.ts

# Build to verify no errors
npm run build
```

### Step 5: Create a Clear Commit

```bash
# Stage changes
git add src/ tests/

# Commit with conventional message
git commit -m "feat(scanner): add environment file detector

- Detects .env files and their patterns
- Identifies potential secrets in env files
- Added comprehensive tests"

# View your commits
git log --oneline -5
```

### Step 6: Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Open PR on GitHub
# - Fill in the PR template
# - Link related issues
# - Describe your changes clearly
# - Request review from maintainers
```

### Step 7: Respond to Code Review

- Address feedback promptly
- Ask questions if feedback isn't clear
- Push new commits (don't force-push after review started)
- Use GitHub's "resolve conversation" feature

```bash
# After addressing feedback
git add .
git commit -m "refactor: address review feedback

- Simplified error handling
- Added missing test cases
- Improved variable naming"

git push origin feature/your-feature-name
```

### Example: Complete First Contribution

**Issue:** "Add tests for language-detector.ts"

**Steps:**

1. Clone repo, create branch
   ```bash
   git checkout -b test/language-detector-coverage
   ```

2. Write tests
   ```typescript
   // tests/scanners/language-detector.test.ts
   import { describe, it, expect } from 'vitest';
   import { detectLanguages } from '../../src/scanners/language-detector.js';

   describe('language-detector', () => {
     it('should detect TypeScript', () => {
       const langs = detectLanguages(['src/index.ts']);
       expect(langs).toContain('TypeScript');
     });

     it('should detect multiple languages', () => {
       const langs = detectLanguages(['src/index.ts', 'config.js']);
       expect(langs).toContain('TypeScript');
       expect(langs).toContain('JavaScript');
     });
   });
   ```

3. Run tests
   ```bash
   npm run test
   ```

4. Commit and push
   ```bash
   git add tests/
   git commit -m "test(language-detector): add comprehensive test coverage

   - Added tests for single language detection
   - Added tests for multiple languages
   - Added tests for edge cases (empty files, unknown extensions)"
   
   git push origin test/language-detector-coverage
   ```

5. Create PR on GitHub

---

## Getting Help

### Documentation

- **README.md** - User-facing documentation and feature overview
- **internal-docs/project_details.md** - Deep dive into architecture and design decisions
- **src/** JSDoc comments - Function-level documentation

### Community

- 💬 **GitHub Issues** - Report bugs or discuss features
- 💬 **GitHub Discussions** - Ask general questions
- 🐛 **Bug Reports** - Include reproduction steps and error messages

### Debugging Tips

#### Enable Verbose Logging

```bash
# Add this to see debug output
reposentry analyze --verbose
```

#### Use Node Debugger

```bash
# Start with debugger
node --inspect-brk dist/index.js analyze

# Open Chrome DevTools: chrome://inspect
```

#### Check Copilot Integration

```typescript
// In any file, test copilot availability
import { isCopilotAvailable, getCopilotBackendName } from './core/copilot.js';

console.log('Copilot available:', isCopilotAvailable());
console.log('Backend:', getCopilotBackendName());
```

#### Common Issues

| Issue | Solution |
|-------|----------|
| Tests fail after deps change | Run `npm install` and `npm run build` |
| TypeScript errors | Run `npm run typecheck` to see all errors |
| Port 3000 already in use | `npm run serve -- --port 3001` |
| `dist/` out of sync with `src/` | Run `npm run build` |
| Tests timeout | Increase timeout in `vitest.config.ts` |

---

## Quick Reference

### Important Commands

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript
npm run dev       # Watch mode
npm run test      # Run tests
npm run typecheck # Type checking
npm run start     # Run CLI
npm link          # Link for global use
```

### Project Structure Cheat Sheet

```
src/
├── cli.ts              ← User commands
├── core/               ← Main logic (orchestrator, copilot, output)
├── engines/            ← Analysis modules (8 engines)
├── scanners/           ← Data collection (7 scanners)
├── prompts/            ← AI prompt templates
├── utils/              ← Helpers
└── server/             ← Web server

tests/                  ← Test files (mirror src structure)
```

### Key Concepts

- **Scanners** gather data from the codebase
- **Copilot** analyzes that data via AI
- **Engines** process Copilot output into formatted files
- **OutputManager** writes files to disk

---

## Contributing Checklist

Before submitting a PR, ensure:

- [ ] Code follows conventions (naming, formatting, comments)
- [ ] All tests pass: `npm run test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] Changes have tests (new code or edge cases)
- [ ] Commit messages follow convention
- [ ] PR description explains what and why
- [ ] No console.log() left behind (use logger instead)
- [ ] No dead code or commented-out sections
- [ ] Changes are minimal and focused

---

## Resources

- **Node.js:** https://nodejs.org
- **TypeScript:** https://www.typescriptlang.org
- **Vitest:** https://vitest.dev
- **GitHub Copilot CLI:** https://github.com/github/copilot-cli
- **Conventional Commits:** https://www.conventionalcommits.org
- **Express.js:** https://expressjs.com

---

## Final Notes

- Don't hesitate to ask questions in GitHub Discussions
- Start with small PRs (easier to review)
- Read existing code to understand patterns
- Test your changes thoroughly before submitting
- Be respectful and constructive in code reviews

**Welcome to the RepoSentry team! 🚀**