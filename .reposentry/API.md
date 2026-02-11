# API Documentation

## Overview

RepoSentry provides a web preview server for browsing generated analysis reports. The server renders Markdown files, Mermaid diagrams, and comparison reports with a premium interactive UI.

---

## Endpoints

### GET /

**Description:** Redirects to the first available report (HEALTH_REPORT.md, README.md, or first available file)

**Method:** GET

**Path:** `/`

**Parameters:** None

**Request Body:** Not applicable

**Response Format:**
- **Status Code:** 302 (Redirect) or 200 (HTML)
- **Content-Type:** `text/html`
- **Response Body:** Rendered HTML page with sidebar navigation

**Example:**

```bash
curl -L http://localhost:3000/
```

**Success Response (202 Redirect):**
```
HTTP/1.1 302 Found
Location: /view/HEALTH_REPORT.md
```

---

### GET /view/*filepath

**Description:** Renders a file from the output directory with syntax highlighting, Mermaid diagram support, and navigation

**Method:** GET

**Path:** `/view/{filepath}`

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| `filepath` | string | path (wildcard) | Relative path to file from output directory (supports `.md`, `.mmd`, or other text formats) |

**Request Body:** Not applicable

**Response Format:**
- **Status Code:** 200 (OK), 404 (File Not Found), 403 (Forbidden)
- **Content-Type:** `text/html`
- **Response Body:** Rendered HTML page with file content

**Security:** Path traversal protection blocks access outside output directory (e.g., `../../secrets.txt`)

**Example Usage:**

```bash
# View a Markdown file
curl http://localhost:3000/view/README.md

# View architecture diagram
curl http://localhost:3000/view/ARCHITECTURE.md

# View nested file
curl http://localhost:3000/view/security/SECURITY_AUDIT.md

# View Mermaid diagram
curl http://localhost:3000/view/diagrams/architecture.mmd
```

**Success Response (200):**
```html
HTTP/1.1 200 OK
Content-Type: text/html

<!doctype html>
<html>
  <head>
    <title>README.md — RepoSentry</title>
    ...
  </head>
  <body>
    <!-- Rendered HTML content -->
  </body>
</html>
```

**Error Response (404):**
```html
HTTP/1.1 404 Not Found
Content-Type: text/html

<!doctype html>
<html>
  ...
  <h1>404 — File Not Found</h1>
  ...
</html>
```

**Error Response (403):**
```html
HTTP/1.1 403 Forbidden
Content-Type: text/html

<!doctype html>
<html>
  ...
  <h1>403 — Forbidden</h1>
  ...
</html>
```

**Features:**
- Converts Markdown to HTML with syntax highlighting
- Embeds Mermaid diagrams from `\`\`\`mermaid` code blocks
- Supports `.md`, `.mmd`, and plain text files
- Interactive diagram zoom/pan with panzoom library
- Code copy buttons for code blocks
- Safe HTML rendering (prevents XSS attacks)

---

### GET /compare

**Description:** Displays score history and side-by-side comparison between analysis runs

**Method:** GET

**Path:** `/compare`

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `left` | integer (optional) | Run ID to compare against latest (1-indexed) |

**Request Body:** Not applicable

**Response Format:**
- **Status Code:** 200 (OK)
- **Content-Type:** `text/html`
- **Response Body:** HTML page with comparison table or history picker

**Example Usage:**

```bash
# View analysis history (picker)
curl http://localhost:3000/compare

# Compare run #2 vs latest run
curl http://localhost:3000/compare?left=2

# Compare run #5 vs latest run
curl http://localhost:3000/compare?left=5
```

**Success Response (History Picker - 200):**
```html
HTTP/1.1 200 OK
Content-Type: text/html

<!doctype html>
<html>
  <body>
    <h1>📊 Score Comparison</h1>
    <p>Select a previous run to compare against the latest (Run #3).</p>
    <table class="cmp-table">
      <thead>
        <tr>
          <th>ID</th><th>Date</th><th>Grade</th><th>Score</th><th>Categories</th><th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td><td>Feb 01, 10:00 AM</td><td>B</td><td>78</td>
          <td><span class="cmp-cat">Docs:72</span> <span class="cmp-cat">Arch:85</span></td>
          <td><a href="/compare?left=1">Compare</a></td>
        </tr>
        <tr class="cmp-latest">
          <td>3</td><td>Feb 09, 11:30 PM</td><td>A</td><td>92</td>
          <td><span class="cmp-cat">Docs:95</span> <span class="cmp-cat">Arch:90</span></td>
          <td><span class="cmp-tag">latest</span></td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
```

**Success Response (Side-by-Side Comparison - 200):**
```html
HTTP/1.1 200 OK
Content-Type: text/html

<!doctype html>
<html>
  <body>
    <h1>📊 Score Comparison: Run #1 vs #3</h1>
    <div class="cmp-summary cmp-good">
      📈 Your codebase health improved! (+14 points)
    </div>
    <table class="cmp-table">
      <thead>
        <tr>
          <th rowspan="2">Category</th>
          <th colspan="2">Run #1 — Feb 01, 10:00 AM</th>
          <th colspan="2">Run #3 — Feb 09, 11:30 PM</th>
          <th>Δ</th>
        </tr>
        <tr>
          <th>Grade</th><th>Score</th><th>Grade</th><th>Score</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Documentation</td>
          <td>B</td><td>72<div class="cmp-bar">...</div></td>
          <td>A</td><td>95<div class="cmp-bar">...</div></td>
          <td><span class="cmp-good">▲ +23</span></td>
        </tr>
        <tr class="cmp-overall">
          <td>OVERALL</td>
          <td>B</td><td>78</td>
          <td>A</td><td>92</td>
          <td><span class="cmp-good">▲ +14</span></td>
        </tr>
      </tbody>
    </table>
    <p><a class="cmp-link" href="/compare">← Back to history</a></p>
  </body>
</html>
```

**Error Response (No History - 200):**
```html
HTTP/1.1 200 OK
Content-Type: text/html

<!doctype html>
<html>
  <body>
    <h1>No History</h1>
    <p>Run <code>reposentry analyze</code> at least twice to compare scores.</p>
  </body>
</html>
```

**Error Response (Insufficient Data - 200):**
```html
HTTP/1.1 200 OK
Content-Type: text/html

<!doctype html>
<html>
  <body>
    <h1>Not Enough Data</h1>
    <p>Run <code>reposentry analyze</code> again to build history.</p>
  </body>
</html>
```

**Features:**
- History picker lists all previous analysis runs with dates and scores
- Side-by-side comparison table shows grade/score deltas
- Color-coded trend indicators (green ▲ for improvement, red ▼ for decline)
- Visual score bars with grade-based coloring
- Reads from `history.json` file in output directory

---

## Server Startup

### Starting the Server

```bash
reposentry serve --port 3000 --output .reposentry
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | 3000 | Port number to listen on |
| `-o, --output` | `.reposentry` | Path to output directory containing reports |

### Browser Access

```
http://localhost:3000
```

---

## Response Headers

All responses include standard HTTP headers:

```
Content-Type: text/html; charset=utf-8
X-Content-Type-Options: nosniff
Cache-Control: public, max-age=3600
```

---

## UI Features

- **Sidebar Navigation:** Auto-generated file tree from output directory
- **Search Palette:** Keyboard shortcut (Ctrl/Cmd + K) to jump to files
- **Diagram Viewer:** Interactive Mermaid diagrams with pan/zoom
- **Code Copy:** One-click copy buttons on code blocks
- **Dark Theme:** Premium dark UI with Indigo accent colors
- **Responsive Design:** Grid-based layout adapting to window size