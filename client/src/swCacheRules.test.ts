import { describe, it, expect } from 'vitest';
import {
  evaluateRequestCachePolicy,
  isProtectedEndpoint,
  CACHE_NAME,
  CACHE_PREFIX,
} from './utils/swCachePolicy';

describe('Service Worker Security & Caching Policy Evaluation', () => {
  const origin = 'http://localhost:5173';

  it('strictly rejects caching for API endpoints (/api and /api/*)', () => {
    const urls = [
      'http://localhost:5173/api',
      'http://localhost:5173/api/',
      'http://localhost:5173/api/v1/planner/daily',
      'http://localhost:5173/api/v1/planner/year',
      'http://localhost:5173/api/v1/planner/backup',
      'http://localhost:5173/api/v1/user/profile',
    ];

    for (const url of urls) {
      const result = evaluateRequestCachePolicy({ url, method: 'GET' }, origin);
      expect(result.action).toBe('NETWORK_ONLY');
      expect(result.reason).toContain('Protected API');
    }
  });

  it('strictly rejects caching for auth and session endpoints (/auth and /auth/*)', () => {
    const urls = [
      'http://localhost:5173/auth',
      'http://localhost:5173/auth/',
      'http://localhost:5173/auth/google',
      'http://localhost:5173/auth/session',
      'http://localhost:5173/auth/logout',
    ];

    for (const url of urls) {
      const result = evaluateRequestCachePolicy({ url, method: 'GET' }, origin);
      expect(result.action).toBe('NETWORK_ONLY');
      expect(result.reason).toContain('Protected API');
    }
  });

  it('strictly rejects caching for health endpoint (/health)', () => {
    const urls = ['http://localhost:5173/health', 'http://localhost:5173/health/'];
    for (const url of urls) {
      const result = evaluateRequestCachePolicy({ url, method: 'GET' }, origin);
      expect(result.action).toBe('NETWORK_ONLY');
      expect(result.reason).toContain('Protected API');
    }
  });

  it('strictly rejects caching for requests carrying credentials, cookies, or mutation IDs', () => {
    const resultWithCreds = evaluateRequestCachePolicy(
      {
        url: 'http://localhost:5173/assets/data.json',
        method: 'GET',
        credentials: 'include',
      },
      origin
    );
    expect(resultWithCreds.action).toBe('NETWORK_ONLY');
    expect(resultWithCreds.reason).toContain('Authenticated or credentialed');

    const resultWithAuth = evaluateRequestCachePolicy(
      {
        url: 'http://localhost:5173/assets/data.json',
        method: 'GET',
        headers: { authorization: 'Bearer secret-token' },
      },
      origin
    );
    expect(resultWithAuth.action).toBe('NETWORK_ONLY');
    expect(resultWithAuth.reason).toContain('Authenticated or credentialed');

    const resultWithCookie = evaluateRequestCachePolicy(
      {
        url: 'http://localhost:5173/assets/data.json',
        method: 'GET',
        headers: { cookie: 'planner_session=abc123xyz' },
      },
      origin
    );
    expect(resultWithCookie.action).toBe('NETWORK_ONLY');
    expect(resultWithCookie.reason).toContain('Authenticated or credentialed');

    const resultWithMutationId = evaluateRequestCachePolicy(
      {
        url: 'http://localhost:5173/assets/data.json',
        method: 'GET',
        headers: { 'x-mutation-id': 'mutation-guid-123' },
      },
      origin
    );
    expect(resultWithMutationId.action).toBe('NETWORK_ONLY');
    expect(resultWithMutationId.reason).toContain('Authenticated or credentialed');
  });

  it('strictly rejects caching for non-GET methods (POST, PUT, DELETE)', () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      const result = evaluateRequestCachePolicy(
        { url: 'http://localhost:5173/assets/index.js', method },
        origin
      );
      expect(result.action).toBe('NETWORK_ONLY');
      expect(result.reason).toBe('Non-GET method');
    }
  });

  it('strictly rejects cross-origin requests from runtime static cache', () => {
    const crossOriginUrls = [
      'https://accounts.google.com/o/oauth2/v2/auth',
      'https://www.googleapis.com/oauth2/v3/userinfo',
      'https://cdn.example.com/script.js',
    ];

    for (const url of crossOriginUrls) {
      const result = evaluateRequestCachePolicy({ url, method: 'GET' }, origin);
      expect(result.action).toBe('NETWORK_ONLY');
      expect(result.reason).toContain('Cross-origin request rejected');
    }
  });

  it('allows allowlisted static application assets with CACHE_FIRST', () => {
    const staticAssets = [
      'http://localhost:5173/assets/index-C650mtrT.js',
      'http://localhost:5173/assets/index-Cx50XNww.css',
      'http://localhost:5173/icons/icon-192x192.png',
      'http://localhost:5173/icons/icon-512x512.png',
      'http://localhost:5173/images/gp-monogram.png',
      'http://localhost:5173/fonts/inter.woff2',
    ];

    for (const url of staticAssets) {
      const result = evaluateRequestCachePolicy({ url, method: 'GET' }, origin);
      expect(result.action).toBe('CACHE_FIRST');
      expect(result.reason).toContain('Allowlisted static application asset');
    }
  });

  it('evaluates SPA navigation and root shell requests with STALE_WHILE_REVALIDATE', () => {
    const navResult = evaluateRequestCachePolicy(
      { url: 'http://localhost:5173/annual', method: 'GET', mode: 'navigate' },
      origin
    );
    expect(navResult.action).toBe('STALE_WHILE_REVALIDATE');
    expect(navResult.reason).toBe('SPA navigation shell');

    const rootResult = evaluateRequestCachePolicy(
      { url: 'http://localhost:5173/', method: 'GET' },
      origin
    );
    expect(rootResult.action).toBe('STALE_WHILE_REVALIDATE');

    const manifestResult = evaluateRequestCachePolicy(
      { url: 'http://localhost:5173/manifest.webmanifest', method: 'GET' },
      origin
    );
    expect(manifestResult.action).toBe('STALE_WHILE_REVALIDATE');
  });

  it('verifies isProtectedEndpoint helper behavior', () => {
    expect(isProtectedEndpoint('/api')).toBe(true);
    expect(isProtectedEndpoint('/api/v1/planner/daily')).toBe(true);
    expect(isProtectedEndpoint('/auth')).toBe(true);
    expect(isProtectedEndpoint('/auth/google')).toBe(true);
    expect(isProtectedEndpoint('/health')).toBe(true);
    expect(isProtectedEndpoint('/health/')).toBe(true);

    expect(isProtectedEndpoint('/')).toBe(false);
    expect(isProtectedEndpoint('/annual')).toBe(false);
    expect(isProtectedEndpoint('/monthly/2026/10')).toBe(false);
    expect(isProtectedEndpoint('/weekly/2026/42')).toBe(false);
    expect(isProtectedEndpoint('/daily/2026-10-15')).toBe(false);
    expect(isProtectedEndpoint('/settings')).toBe(false);
  });

  it('verifies cache naming and prefix isolation', () => {
    expect(CACHE_NAME).toBe('gp-planner-shell-v1');
    expect(CACHE_PREFIX).toBe('gp-planner-');
  });
});
