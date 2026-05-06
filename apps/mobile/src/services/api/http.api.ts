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

export type HttpRetryConfig = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryStatuses?: number[];
};

export type HttpClientConfig = {
  serviceName?: string;
  retry?: HttpRetryConfig;
};

type ResolvedHttpRetryConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryStatuses: Set<number>;
};

type HttpRequestErrorInput = {
  message: string;
  status: number;
  statusText: string;
  responseBody: unknown;
};

const DEFAULT_RETRYABLE_STATUSES = [408, 409, 425, 429, 500, 502, 503, 504];
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 1,
  baseDelayMs: 750,
  maxDelayMs: 5000,
  retryStatuses: DEFAULT_RETRYABLE_STATUSES,
};

export class HttpRequestError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly responseBody: unknown;

  constructor({ message, status, statusText, responseBody }: HttpRequestErrorInput) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
  }
}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly config: HttpClientConfig = {}
  ) {}

  async post<TResponse>(path: string, options: HttpRequestOptions = {}): Promise<TResponse> {
    const retry = this.resolveRetryConfig();
    const method = 'POST';
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const service = this.config.serviceName ?? 'HTTP API';

    for (let attempt = 1; attempt <= retry.maxAttempts; attempt += 1) {
      const requestId = createApiRequestId();
      const startedAt = Date.now();

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

        if (attempt < retry.maxAttempts) {
          await this.waitBeforeRetry(retry, attempt);
          continue;
        }

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
        const error = this.createResponseError(response, responseText, responseBodyForLog);

        if (attempt < retry.maxAttempts && retry.retryStatuses.has(response.status)) {
          await this.waitBeforeRetry(retry, attempt, response);
          continue;
        }

        throw error;
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

    throw new Error('Request failed');
  }

  private resolveRetryConfig(): ResolvedHttpRetryConfig {
    const retry = this.config.retry ?? {};
    const maxAttempts = Math.max(
      1,
      Math.floor(retry.maxAttempts ?? DEFAULT_RETRY_CONFIG.maxAttempts)
    );
    const baseDelayMs = Math.max(0, retry.baseDelayMs ?? DEFAULT_RETRY_CONFIG.baseDelayMs);
    const maxDelayMs = Math.max(baseDelayMs, retry.maxDelayMs ?? DEFAULT_RETRY_CONFIG.maxDelayMs);

    return {
      maxAttempts,
      baseDelayMs,
      maxDelayMs,
      retryStatuses: new Set(retry.retryStatuses ?? DEFAULT_RETRY_CONFIG.retryStatuses),
    };
  }

  private createResponseError(
    response: Response,
    responseText: string,
    responseBodyForLog: unknown
  ) {
    const responseDetail = responseText.trim() ? stringifyForLog(responseBodyForLog) : '';
    const message = responseDetail
      ? `Request failed with status ${response.status}: ${responseDetail}`
      : `Request failed with status ${response.status}`;

    return new HttpRequestError({
      message,
      status: response.status,
      statusText: response.statusText,
      responseBody: responseBodyForLog,
    });
  }

  private async waitBeforeRetry(
    retry: ResolvedHttpRetryConfig,
    attempt: number,
    response?: Response
  ) {
    const retryAfterDelayMs = response ? this.getRetryAfterDelayMs(response) : null;
    const exponentialDelayMs = retry.baseDelayMs * 2 ** Math.max(0, attempt - 1);
    const jitterMs = Math.round(exponentialDelayMs * 0.25 * Math.random());
    const delayMs = Math.min(
      retry.maxDelayMs,
      retryAfterDelayMs ?? exponentialDelayMs + jitterMs
    );

    if (delayMs <= 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  private getRetryAfterDelayMs(response: Response) {
    const retryAfter = response.headers.get('retry-after');

    if (!retryAfter) {
      return null;
    }

    const retryAfterSeconds = Number(retryAfter);

    if (Number.isFinite(retryAfterSeconds)) {
      return Math.max(0, retryAfterSeconds * 1000);
    }

    const retryAfterDateMs = Date.parse(retryAfter);

    if (Number.isFinite(retryAfterDateMs)) {
      return Math.max(0, retryAfterDateMs - Date.now());
    }

    return null;
  }
}
