import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './store/auth';
import { SiteProvider } from './store/site';
import './styles/tokens.css';
import './styles/fonts.css';

// 首屏不引入 antd（P1-3）：ConfigProvider+zhCN 移至懒加载的 SettingsDrawer/CardEditModal 内
// 路由由 App 内置的极简路径路由承担，不再依赖 react-router-dom
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <SiteProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SiteProvider>
    </AuthProvider>
  </React.StrictMode>
);
