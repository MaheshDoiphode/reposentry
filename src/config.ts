import { cosmiconfig } from 'cosmiconfig';

export interface RepoSentryConfig {
  output: string;
  depth: 'quick' | 'standard' | 'deep';
  engines: {
    docs: boolean;
    architecture: boolean;
    security: boolean;
    ci: boolean;
    apiTests: boolean;
    performance: boolean;
    team: boolean;
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
  depth: 'standard',
  engines: {
    docs: true,
    architecture: true,
    security: true,
    ci: true,
    apiTests: true,
    performance: true,
    team: true,
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

export async function loadConfig(): Promise<RepoSentryConfig> {
  const explorer = cosmiconfig('reposentry');
  try {
    const result = await explorer.search();
    if (result && result.config) {
      return { ...DEFAULT_CONFIG, ...result.config };
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}
