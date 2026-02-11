---

# Security Remediation Guide

## Severity Priority: High → Medium → Low

---

## 🔴 HIGH SEVERITY

### Issue 1: Command Injection via `exec()` with String Interpolation
**File:** `src/utils/git.ts` (line 5)

#### Problem
```typescript
// VULNERABLE CODE
return execSync(`git ${cmd}`, { cwd, encoding: 'utf-8', timeout: 15000 }).trim();
```
The `gitCommand()` function constructs shell commands using template literals with user-supplied input. If `cmd` contains shell metacharacters or is user-controlled, attackers can inject arbitrary shell commands.

#### Why It Matters
**Command injection is a critical vulnerability.** Attackers can execute arbitrary system commands with the privileges of the Node.js process, potentially leading to:
- Unauthorized file access or modification
- Remote code execution
- Data exfiltration
- System compromise

#### Fix
**Use array-based argument syntax to prevent shell interpretation:**

```typescript
// FIXED CODE
import { execSync } from 'node:child_process';

export function gitCommand(cmd: string, cwd: string): string {
  try {
    // Split command into executable and arguments
    const args = cmd.split(/\s+/);
    return execSync('git', [args[0], ...args.slice(1)], { 
      cwd, 
      encoding: 'utf-8', 
      timeout: 15000 
    }).trim();
  } catch {
    return '';
  }
}
```

**Or use a safer approach with parameterized commands:**

```typescript
// ALTERNATIVE: More explicit control
const ALLOWED_COMMANDS = new Set([
  'rev-parse',
  'branch',
  'remote',
  'shortlog',
  'log',
  'blame',
  'tag',
]);

export function gitCommand(cmd: string, cwd: string): string {
  try {
    const parts = cmd.split(/\s+/);
    if (!ALLOWED_COMMANDS.has(parts[0])) {
      throw new Error(`Disallowed git command: ${parts[0]}`);
    }
    return execSync('git', parts, { 
      cwd, 
      encoding: 'utf-8', 
      timeout: 15000 
    }).trim();
  } catch {
    return '';
  }
}
```

#### Verification
```bash
# Test 1: Verify command still works normally
npm test -- src/core/git.test.ts

# Test 2: Attempt injection (should fail)
# The function should reject or safely handle malicious input
const result = gitCommand('rev-parse --is-inside-work-tree; rm -rf /', cwd);
// Should return '' or throw, NOT execute the dangerous command
```

---

## 🟠 MEDIUM SEVERITY

### Issue 2: MD5 Hashing Usage in `health-engine.ts`
**File:** `src/engines/health-engine.ts`

#### Problem
MD5 is a cryptographically broken hash algorithm. While the code review didn't pinpoint the exact location, any use of MD5 for security-sensitive operations (password hashing, checksum verification, token generation) is vulnerable to:
- **Collision attacks** — two different inputs can produce the same hash
- **Precomputed attacks** — rainbow tables can reverse hashes
- **Predictability** — unsuitable for security contexts

#### Why It Matters
If MD5 is used for:
- Hashing passwords or secrets → **Password cracking is feasible**
- Verifying file integrity → **Tampering detection fails**
- Generating tokens → **Tokens can be forged**

#### Fix
**Replace MD5 with SHA-256 or stronger algorithms:**

```typescript
// VULNERABLE (if present in code)
import crypto from 'crypto';
const hash = crypto.createHash('md5').update(data).digest('hex');

// FIXED
import crypto from 'crypto';
const hash = crypto.createHash('sha256').update(data).digest('hex');
```

**For password hashing specifically, use bcrypt or Argon2:**

```typescript
// For passwords
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(plaintext, 10);
const isValid = await bcrypt.compare(plaintext, hashedPassword);
```

#### Verification
```bash
# Search for MD5 usage
grep -r "md5\|MD5" src/

# Should return no results after fix:
grep -r "createHash.*md5" src/ || echo "✓ No MD5 usage found"

# Verify replacement with grep
grep -r "createHash.*sha256\|bcrypt" src/
```

---

### Issue 3: `eval()` Usage in `security-engine.ts`
**File:** `src/engines/security-engine.ts` (line 29)

#### Problem
The security scanning code includes an `eval()` detection pattern (which is correct for detecting vulnerabilities in *other* code), but **if `eval()` exists elsewhere in the codebase for executing untrusted input**, this is extremely dangerous.

```typescript
// VULNERABLE EXAMPLE (to AVOID)
const result = eval(userInput);  // NEVER DO THIS
```

#### Why It Matters
`eval()` executes arbitrary JavaScript code:
- **Remote code execution** — untrusted input becomes executable code
- **Sandbox escape** — breaks all security boundaries
- **Injection attacks** — code injection becomes trivial

#### Fix
**Never execute dynamic code. Use safe alternatives:**

```typescript
// VULNERABLE
const dynamicFunc = eval(`(${userCode})`);

// FIXED: Use Function constructor if absolutely necessary (still risky)
const safeFunc = new Function('param', userCode);

// BEST: Use a safe expression evaluator
import { evaluate } from 'mathjs';
const result = evaluate(userExpression);  // Math expressions only

// OR use JSON.parse for safe data deserialization
const data = JSON.parse(jsonString);
```

