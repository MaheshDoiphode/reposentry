/** Helpers for constructing Mermaid diagram syntax */

export function wrapMermaid(type: string, content: string): string {
  return `${type}\n${content}`;
}

export function mermaidFlowchart(direction: 'TD' | 'LR', nodes: string): string {
  return `flowchart ${direction}\n${nodes}`;
}

export function mermaidErDiagram(entities: string): string {
  return `erDiagram\n${entities}`;
}

export function mermaidSequence(actors: string): string {
  return `sequenceDiagram\n${actors}`;
}

export function embedMermaidInMarkdown(title: string, diagram: string): string {
  return `## ${title}\n\n\`\`\`mermaid\n${diagram}\n\`\`\`\n`;
}
