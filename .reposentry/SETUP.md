# SETUP.md

## Development Environment Setup Guide

RepoSentry is an AI-powered codebase intelligence platform. This guide will help you set up your development environment.

---

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: For cloning and working with repositories
- **GitHub Copilot CLI** (optional but recommended for AI-powered analysis features)

### System Requirements

- **macOS**: 10.15 or later
- **Linux**: Any modern distribution (Ubuntu 18.04+, Debian 10+, etc.)
- **Windows**: Windows 10 or later

---

## Installation Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/MaheshDoiphode/reposentry.git
cd reposentry
```

### Step 2: Install Dependencies

#### macOS & Linux
```bash
npm install
```

#### Windows
```bash
npm install
```

> All commands are identical across platforms. npm handles platform differences automatically.

### Step 3: Install GitHub Copilot CLI (Optional but Recommended)

The application works best with GitHub Copilot CLI installed. This enables AI-powered analysis features.

#### macOS & Linux
```bash
npm install -g @github/copilot
```

#### Windows
Using Winget:
```bash
winget install GitHub.Copilot
```

Or using npm:
```bash
npm install -g @github/copilot
```

---

## Environment Variables

RepoSentry uses configuration files for customization. Environment variables are not required for basic operation, but you can create a configuration file:

### Create `reposentry.config.js`

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

Or add to `package.json`:

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

## Database Setup

RepoSentry does not require a database. It analyzes local Git repositories and generates reports based on code analysis.

---

## Building and Running the Project

### Build the Project

Convert TypeScript to JavaScript:

```bash
npm run build
```

Output files are generated in the `dist/` directory.

### Development Mode (Watch)

For continuous development with auto-rebuild:

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### Type Checking

Verify TypeScript types without building:

```bash
npm run typecheck
```

### Run Tests

Execute the test suite:

```bash
npm run test
```

Tests use Vitest and are located in the `tests/` directory.

### Link for Local CLI Testing

After building, link the package globally for testing:

```bash
npm link
```

Now you can run:
```bash
reposentry --help
```

### Start the Application

Run the compiled application:

```bash
npm start
```

---

## Running the Application

### Quick Start: Analyze a Repository

Navigate to any Git repository and run:

```bash
reposentry analyze
```

This generates comprehensive analysis in the `.reposentry/` directory including:
- Documentation suite (README, API, SETUP, CONTRIBUTING)
- Architecture diagrams
- Security audit reports
- CI/CD pipeline suggestions
- API testing collections
- Performance analysis
- Team collaboration templates
- Health assessment report

### Preview Generated Reports

Serve the generated reports in your browser:

```bash
reposentry serve
```

Visit `http://localhost:3000` to view reports.

### Common Commands

#### Full Analysis
```bash
reposentry analyze
```

#### Security-Focused Analysis
```bash
reposentry analyze --security --depth deep
```

#### Documentation Only
```bash
reposentry analyze --docs
```

#### Custom Output Directory
```bash
reposentry analyze --output ./reports
```

#### Generate Health Badge
```bash
reposentry badge
```

---

## Troubleshooting

### Issue: Command not found: `reposentry`

**Solution**: Ensure you've run `npm link`:
```bash
npm run build
npm link
```

### Issue: Node.js version incompatibility

**Solution**: Verify Node.js version is 18 or higher:
```bash
node --version
```

If needed, upgrade Node.js from https://nodejs.org/

### Issue: Git repository not detected

**Solution**: Ensure your project is a Git repository:
```bash
git init
git add .
git commit -m "Initial commit"
```

### Issue: GitHub Copilot features not working

**Solution**: Install and authenticate GitHub Copilot CLI:
```bash
npm install -g @github/copilot
copilot auth login
```

### Issue: Build errors with TypeScript

**Solution**: Clear cache and rebuild:
```bash
rm -rf dist node_modules
npm install
npm run build
```

---

## Project Structure

```
reposentry/
├── src/
│   ├── cli.ts                    # Command-line interface
│   ├── config.ts                 # Configuration loading
│   ├── index.ts                  # Main entry point
│   ├── core/                     # Core analysis logic
│   ├── engines/                  # Specialized analysis engines
│   ├── scanners/                 # Codebase scanning utilities
│   ├── prompts/                  # AI prompt templates
│   ├── utils/                    # Helper functions
│   └── server/                   # Web server for preview
├── tests/                        # Test files
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tsup.config.ts                # Build configuration
├── vitest.config.ts              # Test configuration
└── README.md                      # Project documentation
```

---

## Development Workflow

### Making Changes

1. Make code changes in the `src/` directory
2. Run type checking:
   ```bash
   npm run typecheck
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Test your changes:
   ```bash
   npm run test
   ```

### Adding Tests

Tests should be placed in the `tests/` directory with the `.test.ts` extension. Run tests with:
```bash
npm run test
```

### Debugging

Use your IDE's debugger with the generated `dist/` files, or use:
```bash
node --inspect-brk dist/index.js
```

---

## Additional Resources

- [GitHub Repository](https://github.com/MaheshDoiphode/reposentry)
- [Main README](./README.md)
- [Project Details](./internal-docs/project_details.md)

---

## Support

For issues and questions:
- Open an issue: https://github.com/MaheshDoiphode/reposentry/issues
- Start a discussion: https://github.com/MaheshDoiphode/reposentry/discussions

---

**Happy developing! 🚀**