/**
 * Service Worker Caching & Security Policy
 *
 * Enforces strict, zero-trust caching rules:
 * - Cache ONLY allowlisted same-origin static assets
 * - NEVER cache API responses (/api/*)
 * - NEVER cache auth/session endpoints (/auth/*)
 * - NEVER cache health check (/health)
 * - NEVER cache OAuth / third-party identity requests
 * - NEVER cache requests with credentials, cookies, or Authorization headers
 * - NEVER cache non-GET requests
 * - Reject cross-origin requests from runtime cache
 */

export const CACHE_NAME = 'gp-planner-shell-v1';
export const CACHE_PREFIX = 'gp-planner-';

export type CacheAction = 'CACHE_FIRST' | 'STALE_WHILE_REVALIDATE' | 'NETWORK_ONLY';

export interface RequestLike {
  url: string;
  method?: string;
  mode?: string;
  credentials?: RequestCredentials | string;
  headers?: {
    get(name: string): string | null;
    has?(name: string): boolean;
  } | Record<string, string | null | undefined>;
}

const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.webp',
  '.woff2',
  '.woff',
  '.webmanifest',
];

/**
 * Checks if a pathname represents an API, auth, or health endpoint.
 */
export function isProtectedEndpoint(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return (
    normalized === '/api' ||
    normalized.startsWith('/api/') ||
    normalized === '/auth' ||
    normalized.startsWith('/auth/') ||
    normalized === '/health' ||
    normalized.startsWith('/health/')
  );
}

/**
 * Evaluates whether a request should be served/saved from/to the Service Worker Cache Storage.
 */
export function evaluateRequestCachePolicy(
  req: RequestLike,
  currentOrigin: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
): { action: CacheAction; reason: string } {
  const method = (req.method || 'GET').toUpperCase();

  // 1. Strict rejection of non-GET methods
  if (method !== 'GET') {
    return { action: 'NETWORK_ONLY', reason: 'Non-GET method' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(req.url, currentOrigin);
  } catch {
    return { action: 'NETWORK_ONLY', reason: 'Invalid URL' };
  }

  // 2. Reject cross-origin requests from runtime caching
  if (parsedUrl.origin !== currentOrigin) {
    return { action: 'NETWORK_ONLY', reason: 'Cross-origin request rejected' };
  }

  // 3. Reject any request with credentials, cookies, mutation IDs, or Authorization headers
  let hasCredentials = false;
  if (req.credentials === 'include') {
    hasCredentials = true;
  }

  if (req.headers) {
    if (typeof (req.headers as any).has === 'function') {
      const h = req.headers as { has(n: string): boolean; get(n: string): string | null };
      if (
        h.has('authorization') ||
        h.has('cookie') ||
        h.has('x-mutation-id') ||
        Boolean(h.get('authorization')) ||
        Boolean(h.get('cookie'))
      ) {
        hasCredentials = true;
      }
    } else {
      const h = req.headers as Record<string, string | null | undefined>;
      if (
        Boolean(h['authorization'] || h['Authorization']) ||
        Boolean(h['cookie'] || h['Cookie']) ||
        Boolean(h['x-mutation-id'] || h['X-Mutation-Id'])
      ) {
        hasCredentials = true;
      }
    }
  }

  if (hasCredentials) {
    return { action: 'NETWORK_ONLY', reason: 'Authenticated or credentialed request' };
  }

  const pathname = parsedUrl.pathname.toLowerCase();

  // 4. Strict exclusion of API, authentication, and health endpoints
  if (isProtectedEndpoint(pathname)) {
    return { action: 'NETWORK_ONLY', reason: 'Protected API/Auth/Health endpoint' };
  }

  // 5. OAuth & identity traffic
  if (
    parsedUrl.hostname.includes('google') ||
    parsedUrl.hostname.includes('googleapis') ||
    pathname.includes('oauth')
  ) {
    return { action: 'NETWORK_ONLY', reason: 'OAuth/Identity endpoint' };
  }

  // 6. SPA Navigation (HTML app shell)
  if (req.mode === 'navigate') {
    return { action: 'STALE_WHILE_REVALIDATE', reason: 'SPA navigation shell' };
  }

  // 7. Check for root or explicit index.html / manifest
  if (pathname === '/' || pathname === '/index.html' || pathname === '/manifest.webmanifest') {
    return { action: 'STALE_WHILE_REVALIDATE', reason: 'App shell entry' };
  }

  // 8. Static hashed assets (.js, .css, images, fonts)
  const isAllowlistedStatic = STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  if (isAllowlistedStatic) {
    return { action: 'CACHE_FIRST', reason: 'Allowlisted static application asset' };
  }

  // Default fallback: do not cache arbitrary URLs
  return { action: 'NETWORK_ONLY', reason: 'Unmatched route default' };
}
