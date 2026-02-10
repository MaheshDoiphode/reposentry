export interface PromptContext {
  projectName: string;
  languages: string[];
  frameworks: string[];
  packageManager?: string;
  fileTree?: string;
  codeContext?: string;
  additionalContext?: string;
}

/**
 * Build a structured prompt for Copilot CLI with code context.
 */
export function buildPrompt(
  task: string,
  context: PromptContext,
  outputFormat: 'markdown' | 'json' | 'mermaid' = 'markdown',
): string {
  const parts: string[] = [];

  parts.push(`You are analyzing a ${context.languages.join('/')} project called "${context.projectName}".`);

  if (context.frameworks.length > 0) {
    parts.push(`Frameworks/libraries: ${context.frameworks.join(', ')}.`);
  }

  if (context.packageManager) {
    parts.push(`Package manager: ${context.packageManager}.`);
  }

  if (context.fileTree) {
    parts.push(`Project structure:\n${context.fileTree}`);
  }

  if (context.codeContext) {
    parts.push(`Relevant code:\n${context.codeContext}`);
  }

  if (context.additionalContext) {
    parts.push(context.additionalContext);
  }

  parts.push(`Task: ${task}`);

  if (outputFormat === 'mermaid') {
    parts.push('Output ONLY valid Mermaid diagram syntax. No markdown fences, no explanation.');
  } else if (outputFormat === 'json') {
    parts.push('Output ONLY valid JSON. No markdown fences, no explanation.');
  } else {
    parts.push('Output in well-formatted Markdown.');
  }

  return parts.join('\n\n');
}

/** Build a concise file tree string for context injection */
export function buildFileTree(files: string[], maxLines = 50): string {
  const lines = files.slice(0, maxLines);
  const result = lines.join('\n');
  if (files.length > maxLines) {
    return result + `\n... and ${files.length - maxLines} more files`;
  }
  return result;
}
