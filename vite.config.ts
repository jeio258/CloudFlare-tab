import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

// Cloudflare Pages 部署产物：dist/ = 前端构建 + functions/（Pages Functions）+ _redirects + _headers
const pagesPlugin = () => ({
  name: "cloudflare-tab-pages",
  async closeBundle() {
    const out = join(root, 'dist');
    mkdirSync(out, { recursive: true });
    const fns = join(root, 'functions');
    if (existsSync(fns)) {
      if (existsSync(join(out, 'functions'))) rmSync(join(out, 'functions'), { recursive: true });
      cpSync(fns, join(out, 'functions'), { recursive: true });
    }
    writeFileSync(join(out, '_redirects'), '/* /index.html 200\n');
    writeFileSync(
      join(out, '_headers'),
      [
        '/assets/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '',
        '/images/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '',
        '/*',
        '  X-Content-Type-Options: nosniff',
        '  X-Frame-Options: SAMEORIGIN',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()',
        '',
      ].join('\n')
    );
  },
});

export default defineConfig({
  plugins: [react(), pagesPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: join(root, 'index.html'),
    },
  },
});
