import express from 'express';
import { resolve, join, extname } from 'node:path';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { marked } from 'marked';

export interface ServerOptions {
  port: number;
  outputDir: string;
}

function collectFiles(dir: string, base = ''): Array<{ path: string; name: string }> {
  const results: Array<{ path: string; name: string }> = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(join(dir, entry.name), rel));
    } else {
      results.push({ path: rel, name: entry.name });
    }
  }
  return results;
}

function renderPage(title: string, content: string, sidebar: string, currentPath = ''): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — RepoSentry</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"><\/script>
  <style>
    :root {
      --bg: #ffffff; --fg: #24292f; --fg-muted: #656d76;
      --sidebar-bg: #f6f8fa; --sidebar-hover: #eaeef2;
      --border: #d0d7de; --border-subtle: #e8e8e8;
      --accent: #0969da; --accent-hover: #0550ae; --accent-subtle: #ddf4ff;
      --code-bg: #f6f8fa; --code-border: #d0d7de;
      --success: #1a7f37; --warning: #9a6700; --danger: #cf222e;
      --card-shadow: 0 1px 3px rgba(27,31,36,0.12), 0 1px 2px rgba(27,31,36,0.06);
      --radius: 8px;
    }
    [data-theme="dark"] {
      --bg: #0d1117; --fg: #e6edf3; --fg-muted: #8b949e;
      --sidebar-bg: #161b22; --sidebar-hover: #1c2128;
      --border: #30363d; --border-subtle: #21262d;
      --accent: #58a6ff; --accent-hover: #79c0ff; --accent-subtle: #0d1d30;
      --code-bg: #161b22; --code-border: #30363d;
      --success: #3fb950; --warning: #d29922; --danger: #f85149;
      --card-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      background: var(--bg); color: var(--fg); display: flex; min-height: 100vh;
      font-size: 15px; line-height: 1.6;
    }

    /* ─── Sidebar ─── */
    .sidebar {
      width: 280px; min-width: 280px; background: var(--sidebar-bg);
      border-right: 1px solid var(--border); padding: 0; overflow-y: auto;
      position: fixed; height: 100vh; display: flex; flex-direction: column;
      z-index: 100;
    }
    .sidebar-header {
      padding: 1.25rem 1rem 0.75rem; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 0.5rem;
    }
    .sidebar-header .logo { font-size: 1.4rem; }
    .sidebar-header h2 { font-size: 0.95rem; font-weight: 600; color: var(--fg); letter-spacing: -0.01em; }
    .sidebar-header .badge {
      font-size: 0.65rem; background: var(--accent-subtle); color: var(--accent);
      padding: 0.15rem 0.45rem; border-radius: 10px; font-weight: 500;
    }
    .search-wrap { padding: 0.75rem 1rem 0.5rem; }
    .search {
      width: 100%; padding: 0.45rem 0.7rem 0.45rem 2rem; border: 1px solid var(--border);
      border-radius: 6px; background: var(--bg); color: var(--fg); font-size: 0.82rem;
      outline: none; transition: border-color 0.15s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23656d76' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: 0.6rem center;
    }
    .search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); }
    .nav-content { flex: 1; overflow-y: auto; padding: 0.5rem 0.5rem; }
    .nav-section {
      font-size: 0.7rem; font-weight: 600; color: var(--fg-muted); text-transform: uppercase;
      letter-spacing: 0.05em; padding: 0.8rem 0.75rem 0.3rem; margin-top: 0.25rem;
    }
    .nav-section:first-child { margin-top: 0; }
    .sidebar a {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.75rem; color: var(--fg); text-decoration: none;
      border-radius: 6px; font-size: 0.84rem; margin-bottom: 1px; transition: background 0.1s;
    }
    .sidebar a:hover { background: var(--sidebar-hover); }
    .sidebar a.active { background: var(--accent-subtle); color: var(--accent); font-weight: 500; }
    .sidebar a .icon { font-size: 0.9rem; width: 1.2rem; text-align: center; flex-shrink: 0; }
    .sidebar-footer {
      padding: 0.75rem 1rem; border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: 0.5rem;
    }
    .theme-toggle {
      cursor: pointer; background: var(--bg); border: 1px solid var(--border);
      padding: 0.35rem 0.7rem; border-radius: 6px; color: var(--fg); font-size: 0.8rem;
      transition: background 0.15s; display: flex; align-items: center; gap: 0.4rem; flex: 1; justify-content: center;
    }
    .theme-toggle:hover { background: var(--sidebar-hover); }

    /* ─── Main Content ─── */
    .main {
      margin-left: 280px; padding: 2rem 3rem; max-width: 980px; width: 100%; min-height: 100vh;
    }
    .breadcrumb {
      font-size: 0.82rem; color: var(--fg-muted); margin-bottom: 1.5rem;
      display: flex; align-items: center; gap: 0.3rem;
    }
    .breadcrumb a { color: var(--accent); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .content-card {
      background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 2rem 2.5rem; box-shadow: var(--card-shadow);
    }

    /* ─── Markdown Typography ─── */
    .markdown-body h1 { font-size: 1.85rem; font-weight: 600; margin: 0 0 0.5rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--border); }
    .markdown-body h2 { font-size: 1.4rem; font-weight: 600; margin: 1.8rem 0 0.6rem; padding-bottom: 0.25rem; border-bottom: 1px solid var(--border-subtle); }
    .markdown-body h3 { font-size: 1.15rem; font-weight: 600; margin: 1.4rem 0 0.4rem; }
    .markdown-body h4 { font-size: 1rem; font-weight: 600; margin: 1.2rem 0 0.3rem; }
    .markdown-body p { margin: 0.6rem 0; }
    .markdown-body ul, .markdown-body ol { margin: 0.5rem 0; padding-left: 1.8rem; }
    .markdown-body li { margin: 0.25rem 0; }
    .markdown-body li input[type="checkbox"] { margin-right: 0.4rem; }
    .markdown-body blockquote {
      border-left: 3px solid var(--accent); padding: 0.5rem 1rem; margin: 0.8rem 0;
      color: var(--fg-muted); background: var(--accent-subtle); border-radius: 0 6px 6px 0;
    }
    .markdown-body pre {
      background: var(--code-bg); border: 1px solid var(--code-border);
      padding: 1rem 1.25rem; border-radius: 6px; overflow-x: auto;
      font-size: 0.85rem; line-height: 1.5; margin: 0.8rem 0;
    }
    .markdown-body code {
      background: var(--code-bg); padding: 0.2em 0.4em; border-radius: 4px;
      font-size: 0.88em; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    .markdown-body pre code { background: none; padding: 0; font-size: 0.85rem; border: none; }
    .markdown-body table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    .markdown-body th {
      background: var(--sidebar-bg); font-weight: 600; font-size: 0.85rem;
      text-align: left; padding: 0.6rem 0.9rem; border: 1px solid var(--border);
    }
    .markdown-body td { padding: 0.5rem 0.9rem; border: 1px solid var(--border); font-size: 0.88rem; }
    .markdown-body tr:nth-child(even) { background: var(--sidebar-bg); }
    .markdown-body img { max-width: 100%; border-radius: var(--radius); }
    .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
    .markdown-body a { color: var(--accent); text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body strong { font-weight: 600; }

    /* ─── Code file display ─── */
    .file-header {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem;
      background: var(--sidebar-bg); border: 1px solid var(--border);
      border-radius: var(--radius) var(--radius) 0 0; font-size: 0.85rem;
      font-weight: 500; color: var(--fg-muted);
    }
    .file-header + pre { border-top: none; border-radius: 0 0 var(--radius) var(--radius); margin-top: 0; }

    /* ─── Responsive ─── */
    .mobile-toggle {
      display: none; position: fixed; top: 0.75rem; left: 0.75rem; z-index: 200;
      background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
      padding: 0.4rem 0.6rem; cursor: pointer; font-size: 1.1rem;
    }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); transition: transform 0.2s; }
      .sidebar.open { transform: translateX(0); box-shadow: 4px 0 20px rgba(0,0,0,0.2); }
      .main { margin-left: 0; padding: 1rem 1.25rem; padding-top: 3.5rem; }
      .mobile-toggle { display: block; }
      .content-card { padding: 1.25rem; }
    }
  </style>
