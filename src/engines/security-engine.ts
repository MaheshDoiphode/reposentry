import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { readFileContentSync, fileExists } from '../utils/fs.js';
import { join } from 'node:path';
import {
  securityAuditPrompt, vulnerabilityReportPrompt, secretsScanPrompt,
  threatModelPrompt, remediationPrompt,
} from '../prompts/security.prompts.js';

export interface SecurityEngineInput {
  context: PromptContext;
  rootDir: string;
  files: string[];
  hasEnvFile: boolean;
  hasGitignore: boolean;
  hasDockerfile: boolean;
}

/** Quick regex-based pattern scan for common vulnerabilities */
function quickSecurityScan(rootDir: string, files: string[]): string[] {
  const findings: string[] = [];
  const patterns: Array<{ name: string; pattern: RegExp; severity: string }> = [
    { name: 'Hardcoded password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/gi, severity: 'High' },
    { name: 'Hardcoded API key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'High' },
    { name: 'Hardcoded token', pattern: /(?:token|secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'High' },
    { name: 'SQL injection risk', pattern: /(?:query|execute)\s*\(\s*['"`].*?\$\{/gi, severity: 'High' },
    { name: 'eval() usage', pattern: /\beval\s*\(/g, severity: 'Medium' },
    { name: 'exec() with string', pattern: /\bexec(?:Sync)?\s*\(\s*['"`].*?\$\{/gi, severity: 'High' },
    { name: 'MD5 usage', pattern: /\bmd5\b/gi, severity: 'Medium' },
    { name: 'console.log in production', pattern: /console\.log\s*\(/g, severity: 'Low' },
    { name: 'CORS wildcard', pattern: /cors\s*\(\s*\{[^}]*origin\s*:\s*['"]\*['"]/gi, severity: 'Medium' },
    { name: 'Disabled SSL verification', pattern: /rejectUnauthorized\s*:\s*false/g, severity: 'High' },
  ];

  const codeFiles = files.filter(f =>
    f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.py') ||
    f.endsWith('.go') || f.endsWith('.java') || f.endsWith('.rb'),
  ).slice(0, 100);

  for (const file of codeFiles) {
    try {
      const content = readFileContentSync(join(rootDir, file));
      for (const { name, pattern, severity } of patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        if (regex.test(content)) {
          findings.push(`[${severity}] ${name} in ${file}`);
        }
      }
    } catch { /* ignore */ }
  }

  return findings;
}

export async function runSecurityEngine(
  input: SecurityEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ score: number; details: string }> {
  progress.start('Security Engine', 6);

  // Step 1: Quick pattern scan
  progress.increment('Pattern scanning');
  const quickFindings = quickSecurityScan(input.rootDir, input.files);

  const ctx = { ...input.context };
  if (quickFindings.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nQuick security scan findings:\n${quickFindings.join('\n')}`;
  }

  // Step 2: Full security audit via Copilot
  progress.increment('Security audit');
  const auditResult = await askCopilot(securityAuditPrompt(ctx));
  await output.writeToSubdir('security', 'SECURITY_AUDIT.md', auditResult);

  // Step 3: Vulnerability report
  progress.increment('Vulnerability analysis');
  const vulnResult = await askCopilot(vulnerabilityReportPrompt(ctx));
  await output.writeToSubdir('security', 'VULNERABILITY_REPORT.md', vulnResult);

  // Step 4: Secrets scan
  progress.increment('Secrets scan');
  const secretsResult = await askCopilot(secretsScanPrompt(ctx));
  await output.writeToSubdir('security', 'secrets-scan.json', secretsResult);

  // Step 5: Threat model
  progress.increment('Threat model');
  const threatResult = await askCopilot(threatModelPrompt(ctx));
  await output.writeToSubdir('security', 'threat-model.mmd', threatResult);

  // Step 6: Remediation guide
  progress.increment('Remediation guide');
  const remResult = await askCopilot(remediationPrompt(ctx));
  await output.writeToSubdir('security', 'REMEDIATION.md', remResult);

  progress.succeed('Security Engine');

  // Score calculation — stricter penalties
  const highCount = quickFindings.filter(f => f.startsWith('[High]')).length;
  const medCount = quickFindings.filter(f => f.startsWith('[Medium]')).length;
  const lowCount = quickFindings.filter(f => f.startsWith('[Low]')).length;

  let score = 100;
  score -= highCount * 20;   // High = -20 each (hardcoded secrets, SQL injection, etc.)
  score -= medCount * 10;    // Medium = -10 each (eval, CORS, MD5, etc.)
  score -= lowCount * 3;     // Low = -3 each (console.log, etc.)

  // Environment & config penalties
  if (!input.hasGitignore) score -= 15;  // no .gitignore is a real risk
  if (input.hasEnvFile) score -= 10;     // .env committed to repo

  // Also parse AI vulnerability report for additional severity signals
  const vulnLower = vulnResult.toLowerCase();
  const aiHighMatches = (vulnLower.match(/\bcritical\b|\bhigh\s*severity\b|\bhigh\s*risk\b/g) || []).length;
  const aiMedMatches = (vulnLower.match(/\bmedium\s*severity\b|\bmedium\s*risk\b|\bmoderate\b/g) || []).length;
  score -= aiHighMatches * 5;  // AI-identified critical/high findings
  score -= aiMedMatches * 2;   // AI-identified medium findings

  score = Math.max(0, Math.min(100, score));

  const totalFindings = quickFindings.length + aiHighMatches + aiMedMatches;

  return {
    score,
    details: `${quickFindings.length} pattern findings (${highCount}H/${medCount}M/${lowCount}L) + ${aiHighMatches + aiMedMatches} AI findings | .gitignore: ${input.hasGitignore ? 'yes' : 'NO'} | .env committed: ${input.hasEnvFile ? 'YES' : 'no'}`,
  };
}
