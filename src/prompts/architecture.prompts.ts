import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function systemArchitecturePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Mermaid flowchart diagram showing the high-level system architecture. Show major components (services, databases, external APIs, message queues) and their relationships. Use flowchart TD syntax.',
    ctx,
    'mermaid',
  );
}

export function dataFlowPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Mermaid sequence diagram showing how data flows through the system. Show the request lifecycle from client through middleware, handlers, services, and database. Use sequenceDiagram syntax.',
    ctx,
    'mermaid',
  );
}

export function dependencyGraphPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Mermaid flowchart showing the module/package dependency graph. Show which modules import from which other modules. Use flowchart LR syntax. Keep it readable — group related modules.',
    ctx,
    'mermaid',
  );
}

export function erDiagramPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Mermaid ER diagram showing database tables/models, their columns, and relationships (one-to-many, many-to-many). Use erDiagram syntax.',
    ctx,
    'mermaid',
  );
}

export function apiFlowPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a Mermaid sequence diagram showing the API request flow: client → middleware chain → auth → validation → handler → service → database → response. Use sequenceDiagram syntax.',
    ctx,
    'mermaid',
  );
}

export function architectureDocPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate an ARCHITECTURE.md document explaining the system architecture. Include: overview, component descriptions, data flow explanation, key design decisions, and where to find each component in the codebase.',
    ctx,
  );
}
