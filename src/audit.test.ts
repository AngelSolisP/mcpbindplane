import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogger } from './audit.js';

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger();
  });

  it('starts empty', () => {
    expect(logger.getEntries()).toEqual([]);
  });

  it('logs entries', () => {
    logger.log({
      timestamp: '2026-04-06T12:00:00Z',
      tool: 'list-agents',
      params: { query: 'status:Connected' },
      status: 'success',
      durationMs: 150,
    });

    const entries = logger.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].tool).toBe('list-agents');
    expect(entries[0].status).toBe('success');
  });

  it('logs errors', () => {
    logger.log({
      timestamp: '2026-04-06T12:00:00Z',
      tool: 'delete-agents',
      params: { ids: ['agent-1'] },
      status: 'error',
      durationMs: 50,
      error: 'Not found',
    });

    const entries = logger.getEntries();
    expect(entries[0].status).toBe('error');
    expect(entries[0].error).toBe('Not found');
  });

  it('returns a copy of entries', () => {
    logger.log({
      timestamp: '2026-04-06T12:00:00Z',
      tool: 'get-version',
      params: {},
      status: 'success',
      durationMs: 10,
    });

    const entries = logger.getEntries();
    entries.pop();
    expect(logger.getEntries()).toHaveLength(1);
  });

  it('clears entries', () => {
    logger.log({
      timestamp: '2026-04-06T12:00:00Z',
      tool: 'get-version',
      params: {},
      status: 'success',
      durationMs: 10,
    });

    logger.clear();
    expect(logger.getEntries()).toEqual([]);
  });
});
