import { describe, it, expect } from 'vitest';
import { VERSIONS } from './versions';

describe('VERSIONS (version history)', () => {
  it('is non-empty', () => {
    expect(VERSIONS.length).toBeGreaterThan(0);
  });

  it('has exactly one entry marked isLatest', () => {
    const latest = VERSIONS.filter((v) => v.isLatest);
    expect(latest).toHaveLength(1);
  });

  it('every entry has a non-empty version string, a title, and a non-empty changes array', () => {
    for (const entry of VERSIONS) {
      expect(entry.version.trim()).not.toBe('');
      expect(entry.title.trim()).not.toBe('');
      expect(Array.isArray(entry.changes)).toBe(true);
      expect(entry.changes.length).toBeGreaterThan(0);
    }
  });

  it('version strings are unique', () => {
    const versions = VERSIONS.map((v) => v.version);
    expect(new Set(versions).size).toBe(versions.length);
  });
});
