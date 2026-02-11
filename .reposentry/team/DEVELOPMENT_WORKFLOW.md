---

# Development Workflow

## Overview

This document outlines the recommended Git workflow for the RepoSentry project. All contributors must follow these conventions to maintain code quality, consistency, and effective collaboration.

---

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Commit Conventions](#commit-conventions)
3. [Pull Request Process](#pull-request-process)
4. [Code Review Expectations](#code-review-expectations)
5. [Release Process](#release-process)
6. [Hotfix Procedure](#hotfix-procedure)
7. [Development Checklist](#development-checklist)

---

## Branching Strategy

RepoSentry follows a **Git Flow** branching model with the following branch structure:

### Main Branches

#### `main` (Production)
- **Purpose**: Production-ready code
- **Protection**: Required reviews, status checks, and linear history
- **Merges**: Only from `release/*` and `hotfix/*` branches
- **Tagging**: Tagged with semantic version on each release (e.g., `v0.1.0`)

#### `develop` (Integration)
- **Purpose**: Development integration branch
- **Protection**: Required reviews and passing tests
- **Merges**: From feature branches and release branches
- **Stability**: Should always be deployable to a development environment

### Supporting Branches

#### Feature Branches: `feature/*`
- **Naming**: `feature/descriptive-name` or `feature/ISSUE-123-description`
- **Created from**: `develop`
- **Merged back into**: `develop`
- **Convention**:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/add-health-badge
  ```

#### Release Branches: `release/*`
- **Naming**: `release/v0.1.0` (semantic versioning)
- **Created from**: `develop`
- **Merged back into**: `main` and `develop`
- **Purpose**: Prepare production release (version bumps, final fixes)
- **Convention**:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b release/v0.2.0
  # Update version numbers in package.json
  # Commit changes
  git push origin release/v0.2.0
  ```

#### Hotfix Branches: `hotfix/*`
- **Naming**: `hotfix/v0.1.1` or `hotfix/security-patch`
- **Created from**: `main`
- **Merged back into**: `main` and `develop`
- **Purpose**: Critical production bug fixes
- **Convention**:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b hotfix/v0.1.1
  # Make critical fixes
  git push origin hotfix/v0.1.1
  ```

---

## Commit Conventions

### Commit Message Format

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Test additions or fixes
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes

### Scope

Optional but recommended. Refers to the component being modified:

- `cli`: CLI command changes
- `core`: Core orchestrator/analysis logic
- `engines`: Analysis engines (docs, security, etc.)
- `scanners`: File scanning utilities
- `utils`: Helper utilities
- `config`: Configuration handling
- `server`: Web server for preview
- `tests`: Test infrastructure

### Examples

```bash
# Feature
git commit -m "feat(engines): add performance scoring algorithm"

# Bug fix with body
git commit -m "fix(scanners): handle missing git config gracefully

- Added null checks in git analyzer
- Returns default values instead of throwing errors
- Improves robustness for non-git projects"

# Documentation update
git commit -m "docs: update installation instructions for Windows"

# Chore with footer
git commit -m "chore(deps): upgrade TypeScript to 5.9.3

Closes #123"
```

### Commit Best Practices

- **Atomic commits**: Each commit should represent a single logical change
- **Descriptive messages**: Explain the *why*, not just the *what*
- **Tense**: Use imperative mood ("add feature" not "added feature")
- **Length**: Subject line ≤ 50 characters, body wrapped at 72 characters
- **No merge commits**: Use rebase to keep history clean
- **Sign commits** (optional): `git commit -S` for verified commits

---

## Pull Request Process

### Creating a Pull Request

1. **Ensure branch is up-to-date**:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Push to remote**:
   ```bash
   git push origin feature/your-feature
   ```

3. **Create PR via GitHub**:
   - Use the PR template (auto-populated)
   - Link related issues: `Closes #123`
   - Add descriptive title and body
   - Assign reviewers
   - Add labels (e.g., `bug`, `enhancement`, `documentation`)

### PR Title Format

Follow commit message conventions:

```
feat(engines): add machine learning-based code analysis
fix(cli): handle missing copilot executable gracefully
docs: update architecture documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] No new warnings

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No new console errors
```

### PR Requirements Before Merge

- ✅ All status checks pass (tests, type checking, linting)
- ✅ At least one approval from a maintainer
- ✅ No merge conflicts
- ✅ Branch is up-to-date with `develop`
- ✅ Commit history is clean (squash if necessary)

### Merging PRs

- Use **"Squash and merge"** for feature branches (keeps history clean)
- Use **"Create a merge commit"** for release/hotfix branches (preserves context)
- Delete branch after merge
- Update related issues

---

## Code Review Expectations

### Reviewer Responsibilities

**Scope of Review:**
- Code correctness and logic
- Performance and efficiency
- Test coverage (minimum 80%)
- Security vulnerabilities
- Documentation completeness
- Adherence to conventions

**What Reviewers Should Check:**
1. Does the code solve the stated problem?
2. Are there any edge cases not handled?
3. Is the solution performant?
4. Does it follow project conventions?
5. Are tests adequate and passing?
6. Is the documentation clear?
7. Are there any security concerns?

### Reviewer Comments

- Use **"Comment"** for questions or discussions
- Use **"Approve"** when satisfied with changes
- Use **"Request changes"** only for blocking issues
- Be constructive and respectful
- Provide examples or suggestions when possible

### Author Responsibilities

- Respond to all reviewer feedback
- Make requested changes in follow-up commits (don't force push)
- Re-request review after changes
- Clarify intent when feedback is unclear
- Ask for help if stuck

### Review Turnaround

- Aim to review PRs within 24 hours
- Prioritize critical/blocking PRs
- Small PRs (< 400 lines) should be reviewed in < 4 hours
- Large PRs may need additional time

### Review Process

```
1. Author creates PR and requests reviewers
2. Reviewers examine code within 24 hours
3. If approved → Author merges (with maintainer override if needed)
4. If changes requested → Author responds to feedback
5. Repeat until approved or consensus reached
```

---

## Release Process

### Version Numbering

Use **Semantic Versioning** (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes (0.x.x for active development)
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes only

Examples:
- `v0.1.0` → Initial release
- `v0.2.0` → New analysis engine added
- `v0.2.1` → Bug fix
- `v1.0.0` → First stable release

### Release Steps

1. **Create Release Branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v0.2.0
   ```

2. **Update Version Numbers**:
   - Edit `package.json`: `"version": "0.2.0"`
   - Update `CHANGELOG.md` with release notes
   - Commit: `git commit -m "chore(release): bump version to 0.2.0"`

3. **Create Release PR**:
   - Push release branch: `git push origin release/v0.2.0`
   - Create PR to `main` with title: `Release: v0.2.0`
   - Allow review and merge

4. **Merge to Main**:
   ```bash
   git checkout main
   git pull origin main
   git merge release/v0.2.0
   git tag -a v0.2.0 -m "Release version 0.2.0"
   git push origin main --tags
   ```

5. **Merge Back to Develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git merge release/v0.2.0
   git push origin develop
   ```

6. **Delete Release Branch**:
   ```bash
   git branch -d release/v0.2.0
   git push origin --delete release/v0.2.0
   ```

7. **Create GitHub Release**:
   - Go to Releases tab
   - Create release from tag `v0.2.0`
   - Add release notes from `CHANGELOG.md`
   - Mark as latest/pre-release as appropriate

### Release Checklist

- [ ] All feature PRs merged to `develop`
- [ ] All tests passing
- [ ] Type checking passes
- [ ] No outstanding security issues
- [ ] Documentation updated
- [ ] Changelog prepared
- [ ] Version number bumped
- [ ] Git tags created
- [ ] GitHub release published
- [ ] NPM package updated (when applicable)

---

## Hotfix Procedure

### When to Use Hotfix

- Critical production bugs (data loss, security, crashes)
- Cannot wait for normal release cycle
- Affects live/published versions

### Hotfix Steps

1. **Create Hotfix Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/v0.1.1
   ```

2. **Fix the Issue**:
   - Make minimal, focused changes
   - Update version in `package.json`
   - Add test case for the fix
   - Commit: `git commit -m "fix(scope): brief description of critical bug fix"`

3. **Merge to Main**:
   ```bash
   git checkout main
   git pull origin main
   git merge hotfix/v0.1.1
   git tag -a v0.1.1 -m "Hotfix: v0.1.1"
   git push origin main --tags
   ```

4. **Merge to Develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git merge hotfix/v0.1.1
   git push origin develop
   ```

5. **Create GitHub Release**:
   - Title: "Hotfix: v0.1.1"
   - Description: Brief explanation of the critical bug fix
   - Mark as latest (if applicable)

6. **Delete Hotfix Branch**:
   ```bash
   git branch -d hotfix/v0.1.1
   git push origin --delete hotfix/v0.1.1
   ```

### Hotfix Checklist

- [ ] Bug reproduced and verified
- [ ] Minimal fix implemented
- [ ] New test case added
- [ ] Version bumped (patch only)
- [ ] Merged to both `main` and `develop`
- [ ] Tag created
- [ ] GitHub release published
- [ ] Documentation/changelog updated

---

## Development Checklist

### Before Starting Development

- [ ] Create or assign issue (document what you're working on)
- [ ] Pull latest from `develop`
- [ ] Create feature branch with descriptive name
- [ ] Set up development environment (`npm install`)

### During Development

- [ ] Write tests alongside code (TDD preferred)
- [ ] Follow commit message conventions
- [ ] Keep commits atomic and logical
- [ ] Use `npm run typecheck` regularly
- [ ] Use `npm run test` to validate changes
- [ ] Reference related issues in commits

### Before Creating PR

- [ ] Rebase on latest `develop`: `git rebase origin/develop`
- [ ] Ensure all tests pass: `npm run test`
- [ ] Ensure type safety: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Review your own changes first
- [ ] Update documentation if needed
- [ ] Write clear PR description

### Code Quality Standards

- **Test Coverage**: Minimum 80% for new code
- **Type Safety**: No `any` types without justification
- **Performance**: No unnecessary loops or blocking operations
- **Security**: No hardcoded secrets, SQL injection risks, or XSS vulnerabilities
- **Documentation**: All public APIs documented with JSDoc comments

### Common Commands Reference

```bash
# Start feature
git checkout develop && git pull origin develop
git checkout -b feature/your-feature

# Build and test
npm run build
npm run test
npm run typecheck

# Commit changes
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push origin feature/your-feature

# Keep branch updated
git fetch origin
git rebase origin/develop

# Clean up
git branch -d feature/your-feature
```

---

## Enforcement

### Automated Checks

- **GitHub Actions**: Runs tests and type checking on all PRs
- **Status Checks**: Must pass before merge
- **Branch Protection**: Enforces review requirements
- **Commit Signatures**: Recommended for maintainers

### Manual Enforcement

- Code review by qualified reviewers
- Architecture decisions verified
- Release process followed
- Security guidelines adhered to

---

## Questions & Support

For questions about this workflow:
- Open a discussion in GitHub Discussions
- Ask in PR comments
- Reference this document in issues

**Happy coding! 🚀**