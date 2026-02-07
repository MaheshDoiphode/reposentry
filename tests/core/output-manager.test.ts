import { describe, it, expect } from 'vitest';
import { OutputManager } from '../../src/core/output-manager.js';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('output-manager', () => {
  const testDir = join(process.cwd(), '.test-output');

  it('should create output directory', async () => {
    const manager = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await manager.init();
    expect(existsSync(testDir)).toBe(true);
    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should write files and track count', async () => {
    const manager = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await manager.init();
    await manager.write('test.md', '# Test');
    await manager.write('sub/nested.md', '# Nested');

    expect(manager.getFileCount()).toBe(2);
    expect(manager.getFilesWritten()).toContain('test.md');
    expect(existsSync(join(testDir, 'test.md'))).toBe(true);
    expect(existsSync(join(testDir, 'sub', 'nested.md'))).toBe(true);

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should write to subdirectory', async () => {
    const manager = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await manager.init();
    await manager.writeToSubdir('security', 'AUDIT.md', '# Audit');

    expect(existsSync(join(testDir, 'security', 'AUDIT.md'))).toBe(true);

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });
});
