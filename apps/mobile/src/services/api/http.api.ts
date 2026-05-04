import {
  createApiRequestId,
  logApiError,
  logApiRequest,
  logApiResponse,
  parseBodyForLog,
  sanitizeHeadersForLog,
  stringifyForLog,
} from './api-logger';

export type HttpRequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

export type HttpClientConfig = {
  serviceName?: string;
};

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly config: HttpClientConfig = {}
  ) {}

  async post<TResponse>(path: string, options: HttpRequestOptions = {}): Promise<TResponse> {
    const requestId = createApiRequestId();
    const method = 'POST';
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const startedAt = Date.now();
    const service = this.config.serviceName ?? 'HTTP API';

    logApiRequest({
      service,
      requestId,
      method,
      url,
      headers: sanitizeHeadersForLog(headers),
      body: parseBodyForLog(body),
    });

    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers,
        body,
      });
    } catch (error) {
      logApiError({
        service,
        requestId,
        method,
        url,
        durationMs: Date.now() - startedAt,
        error,
      });

      throw error;
    }

    const responseText = await response.text();
    const responseBodyForLog = parseBodyForLog(responseText);

    logApiResponse({
      service,
      requestId,
      method,
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
      headers: sanitizeHeadersForLog(response.headers),
      body: responseBodyForLog,
    });

    if (!response.ok) {
      const responseDetail = responseText.trim() ? stringifyForLog(responseBodyForLog) : '';
      const errorMessage = responseDetail
        ? `Request failed with status ${response.status}: ${responseDetail}`
        : `Request failed with status ${response.status}`;

      throw new Error(errorMessage);
    }

    if (!responseText.trim()) {
      return undefined as TResponse;
    }

    try {
      return JSON.parse(responseText) as TResponse;
    } catch {
      throw new Error(
        `Request failed because response JSON could not be parsed: ${stringifyForLog(responseText)}`
      );
    }
  }
}
