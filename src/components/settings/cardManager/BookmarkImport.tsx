// 书签导入分区：导入结果提示 + 文件选择（网页版走文件解析，无需扩展）
import { useRef } from 'react';
import { Button } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import type { CardManagerApi } from './useCardManager';

export function BookmarkImport({ m }: { m: CardManagerApi }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      {m.imported > 0 && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
          已导入 {m.imported} 个书签（来自浏览器书签文件），可在下方列表中编辑或删除。
        </div>
      )}

      {/* 书签导入（对齐参考 importBookmark：网页版走文件解析，无需扩展） */}
      <div>
        <div className="mb-1 text-sm font-semibold">导入书签</div>
        <div className="text-xs text-gray-400">支持 Chrome / Firefox / Safari 导出的 HTML 或 JSON 书签文件，按链接去重后加入卡片；标题最长 50 字符，超出自动截断</div>
        <input
          ref={fileRef}
          type="file"
          accept=".html,.htm,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) m.onImport(f);
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
        <Button size="small" icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>
          选择书签文件
        </Button>
      </div>
    </>
  );
}
