import { PromptContext, buildPrompt } from '../core/prompt-builder.js';

export function ciPipelinePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a complete GitHub Actions CI/CD workflow (ci.yml). Include: trigger on push to main and PRs, install dependencies with correct package manager, run linting, run tests, build the project, cache dependencies, and use appropriate Node.js/Python/Go version matrix. Make it production-ready.',
    ctx,
  );
}

export function dockerfileAuditPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Audit this Dockerfile against best practices. Check for: running as root, missing multi-stage build, large base image, missing .dockerignore, no health check, exposed unnecessary ports, secrets in build args, layer optimization issues. For each finding, provide the issue, risk level, and corrected Dockerfile line.',
    ctx,
  );
}

export function dockerfileGeneratePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate an optimized, production-ready Dockerfile for this project. Use multi-stage build, run as non-root user, use alpine base where possible, include health check, optimize layer caching, and add appropriate labels.',
    ctx,
  );
}

export function dockerComposePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a docker-compose.yml for local development. Include: the application service, database service (if detected), any required infrastructure (Redis, RabbitMQ, etc.), proper networking, volume mounts for live reload, environment variables, and health checks.',
    ctx,
  );
}

export function envExamplePrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a .env.example file based on environment variables used in the codebase. For each variable, include a comment explaining its purpose and a placeholder value. Group by category (database, auth, external services, etc.).',
    ctx,
  );
}

export function takeItToProdPrompt(ctx: PromptContext): string {
  return buildPrompt(
    'Generate a comprehensive production deployment guide called "Take It To Production". Include: 1) Pre-deployment checklist (environment variables, secrets, database migrations, build verification), 2) Deployment options with step-by-step instructions (cloud platforms like AWS/GCP/Azure, VPS, containerized with Docker/Kubernetes, static hosting if applicable), 3) DNS and SSL/TLS setup, 4) Monitoring and logging setup (health checks, APM, error tracking), 5) Scaling considerations (horizontal/vertical, load balancing, CDN), 6) Rollback strategy, 7) Post-deployment verification steps. Tailor specifically to this project\'s tech stack.',
    ctx,
  );
}
