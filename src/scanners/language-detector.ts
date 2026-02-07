import { fileExists, readFileContentSync } from '../utils/fs.js';
import { join } from 'node:path';

export interface LanguageInfo {
  languages: string[];
  frameworks: string[];
  packageManager: string;
  testFramework: string;
  buildTool: string;
  runtime: string;
}

interface DetectionRule {
  file: string;
  language?: string;
  framework?: string;
  packageManager?: string;
  testFramework?: string;
  buildTool?: string;
  runtime?: string;
  /** Check inside file content for these patterns */
  contentChecks?: Array<{
    pattern: RegExp;
    framework?: string;
    testFramework?: string;
    buildTool?: string;
  }>;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    file: 'package.json',
    language: 'JavaScript/TypeScript',
    runtime: 'Node.js',
    contentChecks: [
      { pattern: /"typescript"/, framework: 'TypeScript' },
      { pattern: /"react"/, framework: 'React' },
      { pattern: /"next"/, framework: 'Next.js' },
      { pattern: /"vue"/, framework: 'Vue.js' },
      { pattern: /"angular"/, framework: 'Angular' },
      { pattern: /"express"/, framework: 'Express.js' },
      { pattern: /"fastify"/, framework: 'Fastify' },
      { pattern: /"@nestjs\/core"/, framework: 'NestJS' },
      { pattern: /"hono"/, framework: 'Hono' },
      { pattern: /"jest"/, testFramework: 'Jest' },
      { pattern: /"vitest"/, testFramework: 'Vitest' },
      { pattern: /"mocha"/, testFramework: 'Mocha' },
      { pattern: /"webpack"/, buildTool: 'Webpack' },
      { pattern: /"vite"/, buildTool: 'Vite' },
      { pattern: /"esbuild"/, buildTool: 'esbuild' },
      { pattern: /"tsup"/, buildTool: 'tsup' },
      { pattern: /"prisma"/, framework: 'Prisma' },
      { pattern: /"mongoose"/, framework: 'Mongoose' },
      { pattern: /"sequelize"/, framework: 'Sequelize' },
      { pattern: /"typeorm"/, framework: 'TypeORM' },
    ],
  },
  { file: 'requirements.txt', language: 'Python', packageManager: 'pip', runtime: 'Python' },
  { file: 'pyproject.toml', language: 'Python', packageManager: 'pip/poetry', runtime: 'Python' },
  { file: 'setup.py', language: 'Python', runtime: 'Python' },
  { file: 'go.mod', language: 'Go', packageManager: 'go mod', runtime: 'Go' },
  { file: 'Cargo.toml', language: 'Rust', packageManager: 'Cargo', runtime: 'Rust' },
  { file: 'pom.xml', language: 'Java', packageManager: 'Maven', runtime: 'JVM' },
  { file: 'build.gradle', language: 'Java', packageManager: 'Gradle', runtime: 'JVM' },
  { file: 'Gemfile', language: 'Ruby', packageManager: 'Bundler', runtime: 'Ruby' },
  { file: 'composer.json', language: 'PHP', packageManager: 'Composer', runtime: 'PHP' },
  { file: '*.csproj', language: 'C#', packageManager: 'NuGet', runtime: '.NET' },
];

export function detectLanguages(rootDir: string, files: string[]): LanguageInfo {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  let packageManager = '';
  let testFramework = '';
  let buildTool = '';
  let runtime = '';

  // Extension-based detection
  const extMap: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java', '.kt': 'Kotlin',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.cs': 'C#',
    '.swift': 'Swift',
    '.sql': 'SQL',
    '.yml': 'YAML', '.yaml': 'YAML',
  };

  for (const file of files) {
    const ext = '.' + file.split('.').pop()?.toLowerCase();
    if (ext && extMap[ext]) {
      languages.add(extMap[ext]);
    }
  }

  // Config file-based detection
  for (const rule of DETECTION_RULES) {
    const filePath = join(rootDir, rule.file);
    if (!fileExists(filePath)) continue;

    if (rule.language) languages.add(rule.language);
    if (rule.framework) frameworks.add(rule.framework);
    if (rule.packageManager && !packageManager) packageManager = rule.packageManager;
    if (rule.testFramework && !testFramework) testFramework = rule.testFramework;
    if (rule.buildTool && !buildTool) buildTool = rule.buildTool;
    if (rule.runtime && !runtime) runtime = rule.runtime;

    if (rule.contentChecks) {
      try {
        const content = readFileContentSync(filePath);
        for (const check of rule.contentChecks) {
          if (check.pattern.test(content)) {
            if (check.framework) frameworks.add(check.framework);
            if (check.testFramework && !testFramework) testFramework = check.testFramework;
            if (check.buildTool && !buildTool) buildTool = check.buildTool;
          }
        }
      } catch { /* ignore read errors */ }
    }
  }

  // Package manager detection
  if (!packageManager) {
    if (fileExists(join(rootDir, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
    else if (fileExists(join(rootDir, 'yarn.lock'))) packageManager = 'yarn';
    else if (fileExists(join(rootDir, 'package-lock.json'))) packageManager = 'npm';
    else if (fileExists(join(rootDir, 'bun.lockb'))) packageManager = 'bun';
  }

  return {
    languages: [...languages],
    frameworks: [...frameworks],
    packageManager,
    testFramework,
    buildTool,
    runtime,
  };
}
