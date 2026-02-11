```markdown
# RepoSentry API Test Documentation

## Overview

RepoSentry provides a web server for previewing analysis reports. This document contains comprehensive API testing specifications for all available endpoints.

**Base URL:** `http://localhost:{port}`

**Server Framework:** Express.js v5.2.1  
**Content Types:** HTML, JSON (for history data)

---

## API Endpoints

### 1. GET /

**Description:**  
Home endpoint that redirects to the first available analysis report. Serves as the entry point for the web UI. Attempts to display the HEALTH_REPORT.md if available, falls back to README.md, or the first generated file. If no files exist, displays a welcome message.

**Method:** `GET`  
**Path:** `/`  
**Query Parameters:** None  
**Request Body:** None

**Example Request:**

```bash
curl -X GET http://localhost:3000/
```

**Expected Response:**

- **Success (302 Found):** Redirects to `/view/{indexFile.path}`
- **No Files (200 OK):** Renders welcome page with message "No files generated yet. Run `reposentry analyze` first."

**Response Headers:**
```
Location: /view/HEALTH_REPORT.md
Content-Type: text/html; charset=utf-8
```

**Response Body Example (No Files):**
```html
<!doctype html>
<html lang="en">
<head>
    <title>Welcome — RepoSentry</title>
    ...
</head>
<body>
    <h1>No files generated yet</h1>
    <p>Run <code>reposentry analyze</code> first.</p>
</body>
</html>
```

**Edge Cases & Tests:**

| Test Case | Input | Expected Behavior | Status Code |
|-----------|-------|-------------------|------------|
| Normal redirect to HEALTH_REPORT.md | Request root | Redirect to `/view/HEALTH_REPORT.md` | 302 |
| Fallback to README.md | No HEALTH_REPORT.md | Redirect to `/view/README.md` | 302 |
| Fallback to first file | No HEALTH_REPORT or README | Redirect to first available file | 302 |
| No files exist | Empty output directory | Display welcome page | 200 |
| Malformed request | Invalid HTTP method | Method not allowed | 405 |

---

### 2. GET /view/*filepath

**Description:**  
Serves analysis report files with dynamic rendering. Supports Markdown (.md), Mermaid diagrams (.mmd), and plain text files. Includes security protections against path traversal attacks. Automatically converts Mermaid code blocks in Markdown to interactive diagrams.

**Method:** `GET`  
**Path:** `/view/*filepath`  
**Query Parameters:** None  
**Request Body:** None

**Path Parameters:**
- `filepath` (required): Relative path to the file within the output directory. Supports nested directories.

**Example Requests:**

```bash
# Markdown file
curl -X GET http://localhost:3000/view/HEALTH_REPORT.md

# Nested file
curl -X GET http://localhost:3000/view/reports/security-audit.md

# Mermaid diagram
curl -X GET http://localhost:3000/view/architecture.mmd

# Plain text file
curl -X GET http://localhost:3000/view/package.json
```

**Expected Response:**

- **Success (200 OK):** Renders file content as HTML with proper syntax highlighting and formatting

**Response Headers:**
```
Content-Type: text/html; charset=utf-8
```

**Response Body Example (Markdown File):**
```html
<!doctype html>
<html lang="en">
<head>
    <title>HEALTH_REPORT.md — RepoSentry</title>
    ...
</head>
<body>
    <div class="content">
        <h1>Codebase Health Report</h1>
        <p>Comprehensive analysis of your repository...</p>
        <div class="mermaid">...</div>
    </div>
</body>
</html>
```

**Edge Cases & Tests:**

