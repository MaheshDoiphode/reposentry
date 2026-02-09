import express from 'express';
import { resolve, join, extname, relative, isAbsolute, sep } from 'node:path';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { marked } from 'marked';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Prevent raw HTML inside markdown from turning into executable HTML.
// This is especially important if you run RepoSentry on untrusted repos.
const safeRenderer = new marked.Renderer();
(safeRenderer as any).html = (token: any) => {
  const raw = token?.text ?? token?.raw ?? '';
  return escapeHtml(String(raw));
};
marked.use({ renderer: safeRenderer });

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

function renderPage(title: string, content: string, sidebar: string, fileCount: number = 0): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — RepoSentry</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/panzoom@9.4.3/dist/panzoom.min.js"></script>
  <style>
    /* ======================================================
       RepoSentry — Premium Preview UI
       Completely hand-crafted. Zero frameworks.
       ====================================================== */

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
      --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

      /* Surfaces */
      --bg-root: #09090b;
      --bg-sidebar: rgba(12, 12, 15, 0.82);
      --bg-surface: rgba(255, 255, 255, 0.03);
      --bg-elevated: rgba(255, 255, 255, 0.055);
      --bg-hover: rgba(255, 255, 255, 0.07);
      --bg-active: rgba(255, 255, 255, 0.09);

      /* Borders */
      --border-subtle: rgba(255, 255, 255, 0.06);
      --border-default: rgba(255, 255, 255, 0.09);
      --border-strong: rgba(255, 255, 255, 0.14);

      /* Text */
      --text-primary: rgba(255, 255, 255, 0.95);
      --text-secondary: rgba(255, 255, 255, 0.60);
      --text-tertiary: rgba(255, 255, 255, 0.38);

      /* Accents */
      --accent: #6366f1;
      --accent-soft: rgba(99, 102, 241, 0.15);
      --accent-glow: rgba(99, 102, 241, 0.08);
      --teal: #2dd4bf;
      --teal-soft: rgba(45, 212, 191, 0.12);

      /* Radii */
      --radius-xs: 6px;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --radius-2xl: 24px;
    }

    html {
      height: 100%;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    body {
      height: 100%;
      font-family: var(--font);
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);
      background: var(--bg-root);
      overflow: hidden;
    }

    /* Ambient light — subtle moving gradient behind everything */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 10% 0%, rgba(99, 102, 241, 0.12), transparent),
        radial-gradient(ellipse 60% 50% at 90% 10%, rgba(45, 212, 191, 0.08), transparent),
        radial-gradient(ellipse 50% 40% at 50% 100%, rgba(99, 102, 241, 0.06), transparent);
      pointer-events: none;
      z-index: 0;
      animation: ambientShift 25s ease-in-out infinite alternate;
    }

    @keyframes ambientShift {
      0%   { opacity: 1; filter: hue-rotate(0deg); }
      100% { opacity: 0.7; filter: hue-rotate(15deg); }
    }

    /* ── Layout Shell ── */
    .shell {
      position: relative;
      z-index: 1;
      height: 100%;
      display: grid;
      grid-template-columns: 280px 1fr;
      grid-template-rows: 56px 1fr;
      grid-template-areas:
        "sidebar header"
        "sidebar content";
    }

    /* ── Header ── */
    .header {
      grid-area: header;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(9, 9, 11, 0.6);
      backdrop-filter: blur(40px) saturate(1.4);
      -webkit-backdrop-filter: blur(40px) saturate(1.4);
    }

    .header-breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .header-breadcrumb span {
      color: var(--text-tertiary);
      font-size: 13px;
      font-weight: 400;
    }

    .header-breadcrumb .sep {
      color: var(--text-tertiary);
      opacity: 0.5;
      font-size: 11px;
    }

    .header-breadcrumb .current {
      color: var(--text-primary);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    /* Shared button reset */
    .btn-ghost {
      appearance: none;
      border: 1px solid var(--border-default);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-family: var(--font);
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.2s var(--ease-out);
      user-select: none;
    }

    .btn-ghost:hover {
      background: var(--bg-hover);
      border-color: var(--border-strong);
      color: var(--text-primary);
    }

    .btn-ghost:active {
      transform: scale(0.97);
    }

    .btn-ghost svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .btn-ghost kbd {
      font-family: var(--mono);
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
      line-height: 1;
    }

    /* ── Sidebar ── */
    .sidebar {
      grid-area: sidebar;
      display: flex;
      flex-direction: column;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      backdrop-filter: blur(40px) saturate(1.3);
      -webkit-backdrop-filter: blur(40px) saturate(1.3);
      overflow: hidden;
    }

    .sidebar-brand {
      height: 56px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .sidebar-logo {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--accent), var(--teal));
      display: grid;
      place-items: center;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }

    .sidebar-logo::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.25));
      border-radius: inherit;
    }

    .sidebar-logo svg {
      width: 14px;
      height: 14px;
      color: white;
      position: relative;
      z-index: 1;
    }

    .sidebar-wordmark {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar-wordmark strong {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .sidebar-wordmark small {
      font-size: 11px;
      color: var(--text-tertiary);
      font-weight: 400;
    }

    .sidebar-search {
      padding: 12px 12px 4px;
      flex-shrink: 0;
    }

    .sidebar-search input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-family: var(--font);
      font-size: 13px;
      outline: none;
      transition: all 0.2s var(--ease-out);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 10px center;
    }

    .sidebar-search input::placeholder {
      color: var(--text-tertiary);
    }

    .sidebar-search input:focus {
      border-color: rgba(99, 102, 241, 0.5);
      background-color: var(--bg-elevated);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 8px 16px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }

    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .sidebar-section {
      margin-top: 16px;
    }

    .sidebar-section:first-child { margin-top: 4px; }

    .sidebar-section-label {
      padding: 4px 10px 6px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-tertiary);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all 0.15s var(--ease-out);
      margin-bottom: 1px;
      position: relative;
    }

    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--accent-soft);
      color: var(--text-primary);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 16px;
      border-radius: 0 3px 3px 0;
      background: var(--accent);
    }

    .nav-icon {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-xs);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      font-size: 13px;
      line-height: 1;
      transition: all 0.15s var(--ease-out);
    }

    .nav-item:hover .nav-icon {
      border-color: var(--border-default);
      background: var(--bg-active);
    }

    .nav-item.active .nav-icon {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .nav-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .nav-text-name {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    .nav-text-path {
      font-size: 11px;
      color: var(--text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--mono);
      line-height: 1.3;
    }

    .sidebar-footer {
      padding: 10px 12px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .sidebar-footer-hint {
      font-size: 11px;
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .sidebar-footer-hint kbd {
      font-family: var(--mono);
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }

    .sidebar-footer-badge {
      font-family: var(--mono);
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-tertiary);
    }

    /* ── Content Area ── */
    .content {
      grid-area: content;
      overflow: hidden;
    }

    .content-scroll {
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 28px 32px 48px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }

    .content-scroll::-webkit-scrollbar { width: 6px; }
    .content-scroll::-webkit-scrollbar-track { background: transparent; }
    .content-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

    .article {
      max-width: 860px;
      margin: 0 auto;
      animation: fadeUp 0.4s var(--ease-out) both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .article-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .article-header h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .article-header-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .article-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid var(--border-default);
      background: var(--bg-surface);
      color: var(--text-secondary);
    }

    .article-tag.accent {
      background: var(--accent-soft);
      border-color: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
    }

    /* ── Document Styles (Markdown) ── */
    .doc {
      line-height: 1.75;
      font-size: 14.5px;
      color: rgba(255, 255, 255, 0.85);
    }

    .doc > *:first-child { margin-top: 0; }

    .doc h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      margin: 48px 0 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .doc h2 {
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 40px 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .doc h3 {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin: 32px 0 10px;
    }

    .doc h4 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin: 24px 0 8px;
    }

    .doc p {
      margin: 12px 0;
    }

    .doc a {
      color: #818cf8;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s;
      border-bottom: 1px solid rgba(129, 140, 248, 0.3);
    }

    .doc a:hover {
      color: #a5b4fc;
      border-bottom-color: rgba(165, 180, 252, 0.6);
    }

    .doc strong { color: var(--text-primary); font-weight: 600; }

    .doc code {
      font-family: var(--mono);
      font-size: 0.88em;
      padding: 2px 7px;
      border-radius: var(--radius-xs);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: #c4b5fd;
      word-break: break-word;
    }

    .doc pre {
      position: relative;
      margin: 20px 0;
      padding: 18px 20px;
      border-radius: var(--radius-md);
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-default);
      overflow-x: auto;
      line-height: 1.65;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }

    .doc pre::-webkit-scrollbar { height: 4px; }
    .doc pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .doc pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.82);
      display: block;
    }

    .code-copy {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      border-radius: var(--radius-xs);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
      font-family: var(--font);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s var(--ease-out);
      opacity: 0;
    }

    .doc pre:hover .code-copy { opacity: 1; }

    .code-copy:hover {
      background: var(--bg-hover);
      color: var(--text-secondary);
      border-color: var(--border-strong);
    }

    .code-copy.copied {
      background: rgba(45, 212, 191, 0.15);
      border-color: rgba(45, 212, 191, 0.3);
      color: var(--teal);
    }

    .doc ul, .doc ol {
      margin: 12px 0;
      padding-left: 22px;
    }

    .doc li {
      margin: 4px 0;
    }

    .doc li::marker {
      color: var(--text-tertiary);
    }

    .doc hr {
      border: none;
      height: 1px;
      background: var(--border-subtle);
      margin: 32px 0;
    }

    .doc img {
      max-width: 100%;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
    }

    .doc blockquote {
      margin: 20px 0;
      padding: 14px 18px;
      border-left: 3px solid var(--accent);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      background: var(--accent-glow);
      color: rgba(255, 255, 255, 0.8);
    }

    .doc blockquote p:first-child { margin-top: 0; }
    .doc blockquote p:last-child { margin-bottom: 0; }

    .doc table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 20px 0;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
      overflow: hidden;
      font-size: 13px;
    }

    .doc th {
      text-align: left;
      padding: 10px 14px;
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border-default);
    }

    .doc td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-subtle);
      color: rgba(255, 255, 255, 0.8);
    }

    .doc tr:last-child td { border-bottom: none; }
    .doc tr:hover td { background: var(--bg-surface); }

    /* ── Mermaid Diagram Container ── */
    .diagram-container {
      position: relative;
      margin: 24px 0;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-default);
      background: rgba(0, 0, 0, 0.25);
      overflow: hidden;
      min-height: 300px;
    }

    .diagram-toolbar {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
      display: flex;
      gap: 4px;
      padding: 4px;
      background: rgba(9, 9, 11, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      opacity: 1;
      transform: translateY(0);
      transition: background 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
    }

    .diagram-container:hover .diagram-toolbar {
      background: rgba(9, 9, 11, 0.92);
      border-color: var(--border-strong);
    }

    .diagram-btn {
      appearance: none;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      padding: 6px 8px;
      border-radius: var(--radius-xs);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.15s;
      font-family: var(--font);
      font-size: 12px;
      font-weight: 500;
    }

    .diagram-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .diagram-btn svg { width: 16px; height: 16px; }

    .diagram-viewport {
      width: 100%;
      min-height: 300px;
      cursor: grab;
      overflow: hidden;
    }

    .diagram-viewport:active { cursor: grabbing; }

    .diagram-viewport .mermaid {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 280px;
      padding: 24px;
    }

    /* Hide raw mermaid text; show once an SVG child exists */
    .mermaid:not(.rs-rendered) {
      font-size: 0;
      color: transparent;
      min-height: 60px;
    }
    .mermaid.rs-rendered {
      font-size: inherit;
      color: inherit;
    }

    /* Make sure interactions work on the SVG */
    .diagram-viewport svg { pointer-events: auto; }

    /* Expand overlay — always visible at bottom-right */
    .diagram-expand {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      background: rgba(99, 102, 241, 0.85);
      border: 1px solid rgba(99, 102, 241, 0.6);
      color: #fff;
      font-family: var(--font);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
      transition: all 0.15s var(--ease-out);
      user-select: none;
    }

    .diagram-expand:hover {
      background: rgba(99, 102, 241, 1);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.45);
      transform: translateY(-1px);
    }

    .diagram-expand svg {
      width: 14px;
      height: 14px;
    }

    .diagram-viewport .mermaid svg {
      max-width: 100%;
      height: auto;
    }

    .diagram-zoom-hint {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 12px;
      background: rgba(9, 9, 11, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      font-size: 11px;
      color: var(--text-tertiary);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .diagram-container:hover .diagram-zoom-hint { opacity: 1; }

    /* Hide expand button when in modal */
    .diagram-container.in-modal .diagram-expand { display: none; }
    
    /* ── Diagram Modal (true fullscreen canvas) ── */
    .diagram-modal {
      position: fixed;
      inset: 0;
      z-index: 3500;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s var(--ease-out);
    }

    .diagram-modal.open {
      opacity: 1;
      pointer-events: auto;
    }

    .diagram-modal-card {
      width: min(1200px, calc(100vw - 48px));
      height: min(860px, calc(100vh - 48px));
      border-radius: var(--radius-2xl);
      background: rgba(12, 12, 15, 0.94);
      border: 1px solid var(--border-strong);
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.05),
        0 28px 120px rgba(0,0,0,0.82),
        0 0 160px rgba(99, 102, 241, 0.10);
      overflow: hidden;
      display: grid;
      grid-template-rows: 56px 1fr;
      transform: translateY(8px) scale(0.98);
      opacity: 0;
      transition: transform 0.28s var(--ease-spring), opacity 0.18s var(--ease-out);
    }

    .diagram-modal.open .diagram-modal-card {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .diagram-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(9, 9, 11, 0.6);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      min-width: 0;
    }

    .diagram-modal-title {
      font-weight: 650;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .diagram-modal-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .diagram-modal-stage {
      position: relative;
      padding: 16px;
      overflow: hidden;
    }

    .diagram-modal-stage .diagram-container {
      margin: 0;
      height: 100%;
      min-height: 0;
      border-radius: var(--radius-xl);
    }

    .diagram-modal-stage .diagram-viewport {
      height: 100%;
      min-height: 0;
    }

    .diagram-modal-stage .diagram-toolbar {
      opacity: 1;
      transform: translateY(0);
    }

    .diagram-modal-stage .diagram-zoom-hint {
      opacity: 1;
    }

    /* ── Command Palette ── */
    .palette-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s var(--ease-out);
    }

    .palette-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .palette-dialog {
      width: min(640px, 90vw);
      max-height: 420px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-strong);
      background: rgba(18, 18, 22, 0.95);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.05),
        0 24px 80px rgba(0,0,0,0.7),
        0 0 120px rgba(99, 102, 241, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: translateY(-8px) scale(0.98);
      transition: transform 0.25s var(--ease-spring), opacity 0.2s;
      opacity: 0;
    }

    .palette-overlay.open .palette-dialog {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .palette-input-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .palette-input-wrapper svg {
      width: 18px;
      height: 18px;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .palette-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--font);
      font-size: 15px;
      font-weight: 400;
      color: var(--text-primary);
    }

    .palette-input::placeholder { color: var(--text-tertiary); }

    .palette-esc {
      font-family: var(--mono);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
    }

    .palette-results {
      flex: 1;
      overflow-y: auto;
      padding: 6px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.06) transparent;
    }

    .palette-results::-webkit-scrollbar { width: 4px; }
    .palette-results::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

    .palette-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.1s;
      text-decoration: none;
      color: var(--text-secondary);
    }

    .palette-item:hover,
    .palette-item.selected {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .palette-item-icon {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-xs);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      display: grid;
      place-items: center;
      font-size: 12px;
      flex-shrink: 0;
    }

    .palette-item-text {
      flex: 1;
      min-width: 0;
    }

    .palette-item-name {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .palette-item-path {
      font-size: 11px;
      color: var(--text-tertiary);
      font-family: var(--mono);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .palette-item-shortcut {
      font-family: var(--mono);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .palette-empty {
      padding: 32px 16px;
      text-align: center;
      color: var(--text-tertiary);
      font-size: 13px;
    }

    /* ── Toast ── */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      padding: 8px 18px;
      border-radius: 999px;
      background: rgba(18, 18, 22, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-default);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      z-index: 3000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s var(--ease-spring);
    }

    .toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* ── Responsive Layout ── */
    @media (max-width: 768px) {
      .shell {
        grid-template-columns: 1fr;
        grid-template-rows: 56px 1fr;
        grid-template-areas:
          "header"
          "content";
      }

      .sidebar { display: none; }

      .content-scroll {
        padding: 20px 16px 40px;
      }

      .header {
        padding: 0 16px;
      }
    }

    /* ── Print Styles ── */
    @media print {
      body { background: white; color: #1a1a1a; }
      .sidebar, .header, .diagram-toolbar, .code-copy { display: none !important; }
      .shell { display: block; }
      .content-scroll { padding: 0; overflow: visible; }
      .doc h1, .doc h2, .doc h3 { color: #1a1a1a; }
      .doc pre { background: #f5f5f5; border-color: #ddd; }
    }
  </style>
</head>
<body>
  <div class="shell">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div class="sidebar-wordmark">
          <strong>RepoSentry</strong>
          <small>Documentation Preview</small>
        </div>
      </div>

      <div class="sidebar-search">
        <input type="text" id="sidebarSearch" placeholder="Search files..." autocomplete="off" spellcheck="false" />
      </div>

      <nav class="sidebar-nav" id="sidebarNav">
        ${sidebar}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-footer-hint">
          <kbd>Ctrl</kbd><kbd>K</kbd> to search
        </div>
        <span class="sidebar-footer-badge">${fileCount} files</span>
      </div>
    </aside>

    <!-- Header -->
    <header class="header">
      <div class="header-breadcrumb">
        <span>RepoSentry</span>
        <span class="sep">/</span>
        <span class="current">${title}</span>
      </div>
      <div class="header-actions">
        <button class="btn-ghost" id="btnCopy" title="Copy link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Copy Link
        </button>
        <button class="btn-ghost" id="btnPalette" title="Command palette">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <kbd>Ctrl K</kbd>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="content">
      <div class="content-scroll">
        <div class="article">
          <div class="doc" id="doc">${content}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Command Palette -->
  <div class="palette-overlay" id="palette">
    <div class="palette-dialog" role="dialog" aria-modal="true">
      <div class="palette-input-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input class="palette-input" id="paletteInput" placeholder="Search files, jump to anything..." autocomplete="off" spellcheck="false" />
        <span class="palette-esc">ESC</span>
      </div>
      <div class="palette-results" id="paletteResults"></div>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <!-- Diagram Modal -->
  <div class="diagram-modal" id="diagramModal" aria-hidden="true">
    <div class="diagram-modal-card" role="dialog" aria-modal="true" aria-label="Diagram viewer">
      <div class="diagram-modal-header">
        <div class="diagram-modal-title" id="diagramModalTitle">Diagram</div>
        <div class="diagram-modal-actions">
          <button class="btn-ghost" id="diagramModalClose" type="button" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
            Close <kbd>Esc</kbd>
          </button>
        </div>
      </div>
      <div class="diagram-modal-stage" id="diagramModalStage"></div>
    </div>
  </div>

  <script>
    /* ============================================
       RepoSentry — Interactive UI Logic
       ============================================ */

    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];

    /* ── Toast ── */
    function showToast(msg, duration = 2000) {
      const t = $('#toast');
      t.textContent = msg;
      t.classList.add('visible');
      clearTimeout(t._tid);
      t._tid = setTimeout(() => t.classList.remove('visible'), duration);
    }

    /* ── Diagram Modal ── */
    const diagramModal = $('#diagramModal');
    const diagramModalStage = $('#diagramModalStage');
    const diagramModalTitle = $('#diagramModalTitle');
    const diagramModalClose = $('#diagramModalClose');
    let activeDiagramContainer = null;

    function isDiagramModalOpen() {
      return diagramModal?.classList.contains('open');
    }

    function openDiagramModal(container, titleText) {
      if (!diagramModal || !diagramModalStage) return;
      if (!container) return;

      // If another is open, close it first
      if (activeDiagramContainer && activeDiagramContainer !== container) {
        closeDiagramModal();
      }

      // Create placeholder where the container was
      if (!container._rs_placeholder) {
        const ph = document.createElement('div');
        ph.setAttribute('data-diagram-placeholder', '');
        container.parentNode?.insertBefore(ph, container);
        container._rs_placeholder = ph;
      }

      // Move the diagram into modal stage
      diagramModalTitle.textContent = titleText || 'Diagram';
      diagramModalStage.innerHTML = '';
      diagramModalStage.appendChild(container);
      container.classList.add('in-modal');
      activeDiagramContainer = container;

      diagramModal.classList.add('open');
      diagramModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Switch to modal interaction mode (full pan/zoom)
      if (container._rs_updateMode) {
        container._rs_updateMode('modal');
      }
    }

    function closeDiagramModal() {
      if (!diagramModal) return;
      if (!activeDiagramContainer) {
        diagramModal.classList.remove('open');
        diagramModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        return;
      }

      const container = activeDiagramContainer;
      const ph = container._rs_placeholder;
      if (ph && ph.parentNode) {
        ph.parentNode.insertBefore(container, ph);
      }
      container.classList.remove('in-modal');
      activeDiagramContainer = null;

      diagramModal.classList.remove('open');
      diagramModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Switch back to inline interaction mode (static/buttons only)
      if (container._rs_updateMode) {
        container._rs_updateMode('inline');
      }
    }

    diagramModalClose?.addEventListener('click', closeDiagramModal);
    diagramModal?.addEventListener('click', (e) => {
      if (e.target === diagramModal) closeDiagramModal();
    });

    /* ── Sidebar Active State ── */
    const currentPath = window.location.pathname;
    $$('.nav-item').forEach(a => {
      if (a.getAttribute('href') === currentPath) {
        a.classList.add('active');
        requestAnimationFrame(() => {
          a.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }
    });

    /* ── Sidebar Filter ── */
    const sidebarSearch = $('#sidebarSearch');
    const sidebarNav = $('#sidebarNav');

    function filterSidebar(query) {
      const q = (query || '').toLowerCase().trim();
      const sections = $$('.sidebar-section');
      sections.forEach(section => {
        const items = [...section.querySelectorAll('.nav-item')];
        let anyVisible = false;
        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          const match = !q || text.includes(q);
          item.style.display = match ? '' : 'none';
          if (match) anyVisible = true;
        });
        const label = section.querySelector('.sidebar-section-label');
        if (label) label.style.display = anyVisible ? '' : 'none';
        section.style.display = anyVisible ? '' : 'none';
      });
    }

    sidebarSearch?.addEventListener('input', e => filterSidebar(e.target.value));

    /* ── Copy Link ── */
    $('#btnCopy')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard');
      } catch {
        showToast('Failed to copy link');
      }
    });

    /* ── Command Palette ── */
    const paletteOverlay = $('#palette');
    const paletteInput = $('#paletteInput');
    const paletteResults = $('#paletteResults');
    const allNavItems = $$('.nav-item[href]');
    let paletteSelectedIdx = 0;

    function openPalette() {
      paletteOverlay.classList.add('open');
      paletteInput.value = '';
      paletteSelectedIdx = 0;
      renderPaletteResults('');
      requestAnimationFrame(() => paletteInput.focus());
    }

    function closePalette() {
      paletteOverlay.classList.remove('open');
    }

    function renderPaletteResults(query) {
      const q = (query || '').toLowerCase().trim();
      const matches = allNavItems
        .filter(a => !q || a.textContent.toLowerCase().includes(q))
        .slice(0, 50);

      if (!matches.length) {
        paletteResults.innerHTML = '<div class="palette-empty">No files found</div>';
        return;
      }

      paletteResults.innerHTML = matches.map((a, i) => {
        const href = a.getAttribute('href');
        const icon = a.querySelector('.nav-icon')?.textContent?.trim() || '\\u{1F4C4}';
        const name = a.querySelector('.nav-text-name')?.textContent?.trim() || a.textContent.trim();
        const path = a.querySelector('.nav-text-path')?.textContent?.trim() || '';
        return '<a class="palette-item' + (i === paletteSelectedIdx ? ' selected' : '') + '" href="' + href + '">' +
          '<span class="palette-item-icon">' + icon + '</span>' +
          '<span class="palette-item-text">' +
            '<div class="palette-item-name">' + escapeHtml(name) + '</div>' +
            (path ? '<div class="palette-item-path">' + escapeHtml(path) + '</div>' : '') +
          '</span>' +
          '<span class="palette-item-shortcut">\\u21B5</span>' +
        '</a>';
      }).join('');
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function navigatePalette(dir) {
      const items = $$('.palette-item');
      if (!items.length) return;
      items[paletteSelectedIdx]?.classList.remove('selected');
      paletteSelectedIdx = Math.max(0, Math.min(items.length - 1, paletteSelectedIdx + dir));
      items[paletteSelectedIdx]?.classList.add('selected');
      items[paletteSelectedIdx]?.scrollIntoView({ block: 'nearest' });
    }

    function confirmPalette() {
      const items = $$('.palette-item');
      const selected = items[paletteSelectedIdx];
      if (selected) window.location.href = selected.getAttribute('href');
    }

    paletteInput?.addEventListener('input', e => {
      paletteSelectedIdx = 0;
      renderPaletteResults(e.target.value);
    });

    paletteInput?.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); navigatePalette(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); navigatePalette(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); confirmPalette(); }
    });

    paletteOverlay?.addEventListener('click', e => {
      if (e.target === paletteOverlay) closePalette();
    });

    $('#btnPalette')?.addEventListener('click', openPalette);

    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (paletteOverlay.classList.contains('open')) closePalette();
        else openPalette();
      }
      if (e.key === 'Escape') {
        if (isDiagramModalOpen()) {
          e.preventDefault();
          closeDiagramModal();
          return;
        }
        closePalette();
      }
    });

    /* ── Code Block Copy Buttons ── */
    $$('#doc pre').forEach(pre => {
      if (pre.querySelector('.code-copy')) return;
      const btn = document.createElement('button');
      btn.className = 'code-copy';
      btn.textContent = 'Copy';
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        const text = code ? code.textContent : pre.textContent;
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1500);
        } catch {}
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });

    /* ── Mermaid Initialization ── */
    try {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',
        themeVariables: {
          darkMode: true,
          background: 'transparent',
          primaryColor: '#312e81',
          primaryTextColor: '#e0e7ff',
          primaryBorderColor: '#4338ca',
          secondaryColor: '#1e3a5f',
          tertiaryColor: '#1a2332',
          lineColor: '#6366f1',
          textColor: '#c7d2fe',
          mainBkg: '#1e1b4b',
          nodeBorder: '#4338ca',
          clusterBkg: 'rgba(99,102,241,0.08)',
          clusterBorder: 'rgba(99,102,241,0.25)',
          titleColor: '#e0e7ff',
          edgeLabelBackground: '#1e1b4b',
          nodeTextColor: '#e0e7ff',
        }
      });
    } catch {}

    /* ── Mermaid Diagram Enhancement ── */

    // Mark mermaid elements once they have an SVG (hides raw text)
    function markRendered() {
      $$('.mermaid').forEach(el => {
        if (el.querySelector('svg') && !el.classList.contains('rs-rendered')) {
          el.classList.add('rs-rendered');
        }
      });
    }

    // Observe DOM for mermaid SVGs appearing
    const mermaidObserver = new MutationObserver(markRendered);
    const docEl = $('#doc');
    if (docEl) mermaidObserver.observe(docEl, { childList: true, subtree: true });

    function enhanceDiagrams() {
      markRendered();

      $$('#doc .mermaid').forEach(mermaidEl => {
        if (mermaidEl.closest('.diagram-container')) return;
        if (!mermaidEl.querySelector('svg')) return; // not rendered yet

        const container = document.createElement('div');
        container.className = 'diagram-container';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'diagram-toolbar';
        toolbar.innerHTML =
          '<button class="diagram-btn" data-action="zoom-in" title="Zoom in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg></button>' +
          '<button class="diagram-btn" data-action="zoom-out" title="Zoom out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg></button>' +
          '<button class="diagram-btn" data-action="reset" title="Reset view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>';

        // Viewport wrapper
        const viewport = document.createElement('div');
        viewport.className = 'diagram-viewport';

        // Expand button (always visible, highly visible)
        const expandBtn = document.createElement('button');
        expandBtn.className = 'diagram-expand';
        expandBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg> Expand';

        // Zoom hint
        const hint = document.createElement('div');
        hint.className = 'diagram-zoom-hint';
        hint.textContent = 'Scroll to zoom \u00B7 Drag to pan';

        mermaidEl.parentNode.insertBefore(container, mermaidEl);
        viewport.appendChild(mermaidEl);
        container.appendChild(toolbar);
        container.appendChild(viewport);
        container.appendChild(expandBtn);
        container.appendChild(hint);

        // Helper to open the modal for this diagram
        function openThisDiagram() {
          openDiagramModal(container, 'Diagram');
        }

        // Expand button: guaranteed click target
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openThisDiagram();
        });

        // Prepare the SVG for display
        const svg = mermaidEl.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = 'none';
          svg.removeAttribute('height');
          svg.style.width = '100%';
          svg.style.height = 'auto';
        }

        // Initialize Panzoom logic with mode switching
        if (typeof panzoom === 'function' && svg) {
          const pzWrapper = document.createElement('div');
          // Important: wrapper needs to be inline-block for proper centering, but we'll manage sizing via JS
          pzWrapper.style.cssText = 'display:inline-block; transform-origin:0 0; min-width:100%;';
          svg.parentNode.insertBefore(pzWrapper, svg);
          pzWrapper.appendChild(svg);

          let pzInstance = null;

          container._rs_updateMode = (mode) => {
            if (pzInstance) {
              pzInstance.dispose();
              pzInstance = null;
            }

            // Options based on mode
            const isModal = mode === 'modal';
            const options = {
              maxZoom: isModal ? 20 : 5,
              minZoom: 0.1,
              smoothScroll: true,
              zoomSpeed: 0.15,
              // To prevent panzoom from stealing clicks on buttons, we ignore those events
              beforeMouseDown: (e) => {
                const isButton = e.target.closest('button') || e.target.closest('.diagram-btn') || e.target.closest('.diagram-expand');
                if (isButton) return true; // Ignore (let button work)
                
                return false; // Enable pan always (inline & modal)
              }
              // Removed beforeWheel to allow pinch/scroll zoom in inline mode as requested
            };

            pzInstance = panzoom(pzWrapper, options);
            container._rs_panzoom = pzInstance;

            // Initial center
            if (isModal) {
              setTimeout(() => {
                // In modal, fit to screen logic
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                // quick reset
                pzInstance.moveTo(0, 0);
                pzInstance.zoomAbs(0, 0, 1);
                // Center roughly
                 const rect = pzWrapper.getBoundingClientRect();
                 if (rect.width && rect.height) {
                    const dx = (cw - rect.width) / 2;
                    const dy = (ch - rect.height) / 2;
                   pzInstance.moveTo(dx, dy);
                 }
              }, 50);
            } else {
               pzInstance.moveTo(0, 0);
               pzInstance.zoomAbs(0, 0, 1);
            }
          };

          // Initialize as inline
          container._rs_updateMode('inline');

          // Toolbar actions
          toolbar.addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn || !pzInstance) return;
            e.stopPropagation();
            const action = btn.dataset.action;
            const w = container.clientWidth;
            const h = container.clientHeight;

            if (action === 'zoom-in') {
              pzInstance.smoothZoom(w / 2, h / 2, 1.4);
            } else if (action === 'zoom-out') {
              pzInstance.smoothZoom(w / 2, h / 2, 0.7);
            } else if (action === 'reset') {
              pzInstance.moveTo(0, 0);
              pzInstance.zoomAbs(0, 0, 1);
            } else if (action === 'fullscreen') {
              openThisDiagram();
            }
          });
        }

        // Double-click anywhere on diagram also opens modal
        viewport.addEventListener('dblclick', (e) => {
          e.preventDefault();
          openThisDiagram();
        });
      });
    }

    // Schedule enhancement retries
    function scheduleEnhance() {
      enhanceDiagrams();
      setTimeout(enhanceDiagrams, 500);
      setTimeout(enhanceDiagrams, 1200);
      setTimeout(enhanceDiagrams, 2500);
    }
    window.addEventListener('load', scheduleEnhance);
    document.addEventListener('DOMContentLoaded', scheduleEnhance);
    setTimeout(scheduleEnhance, 100);

    /* ── Smooth Scroll Anchors ── */
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    /* ── Scroll Progress Indicator ── */
    const contentScroll = $('.content-scroll');
    const headerEl = $('header.header');
    if (contentScroll && headerEl) {
      const progressBar = document.createElement('div');
      progressBar.style.cssText = 'position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--teal));border-radius:1px;transition:width 0.15s ease-out;width:0%;z-index:10;';
      headerEl.style.position = 'relative';
      headerEl.appendChild(progressBar);

      contentScroll.addEventListener('scroll', () => {
        const el = contentScroll;
        const pct = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      });
    }
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

  let sidebarHtml = `<div class="sidebar-section"><div class="sidebar-section-label">⚡ Tools</div>
    <a class="nav-item" href="/compare">
      <span class="nav-icon">📊</span>
      <span class="nav-text">
        <span class="nav-text-name">Compare Scores</span>
        <span class="nav-text-path">Score history &amp; comparison</span>
      </span>
    </a>
  </div>`;
  for (const [section, sectionFiles] of sections) {
    const sectionTitle = sectionLabels[section] || ('📁 ' + section);
    sidebarHtml += `<div class="sidebar-section"><div class="sidebar-section-label">${sectionTitle}</div>`;
    for (const file of sectionFiles) {
      sidebarHtml += `<a class="nav-item" href="/view/${file.path}">
        <span class="nav-icon">${getIcon(file.name)}</span>
        <span class="nav-text">
          <span class="nav-text-name">${file.name}</span>
          <span class="nav-text-path">${file.path}</span>
        </span>
      </a>`;
    }
    sidebarHtml += `</div>`;
  }

  // Routes
  app.get('/', (_req, res) => {
    const indexFile = files.find(f => f.name === 'HEALTH_REPORT.md') || files.find(f => f.name === 'README.md') || files[0];
    if (indexFile) {
      res.redirect(`/view/${indexFile.path}`);
    } else {
      res.send(renderPage('Welcome', '<h1>No files generated yet</h1><p>Run <code>reposentry analyze</code> first.</p>', sidebarHtml, files.length));
    }
  });

  app.get('/view/*filepath', (req, res) => {
    // Express 5 returns wildcard params as an array of path segments
    const rawParam = req.params.filepath;
    const filePath = Array.isArray(rawParam) ? rawParam.join('/') : rawParam;
    const fullPath = resolve(outputDir, filePath);

    // Block path traversal (e.g., /view/../../secrets.txt)
    const rel = relative(outputDir, fullPath);
    if (rel.startsWith('..') || isAbsolute(rel) || rel.includes(`..${sep}`)) {
      res.status(403).send(renderPage('Forbidden', '<h1>403 — Forbidden</h1>', sidebarHtml, files.length));
      return;
    }

    if (!existsSync(fullPath)) {
      res.status(404).send(renderPage('Not Found', '<h1>404 — File Not Found</h1>', sidebarHtml, files.length));
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
      res.send(renderPage(fileName, mermaidHtml, sidebarHtml, files.length));
    } else if (ext === '.mmd') {
      const mermaidHtml = `<div class="mermaid">${content}</div>`;
      res.send(renderPage(fileName, mermaidHtml, sidebarHtml, files.length));
    } else {
      const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const formatted = `<pre><code>${escaped}</code></pre>`;
      res.send(renderPage(fileName, formatted, sidebarHtml, files.length));
    }
  });

  app.get('/compare', (req, res) => {
    const historyPath = join(outputDir, 'history.json');
    if (!existsSync(historyPath)) {
      res.send(renderPage('Compare', '<h1>No History</h1><p>Run <code>reposentry analyze</code> at least twice to compare scores.</p>', sidebarHtml, files.length));
      return;
    }

    let history: Array<{
      analyzedAt: string;
      overallScore: number;
      overallGrade: string;
      categories: Array<{ name: string; score: number; grade: string; details: string }>;
    }>;
    try {
      history = JSON.parse(readFileSync(historyPath, 'utf-8'));
    } catch {
      res.send(renderPage('Compare', '<h1>Error</h1><p>Could not parse history.json.</p>', sidebarHtml, files.length));
      return;
    }

    if (history.length < 2) {
      res.send(renderPage('Compare', '<h1>Not Enough Data</h1><p>Run <code>reposentry analyze</code> again to build history.</p>', sidebarHtml, files.length));
      return;
    }

    const leftId = req.query.left ? parseInt(req.query.left as string, 10) : null;
    const rightId = history.length; // always latest

    // If no left selected, show picker
    if (!leftId || isNaN(leftId) || leftId < 1 || leftId >= rightId) {
      let rows = '';
      for (let i = 0; i < history.length; i++) {
        const e = history[i];
        const id = i + 1;
        const isLatest = i === history.length - 1;
        const date = new Date(e.analyzedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const gradeClass = e.overallScore >= 80 ? 'cmp-good' : e.overallScore >= 60 ? 'cmp-warn' : 'cmp-bad';
        const cats = e.categories.map(c => '<span class="cmp-cat">' + c.name.substring(0, 4) + ':' + c.score + '</span>').join(' ');
        if (isLatest) {
          rows += '<tr class="cmp-latest"><td>' + id + '</td><td>' + date + '</td><td class="' + gradeClass + '">' + e.overallGrade + '</td><td class="' + gradeClass + '">' + e.overallScore + '</td><td>' + cats + '</td><td><span class="cmp-tag">latest</span></td></tr>';
        } else {
          rows += '<tr><td>' + id + '</td><td>' + date + '</td><td class="' + gradeClass + '">' + e.overallGrade + '</td><td class="' + gradeClass + '">' + e.overallScore + '</td><td>' + cats + '</td><td><a class="cmp-link" href="/compare?left=' + id + '">Compare</a></td></tr>';
        }
      }

      const pickerHtml = `
        <h1>📊 Score Comparison</h1>
        <p>Select a previous run to compare against the latest (Run #${rightId}).</p>
        <table class="cmp-table">
          <thead><tr><th>ID</th><th>Date</th><th>Grade</th><th>Score</th><th>Categories</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <style>
          .cmp-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 14px; border: 1px solid rgba(255,255,255,0.10); overflow: hidden; margin-top: 20px; }
          .cmp-table th { background: rgba(255,255,255,0.06); padding: 12px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.10); }
          .cmp-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: rgba(255,255,255,0.85); }
          .cmp-table tr:last-child td { border-bottom: none; }
          .cmp-table tr:hover td { background: rgba(255,255,255,0.03); }
          .cmp-latest td { opacity: 0.5; }
          .cmp-good { color: #34d399; font-weight: 700; }
          .cmp-warn { color: #fbbf24; font-weight: 700; }
          .cmp-bad { color: #fb7185; font-weight: 700; }
          .cmp-cat { display: inline-block; font-family: var(--mono, monospace); font-size: 11px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); border-radius: 6px; padding: 2px 6px; margin: 1px 2px; }
          .cmp-tag { font-size: 11px; background: rgba(99,102,241,0.25); border: 1px solid rgba(99,102,241,0.4); border-radius: 6px; padding: 3px 8px; color: rgba(255,255,255,0.7); }
          .cmp-link { display: inline-block; padding: 6px 14px; border-radius: 8px; background: linear-gradient(135deg, rgba(99,102,241,0.8), rgba(34,211,238,0.6)); color: #fff; font-weight: 600; font-size: 12px; text-decoration: none; transition: transform 0.1s; }
          .cmp-link:hover { transform: translateY(-1px); opacity: 0.9; }
        </style>`;
      res.send(renderPage('Compare Scores', pickerHtml, sidebarHtml, files.length));
      return;
    }

    // Build side-by-side comparison
    const older = history[leftId - 1];
    const latest = history[rightId - 1];
    const olderMap = new Map(older.categories.map(c => [c.name, c]));
    const latestMap = new Map(latest.categories.map(c => [c.name, c]));
    const allCats = [...new Set([...olderMap.keys(), ...latestMap.keys()])];

    let catRows = '';
    for (const cat of allCats) {
      const o = olderMap.get(cat);
      const l = latestMap.get(cat);
      const scoreBefore = o ? o.score : 0;
      const scoreAfter = l ? l.score : 0;
      const diff = scoreAfter - scoreBefore;
      const diffStr = diff > 0 ? '<span class="cmp-good">▲ +' + diff + '</span>' : diff < 0 ? '<span class="cmp-bad">▼ ' + diff + '</span>' : '<span style="opacity:.5">—</span>';
      const barBefore = '<div class="cmp-bar"><div class="cmp-bar-fill" style="width:' + scoreBefore + '%;background:rgba(255,255,255,0.2)"></div></div>';
      const barAfter = '<div class="cmp-bar"><div class="cmp-bar-fill" style="width:' + scoreAfter + '%;background:' + (scoreAfter >= 80 ? 'rgba(52,211,153,0.7)' : scoreAfter >= 60 ? 'rgba(251,191,36,0.7)' : 'rgba(251,113,133,0.7)') + '"></div></div>';

      catRows += '<tr>' +
        '<td style="font-weight:600">' + cat + '</td>' +
        '<td>' + (o ? o.grade : '—') + '</td><td>' + scoreBefore + barBefore + '</td>' +
        '<td>' + (l ? l.grade : '—') + '</td><td>' + scoreAfter + barAfter + '</td>' +
        '<td style="text-align:center">' + diffStr + '</td>' +
        '</tr>';
    }

    // Overall row
    const overallDiff = latest.overallScore - older.overallScore;
    const overallDiffStr = overallDiff > 0 ? '<span class="cmp-good">▲ +' + overallDiff + '</span>' : overallDiff < 0 ? '<span class="cmp-bad">▼ ' + overallDiff + '</span>' : '<span style="opacity:.5">—</span>';

    const olderDate = new Date(older.analyzedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const latestDate = new Date(latest.analyzedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const summaryEmoji = overallDiff > 0 ? '📈' : overallDiff < 0 ? '📉' : '➡️';
    const summaryText = overallDiff > 0 ? 'Your codebase health improved!' : overallDiff < 0 ? 'Score decreased. Check categories above.' : 'No change in overall score.';
    const summaryClass = overallDiff > 0 ? 'cmp-good' : overallDiff < 0 ? 'cmp-bad' : '';

    const compareHtml = `
      <h1>📊 Score Comparison: Run #${leftId} vs #${rightId}</h1>
      <div class="cmp-summary ${summaryClass}">${summaryEmoji} ${summaryText} (${overallDiff > 0 ? '+' : ''}${overallDiff} points)</div>
      <table class="cmp-table">
        <thead>
          <tr>
            <th rowspan="2" style="vertical-align:bottom">Category</th>
            <th colspan="2" style="text-align:center;border-bottom:1px solid rgba(255,255,255,0.1)">Run #${leftId} — ${olderDate}</th>
            <th colspan="2" style="text-align:center;border-bottom:1px solid rgba(255,255,255,0.1)">Run #${rightId} — ${latestDate}</th>
            <th rowspan="2" style="text-align:center;vertical-align:bottom">Δ</th>
          </tr>
          <tr>
            <th>Grade</th><th>Score</th>
            <th>Grade</th><th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${catRows}
          <tr class="cmp-overall">
            <td style="font-weight:700">OVERALL</td>
            <td>${older.overallGrade}</td><td>${older.overallScore}</td>
            <td>${latest.overallGrade}</td><td>${latest.overallScore}</td>
            <td style="text-align:center">${overallDiffStr}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:18px"><a class="cmp-link" href="/compare">← Back to history</a></p>
      <style>
        .cmp-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 14px; border: 1px solid rgba(255,255,255,0.10); overflow: hidden; margin-top: 20px; }
        .cmp-table th { background: rgba(255,255,255,0.06); padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.10); }
        .cmp-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: rgba(255,255,255,0.85); }
        .cmp-table tr:last-child td { border-bottom: none; }
        .cmp-overall td { background: rgba(255,255,255,0.04); font-weight: 600; border-top: 2px solid rgba(255,255,255,0.15); }
        .cmp-good { color: #34d399; font-weight: 700; }
        .cmp-warn { color: #fbbf24; font-weight: 700; }
        .cmp-bad { color: #fb7185; font-weight: 700; }
        .cmp-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; margin-top: 4px; overflow: hidden; }
        .cmp-bar-fill { height: 100%; border-radius: 3px; transition: width .3s ease; }
        .cmp-summary { margin: 16px 0; padding: 14px 18px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); font-size: 15px; font-weight: 600; }
        .cmp-summary.cmp-good { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.25); }
        .cmp-summary.cmp-bad { background: rgba(251,113,133,0.08); border-color: rgba(251,113,133,0.25); }
        .cmp-link { display: inline-block; padding: 6px 14px; border-radius: 8px; background: linear-gradient(135deg, rgba(99,102,241,0.8), rgba(34,211,238,0.6)); color: #fff; font-weight: 600; font-size: 12px; text-decoration: none; transition: transform 0.1s; }
        .cmp-link:hover { transform: translateY(-1px); opacity: 0.9; }
      </style>`;

    res.send(renderPage('Compare Scores', compareHtml, sidebarHtml, files.length));
  });

  app.listen(options.port, () => {
    console.log(`\n🛡️  RepoSentry Preview Server`);
    console.log(`   📁 Serving: ${outputDir}`);
    console.log(`   🌐 Open: http://localhost:${options.port}`);
    console.log(`   📄 Files: ${files.length}`);
    console.log(`\n   Press Ctrl+C to stop.\n`);
  });
}
