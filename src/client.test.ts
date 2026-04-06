import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BindPlaneClient } from './client.js';

describe('BindPlaneClient', () => {
  let client: BindPlaneClient;

  beforeEach(() => {
    client = new BindPlaneClient('http://localhost:3001', {
      'X-Bindplane-Api-Key': 'test-key',
    });
  });

  it('makes GET requests with correct URL and headers', async () => {
    const mockResponse = { agents: [] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await client.get('/v1/agents');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/agents',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Bindplane-Api-Key': 'test-key',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('appends query params to GET requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    await client.get('/v1/agents', { query: 'status:Connected' });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/agents?query=status%3AConnected',
      expect.anything()
    );
  });

  it('makes POST requests with JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })
    );

    const body = { name: 'test' };
    await client.post('/v1/apply', body);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/apply',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws on non-2xx responses with error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('{"error":"invalid api key"}'),
      })
    );

    await expect(client.get('/v1/agents')).rejects.toThrow(
      'BindPlane API error 401'
    );
  });

  it('strips trailing slash from base URL', () => {
    const c = new BindPlaneClient('http://localhost:3001/', {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );
    c.get('/v1/version');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/version',
      expect.anything()
    );
  });
});
