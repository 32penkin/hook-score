import { appConfig } from '../../shared/config/environment';

const REDACTED_VALUE = '[redacted]';
const MAX_STRING_LOG_LENGTH = 6000;
const MAX_ARRAY_LOG_ITEMS = 20;
const MAX_LOG_DEPTH = 8;

let nextRequestId = 0;

type ApiLogBase = {
  service: string;
  requestId: number;
  method: string;
  url: string;
};

type ApiRequestLog = ApiLogBase & {
  headers?: unknown;
  body?: unknown;
};

type ApiResponseLog = ApiLogBase & {
  status: number;
  statusText: string;
  ok: boolean;
  durationMs: number;
  headers?: unknown;
  body?: unknown;
};

type ApiErrorLog = ApiLogBase & {
  durationMs: number;
  error: unknown;
};

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

const isLoggingEnabled = () => appConfig.apiDebugLogs;

export const createApiRequestId = () => {
  nextRequestId += 1;
  return nextRequestId;
};

const isHeaders = (value: unknown): value is Headers =>
  typeof Headers !== 'undefined' && value instanceof Headers;

const isRequest = (value: unknown): value is Request =>
  typeof Request !== 'undefined' && value instanceof Request;

const isUrl = (value: unknown): value is URL =>
  typeof URL !== 'undefined' && value instanceof URL;

const isUrlSearchParams = (value: unknown): value is URLSearchParams =>
  typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams;

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData;

const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== 'undefined' && value instanceof Blob;

const isSensitiveKey = (key: string) => {
  const normalizedKey = key.toLowerCase();

  return (
    normalizedKey === 'authorization' ||
    normalizedKey === 'apikey' ||
    normalizedKey === 'api_key' ||
    normalizedKey === 'api-key' ||
    normalizedKey === 'x-api-key' ||
    normalizedKey === 'x-goog-api-key' ||
    normalizedKey === 'password' ||
    normalizedKey === 'access_token' ||
    normalizedKey === 'refresh_token' ||
    normalizedKey === 'id_token' ||
    normalizedKey === 'provider_token' ||
    normalizedKey === 'provider_refresh_token' ||
    normalizedKey === 'code_verifier' ||
    normalizedKey === 'auth_code' ||
    normalizedKey === 'client_secret' ||
    normalizedKey === 'cookie' ||
    normalizedKey === 'set-cookie' ||
    normalizedKey.endsWith('_secret') ||
    normalizedKey.endsWith('-secret') ||
    normalizedKey.endsWith('_token') ||
    normalizedKey.endsWith('-token')
  );
};

const isSensitiveQueryParam = (key: string) => {
  const normalizedKey = key.toLowerCase();

  return (
    normalizedKey === 'key' ||
    normalizedKey === 'apikey' ||
    normalizedKey === 'api_key' ||
    normalizedKey === 'access_token' ||
    normalizedKey === 'refresh_token' ||
    normalizedKey === 'id_token' ||
    normalizedKey === 'code' ||
    normalizedKey === 'password' ||
    normalizedKey.endsWith('_token') ||
    normalizedKey.endsWith('-token')
  );
};

const truncateString = (value: string) => {
  if (value.length <= MAX_STRING_LOG_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LOG_LENGTH)}... [truncated ${
    value.length - MAX_STRING_LOG_LENGTH
  } chars, total ${value.length}]`;
};

const summarizeString = (value: string) => {
  const dataUrlMatch = /^data:([^;,]+);base64,/.exec(value);

  if (dataUrlMatch) {
    const base64Start = value.indexOf(',') + 1;

    return `[data-url mime=${dataUrlMatch[1]} base64Chars=${Math.max(
      value.length - base64Start,
      0
    )}]`;
  }

  const compactValue = value.replace(/\s/g, '');

  if (
    compactValue.length > 1024 &&
    compactValue.length % 4 === 0 &&
    /^[A-Za-z0-9+/=]+$/.test(compactValue)
  ) {
    return `[base64 chars=${compactValue.length}]`;
  }

  return truncateString(value);
};

export const sanitizeForLog = (
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return summarizeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  if (depth >= MAX_LOG_DEPTH) {
    return `[Object depthLimit keys=${Object.keys(value).join(',')}]`;
  }

  if (isHeaders(value)) {
    return sanitizeHeadersForLog(value);
  }

  if (isUrlSearchParams(value)) {
    return sanitizeForLog(Object.fromEntries(value.entries()), depth + 1, seen);
  }

  if (isFormData(value)) {
    return '[FormData body omitted]';
  }

  if (isBlob(value)) {
    return `[Blob type=${value.type || 'unknown'} size=${value.size}]`;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof ArrayBuffer) {
    return `[ArrayBuffer byteLength=${value.byteLength}]`;
  }

  if (ArrayBuffer.isView(value)) {
    return `[${value.constructor.name} byteLength=${value.byteLength}]`;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_LOG_ITEMS)
      .map((item) => sanitizeForLog(item, depth + 1, seen));

    if (value.length > MAX_ARRAY_LOG_ITEMS) {
      items.push(`[${value.length - MAX_ARRAY_LOG_ITEMS} more items]`);
    }

    return items;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      isSensitiveKey(key) ? REDACTED_VALUE : sanitizeForLog(nestedValue, depth + 1, seen),
    ])
  );
};

export const sanitizeHeadersForLog = (headers: HeadersInit | null | undefined) => {
  if (!headers) {
    return undefined;
  }

  const headerEntries = isHeaders(headers)
    ? Array.from(headers.entries())
    : Array.isArray(headers)
      ? headers
      : Object.entries(headers);

  return Object.fromEntries(
    headerEntries.map(([key, value]) => [
      key,
      isSensitiveKey(key) ? REDACTED_VALUE : sanitizeForLog(String(value)),
    ])
  );
};

export const sanitizeUrlForLog = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    parsedUrl.searchParams.forEach((_value, key) => {
      if (isSensitiveQueryParam(key)) {
        parsedUrl.searchParams.set(key, REDACTED_VALUE);
      }
    });

    return parsedUrl.toString();
  } catch {
    return url;
  }
};

export const parseBodyForLog = (body: unknown) => {
  if (typeof body !== 'string') {
    return sanitizeForLog(body);
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return '';
  }

  try {
    return sanitizeForLog(JSON.parse(trimmedBody));
  } catch {
    return sanitizeForLog(body);
  }
};

export const sanitizeErrorForLog = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return sanitizeForLog(error);
};

export const stringifyForLog = (value: unknown) => {
  const sanitizedValue = sanitizeForLog(value);

  if (sanitizedValue === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(sanitizedValue, null, 2) ?? String(sanitizedValue);
  } catch {
    return String(sanitizedValue);
  }
};

const logJson = (
  level: 'log' | 'error',
  message: string,
  payload: Record<string, unknown>
) => {
  console[level](`${message} ${stringifyForLog(payload)}`);
};

export const logApiRequest = ({ service, requestId, method, url, headers, body }: ApiRequestLog) => {
  if (!isLoggingEnabled()) {
    return;
  }

  logJson('log', `[${service}] request #${requestId}`, {
    method,
    url: sanitizeUrlForLog(url),
    headers: sanitizeForLog(headers),
    body: sanitizeForLog(body),
  });
};

