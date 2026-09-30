import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';

// 分享页路由级分割：非首屏路径不进主 bundle
const SharePage = lazy(() => import('./pages/SharePage'));

// 路由结构：/ 主页；/s/:id 只读分享页；后台为同页内面板（P1）
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/s/:shareId"
        element={
          <Suspense fallback={null}>
            <SharePage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={null}>
            <HomePage />
          </Suspense>
        }
      />
    </Routes>
  );
}
