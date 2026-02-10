import { readFileContentSync } from '../utils/fs.js';
import { join } from 'node:path';

export interface ModelInfo {
  name: string;
  file: string;
  orm: string;
  fields: string[];
}

interface ORMPattern {
  name: string;
  filePattern: RegExp;
  modelPatterns: RegExp[];
}

const ORM_PATTERNS: ORMPattern[] = [
  {
    name: 'Prisma',
    filePattern: /\.prisma$/,
    modelPatterns: [
      /model\s+(\w+)\s*\{([^}]+)\}/g,
    ],
  },
  {
    name: 'Mongoose',
    filePattern: /\.(ts|js)$/,
    modelPatterns: [
      /new\s+(?:mongoose\.)?Schema\s*\(\s*\{([^}]+)\}/g,
      /mongoose\.model\s*\(\s*['"`](\w+)['"`]/g,
    ],
  },
  {
    name: 'Sequelize',
    filePattern: /\.(ts|js)$/,
    modelPatterns: [
      /(?:sequelize\.define|Model\.init)\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+)\}/g,
    ],
  },
  {
    name: 'TypeORM',
    filePattern: /\.(ts|js)$/,
    modelPatterns: [
      /@Entity\s*\(\s*(?:['"`](\w+)['"`])?\s*\)/g,
      /@Column\s*\(/g,
    ],
  },
  {
    name: 'Django ORM',
    filePattern: /\.py$/,
    modelPatterns: [
      /class\s+(\w+)\s*\(\s*(?:models\.)?Model\s*\)\s*:/g,
    ],
  },
  {
    name: 'SQLAlchemy',
    filePattern: /\.py$/,
    modelPatterns: [
      /class\s+(\w+)\s*\(\s*(?:Base|db\.Model)\s*\)\s*:/g,
    ],
  },
  {
    name: 'GORM',
    filePattern: /\.go$/,
    modelPatterns: [
      /type\s+(\w+)\s+struct\s*\{[^}]*gorm/g,
    ],
  },
  {
    name: 'ActiveRecord',
    filePattern: /\.rb$/,
    modelPatterns: [
      /class\s+(\w+)\s*<\s*(?:ApplicationRecord|ActiveRecord::Base)/g,
    ],
  },
];

export function detectModels(rootDir: string, files: string[]): ModelInfo[] {
  const models: ModelInfo[] = [];

  for (const file of files.slice(0, 200)) {
    for (const orm of ORM_PATTERNS) {
      if (!orm.filePattern.test(file)) continue;

      try {
        const content = readFileContentSync(join(rootDir, file));

        for (const pattern of orm.modelPatterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(content)) !== null) {
            const name = match[1] || file.split(/[/\\]/).pop()?.replace(/\.\w+$/, '') || 'Unknown';
            const fieldsStr = match[2] || '';
            const fields = fieldsStr
              .split(/[,\n]/)
              .map(f => f.trim())
              .filter(f => f && !f.startsWith('//') && !f.startsWith('#'));

            models.push({
              name,
              file,
              orm: orm.name,
              fields: fields.slice(0, 20),
            });
          }
        }
      } catch { /* ignore */ }
    }
  }

  return models;
}