export const logApiResponse = ({
  service,
  requestId,
  method,
  url,
  status,
  statusText,
  ok,
  durationMs,
  headers,
  body,
}: ApiResponseLog) => {
  if (!isLoggingEnabled()) {
    return;
  }

  const payload: Record<string, unknown> = {
    method,
    url: sanitizeUrlForLog(url),
    status,
    statusText,
    ok,
    durationMs,
    headers: sanitizeForLog(headers),
    body: sanitizeForLog(body),
  };

  if (ok) {
    logJson('log', `[${service}] response #${requestId}`, payload);
    return;
  }

  logJson('error', `[${service}] response #${requestId}`, payload);
};

export const logApiError = ({
  service,
  requestId,
  method,
  url,
  durationMs,
  error,
}: ApiErrorLog) => {
  if (!isLoggingEnabled()) {
    return;
  }

  logJson('error', `[${service}] network error #${requestId}`, {
    method,
    url: sanitizeUrlForLog(url),
    durationMs,
    error: sanitizeErrorForLog(error),
  });
};

const getFetchRequestUrl = (input: FetchInput) => {
  if (typeof input === 'string') {
    return input;
  }

  if (isUrl(input)) {
    return input.toString();
  }

  if (isRequest(input)) {
    return input.url;
  }

  return String(input);
};

const getFetchRequestMethod = (input: FetchInput, init: FetchInit) => {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (isRequest(input) && input.method) {
    return input.method.toUpperCase();
  }

  return 'GET';
};

const getFetchRequestHeaders = (input: FetchInput, init: FetchInit) => {
  const requestHeaders = isRequest(input) ? sanitizeHeadersForLog(input.headers) : undefined;
  const initHeaders = sanitizeHeadersForLog(init?.headers);

  return {
    ...(requestHeaders ?? {}),
    ...(initHeaders ?? {}),
  };
};

const getFetchRequestBody = (input: FetchInput, init: FetchInit) => {
  if (init?.body !== undefined && init.body !== null) {
    return parseBodyForLog(init.body);
  }

  if (isRequest(input)) {
    return '[Request object body unavailable]';
  }

  return undefined;
};

const readResponseBodyForLog = async (response: Response) => {
  if (typeof response.clone !== 'function') {
    return '[Response clone unavailable]';
  }

  try {
    return parseBodyForLog(await response.clone().text());
  } catch (error) {
    return {
      unreadableBody: true,
      error: sanitizeErrorForLog(error),
    };
  }
};

export const createApiFetchLogger =
  (service: string) => async (input: FetchInput, init?: FetchInit) => {
    const requestId = createApiRequestId();
    const method = getFetchRequestMethod(input, init);
    const url = getFetchRequestUrl(input);
    const startedAt = Date.now();

    logApiRequest({
      service,
      requestId,
      method,
      url,
      headers: getFetchRequestHeaders(input, init),
      body: getFetchRequestBody(input, init),
    });

    try {
      const response = await globalThis.fetch(input, init);
      const durationMs = Date.now() - startedAt;

      logApiResponse({
        service,
        requestId,
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        durationMs,
        headers: sanitizeHeadersForLog(response.headers),
        body: await readResponseBodyForLog(response),
      });

      return response;
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
  };
