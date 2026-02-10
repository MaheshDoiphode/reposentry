import { describe, it, expect } from 'vitest';
import { OutputManager } from '../../src/core/output-manager.js';
import { existsSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
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

  it('should fail init when output dir is non-empty and force is false', async () => {
    rmSync(testDir, { recursive: true, force: true });
    // Create non-empty directory
    const manager1 = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await manager1.init();
    writeFileSync(join(testDir, 'existing.txt'), 'hi', 'utf-8');

    const manager2 = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await expect(manager2.init()).rejects.toThrow(/not empty/i);

    rmSync(testDir, { recursive: true, force: true });
  });

  it('should clear output dir when force is true', async () => {
    rmSync(testDir, { recursive: true, force: true });
    const manager1 = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await manager1.init();
    writeFileSync(join(testDir, 'existing.txt'), 'hi', 'utf-8');

    const manager2 = new OutputManager({ baseDir: testDir, format: 'markdown', force: true });
    await manager2.init();
    expect(existsSync(join(testDir, 'existing.txt'))).toBe(false);

    rmSync(testDir, { recursive: true, force: true });
  });

  it('should generate html exports and index when format=html', async () => {
    rmSync(testDir, { recursive: true, force: true });
    const manager = new OutputManager({ baseDir: testDir, format: 'html', force: false });
    await manager.init();
    await manager.write('test.md', '# Title\n\n```mermaid\ngraph TD; A-->B;\n```');
    await manager.finalize();

    expect(existsSync(join(testDir, 'html', 'test.html'))).toBe(true);
    expect(existsSync(join(testDir, 'html', 'index.html'))).toBe(true);

    rmSync(testDir, { recursive: true, force: true });
  });

  it('should generate bundle.json when format=json', async () => {
    rmSync(testDir, { recursive: true, force: true });
    const manager = new OutputManager({ baseDir: testDir, format: 'json', force: false });
    await manager.init();
    await manager.write('test.md', '# Test');
    await manager.finalize();

    const bundlePath = join(testDir, 'bundle.json');
    expect(existsSync(bundlePath)).toBe(true);
    const raw = readFileSync(bundlePath, 'utf-8');
    expect(raw).toMatch(/"test\.md"/);

    rmSync(testDir, { recursive: true, force: true });
  });

  it('should preserve history.json across --force wipes', async () => {
    rmSync(testDir, { recursive: true, force: true });
    const manager1 = new OutputManager({ baseDir: testDir, format: 'markdown', force: false });
    await manager1.init();
    writeFileSync(join(testDir, 'history.json'), '[{"score":42}]', 'utf-8');
    writeFileSync(join(testDir, 'old-report.md'), '# old', 'utf-8');

    const manager2 = new OutputManager({ baseDir: testDir, format: 'markdown', force: true });
    await manager2.init();

    // history.json survives, other files don't
    expect(existsSync(join(testDir, 'history.json'))).toBe(true);
    expect(readFileSync(join(testDir, 'history.json'), 'utf-8')).toBe('[{"score":42}]');
    expect(existsSync(join(testDir, 'old-report.md'))).toBe(false);

    rmSync(testDir, { recursive: true, force: true });
  });
});
