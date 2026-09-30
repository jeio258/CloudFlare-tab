import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './store/auth';
import { SiteProvider } from './store/site';
import './styles/tokens.css';
import './styles/fonts.css';

// 首屏不引入 antd（P1-3）：ConfigProvider+zhCN 移至懒加载的 SettingsDrawer/CardEditModal 内
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
