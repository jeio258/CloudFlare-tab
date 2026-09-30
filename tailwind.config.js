/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 设计令牌单一来源：颜色/阴影/圆角/字体均在此定义（tokens.css 仅保留 body 消费的 --ink/--fs-body）
      colors: {
        ink: '#1f2328',
        paper: '#f6f8fa',
        line: '#d1d9e0',
        muted: '#59636e',
        accent: '#0969da',
        danger: '#cf222e',
      },
      boxShadow: {
        card: '0 0 12px rgba(0, 0, 0, 0.25)',
        glass: '0 8px 24px rgba(0,0,0,.18)',
      },
      borderRadius: {
        xl2: '0.75rem',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
