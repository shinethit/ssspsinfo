import { describe, it, expect } from 'vitest';
import { normalizeRole, canAccessTab, type AdminRole } from './roles';

describe('normalizeRole', () => {
  it.each([
    ['super_admin', 'admin'],
    ['admin', 'admin'],
    ['moderator', 'moderator'],
    ['editor', 'moderator'],
    ['sports_moderator', 'moderator'],
    ['news_editor', 'moderator'],
    [undefined, 'moderator'],
    [null, 'moderator'],
    ['', 'moderator'],
    [123, 'moderator'],
  ] as const)('normalizeRole(%s) -> %s', (input, expected) => {
    expect(normalizeRole(input)).toBe(expected);
  });
});

const ALL_TABS = [
  'dashboard',
  'announcements',
  'associations',
  'schools',
  'tickers',
  'audit_logs',
  'accounts',
  'levels',
  'backup',
  'events',
  'sports',
  'documents',
  'gallery',
  'finance',
  'requests',
] as const;

const MODERATOR_TABS = [
  'dashboard',
  'announcements',
  'associations',
  'schools',
  'tickers',
  'levels',
  'events',
  'sports',
  'documents',
  'gallery',
  'finance',
  'requests',
] as const;

describe('canAccessTab', () => {
  it('admin can access all 15 tabs', () => {
    for (const tab of ALL_TABS) {
      expect(canAccessTab('admin', tab)).toBe(true);
    }
  });

  it('moderator can access the 12 content/dashboard/requests tabs', () => {
    for (const tab of MODERATOR_TABS) {
      expect(canAccessTab('moderator', tab)).toBe(true);
    }
  });

  it('moderator cannot access accounts, audit_logs, backup', () => {
    for (const tab of ['accounts', 'audit_logs', 'backup'] as const) {
      expect(canAccessTab('moderator', tab)).toBe(false);
    }
  });

  it('unknown tab is denied for both roles', () => {
    expect(canAccessTab('admin', 'nonexistent-tab')).toBe(false);
    expect(canAccessTab('moderator', 'nonexistent-tab')).toBe(false);
  });
});
