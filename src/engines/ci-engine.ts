import { askCopilot } from '../core/copilot.js';
import { OutputManager } from '../core/output-manager.js';
import { PromptContext } from '../core/prompt-builder.js';
import { Progress } from '../core/progress.js';
import { readFileTruncated, fileExists } from '../utils/fs.js';
import { join } from 'node:path';
import {
  ciPipelinePrompt, dockerfileAuditPrompt, dockerfileGeneratePrompt,
  dockerComposePrompt, envExamplePrompt, takeItToProdPrompt,
} from '../prompts/ci.prompts.js';

export interface CIEngineInput {
  context: PromptContext;
  rootDir: string;
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasCIConfig: boolean;
  hasEnvExample: boolean;
}

export async function runCIEngine(
  input: CIEngineInput,
  output: OutputManager,
  progress: Progress,
): Promise<{ score: number; details: string }> {
  const totalSteps = 4 +
    (input.hasDockerfile ? 1 : 1) +
    (input.hasDockerCompose ? 0 : 1);
  progress.start('CI/CD Engine', totalSteps);

  const ctx = { ...input.context };
  const generated: string[] = [];

  // CI Pipeline
  if (!input.hasCIConfig) {
    progress.increment('Generating CI pipeline');
    const ciResult = await askCopilot(ciPipelinePrompt(ctx));
    await output.writeToSubdir('infrastructure', 'ci.yml', ciResult);
    generated.push('ci.yml');
  } else {
    progress.increment('CI config exists');
    generated.push('CI config already present');
  }

  // Dockerfile
  if (input.hasDockerfile) {
    progress.increment('Auditing Dockerfile');
    try {
      const dockerContent = await readFileTruncated(join(input.rootDir, 'Dockerfile'));
      ctx.codeContext = dockerContent;
      const auditResult = await askCopilot(dockerfileAuditPrompt(ctx));
      await output.writeToSubdir('infrastructure', 'DOCKER_AUDIT.md', auditResult);
      generated.push('DOCKER_AUDIT.md');
    } catch {
      progress.increment('Dockerfile read failed');
    }
  } else {
    progress.increment('Generating Dockerfile');
    const dockerResult = await askCopilot(dockerfileGeneratePrompt(ctx));
    await output.writeToSubdir('infrastructure', 'Dockerfile.suggested', dockerResult);
    generated.push('Dockerfile.suggested');
  }

  // Docker Compose
  if (!input.hasDockerCompose) {
    progress.increment('Generating Docker Compose');
    const composeResult = await askCopilot(dockerComposePrompt(ctx));
    await output.writeToSubdir('infrastructure', 'docker-compose.suggested.yml', composeResult);
    generated.push('docker-compose.suggested.yml');
  }

  // .env.example
  if (!input.hasEnvExample) {
    progress.increment('Generating .env.example');
    const envResult = await askCopilot(envExamplePrompt(ctx));
    await output.writeToSubdir('infrastructure', '.env.example', envResult);
    generated.push('.env.example');
  } else {
    progress.increment('.env.example exists');
  }

  // Production deployment guide
  progress.increment('Generating production guide');
  const prodGuide = await askCopilot(takeItToProdPrompt(ctx));
  await output.writeToSubdir('infrastructure', 'take-it-to-prod.md', prodGuide);
  generated.push('take-it-to-prod.md');

  progress.succeed('CI/CD Engine');

  // Score based on what the project already has (not what we generated)
  let score = 15; // base: project exists
  if (input.hasCIConfig) score += 35;      // CI pipeline is critical
  if (input.hasDockerfile) score += 20;     // containerized
  if (input.hasEnvExample) score += 15;     // env management
  if (input.hasDockerCompose) score += 15;  // orchestration
  score = Math.max(0, Math.min(100, score));

  const missing: string[] = [];
  if (!input.hasCIConfig) missing.push('CI pipeline');
  if (!input.hasDockerfile) missing.push('Dockerfile');
  if (!input.hasEnvExample) missing.push('.env.example');
  if (!input.hasDockerCompose) missing.push('docker-compose');

  return {
    score,
    details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All CI/CD infrastructure present',
  };
}
