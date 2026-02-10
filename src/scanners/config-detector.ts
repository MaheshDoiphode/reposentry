import { fileExists, readFileContentSync } from '../utils/fs.js';
import { join } from 'node:path';

export interface ConfigInfo {
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasCIConfig: boolean;
  ciProvider: string;
  hasEnvFile: boolean;
  hasEnvExample: boolean;
  hasGitignore: boolean;
  hasLicense: boolean;
  hasReadme: boolean;
  hasContributing: boolean;
  hasChangelog: boolean;
  hasPRTemplate: boolean;
  hasIssueTemplates: boolean;
  hasCodeowners: boolean;
  hasEditorConfig: boolean;
  hasPrettier: boolean;
  hasEslint: boolean;
  hasTerraform: boolean;
  hasKubernetes: boolean;
  configFiles: string[];
}

export function detectConfigs(rootDir: string, files: string[]): ConfigInfo {
  const configFiles: string[] = [];

  const check = (path: string) => {
    const exists = fileExists(join(rootDir, path));
    if (exists) configFiles.push(path);
    return exists;
  };

  const checkAny = (...paths: string[]) => paths.some(p => check(p));

  let ciProvider = '';
  if (check('.github/workflows/ci.yml') || check('.github/workflows/ci.yaml') ||
      files.some(f => f.startsWith('.github/workflows/'))) {
    ciProvider = 'GitHub Actions';
  } else if (check('.gitlab-ci.yml')) {
    ciProvider = 'GitLab CI';
  } else if (check('.circleci/config.yml')) {
    ciProvider = 'CircleCI';
  } else if (check('Jenkinsfile')) {
    ciProvider = 'Jenkins';
  } else if (check('.travis.yml')) {
    ciProvider = 'Travis CI';
  }

  return {
    hasDockerfile: checkAny('Dockerfile', 'dockerfile'),
    hasDockerCompose: checkAny('docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'),
    hasCIConfig: ciProvider !== '',
    ciProvider,
    hasEnvFile: checkAny('.env'),
    hasEnvExample: checkAny('.env.example', '.env.sample', '.env.template'),
    hasGitignore: check('.gitignore'),
    hasLicense: checkAny('LICENSE', 'LICENSE.md', 'LICENSE.txt'),
    hasReadme: checkAny('README.md', 'readme.md', 'README.rst', 'README'),
    hasContributing: checkAny('CONTRIBUTING.md', 'contributing.md'),
    hasChangelog: checkAny('CHANGELOG.md', 'changelog.md', 'HISTORY.md'),
    hasPRTemplate: checkAny('.github/pull_request_template.md', '.github/PULL_REQUEST_TEMPLATE.md'),
    hasIssueTemplates: files.some(f => f.includes('.github/ISSUE_TEMPLATE')),
    hasCodeowners: checkAny('CODEOWNERS', '.github/CODEOWNERS', 'docs/CODEOWNERS'),
    hasEditorConfig: check('.editorconfig'),
    hasPrettier: checkAny('.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'),
    hasEslint: checkAny('.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs'),
    hasTerraform: files.some(f => f.endsWith('.tf')),
    hasKubernetes: files.some(f => f.includes('k8s') || f.includes('kubernetes') || f.includes('helm')),
    configFiles,
  };
}
