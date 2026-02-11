# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Features
- Update AI model selection in CLI with dynamic fetching from Copilot backend
- Enhance CLI and Copilot integration with AI model selection and interactive setup
- Add utility functions for file system operations, git commands, logging, and scoring
- Update UI

### Refactoring
- Refactor scoring mechanisms across engines for improved accuracy and transparency
  - Updated scoring logic in CI, Docs, Health, Performance, Security, and Team engines to reflect project state rather than generated files
  - Introduced detailed missing components reporting in CI and Team engines
  - Implemented history tracking for health reports, allowing users to compare scores over time
  - Added comparison feature in the server to visualize score changes between analyses
  - Improved security checks with stricter penalties for vulnerabilities

### Documentation
- Enhanced scoring methodology documentation in Health engine with clear explanations of category weights and scoring formulas
- Enhanced Mermaid diagram prompts for clearer output instructions

### Tests
- Added unit tests for git utilities, mermaid helpers, output manager functionality, prompt builder, and scoring utilities
- Added tests for config detection, file scanning, and language detection
- Added tests for scoring calculations to ensure correct application of weights

### Chores
- Adjusted `tsconfig.json` to include only source files
- Updated `tsup.config.ts` to add a shebang for CLI usage and enable code splitting
- Added `vitest.config.ts` for configuring Vitest testing framework
- Introduced version retrieval utility for CLI versioning