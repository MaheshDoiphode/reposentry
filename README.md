<div align="center">

# 🛡️ RepoSentry

**AI-Powered Codebase Intelligence Platform**

Analyze any project. Generate docs, security audits, CI/CD pipelines, architecture diagrams, and more — powered by GitHub Copilot.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue)](https://www.typescriptlang.org)

</div>

---

## What It Does

Point RepoSentry at any codebase and it generates a full intelligence report:

| Engine | What you get |
|--------|-------------|
| 📝 **Documentation** | README, API docs, Setup guide, Contributing guide, Changelog, FAQ |
| 🏗️ **Architecture** | Mermaid diagrams, dependency graphs, component maps |
| 🔒 **Security** | Vulnerability scan, threat model, CVSS severity |
| 🔄 **CI/CD** | Pipeline config (GitHub Actions, GitLab, CircleCI, Jenkins, Travis, Azure) |
| 🧪 **Testing** | API test collection, HTTP templates, Postman export |
| ⚡ **Performance** | Anti-pattern detection, bottleneck analysis |
| 🤝 **Collaboration** | PR templates, issue templates, CODEOWNERS, onboarding *(git repos only)* |
| ❤️ **Health Report** | Weighted score, letter grade, trend tracking |

---

## Quick Start

```bash
# Install from source
git clone https://github.com/MaheshDoiphode/reposentry.git
cd reposentry
npm install && npm run build && npm link

# Navigate to any project and run
cd your-project
reposentry analyze
```

> **Requires:** Node.js ≥ 18 • [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) (requires active Copilot subscription)
>
> First time? Run `copilot` once to authenticate via `/login`, or set `GH_TOKEN` with a [PAT](https://github.com/settings/personal-access-tokens/new) that has "Copilot Requests" permission.

---

## Commands

```bash
reposentry                  # Interactive mode — pick what to do
reposentry analyze          # Full analysis → .reposentry/
reposentry fix              # Auto-fix detected issues (missing LICENSE, CI, etc.)
reposentry compare          # Compare scores across analysis runs
reposentry serve            # Preview reports at localhost:3000
reposentry badge            # Generate shields.io health badge
reposentry init             # Interactive setup wizard
```

### Key Flags

```bash
reposentry analyze --docs --security  # Run specific engines only
reposentry analyze --all              # Override config, run everything
reposentry analyze --depth deep       # Thorough analysis
reposentry analyze --format json      # Machine-readable output
reposentry analyze --model <model>    # Pick Copilot model
reposentry analyze --force            # Overwrite existing output
reposentry analyze --ignore "dist/**" # Skip patterns
```

---

## In Action

### Full Analysis

Run all engines — docs, architecture, security, CI/CD, testing, performance, collaboration, and health scoring:

> 💡 Check out [`.reposentry/`](.reposentry/) in this repo — we ran RepoSentry on itself so you can see real output.

<div align="center">
<img src="public/full-analysis.png" alt="RepoSentry full analysis" width="700">
</div>

### Auto-Fix Issues

Scan for missing files and let Copilot fix them:

<div align="center">
<img src="public/fix-issue-automatically.png" alt="RepoSentry fix — issue detection" width="700">
</div>

<div align="center">
<img src="public/fix-issue-automatically-2.png" alt="RepoSentry fix — Copilot creating files" width="700">
</div>

---

## Configuration

Optional — works out of the box. Create `reposentry.config.js` or add to `package.json`:

```js
// reposentry.config.js
export default {
  output: '.reposentry',
  depth: 'standard',
  engines: { docs: true, security: true, ci: true },
  ignore: ['node_modules', 'dist'],
};
```

---

## Score History & Comparison

Every `reposentry analyze` saves scores to a persistent history. Run `reposentry compare` to see how your project has improved over time — per-category breakdown with trend arrows.

Preview reports in the browser with `reposentry serve`, including an interactive score comparison view.

---

## Requirements

- **Node.js** ≥ 18
- **GitHub Copilot CLI** — requires an active [Copilot subscription](https://github.com/features/copilot/plans)
  - Install: `npm i -g @github/copilot` or `winget install GitHub.Copilot` or `brew install copilot-cli`
  - Auth: run `copilot` and use `/login`, or set `GH_TOKEN`/`GITHUB_TOKEN` env var
- Works on **git repos** and **non-git projects** (collaboration analysis requires git)

---

## Development

```bash
npm install        # Install dependencies
npm run build      # Build
npm run dev        # Watch mode
npm test           # Run tests (vitest)
```

---

## License

MIT © RepoSentry Contributors
