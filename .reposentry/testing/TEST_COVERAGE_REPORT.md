# Test Coverage Analysis Report

## Overview

**Project:** reposentry  
**Framework:** TypeScript, Express.js  
**Package Manager:** npm  
**Test Framework:** Vitest  
**Total Source Files:** 38  
**Total Test Files:** 8  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Files with Tests** | 8 out of 38 (21%) |
| **Estimated Coverage** | ~15-20% |
| **Test-to-Code Ratio** | 1:4.75 (8 test files : 38 source files) |
| **Critical Untested Areas** | 🔴 HIGH |

---

## Tested Components

### Core Module (2/5 files tested)
- ✅ **output-manager.ts** - Well covered (14 test cases)
- ✅ **prompt-builder.ts** - Good coverage (10 test cases)
- ❌ copilot.ts
- ❌ orchestrator.ts
- ❌ progress.ts

### Utils Module (3/6 files tested)
- ✅ **git.ts** - Basic coverage (3 test cases)
- ✅ **scoring.ts** - Well covered (9 test cases)
- ✅ **mermaid.ts** - Good coverage (3 test cases)
- ❌ fs.ts
- ❌ logger.ts
- ❌ version.ts

### Scanners Module (3/7 files tested)
- ✅ **config-detector.ts** - Minimal coverage (5 test cases)
- ✅ **file-scanner.ts** - Good coverage (6 test cases)
- ✅ **language-detector.ts** - Good coverage (6 test cases)
- ❌ git-analyzer.ts
- ❌ import-parser.ts
- ❌ model-detector.ts
- ❌ route-detector.ts

### Engines Module (0/8 files tested)
- ❌ api-test-engine.ts
- ❌ architecture-engine.ts
- ❌ ci-engine.ts
- ❌ docs-engine.ts
- ❌ health-engine.ts
- ❌ performance-engine.ts
- ❌ security-engine.ts
- ❌ team-engine.ts

### Prompts Module (0/8 files tested)
- ❌ api-test.prompts.ts
- ❌ architecture.prompts.ts
- ❌ ci.prompts.ts
- ❌ docs.prompts.ts
- ❌ health.prompts.ts
- ❌ performance.prompts.ts
- ❌ security.prompts.ts
- ❌ team.prompts.ts

### Server Module (0/1 file tested)
- ❌ server/index.ts

### CLI Module (0/2 files tested)
- ❌ cli.ts
- ❌ config.ts

### Index Module (0/1 file tested)
- ❌ index.ts

---

## Test Coverage Details

### Tests by File

| Test File | Assertion Count | Coverage Focus |
|-----------|-----------------|-----------------|
| `tests/core/output-manager.test.ts` | 14 | File I/O, directory management, format output |
| `tests/core/prompt-builder.test.ts` | 10 | Prompt construction, context building |
| `tests/core/scoring.test.ts` | 9 | Grade calculation, weighted scoring |
| `tests/scanners/file-scanner.test.ts` | 6 | File scanning, extension filtering |
| `tests/scanners/language-detector.test.ts` | 6 | Language & framework detection |
| `tests/scanners/config-detector.test.ts` | 5 | Config file detection |
| `tests/core/mermaid.test.ts` | 3 | Diagram syntax helpers |
| `tests/core/git.test.ts` | 3 | Git utility functions |
| **TOTAL** | **56 test cases** | — |

---

## Critical Untested Areas

### 🔴 **CRITICAL PRIORITY** (Must Test)

1. **All Engine Modules (0% coverage)**
   - **Impact:** Engines are the core analysis modules
   - **Size:** 8 files with complex business logic
   - **Risk:** High — API analysis, security scanning, CI/CD analysis all untested
   - **Examples:**
     - `security-engine.ts` - Vulnerability scanning logic
     - `api-test-engine.ts` - API route testing logic
     - `ci-engine.ts` - CI/CD configuration analysis

2. **Orchestrator Module**
   - **Impact:** Main coordination logic for the entire analysis pipeline
   - **Size:** Single complex file with orchestration logic
   - **Risk:** High — All features depend on this working correctly
   - **Functions affected:** Core analysis workflow, engine execution pipeline

3. **All Prompts Modules (0% coverage)**
   - **Impact:** Prompt engineering is critical for AI accuracy
   - **Size:** 8 prompt template files
   - **Risk:** High — Directly affects quality of AI-generated analysis
   - **Examples:** Security prompts, architecture prompts, docs generation prompts

### 🟠 **HIGH PRIORITY** (Should Test)

4. **Copilot Module**
   - **Impact:** Core AI backend integration
   - **Functions:** Model detection, backend detection, retry logic
   - **Risk:** High — All AI calls depend on this
   - **Untested paths:** Error handling, retries, model switching