| Test Case | Input | Expected Behavior | Status Code |
|-----------|-------|-------------------|------------|
| Valid Markdown file | `/view/HEALTH_REPORT.md` | Renders as HTML with Mermaid support | 200 |
| Valid Mermaid file | `/view/architecture.mmd` | Renders as interactive diagram | 200 |
| Valid text file | `/view/config.json` | Renders in `<pre><code>` block | 200 |
| File not found | `/view/nonexistent.md` | Error page: "404 — File Not Found" | 404 |
| Path traversal attempt | `/view/../../secrets.txt` | Error page: "403 — Forbidden" | 403 |
| Path traversal with separator | `/view/..%5C..%5Csecrets.txt` | Error page: "403 — Forbidden" | 403 |
| Absolute path attempt | `/view//etc/passwd` | Error page: "403 — Forbidden" | 403 |
| Empty filepath | `/view/` | File not found or directory listing error | 404 |
| Deeply nested valid path | `/view/reports/security/findings.md` | Renders file if exists | 200/404 |
| HTML injection in filename | `/view/<script>alert('xss')</script>.md` | File not found (not valid filename) | 404 |
| HTML content in Markdown | `/view/report.md` containing raw HTML | HTML is escaped for security | 200 |

**Security Notes:**
- Path traversal is prevented by checking: `rel.startsWith('..')`, `isAbsolute(rel)`, or `rel.includes(..${sep})`
- HTML content in Markdown files is escaped to prevent XSS attacks
- Raw HTML tags in Markdown are rendered as escaped text, not executable HTML

---

### 3. GET /compare

**Description:**  
Displays score comparison UI for tracking health metrics over time. Shows historical analysis runs with grades and scores. If only one run exists, prompts user to run analysis again. Allows side-by-side comparison of any two runs.

**Method:** `GET`  
**Path:** `/compare`  
**Query Parameters:**
- `left` (optional): Run ID (1-based index) to compare against the latest run

**Request Body:** None

**Example Requests:**

```bash
# View history picker
curl -X GET http://localhost:3000/compare

# Compare specific run with latest
curl -X GET "http://localhost:3000/compare?left=1"

# Compare run #5 with latest
curl -X GET "http://localhost:3000/compare?left=5"
```

**Expected Response:**

- **No History (200 OK):** Renders page: "No History - Run `reposentry analyze` at least twice to compare scores."
- **Insufficient Data (200 OK):** Renders page: "Not Enough Data - Run `reposentry analyze` again to build history."
- **History Picker (200 OK):** Shows table of all runs with dates, grades, scores, and compare links
- **Comparison (200 OK):** Displays side-by-side comparison of two runs with category breakdowns and deltas

**Response Headers:**
```
Content-Type: text/html; charset=utf-8
```

**Response Body Structure (History Picker):**
```html
<h1>📊 Score Comparison</h1>
<p>Select a previous run to compare against the latest (Run #5).</p>
<table class="cmp-table">
  <thead>
    <tr>
      <th>ID</th><th>Date</th><th>Grade</th><th>Score</th><th>Categories</th><th></th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Feb 1, 10:30 AM</td><td>B</td><td>78</td><td>Arch:75 Sec:80 ...</td><td><a href="/compare?left=1">Compare</a></td></tr>
    <tr class="cmp-latest"><td>5</td><td>Feb 9, 11:45 PM</td><td>A</td><td>85</td><td>Arch:88 Sec:90 ...</td><td><span>latest</span></td></tr>
  </tbody>
</table>
```

**Response Body Structure (Comparison):**
```html
<h1>📊 Score Comparison: Run #1 vs #5</h1>
<div class="cmp-summary cmp-good">📈 Your codebase health improved! (+7 points)</div>
<table class="cmp-table">
  <thead>
    <tr>
      <th rowspan="2">Category</th>
      <th colspan="2">Run #1 — Feb 1, 10:30 AM</th>
      <th colspan="2">Run #5 — Feb 9, 11:45 PM</th>
      <th rowspan="2">Δ</th>
    </tr>
    <tr>
      <th>Grade</th><th>Score</th><th>Grade</th><th>Score</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Architecture</td><td>B</td><td>75</td><td>A</td><td>88</td><td>▲ +13</td></tr>
    <tr class="cmp-overall"><td>OVERALL</td><td>B</td><td>78</td><td>A</td><td>85</td><td>▲ +7</td></tr>
  </tbody>
</table>
```

**Edge Cases & Tests:**

