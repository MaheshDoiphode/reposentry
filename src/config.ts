import { cosmiconfig } from 'cosmiconfig';

export interface RepoSentryConfig {
  output: string;
  format: 'markdown' | 'html' | 'json';
  depth: 'quick' | 'standard' | 'deep';
  engines: {
    docs: boolean;
    architecture: boolean;
    security: boolean;
    ci: boolean;
    apiTests: boolean;
    performance: boolean;
    team: boolean;
    health: boolean;
  };
  ignore: string[];
  security: {
    severityThreshold: 'low' | 'medium' | 'high' | 'critical';
    ignorePatterns: string[];
  };
  ci: {
    provider: string;
    nodeVersions: string[];
  };
}

const DEFAULT_CONFIG: RepoSentryConfig = {
  output: '.reposentry',
  format: 'markdown',
  depth: 'standard',
  engines: {
    docs: true,
    architecture: true,
    security: true,
    ci: true,
    apiTests: true,
    performance: true,
    team: true,
    health: true,
  },
  ignore: ['node_modules', 'dist', '*.test.ts'],
  security: {
    severityThreshold: 'medium',
    ignorePatterns: ['*.test.*'],
  },
  ci: {
    provider: 'github-actions',
    nodeVersions: ['18', '20'],
  },
};

function mergeConfig(userConfig: Partial<RepoSentryConfig>): RepoSentryConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    engines: {
      ...DEFAULT_CONFIG.engines,
      ...(userConfig.engines || {}),
    },
    security: {
      ...DEFAULT_CONFIG.security,
      ...(userConfig.security || {}),
    },
    ci: {
      ...DEFAULT_CONFIG.ci,
      ...(userConfig.ci || {}),
    },
    ignore: Array.isArray(userConfig.ignore) ? userConfig.ignore : DEFAULT_CONFIG.ignore,
  };
}

export async function loadConfig(): Promise<RepoSentryConfig> {
  const explorer = cosmiconfig('reposentry');
  try {
    const result = await explorer.search();
    if (result && result.config) {
      return mergeConfig(result.config as Partial<RepoSentryConfig>);
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}
