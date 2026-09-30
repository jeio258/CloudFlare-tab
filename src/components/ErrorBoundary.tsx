// 错误页边界（对齐参考 myErrorPage）：渲染异常时显示友好错误页而非白屏
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CloudFlare-tab error boundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#12151a] text-white" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>
          <div className="text-5xl">:(</div>
          <div className="text-lg font-semibold">页面出错了</div>
          <div className="max-w-md text-center text-sm text-white/60">{this.state.error.message || '发生未知错误'}</div>
          <button
            type="button"
            onClick={() => location.reload()}
            className="rounded-full bg-white/85 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-white"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