5. **Git Analyzer Scanner**
   - **Current:** Only basic git utilities tested
   - **Missing:** `analyzeGitHistory()` and complex git analysis logic
   - **Impact:** Team/collaboration insights rely on this

6. **Server Module**
   - **Impact:** Express.js routes for web UI
   - **Routes:** GET /, GET /view/*, GET /compare
   - **Risk:** Medium — Web endpoints untested

7. **File System Utilities (fs.ts)**
   - **Functions:** walkDir, readFileContent, writeOutput, recursive operations
   - **Risk:** Medium — Core file operations untested

8. **Route & Model Detectors**
   - **Impact:** API endpoint discovery
   - **Risk:** Medium — Architecture analysis depends on accurate route detection

### 🟡 **MEDIUM PRIORITY** (Nice to Have)

9. **CLI Module (cli.ts)**
   - **Impact:** Command-line argument parsing
   - **Risk:** Low-Medium — Integration tested via manual runs
   - **Size:** Single file

10. **Configuration (config.ts)**
    - **Impact:** Project configuration management
    - **Risk:** Low — Simple configuration loading

11. **Logger & Version Utils**
    - **Impact:** Output formatting and versioning
    - **Risk:** Low — Less critical for core functionality

12. **Import Parser**
    - **Current:** Only detector tested, not actual parsing
    - **Impact:** Dependency analysis
    - **Risk:** Medium — Used for architecture insights

---

## Coverage Gaps Summary

| Category | Tested | Total | % Tested | Gap |
|----------|--------|-------|----------|-----|
| Core | 2 | 5 | 40% | 3 files |
| Utils | 3 | 6 | 50% | 3 files |
| Scanners | 3 | 7 | 43% | 4 files |
| **Engines** | **0** | **8** | **0%** | **8 files** |
| **Prompts** | **0** | **8** | **0%** | **8 files** |
| Server | 0 | 1 | 0% | 1 file |
| CLI | 0 | 2 | 0% | 2 files |
| Other | 0 | 1 | 0% | 1 file |
| **TOTAL** | **8** | **38** | **21%** | **30 files** |

---

## Recommendations for Improvement

### Phase 1: Foundation (Target 40% coverage)
1. Add tests for all **8 Engine modules** (each engine has unique analysis logic)
2. Test **orchestrator.ts** (orchestration of entire pipeline)
3. Test **copilot.ts** integration layer (backend detection, model selection)

### Phase 2: Coverage (Target 60% coverage)
4. Add **git-analyzer.ts** tests (team insights, ownership analysis)
5. Add **server/index.ts** tests (API endpoint validation)
6. Add **fs.ts** tests (file operations robustness)
7. Add **route-detector.ts** tests (API analysis accuracy)

### Phase 3: Completion (Target 80%+ coverage)
8. Add prompt template validation tests
9. Add **cli.ts** integration tests
10. Add **import-parser.ts** tests
11. Add **model-detector.ts** tests

### Test Strategies by Module

#### Engines (Highest Priority)
- Mock Copilot responses
- Test with sample project files
- Validate scoring algorithms
- Check prompt generation

#### Orchestrator
- Mock all engine calls
- Test workflow state management
- Validate error handling
- Test progress tracking

#### Core Services
- Integration tests for orchestration
- Unit tests for utilities
- Error boundary tests

---

## Quality Observations

### Strengths ✅
- Good test structure with Vitest
- Core utilities well isolated and testable
- Tests use real project scanning (not fully mocked)
- Good assertion patterns

### Weaknesses ❌
- No tests for main analysis engines
- No prompt validation tests
- Limited error case coverage
- No integration tests for full pipeline
- No tests for CLI argument handling
- Server endpoints completely untested

---

## Estimated Line Coverage Metrics

| Module | Est. Line Coverage | Est. Branch Coverage |
|--------|-------------------|----------------------|
| Core | 40-50% | 25-35% |
| Utils | 50-60% | 30-40% |
| Scanners | 45-55% | 25-35% |
| **Engines** | **0%** | **0%** |
| **Prompts** | **0%** | **0%** |
| **Overall** | **~15-20%** | **~10-15%** |

---

## Test-to-Code Ratio Analysis

- **Files:** 1 test file per 4.75 source files (below recommended 1:3)
- **Test Cases:** 56 assertions / 38 source files = 1.47 tests per file (low)
- **Functions Tested:** ~20-25 out of ~200+ exported functions
- **Recommendation:** Increase tests by 2.5-3x to reach 60% coverage

---

## Next Steps

1. **Immediate:** Add engine module tests (8 files, ~4-6 tests each = 32-48 new tests)
2. **Short-term:** Add orchestrator and copilot tests (5-8 tests each)
3. **Medium-term:** Add scanner gap coverage (git-analyzer, route-detector, import-parser)
4. **Long-term:** Add integration and E2E tests for full pipeline