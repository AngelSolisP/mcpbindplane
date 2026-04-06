import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAuthHeaders } from './auth.js';

describe('getAuthHeaders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.BINDPLANE_API_KEY;
    delete process.env.BINDPLANE_USERNAME;
    delete process.env.BINDPLANE_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns API key header when BINDPLANE_API_KEY is set', () => {
    process.env.BINDPLANE_API_KEY = 'test-key-123';
    const headers = getAuthHeaders();
    expect(headers).toEqual({ 'X-Bindplane-Api-Key': 'test-key-123' });
  });

  it('returns Basic auth header when username and password are set', () => {
    process.env.BINDPLANE_USERNAME = 'admin';
    process.env.BINDPLANE_PASSWORD = 'secret';
    const headers = getAuthHeaders();
    const expected = Buffer.from('admin:secret').toString('base64');
    expect(headers).toEqual({ 'Authorization': `Basic ${expected}` });
  });

  it('prefers API key when both methods are configured', () => {
    process.env.BINDPLANE_API_KEY = 'test-key-123';
    process.env.BINDPLANE_USERNAME = 'admin';
    process.env.BINDPLANE_PASSWORD = 'secret';
    const headers = getAuthHeaders();
    expect(headers).toEqual({ 'X-Bindplane-Api-Key': 'test-key-123' });
  });

  it('throws when no auth is configured', () => {
    expect(() => getAuthHeaders()).toThrow('No authentication configured');
  });

  it('throws when only username is set without password', () => {
    process.env.BINDPLANE_USERNAME = 'admin';
    expect(() => getAuthHeaders()).toThrow('BINDPLANE_PASSWORD is required');
  });
});
