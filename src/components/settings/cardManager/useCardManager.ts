// 卡片管理状态与操作：列表/分组/批量/导入四个分区共享，入口只做组装
import { useState } from 'react';
import { message } from 'antd';
import { useSite } from '../../../store/site';
import { parseBookmarkFile, bookmarkToCard } from '../../../lib/bookmarkImport';
import { fetchIconsBatch } from './fetchIcons';

export function useCardManager(initialBatch: boolean, initialSelect?: string) {
  const { cards, setCards, settings, updateSettings } = useSite();
  const groups = settings.cardGroups || [];
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

  const toggleBatch = () => {
    setBatch(!batch);
    setSelected(new Set());
  };

  const selectAllOrNone = () => {
    setSelected(selected.size === cards.length ? new Set() : new Set(cards.map((c) => c.id)));
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

  return {
    cards,
    groups,
    editTarget,
    setEditTarget,
    imported,
    batch,
    toggleBatch,
    selected,
    toggleSelect,
    selectAllOrNone,
    newGroup,
    setNewGroup,
    renameMap,
    setRenameMap,
    batchGroup,
    setBatchGroup,
    batchIcon,
    setBatchIcon,
    batchFontSize,
    setBatchFontSize,
    batchFontColor,
    setBatchFontColor,
    batchBgColor,
    setBatchBgColor,
    remove,
    move,
    onImport,
    batchFetchIcons,
    addGroup,
    renameGroup,
    deleteGroup,
    batchDelete,
    batchMoveGroup,
    batchSetIcon,
    batchApplyStyle,
  };
}

export type CardManagerApi = ReturnType<typeof useCardManager>;