| Test Case | Input | Expected Behavior | Status Code |
|-----------|-------|-------------------|------------|
| No history file exists | GET /compare | Display "No History" message | 200 |
| Only one run in history | GET /compare | Display "Not Enough Data" message | 200 |
| Valid left parameter (first run) | GET /compare?left=1 | Show comparison with latest | 200 |
| Valid left parameter (middle run) | GET /compare?left=3 | Show comparison with latest | 200 |
| left = latest run ID | GET /compare?left=5 (if 5 is latest) | Invalid (left >= right); show picker | 200 |
| left > total runs | GET /compare?left=999 | Invalid; show picker | 200 |
| left = 0 | GET /compare?left=0 | Invalid (< 1); show picker | 200 |
| left < 0 | GET /compare?left=-1 | Invalid; show picker | 200 |
| left = NaN | GET /compare?left=abc | Show picker (NaN check) | 200 |
| left not provided | GET /compare | Show picker with all runs | 200 |
| Corrupted history.json | File exists but invalid JSON | Display "Error" message | 200 |
| history.json empty array | GET /compare | Display "Not Enough Data" message | 200 |
| Missing left query param | GET /compare | Show history picker (default) | 200 |
| Multiple left params | GET /compare?left=1&left=2 | Uses first value | 200 |
| history.json missing analyzedAt | Malformed entry | May cause rendering issues | 200 |

**History.json Format Expected:**
```json
[
  {
    "analyzedAt": "2025-02-01T10:30:00Z",
    "overallScore": 78,
    "overallGrade": "B",
    "categories": [
      {
        "name": "Architecture",
        "score": 75,
        "grade": "B",
        "details": "..."
      },
      {
        "name": "Security",
        "score": 80,
        "grade": "A",
        "details": "..."
      }
    ]
  },
  {
    "analyzedAt": "2025-02-09T23:45:00Z",
    "overallScore": 85,
    "overallGrade": "A",
    "categories": [...]
  }
]
```

---

## HTTP Methods & Status Codes

### Supported Methods
- **GET** - Retrieve resources (all endpoints)
- **POST, PUT, DELETE, PATCH** - Not implemented (405 Method Not Allowed)

### Status Codes Used

| Code | Meaning | Endpoint(s) |
|------|---------|------------|
| 200 | OK | All endpoints (successful response) |
| 302 | Found (Redirect) | `/` (redirects to first file) |
| 403 | Forbidden | `/view/*filepath` (path traversal attempt) |
| 404 | Not Found | `/view/*filepath` (file not found), `/` (no files) |
| 405 | Method Not Allowed | All endpoints (wrong HTTP method) |

---

## Content Security & Safety

