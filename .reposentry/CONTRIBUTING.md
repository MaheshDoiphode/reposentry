# CONTRIBUTING.md

## Contributing to RepoSentry

Thank you for your interest in contributing to RepoSentry! We welcome contributions from everyone. This guide will help you understand our development process and how to make meaningful contributions.

---

## Table of Contents

- [Fork and Clone](#fork-and-clone)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Format](#commit-message-format)
- [Code Style Guidelines](#code-style-guidelines)
- [PR Process](#pr-process)
- [Testing Requirements](#testing-requirements)
- [Code Review Expectations](#code-review-expectations)

---

## Fork and Clone

### 1. Fork the Repository

Click the **Fork** button on the [RepoSentry GitHub repository](https://github.com/MaheshDoiphode/reposentry) to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/reposentry.git
cd reposentry
```

### 3. Add Upstream Remote

Keep your fork synced with the main repository:

```bash
git remote add upstream https://github.com/MaheshDoiphode/reposentry.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Create a Development Branch

```bash
git checkout -b feature/your-feature-name
```

---

## Branch Naming Conventions

Use clear, descriptive branch names following this pattern:

```
<type>/<scope>-<description>
```

### Types

- **`feature/`** — New functionality or features
- **`fix/`** — Bug fixes
- **`docs/`** — Documentation updates only
- **`refactor/`** — Code refactoring without feature changes
- **`test/`** — Test additions or improvements
- **`perf/`** — Performance improvements
- **`ci/`** — CI/CD configuration changes
- **`chore/`** — Dependency updates, build config, etc.

### Examples

```bash
# Good
git checkout -b feature/add-mermaid-diagrams
git checkout -b fix/security-engine-null-check
git checkout -b docs/update-installation-guide
git checkout -b refactor/simplify-prompt-builder
git checkout -b test/add-ci-engine-tests
git checkout -b perf/optimize-file-scanning

# Avoid
git checkout -b fix-bug                 # Too vague
git checkout -b new-feature             # Unclear scope
git checkout -b update                  # No context
```

---

## Commit Message Format

Follow the **Conventional Commits** specification for clear, semantic commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat** — New feature
- **fix** — Bug fix
- **docs** — Documentation changes
- **style** — Code style changes (formatting, missing semicolons, etc.)
- **refactor** — Code refactoring without feature or bug changes
- **perf** — Performance improvement
- **test** — Test additions or updates
- **ci** — CI/CD configuration changes
- **chore** — Build config, dependency updates, etc.

### Scope

The scope specifies which part of the codebase is affected:
- `core` — Core analysis logic
- `engines` — Analysis engines (security, docs, ci, etc.)
- `scanners` — Codebase scanning utilities
- `cli` — Command-line interface
- `server` — Web preview server
- `utils` — Helper utilities

### Subject

- Use imperative mood ("add" not "adds" or "added")
- Do not capitalize the first letter
- Do not include a period at the end
- Limit to 50 characters

### Body

Explain **what** and **why**, not how. Include motivation for the change and contrast with previous behavior.

```
- Wrap at 72 characters
- Explain the problem being solved
- Reference any related issues (#123)
```

### Footer

```
Fixes #123
Closes #456
Refs #789
Breaking-Change: description of what changed
```

### Examples

```bash
# Simple feature
git commit -m "feat(engines): add performance analysis engine"

# Bug fix with reference
git commit -m "fix(scanners): resolve null pointer in language detector

Previously, the language detector would crash if no package.json was found.
Now it gracefully falls back to generic detection.

Fixes #234"

# Documentation update
git commit -m "docs(readme): update installation instructions for Windows"

# Refactoring with context
git commit -m "refactor(core): simplify prompt builder logic

Extract prompt generation into separate methods for better
maintainability and testability.

Refs #567"
```

---

## Code Style Guidelines

### TypeScript

We use strict TypeScript with the following conventions:

#### Formatting

- **Indent**: 2 spaces (configured in ESLint)
- **Line length**: 80 characters (soft limit), 100 (hard limit)
- **Quotes**: Single quotes (`'`) for strings
- **Semicolons**: Required
- **Trailing commas**: ES5-style (objects/arrays only)

#### Type Safety

```typescript
// ✅ Good
const calculateScore = (value: number): number => {
  return value * 2;
};

interface AnalysisResult {
  score: number;
  status: 'pass' | 'fail';
}

// ❌ Avoid
const calculateScore = (value: any) => {
  return value * 2;
};

let result: any = { score: 100 };
```

#### Naming Conventions

- **Classes and Interfaces**: PascalCase (`FileScanner`, `AnalysisEngine`)
- **Functions and Variables**: camelCase (`analyzeFile`, `maxScore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DEPTH`, `DEFAULT_TIMEOUT`)
- **Private Methods/Properties**: `_privateName`

```typescript
// ✅ Good
class SecurityEngine {
  private _vulnerabilities: Vulnerability[] = [];

  public analyzeSecurity(codebase: Codebase): SecurityReport {
    // implementation
  }
}

// ❌ Avoid
class security_engine {
  vulnerabilities: any[] = [];

  AnalyzeSecurity(codebase: any) {
    // implementation
  }
}
```

#### Imports and Exports

```typescript
// ✅ Good
import type { AnalysisResult } from './types';
import { FileScanner } from './scanners/file-scanner';

export interface Config {
  depth: 'quick' | 'standard' | 'deep';
}

export const DEFAULT_CONFIG: Config = {
  depth: 'standard',
};

// ❌ Avoid
import * as types from './types';
export default analyzeFile;
```

#### Comments

Only comment code that needs clarification. Prefer self-documenting code:

```typescript
// ✅ Good
const isValidScore = (score: number): boolean => score >= 0 && score <= 100;

// ❌ Avoid
// check if score is between 0 and 100
const isValidScore = (score: number): boolean => score >= 0 && score <= 100;
```

### Error Handling

```typescript
// ✅ Good
try {
  const result = await analyzeFile(filepath);
  return result;
} catch (error) {
  logger.error(`Failed to analyze ${filepath}:`, error);
  throw new AnalysisError(`Cannot analyze file: ${filepath}`, { cause: error });
}

// ❌ Avoid
try {
  const result = await analyzeFile(filepath);
} catch (e) {
  console.log('error');
}
```

---

## PR Process

### Before Submitting

1. **Create a feature branch** from `main`:
   ```bash
   git fetch upstream
   git checkout -b feature/your-feature upstream/main
   ```

2. **Make your changes** following code style guidelines.

3. **Add tests** for new functionality (see [Testing Requirements](#testing-requirements)).

4. **Run the full test suite**:
   ```bash
   npm run typecheck
   npm run test
   npm run build
   ```

5. **Ensure all tests pass** before pushing.

### Submitting Your PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on the [main repository](https://github.com/MaheshDoiphode/reposentry/pulls).

3. **Fill out the PR template** with:
   - Clear description of changes
   - Motivation and context
   - Type of change (feature, fix, refactor, etc.)
   - Related issues (`Fixes #123`, `Refs #456`)
   - Testing performed

4. **Example PR Description**:
   ```markdown
   ## Description
   Adds performance analysis engine to detect anti-patterns and bottlenecks.

   ## Type of Change
   - [x] New feature
   - [ ] Bug fix
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issues
   Fixes #234

   ## Testing
   - Added 12 new test cases
   - All existing tests pass
   - Tested with 5+ real projects

   ## Checklist
   - [x] Code follows style guidelines
   - [x] Tests added/updated
   - [x] Documentation updated
   - [x] No breaking changes
   ```

### PR Review Process

- A maintainer will review your PR within 2-3 business days
- Address feedback and push updates to the same branch
- Re-request review once changes are complete
- PR requires **approval from at least one maintainer** before merging

---

## Testing Requirements

### Writing Tests

All new features **must include tests**. We use [Vitest](https://vitest.dev/) as our test framework.

#### Test File Organization

- Place test files in `tests/` matching the source structure
- Name files with `.test.ts` suffix
- Group related tests with `describe()` blocks

#### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileScanner } from '../src/scanners/file-scanner';

describe('FileScanner', () => {
  let scanner: FileScanner;

  beforeEach(() => {
    scanner = new FileScanner();
  });

  it('should scan TypeScript files correctly', () => {
    const files = scanner.scan('./src', { extensions: ['.ts'] });
    expect(files).toContain('src/index.ts');
  });

  it('should ignore patterns', () => {
    const files = scanner.scan('./src', {
      ignore: ['**/*.test.ts'],
    });
    expect(files).not.toContain('src/index.test.ts');
  });
});
```

#### Coverage Requirements

- **New features**: Minimum 80% code coverage
- **Bug fixes**: Should include test demonstrating the fix
- **Refactoring**: Maintain existing test coverage

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/scanners/file-scanner.test.ts

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### Type Checking

Always run type checking before submitting:

```bash
npm run typecheck
```

No TypeScript errors should remain.

### Build Verification

Ensure the project builds successfully:

```bash
npm run build
```

---

## Code Review Expectations

### As an Author

- Be respectful and open to feedback
- Respond to all comments before request re-review
- Test changes thoroughly before submission
- Keep PRs focused and reasonably sized (under 400 lines)
- Update your branch with the latest `main` if conflicts arise

```bash
git fetch upstream
git rebase upstream/main
git push --force-with-lease origin feature/your-feature
```

### As a Reviewer

We look for:

1. **Functionality** — Does the code solve the problem?
2. **Design** — Is the solution well-architected?
3. **Code Quality** — Does it follow our guidelines?
4. **Tests** — Are changes adequately tested?
5. **Documentation** — Is it clear to future maintainers?
6. **Performance** — Are there obvious inefficiencies?

#### Approval Criteria

A PR is approved when it:

- ✅ Follows all code style guidelines
- ✅ Includes comprehensive tests (>80% coverage)
- ✅ Passes all CI checks (build, tests, type checking)
- ✅ Has descriptive commit messages
- ✅ Includes documentation updates where relevant
- ✅ Resolves related issues cleanly

#### Common Feedback Patterns

```
// Request changes
"This logic would be clearer if extracted into a separate function. 
Could you refactor this?"

// Suggest improvements
"Minor: Consider using a const here instead of let for clarity."

// Ask for clarification
"What's the reason for this approach? Are there alternatives?"

// Approve with comment
"Looks good! One small suggestion: could you add a comment explaining 
the edge case here?"
```

---

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/MaheshDoiphode/reposentry/discussions)
- **Found a bug?** [Report an Issue](https://github.com/MaheshDoiphode/reposentry/issues)
- **Need guidance?** Ask in the PR or discussion thread

---

## Recognition

Contributors will be recognized in:
- PR merged notification
- Project README (for significant contributions)
- Release notes

Thank you for contributing to RepoSentry! 🚀