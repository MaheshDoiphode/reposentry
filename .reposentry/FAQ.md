# FAQ.md

## Frequently Asked Questions (FAQ)

### Installation & Setup

#### Q: Do I need GitHub Copilot CLI to use RepoSentry?
**A:** No, but it's highly recommended. GitHub Copilot CLI enables AI-powered analysis with real insights. Without it, RepoSentry will generate placeholder results. To install:
- **macOS/Linux:** `npm install -g @github/copilot`
- **Windows:** `winget install GitHub.Copilot`

#### Q: What are the minimum system requirements?
**A:** You need Node.js ≥ 18 and a Git repository initialized in your project directory. RepoSentry analyzes Git history and structure as part of its analysis.

#### Q: How do I install RepoSentry from source?
**A:** 
```bash
git clone https://github.com/MaheshDoiphode/reposentry.git
cd reposentry
npm install
npm run build
npm link
```
Then use `reposentry` command from any terminal.

#### Q: Can I install RepoSentry globally from npm?
**A:** RepoSentry is currently private (`"private": true` in package.json). Once published to npm, you'll be able to install with `npm install -g reposentry`.

---

### Usage & Commands

#### Q: What does the `analyze` command do?
**A:** It's the main command that analyzes your repository and generates comprehensive reports across 8 different engines (docs, architecture, security, CI/CD, API testing, performance, team, and health). By default, it outputs results to `.reposentry/` directory.

#### Q: How do I run analysis on specific engines only?
**A:** Use engine flags:
```bash
reposentry analyze --docs --security          # Only docs and security
reposentry analyze --ci --api-tests           # Only CI/CD and API tests
reposentry analyze --health                    # Only health report
```

#### Q: What is the `serve` command for?
**A:** It starts a local web server (default port 3000) to preview your generated reports in a browser with a polished UI, Mermaid diagram rendering, and file navigation.

#### Q: What does the `badge` command do?
**A:** It generates a shields.io badge showing your project's health score that you can embed in your README.md:
```markdown
[![RepoSentry Score: A (92/100)](https://img.shields.io/badge/RepoSentry-A%20(92%25)-brightgreen)](./HEALTH_REPORT.md)
```

---

### Analysis Depth & Configuration

#### Q: What's the difference between `quick`, `standard`, and `deep` analysis?
**A:** 
- **quick** (2-5 min): Basic scanning, good for CI/CD pipelines
- **standard** (5-15 min): Balanced analysis, recommended for most users
- **deep** (15-30+ min): Comprehensive analysis with all details and patterns

#### Q: How do I configure RepoSentry settings?
**A:** RepoSentry supports three configuration methods (in order of priority):
1. **reposentry.config.js** (ESM module)
2. **reposentry.config.json** (JSON file)
3. **package.json** with `"reposentry"` field

Example config:
```javascript
export default {
  output: '.reposentry',
  depth: 'standard',
  format: 'markdown',
  engines: { docs: true, security: true },
  ignore: ['node_modules', 'dist'],
  security: { severityThreshold: 'medium' },
  ci: { provider: 'github-actions', nodeVersions: ['18', '20'] }
};
```

#### Q: What patterns can I ignore during analysis?
**A:** Use glob patterns in the `--ignore` flag or config:
```bash
reposentry analyze --ignore "node_modules/**" "dist/**" "*.test.ts"
```
Default ignores: `node_modules`, `dist`, `*.test.ts`

---

### Output Formats

#### Q: What output formats does RepoSentry support?
**A:** Three formats:
- **markdown** (default): Human-readable, Git-friendly with embedded Mermaid diagrams
- **html**: Static HTML files for browser viewing with interactive Mermaid rendering
- **json**: Machine-readable output for CI/CD automation and integration

#### Q: Where are the generated files stored?
**A:** By default in `.reposentry/` directory with structure:
```
.reposentry/
├── README.md, API.md, SETUP.md, CONTRIBUTING.md, CHANGELOG.md, FAQ.md
├── ARCHITECTURE.md + diagrams/
├── security/ (SECURITY_AUDIT.md, VULNERABILITY_REPORT.md, threat-model.mmd)
├── infrastructure/ (CI/CD suggestions, Dockerfile)
├── testing/ (API_TESTS.md, api-collection.json)
├── PERFORMANCE_REPORT.md
├── TEAM_GUIDELINES.md
├── HEALTH_REPORT.md
└── analysis.json
```

---

### Features & Engines

#### Q: What documentation does RepoSentry generate?
**A:** The docs engine creates:
- **README.md**: Project overview and getting started
- **API.md**: API endpoints and documentation
- **SETUP.md**: Installation and configuration guide
- **CONTRIBUTING.md**: Development setup and contribution guidelines
- **CHANGELOG.md**: Version history and changes
- **FAQ.md**: Frequently asked questions

#### Q: What does the architecture engine produce?
**A:** Generates `ARCHITECTURE.md` with Mermaid diagrams showing:
- Dependency graphs
- Component structure analysis
- Module relationship mapping
- Technology stack visualization

#### Q: How does the security engine work?
**A:** Scans for:
- Vulnerabilities and threats
- Security best practices violations
- CVSS severity assessment
- Threat models and recommendations

#### Q: What API tests does the engine generate?
**A:** Creates:
- HTTP request templates
- Postman/REST client collections (JSON format)
- Mock scenarios and test scripts
- API testing documentation