### HTML Escaping
All user-provided or untrusted content is escaped:
```javascript
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### Path Traversal Prevention
The `/view/*filepath` endpoint implements strict path validation:
```javascript
const rel = relative(outputDir, fullPath);
if (rel.startsWith('..') || isAbsolute(rel) || rel.includes(`..${sep}`)) {
  // Reject with 403
}
```

### Markdown Rendering Safety
- HTML tags in Markdown are escaped before rendering
- Mermaid diagrams are safely rendered in isolated containers
- No raw HTML execution from user input

---

## Integration Testing Checklist

### Setup
- [ ] Start RepoSentry server: `npm run start` or `npm run dev`
- [ ] Server listens on port (default: 3000)
- [ ] Output directory contains analysis reports

### Test Execution

#### Endpoint: GET /
- [ ] Redirect to HEALTH_REPORT.md if exists
- [ ] Fallback to README.md if HEALTH_REPORT missing
- [ ] Fallback to first file if neither exists
- [ ] Display welcome page if no files
- [ ] Verify 302 redirect status code

#### Endpoint: GET /view/*filepath
- [ ] Render .md files with proper HTML
- [ ] Render .mmd files with Mermaid diagrams
- [ ] Render plain text in `<pre><code>` blocks
- [ ] Return 404 for nonexistent files
- [ ] Return 403 for path traversal attempts (../, ..\, /../, etc.)
- [ ] Escape HTML in Markdown content
- [ ] Verify sidebar navigation displays all files

#### Endpoint: GET /compare
- [ ] Show "No History" if history.json missing
- [ ] Show "Not Enough Data" if < 2 runs
- [ ] Display history picker with all runs
- [ ] Display side-by-side comparison when left parameter valid
- [ ] Reject invalid left parameter and show picker
- [ ] Show correct deltas (▲/▼/—)
- [ ] Color-code grades (green A+/A, yellow B, red C+/C/D)

### Performance Tests
- [ ] Response time < 500ms for typical files
- [ ] Handle large markdown files (> 1MB)
- [ ] Handle deep nested paths (5+ levels)
- [ ] Verify no memory leaks on repeated requests

### Security Tests
- [ ] Path traversal: `/view/../../sensitive.json` → 403
- [ ] Absolute path: `/view//etc/passwd` → 403
- [ ] Double encoding: `/view/..%2F..%2Fsecrets.txt` → 403/404
- [ ] XSS in filename: `/view/<script>.md` → 404
- [ ] XSS in Markdown: Content with `<script>` → Escaped
- [ ] Verify CORS headers if needed (not currently set)

---

## Authentication & Authorization

Currently, **no authentication or authorization** is implemented:
- All endpoints are publicly accessible
- No API key or token validation
- No user-based access control

**Recommendation:** If exposing RepoSentry in production, implement:
- HTTP Basic Auth
- OAuth 2.0 / OIDC
- API key authentication
- IP whitelisting

---

## Example Test Scenarios

### Scenario 1: First-Time User Flow
```bash
# 1. Access root
curl -L http://localhost:3000/

# 2. Browser follows redirect to first report
curl -L http://localhost:3000/view/HEALTH_REPORT.md

# 3. Click on sidebar link to view another report
curl -L http://localhost:3000/view/API_DOCUMENTATION.md
```

### Scenario 2: Tracking Improvements Over Time
```bash
# 1. View comparison history
curl http://localhost:3000/compare

# 2. Select a run to compare
curl "http://localhost:3000/compare?left=1"

# 3. Review score deltas and category changes
# Expect: Side-by-side table showing improvements/regressions
```

### Scenario 3: Security Testing
```bash
# Attempt 1: Path traversal (Linux-style)
curl http://localhost:3000/view/../../../etc/passwd
# Expected: 403 Forbidden

# Attempt 2: Path traversal (Windows-style)
curl http://localhost:3000/view/..%5C..%5Csecrets.txt
# Expected: 403 Forbidden

# Attempt 3: Absolute path
curl http://localhost:3000/view//etc/passwd
# Expected: 403 Forbidden

# Attempt 4: XSS in content (safe - HTML escaped)
curl http://localhost:3000/view/report-with-html.md
# Expected: 200 with escaped HTML tags
```

---

## Deployment Considerations

### Environment Configuration
- **Port:** Configurable via options.port (default: 3000)
- **Output Directory:** Must contain generated .md, .mmd, or text files
- **Static Files:** Public/ directory served for static assets

### Performance Recommendations
- [ ] Enable gzip compression for HTML responses
- [ ] Implement caching headers (Cache-Control: public, max-age=3600)
- [ ] Use reverse proxy (nginx/Caddy) for TLS and compression
- [ ] Monitor memory usage for large file serving

### Security Recommendations
- [ ] Always use HTTPS in production
- [ ] Implement rate limiting to prevent DOS
- [ ] Add authentication layer before exposing publicly
- [ ] Regularly audit file permissions in output directory
- [ ] Use Content Security Policy (CSP) headers

---

## Known Limitations

1. **No Authentication:** All endpoints are publicly accessible
2. **Single Directory Serving:** Limited to outputDir; cannot serve arbitrary files
3. **No API Response Format:** Server returns HTML only (no JSON API)
4. **No Search/Filter:** No search functionality across reports
5. **Static History:** history.json is read-only; UI cannot modify it
6. **No Request Logging:** Requests are not logged by default

---

## Changelog

**Version 0.1.0:**
- Initial API implementation
- Three core endpoints: `/`, `/view/*filepath`, `/compare`
- Path traversal security
- HTML content escaping
- Mermaid diagram support

---

## Support & Feedback

For issues or feature requests related to the API server, open an issue on [GitHub](https://github.com/MaheshDoiphode/reposentry/issues).
```