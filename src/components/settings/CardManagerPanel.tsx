// 卡片管理面板：分组分区列表 + 编辑弹窗（对齐上游 addorEditCardForm 弹窗形式） + 书签导入 + 分组管理 + 批量调整
import { useState } from 'react';
import { Button, Checkbox, Input, InputNumber, Select, message, Upload } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined,
  ImportOutlined, CheckOutlined,
} from '@ant-design/icons';
import { useSite } from '../../store/site';
import { fetchSiteInfoWithFavicon } from '../../lib/siteInfo';
import CardEditModal from './CardEditModal';
import { parseBookmarkFile, bookmarkToCard } from '../../lib/bookmarkImport';

// 获取网站信息（含 favicon 兜底）：icon 取上游结果，为空时探测站点 favicon.ico
const fetchSiteInfo = async (url: string) => fetchSiteInfoWithFavicon(url);

// 批量抓取缺图标卡片的 favicon（并发 2，失败静默保持默认图标）
async function fetchIconsBatch(targets: { id: string; url: string }[], apply: (id: string, icon: string) => void) {
  const queue = [...targets];
  const worker = async () => {
    while (queue.length) {
      const c = queue.shift()!;
      try {
        const info = await fetchSiteInfo(c.url);
        if (info?.icon) apply(c.id, info.icon);
      } catch {
        /* 单个失败保持默认图标 */
      }
    }
  };
  await Promise.all([worker(), worker()]);
}

