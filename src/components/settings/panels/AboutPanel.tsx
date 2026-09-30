// 关于 + 版本说明（对齐参考「版本说明」项）
import { Divider } from 'antd';

export function AboutPanel() {
  return (
    <div className="space-y-3 text-sm leading-6">
      <div className="flex items-center gap-2">
        <img src="/icons/logo.svg" alt="logo" className="h-10 w-10" />
        <div>
          <div className="font-semibold">CloudFlare-tab</div>
          <div className="text-xs text-gray-500">CloudFlare-tab 新标签页</div>
        </div>
      </div>
      <p className="text-gray-600">
        前端 React + Vite，后端 Cloudflare Pages Functions + D1。
        支持账号云同步、自定义导航卡片、挂件与后台管理。
      </p>
      <Divider />
      <div className="text-sm font-semibold">版本说明</div>
      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-500">
        <div>当前版本：v1.0.0（2026-09-27）</div>
        <div>· 桌面/移动双端自适应的导航起始页</div>
        <div>· 后端 Cloudflare Pages Functions + D1</div>
        <div>· 支持：卡片分组/批量调整、书签迁移、云同步、个性分享、挂件、简约模式、自由换位</div>
      </div>
      <p className="text-gray-400">© 2026 CloudFlare-tab · 由 Cloudflare Pages 提供支持</p>
    </div>
  );
}
