import { execSync, spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { logger } from '../utils/logger.js';

export interface CopilotOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  /** Project directory — copilot reads from here but cannot write */
  projectDir?: string;
}

const DEFAULT_OPTIONS: Required<CopilotOptions> = {
  maxRetries: 2,
  retryDelayMs: 3000,
  timeoutMs: 180000,
  projectDir: '',  // empty = use process.cwd() at call time
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type CopilotBackend = 'copilot-cli' | 'gh-copilot' | 'none';

let detectedBackend: CopilotBackend | null = null;
let globalModel = 'claude-haiku-4.5';

/** Set the AI model to use for all Copilot calls */
export function setCopilotModel(model: string): void {
  globalModel = model;
}

/** Get available models from copilot CLI (parsed from --help output) */
export function getAvailableModels(): string[] {
  const backend = detectBackend();
  if (backend === 'none') return [];

  try {
    const cmd = backend === 'copilot-cli' ? 'copilot' : 'gh';
    const args = backend === 'copilot-cli' ? ['-h'] : ['copilot', '-h'];
    const result = spawnSync(cmd, args, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const output = (result.stdout || '') + (result.stderr || '');
    // Match the --model line and extract all quoted model names from choices
    const modelSection = output.match(/--model[\s\S]*?\(choices:\s*([\s\S]*?)\)/);
    if (modelSection) {
      const models = [...modelSection[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
      if (models.length > 0) return models;
    }
  } catch { /* fall through to empty */ }

  return [];
}

/** Detect which Copilot CLI backend is available */
function detectBackend(): CopilotBackend {
  if (detectedBackend !== null) return detectedBackend;

  // 1. Try new standalone Copilot CLI (`copilot -p`)
  try {
    execSync('copilot --version', { encoding: 'utf-8', timeout: 10000, stdio: 'pipe' });
    detectedBackend = 'copilot-cli';
    return detectedBackend;
  } catch { /* not available */ }

  // 2. Try legacy gh extension (`gh copilot -p`)
  try {
    execSync('gh copilot --version', { encoding: 'utf-8', timeout: 10000, stdio: 'pipe' });
    detectedBackend = 'gh-copilot';
    return detectedBackend;
  } catch { /* not available */ }

  detectedBackend = 'none';
  return detectedBackend;
}

/** Check if any Copilot CLI backend is available */
export function isCopilotAvailable(): boolean {
  return detectBackend() !== 'none';
}

/** Get a human-friendly name for the detected backend */
export function getCopilotBackendName(): string {
  const b = detectBackend();
  if (b === 'copilot-cli') return 'GitHub Copilot CLI';
  if (b === 'gh-copilot') return 'gh copilot extension (legacy)';
  return 'none';
}

/**
 * Truncate and clean a prompt for safe CLI usage.
 * Keeps it under the arg limit and collapses whitespace.
 * Detects output format from prompt content to avoid contradictory instructions.
 */
function preparePrompt(prompt: string, maxLen = 6000): string {
  // Detect if the prompt asks for a specific non-markdown format
  const isMermaid = /mermaid/i.test(prompt) && /diagram/i.test(prompt);
  const isJson = /valid JSON/i.test(prompt);

  let prefix: string;
  if (isMermaid) {
    prefix = 'IMPORTANT: Output ONLY the raw Mermaid diagram code. ' +
      'No markdown fences, no explanatory text, no narration, no commentary. ' +
      'Do NOT ask clarifying questions. Do NOT say "I will" or "Let me". ' +
      'Start directly with the diagram type keyword (flowchart, sequenceDiagram, erDiagram, etc). ' +
      'You may read project files for context but do NOT create or write any files.\n\n';
  } else if (isJson) {
    prefix = 'IMPORTANT: Output ONLY valid JSON. ' +
      'No markdown fences, no explanatory text, no narration, no commentary. ' +
      'Do NOT ask clarifying questions. ' +
      'You may read project files for context but do NOT create or write any files.\n\n';
  } else {
    prefix = 'IMPORTANT: Output ONLY the requested content in Markdown format. ' +
      'Do NOT include any explanatory text, narration, commentary, or phrases like ' +
      '"Let me", "I will", "Here is", "Based on". Start directly with the Markdown content. ' +
      'Do NOT ask clarifying questions — just generate the content. ' +
      'You may read project files for context but do NOT create or write any files.\n\n';
  }

  let clean = (prefix + prompt).replace(/\s+/g, ' ').trim();
  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen) + ' ... (truncated)';
  }
  return clean;
}

/**
 * Strip copilot agentic narration from output, keeping only the actual content.
 * Aggressively removes conversational text, tool usage narration, and meta-commentary.
 */
function cleanCopilotOutput(raw: string): string {
  let text = raw;

  // Remove tool_call/tool_result fenced blocks
  text = text.replace(/```(?:tool_call|tool_result)[\s\S]*?```/g, '');

  // Narration patterns to strip — matches full lines
  const narrationPatterns = [
    /^(?:Let me|I'll|I will|I need to|I'm going to|I should|Now I'll|Now I |Now let|Let's|OK,? |Perfect[!.,]|Great[!.,]|Sure[!.,]|Done[!.,]|Alright[!.,]).*/i,
    /^(?:I've (?:created|generated|written|updated|analyzed|completed|finished|prepared|built|compiled)).*/i,
    /^(?:Here(?:'s| is| are) (?:the|your|a|an)).*/i,
    /^(?:Based on (?:the|your|this|my)).*/i,
    /^(?:It (?:seems|looks|appears) (?:like |that )?(?:the|this|your)).*/i,
    /^(?:Since (?:the|this|we|you|I)).*/i,
    /^(?:This (?:is|will|should|would|could|appears|seems|looks|indicates|shows|means)).*/i,
    /^(?:The (?:analysis|report|output|result|file|content|project|code) (?:shows|indicates|suggests|reveals)).*/i,
    /^(?:To (?:create|generate|build|analyze|provide|help|summarize|address)).*/i,
    /^(?:(?:Looking|Checking|Analyzing|Reading|Scanning|Examining|Reviewing|Processing) (?:at |the |this |your |through )).*/i,
  ];

  const lines = text.split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Always keep empty lines
    if (trimmed === '') {
      cleaned.push(line);
      continue;
    }

    // Always keep markdown structural elements
    if (trimmed.startsWith('#') || trimmed.startsWith('|') || trimmed.startsWith('- ') ||
        trimmed.startsWith('* ') || trimmed.startsWith('> ') || trimmed.startsWith('```') ||
        /^\d+\.\s/.test(trimmed) || trimmed.startsWith('![') || trimmed.startsWith('[')) {
      cleaned.push(line);
      continue;
    }

    // Skip lines matching narration patterns
    if (narrationPatterns.some(p => p.test(trimmed))) {
      continue;
    }

    // Keep other content
    cleaned.push(line);
  }

  // Trim excessive blank lines
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Call Copilot CLI with a prompt and return the response text.
 * Uses spawnSync with args array to avoid all shell escaping issues.
 * Runs copilot from the project directory (read access) but excludes the write tool.
 * Supports both the new standalone `copilot` CLI and the legacy `gh copilot` extension.
 */
export async function askCopilot(prompt: string, options?: CopilotOptions): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!opts.projectDir) opts.projectDir = process.cwd();
  const backend = detectBackend();

  if (backend === 'none') {
    return '[Copilot analysis unavailable — no Copilot CLI found. Install via: npm i -g @github/copilot]';
  }

  const cleanPrompt = preparePrompt(prompt);

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      logger.debug(`Copilot call attempt ${attempt}/${opts.maxRetries} via ${backend}`);

      let stdout: string;
      let stderr: string;

      if (backend === 'copilot-cli') {
        // -p: non-interactive prompt
        // -s: silent/script mode (response only)
        // --allow-all-tools: auto-approve tool usage (required for non-interactive)
        // --excluded-tools write: block file writing — copilot can read but not write
        // --no-ask-user: don't ask clarifying questions
        // --model: fast model for bulk analysis
        // cwd: project directory so copilot can read source files
        const result = spawnSync('copilot', [
          '-p', cleanPrompt,
          '-s',
          '--allow-all-tools',
          '--excluded-tools', 'write',
          '--no-ask-user',
          '--model', globalModel,
        ], {
          encoding: 'utf-8',
          timeout: opts.timeoutMs,
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 1024 * 1024 * 10,
          cwd: opts.projectDir,
        });

        if (result.error) {
          throw result.error;
        }
        stdout = result.stdout || '';
        stderr = result.stderr || '';

        if (result.status !== 0 && !stdout.trim()) {
          throw new Error(stderr || `copilot exited with code ${result.status}`);
        }
      } else {
        // Legacy gh copilot -p
        const result = spawnSync('gh', [
          'copilot', '-p', cleanPrompt,
        ], {
          encoding: 'utf-8',
          timeout: opts.timeoutMs,
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 1024 * 1024 * 10,
          cwd: opts.projectDir,
        });

        if (result.error) {
          throw result.error;
        }
        stdout = result.stdout || '';
        stderr = result.stderr || '';

        if (result.status !== 0 && !stdout.trim()) {
          throw new Error(stderr || `gh copilot exited with code ${result.status}`);
        }
      }

      const trimmed = cleanCopilotOutput(stdout);
      if (trimmed) return trimmed;
      throw new Error('Empty response from Copilot CLI');
    } catch (err: any) {
      if (attempt === opts.maxRetries) {
        logger.error(`Copilot CLI call failed after ${opts.maxRetries} attempts`);
        logger.debug(err?.message?.slice(0, 200) || 'Unknown error');
        return `[Copilot analysis unavailable — ${(err?.message || 'command failed').slice(0, 150)}]`;
      }
      const delay = opts.retryDelayMs * Math.pow(2, attempt - 1);
      logger.debug(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  return '[Copilot analysis unavailable]';
}

/** Batch multiple Copilot calls sequentially with rate limiting */
export async function batchCopilotCalls(
  prompts: Array<{ key: string; prompt: string }>,
  delayBetweenMs = 1000,
  options?: CopilotOptions,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (let i = 0; i < prompts.length; i++) {
    const { key, prompt } = prompts[i];
    results.set(key, await askCopilot(prompt, options));
    if (i < prompts.length - 1) {
      await sleep(delayBetweenMs);
    }
  }
  return results;
}
