import { lazy, Suspense, useEffect, useState } from 'react';
import HomePage from './pages/HomePage';

// 分享页路由级分割：非首屏路径不进主 bundle
const SharePage = lazy(() => import('./pages/SharePage'));

// 极简路径路由（替代 react-router-dom）：本应用仅「/ 首页」与「/s/:id 分享页」两条路径，
// 且只通过整页加载/前进后退切换，无需 pushState 路由；未知路径回落首页（与旧 '*' 行为一致）
function usePathname() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export default function App() {
  const path = usePathname();
  const m = path.match(/^\/s\/([^/]+)\/?$/);
  if (m) {
    return (
      <Suspense fallback={null}>
        <SharePage shareId={decodeURIComponent(m[1])} />
      </Suspense>
    );
  }
  return <HomePage />;
}
