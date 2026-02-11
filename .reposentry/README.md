---

# RepoSentry

**AI-Powered Codebase Intelligence Platform**

RepoSentry is a comprehensive TypeScript/Node.js tool that analyzes your codebase and generates intelligent reports across documentation, architecture, security, CI/CD, testing, performance, team collaboration, and health metrics. Powered by GitHub Copilot's AI capabilities, it provides actionable insights to improve code quality and project management.

## Features

- 🤖 **AI-Powered Analysis** — Leverages GitHub Copilot for intelligent code analysis and recommendations
- 📚 **Documentation Generation** — Auto-generates README, API docs, SETUP, CONTRIBUTING, CHANGELOG, and FAQ files
- 🏗️ **Architecture Diagrams** — Creates Mermaid diagrams and comprehensive architecture documentation
- 🔒 **Security Audits** — Performs vulnerability scanning, threat modeling, and security assessments
- 🚀 **CI/CD Pipeline Setup** — Generates GitHub Actions workflows, Dockerfiles, and environment configurations
- ✅ **API Test Generation** — Creates test documentation, Postman collections, and test scripts
- ⚡ **Performance Analysis** — Detects anti-patterns and performance bottlenecks
- 👥 **Team Collaboration** — Generates PR templates, issue templates, CODEOWNERS, and onboarding guides
- 💪 **Health Reports** — Calculates aggregate health scores and generates grade badges
- 📊 **Multiple Output Formats** — Supports Markdown, HTML, and JSON output
- ⚙️ **Flexible Configuration** — Cosmiconfig support for `.reposentry` config files
- 🎯 **Granular Control** — Run specific engines or full analysis with depth customization

## Installation

### Prerequisites

- Node.js >= 18
- Git repository (recommended for enhanced analysis)
- GitHub Copilot CLI (optional, for AI-powered insights)

### From npm

```bash
npm install -g reposentry
```

### From Source

```bash
git clone https://github.com/MaheshDoiphode/reposentry.git
cd reposentry
npm install
npm run build
npm start -- analyze
```

### Install GitHub Copilot CLI (Optional)

For full AI-powered analysis capabilities:

```bash
# macOS/Linux
brew install github/gh/copilot

# Windows (via winget)
winget install GitHub.Copilot

# Or via npm
npm install -g @github/copilot
```

## Usage

### Basic Analysis

Run a full analysis on your repository:

```bash
reposentry analyze
```

### Run Specific Engines

Analyze only certain aspects of your codebase:

```bash
# Documentation only
reposentry analyze --docs

# Architecture and CI/CD
reposentry analyze --architecture --ci

# Security audit only
reposentry analyze --security

# Multiple engines
reposentry analyze --docs --api-tests --health
```

### Available Engines

| Flag | Description |
|------|-------------|
| `--docs` | README, API docs, SETUP, CONTRIBUTING, CHANGELOG, FAQ |
| `--architecture` | Mermaid diagrams + ARCHITECTURE.md |
| `--security` | Vulnerability scan, threat model, security report |
| `--ci` | GitHub Actions, Dockerfile, Docker Compose, .env |
| `--api-tests` | API test docs, Postman collection, test scripts |
| `--performance` | Anti-pattern detection + performance audit |
| `--team` | PR templates, issue templates, CODEOWNERS, onboarding |
| `--health` | Aggregate health score + grade badge |

### Advanced Options

```bash
# Set output directory
reposentry analyze -o ./reports

# Specify output format
reposentry analyze --format json

# Set analysis depth
reposentry analyze --depth deep

# Use specific AI model
reposentry analyze --model gpt-4

# Ignore patterns
reposentry analyze --ignore "test/**" "*.spec.ts"

# Overwrite existing output
reposentry analyze --force

# Verbose output
reposentry analyze --verbose

# Disable colored output
reposentry analyze --no-color

# Run all engines explicitly
reposentry analyze --all
```

### Command Examples

```bash
# Full deep analysis with verbose output
reposentry analyze --depth deep --verbose

# Generate docs and CI pipelines, output to custom directory
reposentry analyze --docs --ci -o ./generated

# JSON output for programmatic processing
reposentry analyze --format json > analysis.json

# Security and performance audit with high verbosity
reposentry analyze --security --performance --verbose

# Quick analysis with all engines
reposentry analyze --depth quick --all
```

## Configuration

RepoSentry supports configuration via `cosmiconfig`, allowing you to define settings in multiple formats:

### Configuration File Options

Create one of these in your project root:

- `.reposentryrc.json`
- `.reposentryrc.js`
- `.reposentryrc.cjs`
- `.reposentryrc.yaml`
- `.reposentryrc.yml`
- `reposentry.config.js`
- `reposentry.config.cjs`
- `"reposentry"` field in `package.json`

### Configuration Schema

```typescript
interface RepoSentryConfig {
  // Output directory (default: .reposentry)
  output: string;

  // Output format: markdown | html | json (default: markdown)
  format: 'markdown' | 'html' | 'json';

  // Analysis depth: quick | standard | deep (default: standard)
  depth: 'quick' | 'standard' | 'deep';

  // Engine selection
  engines: {
    docs: boolean;
    architecture: boolean;
    security: boolean;
    ci: boolean;
    apiTests: boolean;
    performance: boolean;
    team: boolean;
    health: boolean;
  };

  // Glob patterns to ignore
  ignore: string[];

  // Security configuration
  security: {
    severityThreshold: 'low' | 'medium' | 'high' | 'critical';
    ignorePatterns: string[];
  };

  // CI/CD configuration
  ci: {
    provider: string;
    nodeVersions: string[];
  };
}
```

