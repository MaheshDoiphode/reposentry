# CODE_REVIEW_CHECKLIST.md

## Code Review Checklist for RepoSentry

A comprehensive checklist for reviewing pull requests to the RepoSentry project (AI-powered codebase intelligence platform built with TypeScript and Express.js).

---

## 📋 General Code Quality

- [ ] Code follows project naming conventions (camelCase for variables/functions, PascalCase for classes)
- [ ] Comments are clear, concise, and explain the "why" not the "what"
- [ ] Dead code, console.logs, and debugging statements are removed
- [ ] Code is DRY (Don't Repeat Yourself) - no unnecessary duplication
- [ ] Functions are focused and handle a single responsibility
- [ ] Complexity is reasonable (functions under 50 lines when possible)
- [ ] Import statements are organized and unused imports are removed
- [ ] Files follow the established project structure (src/cli.ts, src/core/, src/engines/, etc.)

---

## 🔒 Type Safety

- [ ] All variables have explicit type annotations where necessary
- [ ] Function parameters have types defined
- [ ] Function return types are explicitly specified
- [ ] No `any` types are used unless absolutely justified with a comment
- [ ] No `as` type assertions without proper justification
- [ ] Generic types are used appropriately (T, U, etc. in reusable functions)
- [ ] TypeScript strict mode rules are followed (no implicit `any`, strict null checks)
- [ ] `tsconfig.json` requirements are met (`strict: true`)
- [ ] Interfaces are used instead of type aliases where appropriate for object contracts

---

## ⚠️ Error Handling

- [ ] All async/await operations have try-catch blocks
- [ ] Promise rejection handling is present (no unhandled promise rejections)
- [ ] Errors are logged with appropriate context (see `src/utils/logger.ts`)
- [ ] Custom error classes extend Error appropriately
- [ ] Error messages are descriptive and actionable
- [ ] User-facing errors don't expose sensitive information
- [ ] Null/undefined checks are performed before accessing properties
- [ ] Optional chaining (`?.`) and nullish coalescing (`??`) are used appropriately
- [ ] CLI errors exit with appropriate exit codes

---

## 🧪 Testing

- [ ] New features include corresponding unit tests
- [ ] Tests are located in `tests/` directory with matching file structure
- [ ] Test descriptions clearly state what is being tested
- [ ] Tests cover both happy path and edge cases
- [ ] Mock data is properly isolated (not shared between tests)
- [ ] Vitest configuration (`vitest.config.ts`) requirements are met
- [ ] No skipped tests (`.skip`, `.only`) in committed code
- [ ] Test coverage for critical paths (engines, scanners, core logic)
- [ ] Integration tests for orchestrator flow are included if applicable
- [ ] Tests pass locally before submitting PR

---

## 🔐 Security

- [ ] No hardcoded secrets, API keys, or credentials
- [ ] File operations use proper path handling (relative paths, no path traversal)
- [ ] Shell commands are properly escaped (if using git operations)
- [ ] Dependencies match `package.json` versions - no version drift
- [ ] No unsafe use of `eval()` or `Function()` constructor
- [ ] Sensitive data (tokens, passwords) is not logged
- [ ] User input is validated before processing
- [ ] Git operations use `simple-git` library safely
- [ ] File globbing uses controlled patterns to avoid unintended matches
- [ ] Permission checks for file read/write operations are appropriate

---

## ⚡ Performance

- [ ] No blocking operations in hot paths
- [ ] File I/O operations use appropriate buffering (streaming for large files)
- [ ] Glob patterns in file scanning are optimized (avoid overly broad patterns)
- [ ] Promise operations are not unnecessarily sequential when parallel would be better
- [ ] Large datasets are processed with pagination or streaming when applicable
- [ ] Caching is used for expensive operations (config detection, language detection)
- [ ] No N+1 query patterns in loops
- [ ] Memory usage is reasonable (no unbounded arrays/objects)
- [ ] Loading spinners (ora) don't block operations
- [ ] Analysis depth settings are respected for performance trade-offs

---

## 📱 Accessibility (Frontend)

- [ ] N/A for backend CLI/core library code
- [ ] If web server (`src/server/index.ts`) is used: alt text for diagrams/images
- [ ] If Express routes serve HTML: semantic HTML structure is used
- [ ] ARIA labels are present for dynamic content
- [ ] Keyboard navigation is supported for interactive elements
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Terminal output uses colors responsibly (respects `--no-color` flag)

---

## 🗄️ Database / Data Persistence

- [ ] N/A - RepoSentry does not use databases
- [ ] File storage operations use proper error handling
- [ ] Output directory creation handles existing files appropriately
- [ ] Config file detection follows `cosmiconfig` patterns correctly
- [ ] Data serialization (JSON) handles edge cases (circular references, special characters)
- [ ] Backup/rollback mechanisms if overwriting existing analysis files

---

## 📚 Documentation

- [ ] Public APIs have JSDoc comments with parameter and return types
- [ ] Complex algorithms are explained with comments
- [ ] README.md is updated if user-facing behavior changes
- [ ] New CLI flags are documented in `--help` output
- [ ] Configuration options are documented in `reposentry.config.js` examples
- [ ] New analysis engines have descriptions in the engines table
- [ ] Example commands are provided for new features
- [ ] Internal documentation (`internal-docs/`) is updated if architecture changes
- [ ] Type definitions are clear (interfaces have documentation)
- [ ] CONTRIBUTING.md guidelines are followed for commit messages

---

## 🔧 Engine-Specific Checks

### If modifying `engines/`

- [ ] Engine follows the established pattern (extends base or implements interface)
- [ ] Prompt templates in `src/prompts/` are clear and focused
- [ ] Output structure matches what the engine produces
- [ ] Integration with `orchestrator.ts` is correct
- [ ] Engine respects analysis `--depth` parameter
- [ ] Output files are generated with proper formatting (Markdown, JSON, etc.)

### If modifying `scanners/`

- [ ] Scanner handles large codebases efficiently (respects globs, ignores node_modules)
- [ ] File parsing doesn't corrupt binary files or non-text files
- [ ] Language detection is accurate (check `language-detector.ts`)
- [ ] Parser handles edge cases (empty files, malformed syntax, etc.)
- [ ] Results are cached appropriately to avoid re-scanning

---

## 🎛️ CLI & Configuration

- [ ] New commands follow `commander` CLI framework patterns
- [ ] Help text is clear and includes examples
- [ ] Arguments and options are validated
- [ ] Default values are sensible
- [ ] Config file loading respects `cosmiconfig` discovery pattern
- [ ] Flags are consistent with existing conventions (e.g., `--output`, `--format`)
- [ ] Verbosity levels (`--verbose`) are respected throughout code

---

## 🚀 Build & Dependencies

- [ ] `npm run build` completes without errors
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes all tests
- [ ] No new dependencies added without justification
- [ ] Version constraints are reasonable (avoid overly specific versions)
- [ ] `npm` scripts in `package.json` are documented
- [ ] Build output in `dist/` is gitignored properly
- [ ] Exports in `package.json` match actual distribution

---

## 🔄 Git & PR Standards

- [ ] Commit messages are clear and descriptive
- [ ] No merge commits (rebase when pulling latest)
- [ ] PR description explains the change and rationale
- [ ] Related issues are referenced in PR description
- [ ] No unnecessary files are committed (node_modules, dist, .DS_Store, etc.)
- [ ] Changelog or version bump if applicable

---

## 🧠 Architecture & Design

- [ ] Changes align with RepoSentry's architecture
- [ ] Orchestrator pattern is used for managing engine flow
- [ ] Separation of concerns is maintained (scanners, engines, outputs)
- [ ] Code reuse is maximized through utilities (`src/utils/`)
- [ ] Configuration is centralized (`src/config.ts`)
- [ ] No circular dependencies between modules
- [ ] Output manager is used for file writing (not direct fs writes)
- [ ] Progress tracking is integrated when appropriate

---

## ✅ Final Checks

- [ ] All linting warnings are addressed
- [ ] PR is rebased on latest main
- [ ] Sensitive information is not exposed in code or comments
- [ ] Changes don't break existing analysis reports
- [ ] Feature flags are removed before merge
- [ ] Performance impact is minimal for standard analysis depths
- [ ] Node.js version requirement (≥18) is respected

---

**Last Updated:** 2026-02-09