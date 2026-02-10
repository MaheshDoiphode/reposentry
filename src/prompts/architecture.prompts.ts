import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function systemArchitecturePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate ONLY a Mermaid flowchart diagram (flowchart TD syntax) showing the high-level system architecture. Show major components (frontend, backend services, databases, external APIs) and their connections with labeled arrows. Output the raw mermaid code starting with "flowchart TD". No text before or after the diagram.',
    ctx,
    'mermaid',
  );
}

export function dataFlowPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate ONLY a Mermaid sequence diagram (sequenceDiagram syntax) showing how data flows through the system. Show the request lifecycle: Client, Frontend, API/Backend, Auth, Database. Output the raw mermaid code starting with "sequenceDiagram". No text before or after the diagram.',
    ctx,
    'mermaid',
  );
}

export function dependencyGraphPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate ONLY a Mermaid flowchart (flowchart LR syntax) showing the module/package dependency graph based on the import structure. Show which modules import from which other modules. Group related modules. Output the raw mermaid code starting with "flowchart LR". No text before or after the diagram.',
    ctx,
    'mermaid',
  );
}

export function erDiagramPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate ONLY a Mermaid ER diagram (erDiagram syntax) showing database tables/models, their columns with types, and relationships (one-to-many, many-to-many). Output the raw mermaid code starting with "erDiagram". No text before or after the diagram.',
    ctx,
    'mermaid',
  );
}

export function apiFlowPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate ONLY a Mermaid sequence diagram (sequenceDiagram syntax) showing the API request flow: Client ->> API Gateway ->> Auth Middleware ->> Route Handler ->> Service Layer ->> Database. Show success and error paths. Output the raw mermaid code starting with "sequenceDiagram". No text before or after the diagram.',
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