export function CardManagerPanel({ initialBatch = false, initialSelect }: { initialBatch?: boolean; initialSelect?: string } = {}) {
  const { cards, setCards, settings, updateSettings } = useSite();
  const groups = settings.cardGroups || [];
  // 编辑弹窗（对齐上游弹出式弹窗卡片交互）
  const [editTarget, setEditTarget] = useState<string | 'new' | null>(null);
  const [imported, setImported] = useState(0);
  // 批量模式（右键「批量编辑」一步直达：initialBatch + 预选卡片）
  const [batch, setBatch] = useState(initialBatch);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelect ? [initialSelect] : []));
  const [newGroup, setNewGroup] = useState('');
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [batchGroup, setBatchGroup] = useState('');
  const [batchIcon, setBatchIcon] = useState('');
  const [batchFontSize, setBatchFontSize] = useState<number | null>(null);
  const [batchFontColor, setBatchFontColor] = useState('#333333');
  const [batchBgColor, setBatchBgColor] = useState('#ffffff');

  const remove = (id: string) => setCards(cards.filter((c) => c.id !== id));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...cards];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setCards(next);
  };

  // 书签导入：HTML/JSON 书签导出文件 → 卡片（按 url 去重）；导入后自动补抓缺失图标
  const onImport = async (file: File) => {
    const text = await file.text();
    try {
      const items = parseBookmarkFile(file.name, text, new Set(cards.map((c) => c.url)));
      const fresh = items.filter((c) => !c.dup);
      if (fresh.length === 0) {
        message.warning('未解析到可导入的书签（或全部已存在）');
        return;
      }
      const newCards = fresh.map(bookmarkToCard);
      setCards([...cards, ...newCards]);
      setImported(fresh.length);
      message.success(`已导入 ${fresh.length} 个书签${items.length - fresh.length ? `（${items.length - fresh.length} 个重复跳过）` : ''}`);
      // 后台补抓图标，不阻塞 UI
      const missing = newCards.filter((c) => !c.icon);
      if (missing.length) {
        const hide = message.loading(`正在获取 ${missing.length} 个网站图标…`, 0);
        let cur = [...cards, ...newCards];
        await fetchIconsBatch(missing, (id, icon) => {
          cur = cur.map((x) => (x.id === id && !x.icon ? { ...x, icon } : x));
          setCards(cur);
        });
        hide();
        message.success('图标获取完成');
      }
    } catch {
      message.error('文件解析失败，仅支持 HTML / JSON 书签导出文件');
    }
  };

  // 批量管理：为选中且缺图标的卡片抓取 favicon
  const batchFetchIcons = async () => {
    const missing = cards.filter((c) => selected.has(c.id) && !c.icon);
    if (missing.length === 0) return message.info('选中卡片均已有图标');
    const hide = message.loading(`正在获取 ${missing.length} 个网站图标…`, 0);
    let cur = [...cards];
    await fetchIconsBatch(missing, (id, icon) => {
      cur = cur.map((x) => (x.id === id && !x.icon ? { ...x, icon } : x));
      setCards(cur);
    });
    hide();
    message.success('图标获取完成');
  };

  // ===== 分组管理 =====
  const addGroup = () => {
    const n = newGroup.trim();
    if (!n) return message.warning('请输入分组名');
    if (groups.includes(n)) return message.warning('分组已存在');
    updateSettings({ cardGroups: [...groups, n] });
    setNewGroup('');
    message.success('分组已添加');
  };
  const renameGroup = (oldName: string) => {
    const next = (renameMap[oldName] || '').trim();
    if (!next || next === oldName) return;
    if (groups.includes(next)) return message.warning('目标分组名已存在');
    updateSettings({ cardGroups: groups.map((g) => (g === oldName ? next : g)) });
    setCards(cards.map((c) => (c.group === oldName ? { ...c, group: next } : c)));
    setRenameMap((m) => {
      const { [oldName]: _drop, ...rest } = m;
      return rest;
    });
    message.success('分组已重命名');
  };
  const deleteGroup = (name: string) => {
    if (!confirm(`删除分组「${name}」？组内卡片将移至未分组。`)) return;
    updateSettings({ cardGroups: groups.filter((g) => g !== name) });
    setCards(cards.map((c) => (c.group === name ? { ...c, group: '' } : c)));
    message.success('分组已删除');
  };

  // ===== 批量调整 =====
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const batchDelete = () => {
    if (selected.size === 0) return message.warning('请先选择卡片');
    if (!confirm(`删除选中的 ${selected.size} 张卡片？`)) return;
    setCards(cards.filter((c) => !selected.has(c.id)));
    setSelected(new Set());
    message.success('已批量删除');
  };
  const batchMoveGroup = () => {
    if (selected.size === 0) return message.warning('请先选择卡片');
    setCards(cards.map((c) => (selected.has(c.id) ? { ...c, group: batchGroup } : c)));
    message.success(`已移动 ${selected.size} 张卡片`);
  };
  const batchSetIcon = () => {
    const u = batchIcon.trim();
    if (!u) return message.warning('请输入图标 URL');
    if (selected.size === 0) return message.warning('请先选择卡片');
    setCards(cards.map((c) => (selected.has(c.id) ? { ...c, icon: u } : c)));
    setBatchIcon('');
    message.success(`已更新 ${selected.size} 张卡片图标`);
  };
  // 批量样式（字号/文字颜色/背景颜色；undefined = 清除该覆盖）
  const batchApplyStyle = (patch: { fontSize?: number; fontColor?: string; bgColor?: string }) => {
    if (selected.size === 0) return message.warning('请先选择卡片');
    setCards(cards.map((c) => (selected.has(c.id) ? { ...c, ...patch } : c)));
    message.success(`已更新 ${selected.size} 张卡片样式`);
  };

  // 分组分区渲染：未分组 + 各分组
  const renderRow = (c: (typeof cards)[number], globalIdx: number) => (
    <div key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
      {batch && <Checkbox checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />}
      <img src={c.icon || '/icons/website.svg'} alt="" className="h-8 w-8 rounded object-contain" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{c.title}</div>
        <div className="truncate text-xs text-gray-400">{c.url}</div>
      </div>
      {!batch && (
        <>
          <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={globalIdx === 0} onClick={() => move(globalIdx, -1)} />
          <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={globalIdx === cards.length - 1} onClick={() => move(globalIdx, 1)} />
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => setEditTarget(c.id)} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(c.id)} />
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">共 {cards.length} 张卡片</span>
        <div className="flex gap-2">
          <Button size="small" icon={<CheckOutlined />} type={batch ? 'primary' : 'default'} onClick={() => { setBatch(!batch); setSelected(new Set()); }}>
            {batch ? '完成' : '批量管理'}
          </Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setEditTarget('new')}>
            添加卡片
          </Button>
        </div>
      </div>

      {batch && (
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600">已选 {selected.size} 张</span>
            <Button
              size="small"
              type="link"
              onClick={() => setSelected(selected.size === cards.length ? new Set() : new Set(cards.map((c) => c.id)))}
            >
              {selected.size === cards.length ? '全不选' : '全选'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={batchGroup}
              onChange={setBatchGroup}
              placeholder="移动到分组"
              size="small"
              className="min-w-32 flex-1"
              allowClear
              options={groups.map((g) => ({ value: g, label: g }))}
            />
            <Button size="small" onClick={batchMoveGroup}>
              移动
            </Button>
            <Button size="small" danger onClick={batchDelete}>
              删除
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input size="small" value={batchIcon} onChange={(e) => setBatchIcon(e.target.value)} placeholder="批量设置图标 URL" />
            <Button size="small" onClick={batchSetIcon}>
              应用
            </Button>
            <Button size="small" onClick={batchFetchIcons}>
              获取图标
            </Button>
          </div>
          {/* 批量样式（对齐参考：批量调整字号/文字颜色/背景颜色） */}
          <div className="flex items-center gap-2">
            <InputNumber
              size="small"
              min={9}
              max={28}
              value={batchFontSize}
              placeholder="字号"
              onChange={(v: number | null) => setBatchFontSize(v ?? null)}
              className="w-20"
              addonAfter="px"
            />
            <Button size="small" disabled={batchFontSize === null} onClick={() => batchApplyStyle({ fontSize: batchFontSize ?? undefined })}>
              应用字号
            </Button>
            <input
              type="color"
              aria-label="批量文字颜色"
              value={batchFontColor}
              onChange={(e) => setBatchFontColor(e.target.value)}
              className="h-6 w-8 cursor-pointer rounded border border-gray-300"
            />
            <Button size="small" onClick={() => batchApplyStyle({ fontColor: batchFontColor })}>
              文字色
            </Button>
            <input
              type="color"
              aria-label="批量背景颜色"
              value={batchBgColor}
              onChange={(e) => setBatchBgColor(e.target.value)}
              className="h-6 w-8 cursor-pointer rounded border border-gray-300"
            />
            <Button size="small" onClick={() => batchApplyStyle({ bgColor: batchBgColor })}>
              背景色
            </Button>
            <Button size="small" onClick={() => batchApplyStyle({ fontSize: undefined, fontColor: undefined, bgColor: undefined })}>
              清除样式
            </Button>
          </div>
        </div>
      )}

      {imported > 0 && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
          已导入 {imported} 个书签（来自浏览器书签文件），可在下方列表中编辑或删除。
        </div>
      )}

      {/* 书签导入（对齐参考 importBookmark：网页版走文件解析，无需扩展） */}
      <div>
        <div className="mb-1 text-sm font-semibold">导入书签</div>
        <div className="text-xs text-gray-400">支持 Chrome / Firefox / Safari 导出的 HTML 或 JSON 书签文件，按链接去重后加入卡片；标题最长 50 字符，超出自动截断</div>
        <Upload
          accept=".html,.htm,.json"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(f) => {
            onImport(f as File);
            return false;
          }}
        >
          <Button size="small" icon={<ImportOutlined />}>
            选择书签文件
          </Button>
        </Upload>
      </div>

      {/* 分组管理 */}
      <div>
        <div className="mb-1 text-sm font-semibold">分组管理</div>
        <div className="space-y-2">
          {groups.length === 0 && <div className="text-xs text-gray-400">暂无分组，卡片默认未分组</div>}
          {groups.map((g) => (
            <div key={g} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <Input
                size="small"
                value={renameMap[g] ?? g}
                onChange={(e) => setRenameMap((m) => ({ ...m, [g]: e.target.value }))}
                className="flex-1"
              />
              <Button size="small" type="text" icon={<CheckOutlined />} onClick={() => renameGroup(g)} />
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => deleteGroup(g)} />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input size="small" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="新分组名" />
            <Button size="small" icon={<PlusOutlined />} onClick={addGroup}>
              添加分组
            </Button>
          </div>
        </div>
      </div>

      {/* 卡片列表：按分组分区 */}
      <div className="space-y-2">
        {cards.filter((c) => !c.group || !groups.includes(c.group)).map((c) => renderRow(c, cards.indexOf(c)))}
        {groups.map((g) => {
          const list = cards.filter((c) => c.group === g);
          if (list.length === 0) return null;
          return (
            <div key={g} className="space-y-2">
              <div className="text-xs font-semibold text-gray-500">
                {g}（{list.length}）
              </div>
              {list.map((c) => renderRow(c, cards.indexOf(c)))}
            </div>
          );
        })}
        {cards.length === 0 && <div className="py-4 text-center text-xs text-gray-400">暂无卡片，点击「添加卡片」或导入书签</div>}
      </div>

      {/* 编辑弹窗（对齐上游弹出式弹窗卡片） */}
      <CardEditModal open={editTarget !== null} cardId={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}
