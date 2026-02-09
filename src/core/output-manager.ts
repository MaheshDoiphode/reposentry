import { join, extname } from 'node:path';
import { existsSync, readdirSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { marked } from 'marked';
import { writeOutput, ensureDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { getCliVersion } from '../utils/version.js';

/** File extensions where code fences should be stripped (non-markdown raw files) */
const RAW_EXTENSIONS = new Set([
  '.yml', '.yaml', '.json', '.toml', '.ini', '.cfg', '.conf',
  '.env', '.sh', '.bash', '.ps1', '.bat', '.cmd',
  '.tf', '.hcl', '.dockerfile', '.mmd',
]);

/**
 * Strip markdown code fences from content intended for raw config files.
 * Handles ```yaml, ```dockerfile, ```json, etc. and nested fences.
 */
function stripCodeFences(content: string, filename: string): string {
  const ext = extname(filename).toLowerCase();
  const baseName = filename.toLowerCase();

  // Only strip fences for non-markdown raw files
  const isRaw = RAW_EXTENSIONS.has(ext) ||
    baseName.startsWith('dockerfile') ||
    baseName === '.env.example' ||
    baseName.endsWith('.suggested');

  if (!isRaw) return content;

  let result = content;

  // Remove opening ```lang and closing ``` fences
  // Handle multiple fence blocks — extract inner content
  const fencePattern = /^```[\w.-]*\s*\n([\s\S]*?)^```\s*$/gm;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(result)) !== null) {
    blocks.push(match[1]);
  }

  if (blocks.length > 0) {
    // Use the largest block (the main content), skip tiny explanation blocks
    const mainBlock = blocks.reduce((a, b) => a.length >= b.length ? a : b);
    result = mainBlock;
  }

  // Remove any remaining standalone fence markers
  result = result.replace(/^```[\w.-]*\s*$/gm, '').replace(/^```\s*$/gm, '');

  // Remove markdown-only header lines before the actual content (e.g., "# GitHub Actions CI/CD Workflow")
  // Only for YAML/Dockerfile/env files where markdown headers make no sense
  if (['.yml', '.yaml'].includes(ext) || baseName.startsWith('dockerfile') || baseName === '.env.example') {
    result = result.replace(/^#\s+[A-Z].*\n+/gm, (match, offset) => {
      // Keep YAML comments (lines starting with # inside YAML content)
      // Remove markdown-style headers only at the very start
      if (offset === 0 || result.slice(0, offset).trim() === '') return '';
      return match;
    });
  }

  return result.trim() + '\n';
}

export interface OutputOptions {
  baseDir: string;
  format: 'markdown' | 'html' | 'json';
  force: boolean;
}

export class OutputManager {
  private baseDir: string;
  private filesWritten: string[] = [];
  private contentByPath = new Map<string, string>();
  private htmlExports: Array<{ sourcePath: string; htmlPath: string; title: string }> = [];

  constructor(private options: OutputOptions) {
    this.baseDir = options.baseDir;
  }

  /** Files that must survive a --force wipe (persistent across runs) */
  private static readonly PRESERVED_FILES = ['history.json'];

  async init(): Promise<void> {
    const exists = existsSync(this.baseDir);
    if (exists) {
      const entries = readdirSync(this.baseDir, { withFileTypes: true });
      const nonEmpty = entries.some(e => e.name !== '.DS_Store');
      if (nonEmpty && !this.options.force) {
        throw new Error(
          `Output directory is not empty: ${this.baseDir}. Use --force or choose a different --output directory.`,
        );
      }
      if (nonEmpty && this.options.force) {
        // Backup persistent files before wiping
        const backups = new Map<string, string>();
        for (const name of OutputManager.PRESERVED_FILES) {
          const fp = join(this.baseDir, name);
          if (existsSync(fp)) {
            try { backups.set(name, readFileSync(fp, 'utf-8')); } catch { /* skip unreadable */ }
          }
        }

        rmSync(this.baseDir, { recursive: true, force: true });

        // Restore persistent files
        if (backups.size > 0) {
          mkdirSync(this.baseDir, { recursive: true });
          for (const [name, content] of backups) {
            writeFileSync(join(this.baseDir, name), content, 'utf-8');
          }
        }
      }
    }

    await ensureDir(this.baseDir);
  }

  async write(relativePath: string, content: string): Promise<void> {
    const fullPath = join(this.baseDir, relativePath);
    const cleaned = stripCodeFences(content, relativePath);
    await writeOutput(fullPath, cleaned);
    this.filesWritten.push(relativePath);
    logger.debug(`Written: ${relativePath}`);

    if (this.options.format === 'json') {
      this.contentByPath.set(relativePath, cleaned);
    }
    if (this.options.format === 'html') {
      await this.writeHtmlExport(relativePath, cleaned);
    }
  }

