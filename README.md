# RepoSentry 🚀

**AI-Powered Codebase Intelligence Platform**

RepoSentry is an intelligent tool that automatically analyzes your repository and generates comprehensive documentation, architecture diagrams, security audits, CI/CD pipelines, performance reports, and more. Built with TypeScript and powered by GitHub Copilot, it transforms your codebase into actionable insights.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Usage](#usage)
  - [Commands](#commands)
  - [Options](#options)
  - [Configuration](#configuration)
- [Output Formats](#output-formats)
- [Analysis Engines](#analysis-engines)
- [Examples](#examples)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 📚 **Documentation Suite**
- Auto-generated API documentation
- README generation
- Code examples extraction
- Architecture documentation

### 🏗️ **Architecture Intelligence**
- Dependency graph visualization (Mermaid diagrams)
- Component structure analysis
- Module relationship mapping
- Technology stack detection

### 🔒 **Security Audit**
- Vulnerability scanning
- Threat modeling
- Security best practices recommendations
- CVSS severity assessment

### 🔄 **CI/CD Pipeline Generation**
- GitHub Actions workflow creation
- Multi-version testing setup
- Automated deployment configuration
- Build optimization recommendations

### 🧪 **API Testing Suite**
- Test collection generation
- HTTP request templates
- Mock scenario creation
- Postman/REST client compatibility

### ⚡ **Performance Analysis**
- Anti-pattern detection
- Bottleneck identification
- Resource usage optimization tips
- Load handling recommendations

### 👥 **Team Collaboration Templates**
- Code review guidelines
- Contributing guidelines
- Issue templates
- Pull request templates

### 📊 **Health Reports & Grades**
- Overall codebase health score
- Category-based grading
- Trend analysis
- Actionable improvement roadmap

---

## Getting Started

### Installation

#### From Source (recommended)
```bash
git clone https://github.com/MaheshDoiphode/reposentry.git
cd reposentry
npm install
npm run build
npm link
```

You can now run:
```bash
reposentry --help
```

#### From npm (optional)
If/when published to npm, you can install globally:
```bash
npm install -g reposentry
```

#### Requirements
- **Node.js** ≥ 18
- **Git** repository (RepoSentry analyzes Git projects)
- **GitHub Copilot CLI** (optional but recommended for full AI analysis)

#### Installing GitHub Copilot CLI

```bash
# macOS / Linux
npm install -g @github/copilot

# Windows (using winget)
winget install GitHub.Copilot
```

### Quick Start

Navigate to your repository and run:

```bash
reposentry analyze
```

This generates a complete analysis in the `.reposentry/` directory with:
- `README.md`, `API.md`, `SETUP.md`, `CONTRIBUTING.md` - Documentation suite
- `ARCHITECTURE.md` + diagrams in `diagrams/` - Architecture diagrams
- `security/SECURITY_AUDIT.md` + `security/VULNERABILITY_REPORT.md` - Security audit
- `infrastructure/` - CI/CD and infrastructure suggestions
- `testing/api-collection.json` + `testing/API_TESTS.md` - API testing assets
- `HEALTH_REPORT.md` + `analysis.json` - Health score + machine-readable summary
- `API_TESTS.json` - Test collection
- `PERFORMANCE_REPORT.md` - Performance insights
- `TEAM_GUIDELINES.md` - Collaboration templates
- `HEALTH_REPORT.md` - Overall assessment
- `analysis.json` - Raw analysis data

---

## Usage

### Commands

#### `reposentry analyze` — Generate Complete Analysis

Analyze your repository and generate all reports.

```bash
reposentry analyze [options]
```

**Options:**
```
-o, --output <dir>              Output directory (default: .reposentry)
-f, --format <type>             Output format: markdown | html | json (default: markdown)
--depth <level>                 Analysis depth: quick | standard | deep (default: standard)
--ignore <patterns...>          Glob patterns to ignore
--force                         Overwrite existing output
-v, --verbose                   Show detailed analysis progress
--docs                          Documentation suite only
--architecture                  Architecture diagrams only
--security                      Security audit only
--ci                           Generate CI/CD pipeline only
--api-tests                    Generate API test collection only
--performance                  Performance analysis only
--team                         Collaboration templates only
--health                       Health report only
--no-color                     Disable colored output
```

#### `reposentry serve` — Preview Reports

View generated reports in your browser.

```bash
reposentry serve [options]
```

**Options:**
```
--port <port>                   Port to listen on (default: 3000)
-o, --output <dir>              Output directory to serve (default: .reposentry)
```

#### `reposentry badge` — Generate Health Badge

Create a shields.io badge for your README.

```bash
reposentry badge [options]
```

**Options:**
```
-o, --output <dir>              Output directory (default: .reposentry)
```

---

### Options Explained

#### `--depth <level>`

Controls the thoroughness of analysis:

- **`quick`** - Fast scan (2-5 min) - Basic scanning, suitable for CI/CD
- **`standard`** - Balanced scan (5-15 min) - Recommended for most uses
- **`deep`** - Comprehensive (15-30+ min) - Full analysis with all details

#### `--format <type>`

Output format for reports:

- **`markdown`** - Human-readable, Git-friendly (default)
- **`html`** - Interactive reports for browser viewing
- **`json`** - Machine-readable for automation/integration

#### `--ignore <patterns...>`

Glob patterns to skip during analysis:

```bash
reposentry analyze --ignore "node_modules/**" "dist/**" "*.test.ts"
```

---

### Configuration

RepoSentry supports configuration via `reposentry.config.js`, `reposentry.config.json`, or a `reposentry` field in `package.json`.

#### Example: `reposentry.config.js`

```javascript
export default {
  output: '.reposentry',
  depth: 'standard',
  engines: {
    docs: true,
    architecture: true,
    security: true,
    ci: true,
    apiTests: true,
    performance: true,
    team: true,
  },
  ignore: ['node_modules', 'dist', '*.test.ts', 'build/**'],
  security: {
    severityThreshold: 'medium',
    ignorePatterns: ['*.test.*', 'node_modules/**'],
  },
  ci: {
    provider: 'github-actions',
    nodeVersions: ['18', '20', '22'],
  },
};
```

#### Example: `package.json`

```json
{
  "reposentry": {
    "output": ".reposentry",
    "depth": "standard",
    "engines": {
      "security": true,
      "docs": true
    }
  }
}
```

---

## Output Formats

### Markdown (Default)

Perfect for Git repositories and documentation sites.

```bash
reposentry analyze --format markdown
```

Generates human-readable reports with:
- Formatted code blocks
- Embedded diagrams (Mermaid)
- Clickable links
- Table of contents

### HTML

Exports a static HTML mirror of the generated reports under `.reposentry/html/`.

```bash
reposentry analyze --format html
```

Includes:
- A simple `index.html` file list
- Mermaid diagram rendering for `.mmd` + mermaid fences

### JSON

Machine-readable export for automation.

```bash
reposentry analyze --format json
```

Contains:
- `.reposentry/bundle.json` with all generated files embedded (path + content)
- `.reposentry/analysis.json` with scores/grades (via the health engine)

---

## Analysis Engines

RepoSentry includes specialized engines for different aspects:

| Engine | Purpose | Output |
|--------|---------|--------|
| **docs-engine** | Generate documentation suite | `README.md`, `API.md`, `SETUP.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `FAQ.md` |
| **architecture-engine** | Visualize system design | `ARCHITECTURE.md` + `diagrams/*.mmd` |
| **security-engine** | Security scanning & threat modeling | `security/SECURITY_AUDIT.md`, `security/VULNERABILITY_REPORT.md`, `security/threat-model.mmd`, ... |
| **ci-engine** | CI/CD + infra suggestions | `infrastructure/ci.yml`, `infrastructure/Dockerfile.suggested`, ... |
| **api-test-engine** | Create test collections | `testing/API_TESTS.md`, `testing/api-collection.json`, `testing/api-tests.sh`, ... |
| **performance-engine** | Detect anti-patterns | `performance/PERFORMANCE_AUDIT.md` + `performance/performance-score.json` |
| **team-engine** | Collaboration templates | `team/PR_TEMPLATE.md`, `team/issue-templates/*`, `team/CODEOWNERS`, ... |
| **health-engine** | Overall health assessment | `HEALTH_REPORT.md` + `analysis.json` |

Run specific engines:

```bash
# Only documentation
reposentry analyze --docs

# Documentation + Architecture
reposentry analyze --docs --architecture

# Override config and run everything
reposentry analyze --all
```

---

## Examples

### Example 1: Full Analysis with Default Settings

```bash
cd my-app
reposentry analyze
```

Generates all reports in `.reposentry/` directory.

### Example 2: Security-Focused Analysis

```bash
reposentry analyze --security --depth deep --output ./security-reports
```

Generates comprehensive security audit.

### Example 3: CI/CD Generation for Node.js Project

```bash
reposentry analyze --ci --force
```

Creates GitHub Actions workflow with Node.js 18, 20 testing.

### Example 4: Quick Analysis with Custom Ignores

```bash
reposentry analyze \
  --depth quick \
  --ignore "node_modules/**" "dist/**" "*.test.ts" \
  --output ./reports
```

Completes in 2-5 minutes, ignoring build artifacts.

### Example 5: Generate Health Badge

```bash
reposentry analyze
reposentry badge
```

Output:
```markdown
[![RepoSentry Score: A (92/100)](https://img.shields.io/badge/RepoSentry-A%20(92%25)-brightgreen)](./HEALTH_REPORT.md)
```

Add to your `README.md`:

```markdown
## Project Health

[![RepoSentry Score: A (92/100)](https://img.shields.io/badge/RepoSentry-A%20(92%25)-brightgreen)](./HEALTH_REPORT.md)

[View Detailed Health Report](./HEALTH_REPORT.md)
```

### Example 6: Serve Reports Locally

```bash
reposentry analyze
reposentry serve --port 8080
```

Then visit `http://localhost:8080` to browse interactive reports.

### Example 7: JSON Output for CI/CD Integration

```bash
reposentry analyze --format json --output ./reports

# Use in scripts
cat ./reports/analysis.json | jq '.overallScore'
```

---

## Requirements

- **Node.js** ≥ 18 (uses ES modules)
- **Git** (repository must be initialized)
- **GitHub Copilot CLI** (recommended, optional)
  - Enables AI-powered analysis
  - Fallback to placeholder results if unavailable

### Dependencies

RepoSentry uses:
- **commander** - CLI argument parsing
- **chalk** - Terminal colors
- **boxen** - Styled console boxes
- **glob** - File pattern matching
- **simple-git** - Git operations
- **marked** - Markdown parsing
- **handlebars** - Template rendering
- **express** - Web server for preview
- **cosmiconfig** - Configuration file discovery
- **ora** - Loading spinners

---

## Development

### Setup

```bash
# Install dependencies
npm install

# Build (TypeScript → JavaScript)
npm run build

# Watch mode
npm run dev

# Type checking
npm run typecheck

# Run tests
npm run test
```

### Project Structure

```
src/
├── cli.ts                    # Command-line interface
├── config.ts                 # Configuration loading
├── core/                     # Core analysis logic
│   ├── orchestrator.ts       # Main analysis flow
│   ├── copilot.ts           # Copilot integration
│   ├── prompt-builder.ts    # Prompt generation
│   ├── output-manager.ts    # File output handling
│   └── progress.ts          # Progress tracking
├── engines/                  # Specialized analysis engines
│   ├── docs-engine.ts
│   ├── architecture-engine.ts
│   ├── security-engine.ts
│   ├── ci-engine.ts
│   ├── api-test-engine.ts
│   ├── performance-engine.ts
│   ├── team-engine.ts
│   └── health-engine.ts
├── scanners/                 # Codebase scanning utilities
│   ├── file-scanner.ts
│   ├── language-detector.ts
│   ├── import-parser.ts
│   ├── route-detector.ts
│   ├── model-detector.ts
│   └── git-analyzer.ts
├── prompts/                  # AI prompt templates
├── utils/                    # Helper functions
└── server/                   # Web server for preview
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License © 2024 RepoSentry Contributors

---

## Support

- 📚 [Documentation](./DOCUMENTATION.md)
- 🐛 [Report Issues](https://github.com/MaheshDoiphode/reposentry/issues)
- 💬 [GitHub Discussions](https://github.com/MaheshDoiphode/reposentry/discussions)

---

## Roadmap

- [ ] Web UI for configuration
- [ ] Custom prompt templates
- [ ] Multi-language support
- [ ] IDE extensions (VS Code)
- [ ] GitHub App integration
- [ ] Cost estimation engine
- [ ] Real-time collaboration analysis
- [ ] Machine learning-based insights

---

**Happy analyzing! 🎯**