### Example Configuration (JSON)

```json
{
  "output": ".reposentry",
  "format": "markdown",
  "depth": "standard",
  "engines": {
    "docs": true,
    "architecture": true,
    "security": true,
    "ci": true,
    "apiTests": true,
    "performance": true,
    "team": true,
    "health": true
  },
  "ignore": [
    "node_modules",
    "dist",
    "*.test.ts",
    "coverage"
  ],
  "security": {
    "severityThreshold": "medium",
    "ignorePatterns": ["*.test.*"]
  },
  "ci": {
    "provider": "github-actions",
    "nodeVersions": ["18", "20"]
  }
}
```

### Example Configuration (YAML)

```yaml
output: .reposentry
format: markdown
depth: standard

engines:
  docs: true
  architecture: true
  security: true
  ci: true
  apiTests: true
  performance: true
  team: true
  health: true

ignore:
  - node_modules
  - dist
  - "*.test.ts"
  - coverage

security:
  severityThreshold: medium
  ignorePatterns:
    - "*.test.*"

ci:
  provider: github-actions
  nodeVersions:
    - "18"
    - "20"
```

### Example Configuration (package.json)

```json
{
  "reposentry": {
    "output": ".reposentry",
    "format": "markdown",
    "depth": "standard",
    "engines": {
      "docs": true,
      "security": true
    }
  }
}
```

### Default Configuration

If no configuration file is found, RepoSentry uses these defaults:

- **Output**: `.reposentry`
- **Format**: `markdown`
- **Depth**: `standard`
- **All Engines**: enabled
- **Ignore patterns**: `node_modules`, `dist`, `*.test.ts`
- **Security threshold**: `medium`
- **CI provider**: `github-actions`
- **Node versions**: `18`, `20`

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Build TypeScript to JavaScript |
| `npm run dev` | Watch mode for development |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run test suite with Vitest |
| `npm start` | Run the CLI |

## Project Structure

```
reposentry/
├── src/
│   ├── cli.ts                 # CLI command definitions
│   ├── config.ts              # Configuration loading
│   ├── index.ts               # Entry point
│   ├── core/                  # Core orchestration logic
│   │   ├── orchestrator.ts    # Main analysis orchestrator
│   │   ├── copilot.ts         # Copilot integration
│   │   ├── output-manager.ts  # Output file handling
│   │   ├── progress.ts        # Progress reporting
│   │   └── prompt-builder.ts  # AI prompt building
│   ├── engines/               # Analysis engines
│   │   ├── docs-engine.ts
│   │   ├── architecture-engine.ts
│   │   ├── security-engine.ts
│   │   ├── ci-engine.ts
│   │   ├── api-test-engine.ts
│   │   ├── performance-engine.ts
│   │   ├── team-engine.ts
│   │   └── health-engine.ts
│   ├── prompts/               # AI prompt templates
│   ├── scanners/              # Code analysis scanners
│   │   ├── file-scanner.ts
│   │   ├── language-detector.ts
│   │   ├── config-detector.ts
│   │   ├── import-parser.ts
│   │   ├── route-detector.ts
│   │   ├── model-detector.ts
│   │   └── git-analyzer.ts
│   ├── server/                # Express API server
│   └── utils/                 # Utility functions
├── tests/                     # Test suite
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## API Routes

RepoSentry includes an optional Express API server for programmatic access:

- `GET /` — Health check
- `GET /view/*filepath` — View analyzed files
- `GET /compare` — Compare analysis results

## Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI argument parsing |
| `cosmiconfig` | Configuration file discovery |
| `chalk` | Terminal colors |
| `boxen` | Terminal boxes |
| `ora` | Loading spinners |
| `simple-git` | Git operations |
| `express` | Web server |
| `glob` | File pattern matching |
| `handlebars` | Template rendering |
| `marked` | Markdown parsing |

## Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. Fork the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/reposentry.git
   cd reposentry
   ```

2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. Make your changes and test
   ```bash
   npm run typecheck
   npm test
   npm run dev
   ```

### Contribution Guidelines

- **Code Style**: Follow the existing TypeScript style and conventions
- **Testing**: Add tests for new features in the `tests/` directory
- **Type Safety**: Maintain TypeScript type safety (run `npm run typecheck`)
- **Commits**: Use clear, descriptive commit messages
- **Pull Requests**: Include a description of changes and motivation

### Areas for Contribution

- New analysis engines for additional frameworks
- Enhanced AI prompt engineering
- Additional output format support (AsciiDoc, reStructuredText, etc.)
- Integration with more CI/CD platforms
- Improved scanner capabilities
- Documentation improvements
- Bug fixes and performance optimizations

### Pull Request Process

1. Update tests and documentation as needed
2. Run the full test suite: `npm test`
3. Ensure type checking passes: `npm run typecheck`
4. Create a clear pull request with motivation and changes
5. Address any review feedback

### Reporting Issues

Found a bug? Please create an issue with:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Your environment (OS, Node.js version)
- Relevant project configuration

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Support

For questions, feature requests, or issues:

- **GitHub Issues**: [github.com/MaheshDoiphode/reposentry/issues](https://github.com/MaheshDoiphode/reposentry/issues)
- **Repository**: [github.com/MaheshDoiphode/reposentry](https://github.com/MaheshDoiphode/reposentry)

## Acknowledgments

- Built with [GitHub Copilot](https://github.com/features/copilot)
- Powered by [Commander.js](https://github.com/tj/commander.js), [Express.js](https://expressjs.com/), and [TypeScript](https://www.typescriptlang.org/)

---

**RepoSentry** — Transform your codebase into an intelligent, well-documented, secure, and maintainable project.