  async writeToSubdir(subdir: string, filename: string, content: string): Promise<void> {
    await this.write(join(subdir, filename), content);
  }

  getFilesWritten(): string[] {
    return [...this.filesWritten];
  }

  getFileCount(): number {
    return this.filesWritten.length;
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  async finalize(): Promise<void> {
    if (this.options.format === 'json') {
      const bundle = {
        tool: 'reposentry',
        version: getCliVersion(),
        generatedAt: new Date().toISOString(),
        files: [...this.contentByPath.entries()].map(([path, content]) => ({ path, content })),
      };
      await writeOutput(join(this.baseDir, 'bundle.json'), JSON.stringify(bundle, null, 2));
    }

    if (this.options.format === 'html') {
      await this.writeHtmlIndex();
    }
  }

  private async writeHtmlIndex(): Promise<void> {
    const items = this.htmlExports
      .map(e => `<li><a href="./${escapeAttr(e.htmlPath)}">${escapeHtml(e.title)}</a> <span class="muted">(${escapeHtml(e.sourcePath)})</span></li>`)
      .join('\n');

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RepoSentry HTML Export</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:32px;line-height:1.5}
    h1{margin:0 0 8px 0}
    .muted{color:#666;font-size:12px}
    ul{padding-left:18px}
    li{margin:6px 0}
  </style>
</head>
<body>
  <h1>RepoSentry HTML Export</h1>
  <div class="muted">Generated by reposentry v${escapeHtml(getCliVersion())} on ${escapeHtml(new Date().toLocaleString())}</div>
  <h2>Files</h2>
  <ul>
    ${items || '<li class="muted">No HTML exports generated.</li>'}
  </ul>
</body>
</html>`;

    await writeOutput(join(this.baseDir, 'html', 'index.html'), html);
  }

  private async writeHtmlExport(relativePath: string, content: string): Promise<void> {
    const ext = extname(relativePath).toLowerCase();
    const outBase = join(this.baseDir, 'html');

    if (ext === '.md') {
      const htmlPath = replaceExt(relativePath, '.html');
      const fullOut = join(outBase, htmlPath);

      const rendered = renderMarkdownToHtml(content);
      const page = wrapHtmlPage(relativePath, rendered);
      await writeOutput(fullOut, page);
      this.htmlExports.push({ sourcePath: relativePath, htmlPath: htmlPath.replace(/\\/g, '/'), title: relativePath });
      return;
    }

    if (ext === '.mmd') {
      const htmlPath = replaceExt(relativePath, '.html');
      const fullOut = join(outBase, htmlPath);
      const rendered = `<div class="mermaid">${escapeHtml(content)}</div>`;
      const page = wrapHtmlPage(relativePath, rendered);
      await writeOutput(fullOut, page);
      this.htmlExports.push({ sourcePath: relativePath, htmlPath: htmlPath.replace(/\\/g, '/'), title: relativePath });
      return;
    }

    // For non-markdown files, emit a simple preformatted viewer.
    const htmlPath = `${relativePath}.html`;
    const fullOut = join(outBase, htmlPath);
    const rendered = `<pre><code>${escapeHtml(content)}</code></pre>`;
    const page = wrapHtmlPage(relativePath, rendered);
    await writeOutput(fullOut, page);
    this.htmlExports.push({ sourcePath: relativePath, htmlPath: htmlPath.replace(/\\/g, '/'), title: relativePath });
  }
}

function replaceExt(path: string, newExt: string): string {
  return path.replace(/\.[^.]+$/, newExt);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(input: string): string {
  return escapeHtml(input).replace(/\n/g, '');
}

function renderMarkdownToHtml(markdown: string): string {
  // Prevent raw HTML in markdown from turning into executable HTML.
  const renderer = new marked.Renderer();
  (renderer as any).html = (token: any) => {
    const raw = token?.text ?? token?.raw ?? '';
    return escapeHtml(String(raw));
  };

  marked.use({ renderer });

  const html = marked.parse(markdown) as string;
  // Convert fenced mermaid blocks into divs for client-side rendering.
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    '<div class="mermaid">$1</div>',
  );
}

function wrapHtmlPage(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — RepoSentry Export</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:24px;line-height:1.55}
    pre{background:#0b1020;color:#e6edf3;padding:14px;border-radius:10px;overflow:auto}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
    .mermaid{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px;overflow:auto}
    h1,h2,h3{margin-top:18px}
  </style>
</head>
<body>
  ${bodyHtml}
  <script>
    try { mermaid.initialize({ startOnLoad: true, theme: 'default' }); } catch {}
  </script>
</body>
</html>`;
}