#### Q: How is the health score calculated?
**A:** The health engine scores your project across multiple categories:
- Documentation completeness
- Architecture clarity
- Security posture
- CI/CD coverage
- API testability
- Performance optimization
- Team collaboration readiness
Each contributes to an overall A-F grade.

---

### Troubleshooting

#### Q: I'm getting "Not a Git repository" warning. Is that a problem?
**A:** No, it's just a warning. RepoSentry will continue analysis, but git-specific features (commit history, tags, blame) will be limited.

#### Q: Why are my results showing placeholders without Copilot?
**A:** RepoSentry requires GitHub Copilot CLI for AI-powered analysis. Install it:
```bash
npm install -g @github/copilot    # macOS/Linux
winget install GitHub.Copilot     # Windows
```

#### Q: Can I overwrite existing output?
**A:** Yes, use the `--force` flag: `reposentry analyze --force`

#### Q: How do I see verbose debug output?
**A:** Use the `-v` or `--verbose` flag: `reposentry analyze -v`

#### Q: How do I disable colored output?
**A:** Use the `--no-color` flag: `reposentry analyze --no-color`

---

### Advanced Usage

#### Q: How do I specify a custom AI model?
**A:** Use the `--model` flag:
```bash
reposentry analyze --model claude-opus-4.6
```
Available models depend on your Copilot backend (see with `copilot --help` or `gh copilot --help`).

#### Q: Can I use RepoSentry in CI/CD pipelines?
**A:** Yes! Use `--format json` and `--depth quick` for faster analysis:
```bash
reposentry analyze --depth quick --format json --output ./reports
cat ./reports/analysis.json | jq '.overallScore'
```

#### Q: How do I generate only the health badge?
**A:** Run analysis first, then generate the badge:
```bash
reposentry analyze
reposentry badge --output .reposentry
```

#### Q: Can I customize prompts for analysis?
**A:** The project is designed with template-based prompts. For now, you can't customize them directly, but this is on the roadmap under "Custom prompt templates".

---

### Development

#### Q: How do I run tests?
**A:** Use `npm test` to run the Vitest test suite. Tests cover core utilities, scanners, and output handling.

#### Q: How do I run type checking?
**A:** Use `npm run typecheck` to verify TypeScript types without building.

#### Q: What is the development setup?
**A:** 
1. `npm install` - Install dependencies
2. `npm run dev` - Start watch mode for development
3. `npm run build` - Build TypeScript to JavaScript
4. `npm test` - Run tests
5. `npm link` - Install locally for testing commands

#### Q: What's the project structure?
**A:**
- **src/cli.ts**: Command-line interface definition
- **src/core/**: Core analysis orchestration, Copilot integration, prompt building
- **src/engines/**: 8 specialized analysis engines
- **src/scanners/**: Codebase analysis utilities (language detection, route detection, etc.)
- **src/prompts/**: AI prompt templates for each engine
- **src/utils/**: Helper functions (git, logger, scoring, file ops)
- **src/server/**: Web server for preview UI

---

### Roadmap & Limitations

#### Q: What features are planned for the future?
**A:** The roadmap includes:
- Web UI for configuration
- Custom prompt templates
- Multi-language support
- VS Code extension
- GitHub App integration
- Cost estimation engine
- Real-time collaboration analysis
- Machine learning-based insights

#### Q: Is RepoSentry open source?
**A:** Yes! It's licensed under MIT. Contributions are welcome on GitHub.

#### Q: Can I use RepoSentry on private/confidential code?
**A:** RepoSentry analyzes your code locally and the data stays with you (when using Copilot CLI locally). However, if you run `reposentry serve`, be aware the web UI renders your reports on localhost.

---

### Common Pitfalls

#### Q: Why is my Node.js version not detected?
**A:** Make sure you have a `package.json` file in your project root. RepoSentry detects frameworks and runtime through package.json detection rules.

#### Q: Why are some routes not detected in my API?
**A:** Route detection is framework-specific. RepoSentry currently detects routes in Express.js, Fastify, and other common Node.js frameworks. Custom frameworks may need code inspection.

#### Q: Why does analysis take so long?
**A:** AI analysis depends on your codebase size and Copilot backend responsiveness. Use `--depth quick` for faster results, or exclude large directories with `--ignore`.

#### Q: Can I run multiple engines in parallel?
**A:** Currently, engines run sequentially. This is by design for stability and sequential output. Future versions may support parallel execution.

---

### Performance Tips

#### Q: How can I speed up analysis?
**A:** 
- Use `--depth quick` instead of `standard` or `deep`
- Use `--ignore` to exclude node_modules, build artifacts
- Run specific engines instead of full analysis
- Use in CI/CD with cached results

#### Q: What's the typical analysis time for different sizes?
**A:**
- Small project (< 10k LOC): 2-5 minutes
- Medium project (10k-100k LOC): 5-15 minutes
- Large project (> 100k LOC): 15-30+ minutes

---

### Integration & Automation

#### Q: How do I integrate RepoSentry results into my docs site?
**A:** 
1. Generate reports: `reposentry analyze --format markdown`
2. Copy files from `.reposentry/` to your docs directory
3. Link from your main README.md to the health report

#### Q: Can I use RepoSentry output in GitHub Actions?
**A:** Yes! Run `reposentry analyze --format json` in your workflow and parse the output. Example use cases: gates for merging based on health score, status checks, report artifacts.

#### Q: How do I schedule regular analysis runs?
**A:** Use GitHub Actions schedule trigger or similar in other CI/CD systems. Store results as artifacts for trend tracking over time.