</head>
<body>
  <button class="mobile-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open')">☰</button>
  <nav class="sidebar">
    <div class="sidebar-header">
      <span class="logo">🛡️</span>
      <h2>RepoSentry</h2>
      <span class="badge">v0.1.0</span>
    </div>
    <div class="search-wrap">
      <input class="search" type="text" placeholder="Search files..." id="search" oninput="filterNav()">
    </div>
    <div class="nav-content">
      ${sidebar}
    </div>
    <div class="sidebar-footer">
      <button class="theme-toggle" onclick="toggleTheme()">
        <span id="theme-icon">🌙</span> <span id="theme-label">Dark mode</span>
      </button>
    </div>
  </nav>
  <main class="main">
    <div class="breadcrumb">
      <a href="/">RepoSentry</a> <span>/</span> <span>${title}</span>
    </div>
    <div class="content-card markdown-body">
      ${content}
    </div>
  </main>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default' });
    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.dataset.theme === 'dark';
      html.dataset.theme = isDark ? 'light' : 'dark';
      document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
      document.getElementById('theme-label').textContent = isDark ? 'Dark mode' : 'Light mode';
      mermaid.initialize({ startOnLoad: false, theme: isDark ? 'default' : 'dark' });
    }
    function filterNav() {
      const q = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('.nav-content a').forEach(a => {
        a.style.display = a.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
    // Highlight active nav link
    document.querySelectorAll('.nav-content a').forEach(a => {
      if (window.location.pathname === a.getAttribute('href')) a.classList.add('active');
    });
  </script>
</body>
</html>`;
}

export async function startServer(options: ServerOptions): Promise<void> {
  const app = express();
  const outputDir = resolve(process.cwd(), options.outputDir);

  if (!existsSync(outputDir)) {
    console.error(`❌ Output directory not found: ${outputDir}`);
    console.error('   Run `reposentry analyze` first.');
    process.exit(1);
  }

  const files = collectFiles(outputDir);

  // File icon mapping
  const fileIcons: Record<string, string> = {
    'HEALTH_REPORT.md': '❤️', 'README.md': '📖', 'API.md': '🔌',
    'SETUP.md': '⚙️', 'CONTRIBUTING.md': '🤝', 'CHANGELOG.md': '📋',
    'FAQ.md': '❓', 'ARCHITECTURE.md': '🏗️', 'SECURITY_REPORT.md': '🔒',
    'CODEOWNERS': '👥', 'take-it-to-prod.md': '🚀',
    'analysis.json': '📊', 'badge.md': '🏷️',
  };
  const extIcons: Record<string, string> = {
    '.yml': '📄', '.yaml': '📄', '.json': '📊', '.md': '📝',
    '.env': '🔧', '.sh': '💻', '.mmd': '📈',
  };
  function getIcon(name: string): string {
    if (fileIcons[name]) return fileIcons[name];
    const ext = extname(name);
    return extIcons[ext] || '📄';
  }

  // Section label mapping
  const sectionLabels: Record<string, string> = {
    root: '📚 Documentation',
    infrastructure: '🔧 Infrastructure',
    diagrams: '📈 Diagrams',
    security: '🔒 Security',
    team: '👥 Team',
    testing: '🧪 Testing',
  };

  // Build sidebar
  const sections = new Map<string, Array<{ path: string; name: string }>>();
  for (const file of files) {
    const dir = file.path.includes('/') ? file.path.split('/')[0] : 'root';
    if (!sections.has(dir)) sections.set(dir, []);
    sections.get(dir)!.push(file);
  }

  let sidebarHtml = '';
  for (const [section, sectionFiles] of sections) {
    sidebarHtml += `<div class="nav-section">${sectionLabels[section] || `📁 ${section}`}</div>`;
    for (const file of sectionFiles) {
      sidebarHtml += `<a href="/view/${file.path}"><span class="icon">${getIcon(file.name)}</span> ${file.name}</a>`;
    }
  }

  // Routes
  app.get('/', (_req, res) => {
    const indexFile = files.find(f => f.name === 'HEALTH_REPORT.md') || files.find(f => f.name === 'README.md') || files[0];
    if (indexFile) {
      res.redirect(`/view/${indexFile.path}`);
    } else {
      res.send(renderPage('Welcome', '<h1>No files generated yet</h1><p>Run <code>reposentry analyze</code> first.</p>', sidebarHtml));
    }
  });

  app.get('/view/*filepath', (req, res) => {
    // Express 5 returns wildcard params as an array of path segments
    const rawParam = req.params.filepath;
    const filePath = Array.isArray(rawParam) ? rawParam.join('/') : rawParam;
    const fullPath = join(outputDir, filePath);

    if (!existsSync(fullPath)) {
      res.status(404).send(renderPage('Not Found', '<h1>404 — File Not Found</h1>', sidebarHtml));
      return;
    }

    const content = readFileSync(fullPath, 'utf-8');
    const ext = extname(filePath);
    const fileName = filePath.split('/').pop() || filePath;

    if (ext === '.md') {
      const html = marked(content) as string;
      const mermaidHtml = html.replace(
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
        '<div class="mermaid">$1</div>',
      );
      res.send(renderPage(fileName, mermaidHtml, sidebarHtml, filePath));
    } else if (ext === '.mmd') {
      const mermaidHtml = `<div class="mermaid">${content}</div>`;
      res.send(renderPage(fileName, mermaidHtml, sidebarHtml, filePath));
    } else {
      const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const formatted = `<div class="file-header">📄 ${fileName}</div><pre><code>${escaped}</code></pre>`;
      res.send(renderPage(fileName, formatted, sidebarHtml, filePath));
    }
  });

  app.listen(options.port, () => {
    console.log(`\n🛡️  RepoSentry Preview Server`);
    console.log(`   📁 Serving: ${outputDir}`);
    console.log(`   🌐 Open: http://localhost:${options.port}`);
    console.log(`   📄 Files: ${files.length}`);
    console.log(`\n   Press Ctrl+C to stop.\n`);
  });
}
