export class BindPlaneClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(
    baseUrl: string,
    authHeaders: Record<string, string>,
    options?: { timeout?: number }
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.headers = {
      ...authHeaders,
      'Content-Type': 'application/json',
    };
    this.timeout = options?.timeout ?? 30_000;
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>('GET', url);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', `${this.baseUrl}${path}`, body);
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', `${this.baseUrl}${path}`, body);
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', `${this.baseUrl}${path}`, body);
  }

  async delete<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('DELETE', `${this.baseUrl}${path}`, body);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `BindPlane API error ${response.status} (${response.statusText}): ${errorBody}`
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
