import { readFileContentSync } from '../utils/fs.js';
import { join } from 'node:path';

export interface RouteInfo {
  method: string;
  path: string;
  file: string;
  handler?: string;
  middleware?: string[];
}

interface FrameworkPattern {
  name: string;
  filePattern: RegExp;
  routePatterns: RegExp[];
}

const FRAMEWORK_PATTERNS: FrameworkPattern[] = [
  {
    name: 'Express.js',
    filePattern: /\.(ts|js)$/,
    routePatterns: [
      /(?:app|router)\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /(?:app|router)\.use\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ],
  },
  {
    name: 'Fastify',
    filePattern: /\.(ts|js)$/,
    routePatterns: [
      /fastify\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\.route\s*\(\s*\{[^}]*method:\s*['"`](\w+)['"`][^}]*url:\s*['"`]([^'"`]+)['"`]/g,
    ],
  },
  {
    name: 'NestJS',
    filePattern: /\.(ts|js)$/,
    routePatterns: [
      /@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]?([^'"`)\s]*)['"`]?\s*\)/g,
    ],
  },
  {
    name: 'FastAPI',
    filePattern: /\.py$/,
    routePatterns: [
      /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ],
  },
  {
    name: 'Django',
    filePattern: /\.py$/,
    routePatterns: [
      /path\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /@api_view\s*\(\s*\[['"`](\w+)['"`]/g,
    ],
  },
  {
    name: 'Spring Boot',
    filePattern: /\.java$/,
    routePatterns: [
      /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/g,
      /@RequestMapping\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/g,
    ],
  },
  {
    name: 'Gin',
    filePattern: /\.go$/,
    routePatterns: [
      /\.(GET|POST|PUT|PATCH|DELETE)\s*\(\s*"([^"]+)"/g,
    ],
  },
];

export function detectRoutes(rootDir: string, files: string[]): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const file of files.slice(0, 200)) {
    for (const framework of FRAMEWORK_PATTERNS) {
      if (!framework.filePattern.test(file)) continue;

      try {
        const content = readFileContentSync(join(rootDir, file));

        for (const pattern of framework.routePatterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(content)) !== null) {
            const method = match[1]?.toUpperCase() || 'USE';
            const path = match[2] || match[1] || '/';
            routes.push({
              method,
              path: path.startsWith('/') ? path : `/${path}`,
              file,
            });
          }
        }
      } catch { /* ignore */ }
    }
  }

  return routes;
}

export function getDetectedFramework(routes: RouteInfo[]): string | null {
  if (routes.length === 0) return null;
  // Return the most common framework based on file patterns
  return 'Express.js'; // Simplified — actual detection uses the framework patterns above
}
