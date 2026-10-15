import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Icon Assets Verification', () => {
  const publicDir = path.resolve(__dirname, '../public');
  const manifestPath = path.join(publicDir, 'manifest.webmanifest');
  const indexHtmlPath = path.resolve(__dirname, '../index.html');

  it('verifies manifest.webmanifest exists and has compliant PWA fields', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifestContent.name).toBe('Guided Annual Planner');
    expect(manifestContent.short_name).toBe('GP Planner');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.theme_color).toBe('#7A9A48');
    expect(manifestContent.background_color).toBe('#FAF7F2');
    expect(manifestContent.orientation).toBe('portrait-primary');
    expect(Array.isArray(manifestContent.icons)).toBe(true);
    expect(manifestContent.icons.length).toBeGreaterThanOrEqual(4);
  });

  it('verifies all 4 required icon files exist with valid PNG magic bytes and exact dimensions', () => {
    const requiredIcons = [
      { name: 'icon-192x192.png', width: 192, height: 192, purpose: 'any' },
      { name: 'icon-512x512.png', width: 512, height: 512, purpose: 'any' },
      { name: 'icon-maskable-192x192.png', width: 192, height: 192, purpose: 'maskable' },
      { name: 'icon-maskable-512x512.png', width: 512, height: 512, purpose: 'maskable' },
    ];

    for (const icon of requiredIcons) {
      const iconPath = path.join(publicDir, 'icons', icon.name);
      expect(fs.existsSync(iconPath), `Missing icon: ${icon.name}`).toBe(true);

      const buf = fs.readFileSync(iconPath);
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const magic = buf.subarray(0, 8).toString('hex');
      expect(magic).toBe('89504e470d0a1a0a');

      // PNG dimensions (bytes 16..20 and 20..24, big-endian)
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(icon.width);
      expect(height).toBe(icon.height);
    }
  });

  it('verifies client/index.html includes required PWA meta tags and manifest reference', () => {
    expect(fs.existsSync(indexHtmlPath)).toBe(true);
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');

    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('name="theme-color" content="#7A9A48"');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(html).toContain('name="apple-mobile-web-app-title" content="GP Planner"');
    expect(html).toContain('rel="apple-touch-icon" href="/icons/icon-192x192.png"');
  });
});
