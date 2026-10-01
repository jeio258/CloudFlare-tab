import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

// Cloudflare Pages 部署产物：dist/ = 前端构建 + functions/（Pages Functions）+ _headers
// SPA 回退不再写 _redirects（CF 环检测 code 100324 拒绝 `/* /index.html 200`）：
// Pages 对根含 index.html 的项目自动做无扩展名路径回退，深链接 /s/* 直接命中
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
    // CSS 内联：首屏唯一样式表直接进 HTML，消除阻塞渲染的串行请求（真实网络下每请求 300ms+）
    const htmlPath = join(out, 'index.html');
    let html = readFileSync(htmlPath, 'utf8');
    html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => {
      const cssPath = join(out, href.slice(1));
      if (!existsSync(cssPath)) return _;
      const css = readFileSync(cssPath, 'utf8');
      rmSync(cssPath);
      return `<style>${css}</style>`;
    });
    writeFileSync(htmlPath, html);
  },
});

export default defineConfig({
  plugins: [react(), pagesPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: join(root, 'index.html'),
      output: {
        // P1-3 拆包：antd 系与 react 系独立 chunk，antd 仅由懒加载设置抽屉/编辑弹窗引入，首屏不加载
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](antd|@ant-design[\\/][^\\/]+|rc-[\\w-]+|@rc-component[\\/][^\\/]+|dayjs)[\\/]/.test(id)) return 'antd';
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
});
