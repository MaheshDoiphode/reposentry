# Scoring Methodology

> **Transparency note:** RepoSentry scores are based on what your project *already has*, not on what RepoSentry generates. Generated files do not inflate your score.

---

## Grade Scale

| Grade | Score Range |
|-------|------------|
| A+    | 97 – 100   |
| A     | 93 – 96    |
| A-    | 90 – 92    |
| B+    | 87 – 89    |
| B     | 83 – 86    |
| B-    | 80 – 82    |
| C+    | 77 – 79    |
| C     | 73 – 76    |
| C-    | 70 – 72    |
| D+    | 67 – 69    |
| D     | 63 – 66    |
| D-    | 60 – 62    |
| F     | 0 – 59     |

---

## Overall Score = Weighted Average

Not all categories weigh equally. Security and Testing carry more weight because they directly affect production readiness.

| Category | Weight | Reason |
|----------|--------|--------|
| Security | 2.0× | Vulnerabilities directly impact production safety |
| Testing | 1.5× | Test coverage is critical for reliability |
| CI/CD | 1.2× | Automation reduces human error |
| Performance | 1.2× | Anti-patterns affect user experience |
| Documentation | 1.0× | Standard weight |
| Architecture | 1.0× | Standard weight |
| Collaboration | 0.8× | Important but less urgent than code quality |

**Formula:** `Overall = Σ(category_score × weight) / Σ(weight)`

---

## Per-Category Scoring

### Documentation (weight: 1.0×)
- Base: 20 points
- Has existing README: +25
- Has API routes documented: +10
- Active development (>3 recent commits): +10
- Has version tags: +15
- No README: −10
- No commits: −5

### Architecture (weight: 1.0×)
- Base: 30 points
- Has module imports (structured codebase): +15
- Has data models: +15
- Has API routes: +15
- 3+ top-level directories (separation of concerns): +10
- 5+ top-level directories: +5
- No imports and no routes (monolithic): −10

### Security (weight: 2.0×)
- Starts at 100 (clean baseline)
- Per High-severity finding (hardcoded secrets, SQL injection, etc.): −20
- Per Medium-severity finding (eval, CORS, MD5): −10
- Per Low-severity finding (console.log, etc.): −3
- No .gitignore: −15
- .env file committed: −10
- AI-identified critical/high-risk findings: −5 each
- AI-identified medium-risk findings: −2 each

### CI/CD (weight: 1.2×)
- Base: 15 points
- Has CI/CD pipeline config: +35
- Has Dockerfile: +20
- Has .env.example: +15
- Has docker-compose: +15

### Testing (weight: 1.5×)
- Base: 10 points
- Has any test files: +20
- Has >5 test files: +10
- Has >10 test files: +10
- Has >20 test files: +10
- Route coverage ratio × 30 (if routes exist)
- Very low test-to-route ratio (<30%): −10
- Zero test files: −5

### Performance (weight: 1.2×)
- Base: 70 points (if anti-patterns found) / 95 (if clean)
- Per anti-pattern detected: −5
- Scans for: sync I/O, SELECT *, unbounded queries, nested awaits, console.log in hot paths, uncompressed payloads

### Collaboration (weight: 0.8×)
- Base: 15 points
- Has PR template: +25
- Has issue templates: +20
- Has CODEOWNERS: +20
- Multi-contributor (>1): +10
- Active team (>3 contributors): +10

---

*Scoring is deterministic and reproducible. Run the same analysis twice on an unchanged codebase and you will get the same score.*