#### Verification
```bash
# Search for eval usage (actual, not pattern scanning)
grep -r "eval\s*(" src/ --include="*.ts" --include="*.js"

# Should return ONLY the pattern in security-engine.ts (the regex that *detects* eval)
# If you find actual eval() calls, remove them

# Check that tests pass
npm test
```

---

### Issue 4: MD5 Usage in `security-engine.ts`
**File:** `src/engines/security-engine.ts` (line 31)

#### Problem
Same as Issue 2 — MD5 is included in the vulnerability scanner's pattern list (which is correct), but if the codebase *actually uses* MD5 anywhere, it must be replaced.

#### Fix
Refer to **Issue 2** above. Search for and replace all MD5 usages with SHA-256 or bcrypt.

#### Verification
```bash
# Comprehensive MD5 search
grep -ri "md5\|MD5\|createHash.*md5" src/

# Should only find matches in security-engine.ts (as the detection pattern)
# Pattern should look like: pattern: /\bmd5\b/gi

# After fix, this should return nothing:
grep -ri "createHash.*md5" src/ || echo "✓ No actual MD5 hashing found"
```

---

## 🟡 LOW SEVERITY

### Issue 5-8: `console.log()` in Production Code

#### Files Affected
- `src/cli.ts` (lines 94, 126-130)
- `src/core/orchestrator.ts` (line 63)
- `src/server/index.ts` (multiple locations)
- `src/utils/logger.ts` (lines 13, 15, 17, 21, 25, 28)

#### Problem
`console.log()` outputs to stdout, which:
- **Leaks sensitive information** to logs if stderr/stdout is captured
- **Pollutes logs** with unstructured output (complicates log aggregation)
- **Mixes business logic with debugging** (harder to redirect/disable)
- **Violates 12-factor app principles** (no structured logging)

#### Why It Matters
While not a direct security vulnerability, logging issues can:
- Expose secrets or PII in production logs
- Make log analysis and monitoring ineffective
- Fail compliance requirements (GDPR, HIPAA) for log redaction

#### Fix
**Use the existing logger module consistently:**

```typescript
// BAD
console.log('Analysis failed: ' + err.message);

// GOOD (already exists in logger.ts)
import { logger } from './utils/logger.js';
logger.info('Analysis failed: ' + err.message);
logger.error('Analysis failed: ' + err.message);  // for errors

// If console.log is unavoidable (explicit console output), comment why
console.log('\n📛 RepoSentry Badge for ' + data.project);  // User-facing CLI output
```

**In `src/utils/logger.ts`, the logger module already exists and properly uses `console` with formatting:**

```typescript
// This is GOOD — structured logging
export const logger = {
  info(msg: string): void {
    console.log(chalk.blue('ℹ'), msg);  // Structured with prefix
  },
  error(msg: string): void {
    console.error(chalk.red('✖'), msg);  // Uses console.error for errors
  },
  // ... other methods
};
```

#### Verification
```bash
# Find console.log calls (should only be in logger.ts or CLI output)
grep -n "console\.log\|console\.error" src/cli.ts src/core/orchestrator.ts src/server/index.ts

# After fix, these files should use logger.* instead:
grep -n "logger\." src/cli.ts src/core/orchestrator.ts src/server/index.ts

# Count instances
echo "Before fix:"
grep -r "console\.log\|console\.error" src/ --include="*.ts" | wc -l

echo "After fix:"
grep -r "console\.log\|console\.error" src/ --include="*.ts" | wc -l
```

**Exceptions (intentional console output):**
```typescript
// These are OK—they're intentional CLI/user output, not debug logging
console.log(chalk.blue('Analysis Results'));        // User-facing header
console.log(banner);                                // ASCII art
console.error('❌ Analysis failed: ' + err.message); // User-facing error

// These should be logger.* instead
console.log('Debug: ' + someVariable);
console.error('Internal error trace');
```

---

## Summary Table

| Severity | Issue | Location | Remediation Effort | Risk Level |
|----------|-------|----------|-------------------|------------|
| 🔴 High | Command Injection | `src/utils/git.ts:5` | **Medium** | Critical |
| 🟠 Medium | MD5 Usage | `src/engines/health-engine.ts` | **Low-Medium** | High |
| 🟠 Medium | `eval()` Detection | `src/engines/security-engine.ts:29` | **Low** | High (if eval exists) |
| 🟠 Medium | MD5 Usage | `src/engines/security-engine.ts:31` | **Low-Medium** | High |
| 🟡 Low | `console.log()` | `src/cli.ts`, `src/core/orchestrator.ts`, `src/server/index.ts`, `src/utils/logger.ts` | **Low** | Low |

---

## Implementation Checklist

- [ ] **Priority 1:** Fix command injection in `git.ts` (lines 1-64)
- [ ] **Priority 2:** Search codebase for actual MD5 usage and replace with SHA-256
- [ ] **Priority 3:** Search codebase for actual `eval()` usage and remove
- [ ] **Priority 4:** Replace `console.log()` calls with `logger.*` in CLI/core modules
- [ ] **Priority 5:** Run full test suite: `npm test`
- [ ] **Priority 6:** Run security scan again to verify fixes
- [ ] **Priority 7:** Update `SECURITY.md` with vulnerability disclosure policy