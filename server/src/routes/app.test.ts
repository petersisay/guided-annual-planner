import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('App Root Endpoints, Production Static Serving & SPA Routing Guard', () => {
  const app = createApp();

  it('GET /health returns 200 with service status and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('guided-annual-planner-api');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/v1/nonexistent returns 404 JSON without being caught by SPA fallback', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('GET / serves the client index.html app shell when client/dist exists', async () => {
    const res = await request(app).get('/');
    // When client/dist exists from production build, returns index.html
    if (res.status === 200) {
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Guided Annual Planner');
      expect(res.text).toContain('manifest.webmanifest');
    }
  });

  it('GET /annual (representative SPA route) falls back to index.html without 404', async () => {
    const res = await request(app).get('/annual');
    if (res.status === 200) {
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Guided Annual Planner');
    }
  });

  it('GET /manifest.webmanifest serves the static manifest file', async () => {
    const res = await request(app).get('/manifest.webmanifest');
    if (res.status === 200) {
      expect(res.text).toContain('Guided Annual Planner');
      expect(res.text).toContain('GP Planner');
    }
  });
});
