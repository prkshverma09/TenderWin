/**
 * @vitest-environment node
 */
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Google Docs Add-on build', () => {
  const projectRoot = process.cwd();
  const distDir = join(projectRoot, 'dist');

  it('should produce a single HTML file in dist', () => {
    expect(existsSync(distDir)).toBe(true);
    const files = readdirSync(distDir);
    const htmlFiles = files.filter((f) => f.endsWith('.html'));
    expect(htmlFiles.length).toBe(1);
    expect(htmlFiles[0]).toBeTruthy();
  });
});
