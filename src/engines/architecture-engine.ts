import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { embedMermaidInMarkdown } from '../utils/mermaid.js';
import {
  systemArchitecturePrompt, dataFlowPrompt, dependencyGraphPrompt,
  erDiagramPrompt, apiFlowPrompt, architectureDocPrompt,
} from '../prompts/architecture.prompts.js';
import { ImportInfo } from '../scanners/import-parser.js';
import { ModelInfo } from '../scanners/model-detector.js';
import { RouteInfo } from '../scanners/route-detector.js';

export interface ArchitectureEngineInput {
  context: PromptContext;
  imports: ImportInfo[];
  models: ModelInfo[];
  routes: RouteInfo[];
}

export async function runArchitectureEngine(
  input: ArchitectureEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ score: number; details: string }> {
  progress.start('Architecture Engine', 6);

  const ctx = { ...input.context };

  // Add dependency info to context
  if (input.imports.length > 0) {
    const depSummary = input.imports
      .slice(0, 30)
      .map(i => `${i.file} → ${i.imports.join(', ')}`)
      .join('\n');
    ctx.additionalContext = (ctx.additionalContext || '') + `\nImport graph:\n${depSummary}`;
  }

  if (input.models.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nDatabase models:\n${input.models.map(m => `${m.name} (${m.orm}) in ${m.file}: ${m.fields.slice(0, 5).join(', ')}`).join('\n')}`;
  }

  if (input.routes.length > 0) {
    ctx.additionalContext = (ctx.additionalContext || '') +
      `\nAPI routes:\n${input.routes.map(r => `${r.method} ${r.path}`).join('\n')}`;
  }

  const diagrams: Array<{ key: string; label: string; promptFn: (c: PromptContext) => string; file: string; title: string }> = [
    { key: 'arch', label: 'System Architecture', promptFn: systemArchitecturePrompt, file: 'diagrams/architecture.mmd', title: 'System Architecture' },
    { key: 'dataflow', label: 'Data Flow', promptFn: dataFlowPrompt, file: 'diagrams/data-flow.mmd', title: 'Data Flow' },
    { key: 'deps', label: 'Dependency Graph', promptFn: dependencyGraphPrompt, file: 'diagrams/dependency-graph.mmd', title: 'Dependency Graph' },
    { key: 'er', label: 'Database Schema', promptFn: erDiagramPrompt, file: 'diagrams/database-schema.mmd', title: 'Database Schema' },
    { key: 'apiflow', label: 'API Flow', promptFn: apiFlowPrompt, file: 'diagrams/api-flow.mmd', title: 'API Request Flow' },
  ];

  const mermaidSections: string[] = [];

  for (const diag of diagrams) {
    progress.increment(diag.label);
    const prompt = diag.promptFn(ctx);
    const result = await askCopilot(prompt);
    await output.write(diag.file, result);
    mermaidSections.push(embedMermaidInMarkdown(diag.title, result));
  }

  // Generate Architecture doc with embedded diagrams
  progress.increment('ARCHITECTURE.md');
  const archDocPrompt = architectureDocPrompt(ctx);
  const archDoc = await askCopilot(archDocPrompt);
  const fullArchDoc = archDoc + '\n\n---\n\n' + mermaidSections.join('\n---\n\n');
  await output.write('ARCHITECTURE.md', fullArchDoc);

  progress.succeed('Architecture Engine');

  return {
    score: 85,
    details: `${diagrams.length} diagrams + architecture document generated`,
  };
}
