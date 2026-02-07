import { describe, it, expect } from 'vitest';
import { embedMermaidInMarkdown, mermaidFlowchart, mermaidErDiagram } from '../../src/utils/mermaid.js';

describe('mermaid helpers', () => {
  it('should embed mermaid in markdown', () => {
    const result = embedMermaidInMarkdown('Test Diagram', 'flowchart TD\n  A --> B');
    expect(result).toContain('## Test Diagram');
    expect(result).toContain('```mermaid');
    expect(result).toContain('flowchart TD');
  });

  it('should create flowchart', () => {
    const result = mermaidFlowchart('TD', '  A --> B');
    expect(result).toBe('flowchart TD\n  A --> B');
  });

  it('should create ER diagram', () => {
    const result = mermaidErDiagram('  USER ||--o{ ORDER : places');
    expect(result).toContain('erDiagram');
    expect(result).toContain('USER');
  });
});
