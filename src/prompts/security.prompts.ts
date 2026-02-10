import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function securityAuditPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Perform a comprehensive security audit of this codebase. For each finding, provide: severity (Critical/High/Medium/Low), category (OWASP Top 10 mapping), description, exact location, and recommended fix. Include an overall risk grade (A-F). Check for: hardcoded secrets, SQL injection, XSS, path traversal, command injection, insecure crypto, authentication issues, authorization gaps, input validation, CORS misconfiguration, sensitive data exposure.',
    ctx,
  );
}

export function vulnerabilityReportPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a vulnerability report analyzing: 1) Known vulnerabilities in dependencies (based on package versions). 2) Code-level security issues found through pattern analysis. For each vulnerability, provide: CVE (if applicable), severity, affected component, description, and remediation steps.',
    ctx,
  );
}

export function secretsScanPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Scan for hardcoded secrets in the codebase. Look for: API keys, passwords, tokens, private keys, connection strings, and other sensitive data in source code and config files. For each finding, provide the file, line pattern, type of secret, and risk level.',
    ctx,
    'json',
  );
}

export function threatModelPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Mermaid threat model diagram. Show: trust boundaries, data flows across boundaries, potential attack surfaces, threat actors, and data stores. Use flowchart TD syntax with subgraphs for trust boundaries.',
    ctx,
    'mermaid',
  );
}

export function remediationPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a step-by-step remediation guide for the security issues found. For each issue, provide: the problem, why it matters, the exact fix (with code examples), and how to verify the fix works. Prioritize by severity.',
    ctx,
  );
}
