// 卡片编辑弹窗（对齐上游 addorEditCardForm 弹窗形式）：卡片管理与首页 hover 编辑共用
import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { CloudDownloadOutlined } from '@ant-design/icons';
import { useSite } from '../../store/site';
import { fetchSiteInfoWithFavicon } from '../../lib/siteInfo';
import type { HomeCard } from '../../api/types';
import { newCardId } from '../../lib/id';
import { WIDGET_TYPES } from '../home/WidgetCards';

interface FormValues {
  title: string;
  subTitle?: string;
  url?: string;
  icon?: string;
  group?: string;
  displayStyle?: 'default' | 'horizontal' | 'vertical' | 'image' | 'text';
  size?: HomeCard['size'];
  fontSize?: number;
  type?: string;
  config?: string;
}

interface Props {
  open: boolean;
  cardId: string | 'new' | null;
  onClose: () => void;
}

export default function CardEditModal({ open, cardId, onClose }: Props) {
  const { cards, setCards, settings } = useSite();
  const [form] = Form.useForm<FormValues>();
  const [fetching, setFetching] = useState(false);
  const [manualIcon, setManualIcon] = useState(false); // 图标输入框默认隐藏，自动获取的 URL 直接生效

  useEffect(() => {
    if (!open) return;
    if (cardId === 'new') form.resetFields();
    else {
      const c = cards.find((x) => x.id === cardId);
      if (c) {
        form.setFieldsValue({
          title: c.title, subTitle: c.subTitle, url: c.url, icon: c.icon || '',
          group: c.group || '', displayStyle: c.displayStyle || 'default', type: c.type || 'link', config: c.config || '',
          size: c.size, fontSize: c.fontSize,
        });
      }
    }
  }, [open, cardId]);

  const autoFill = async () => {
    const url = (form.getFieldValue('url') || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      message.warning('请先输入以 http(s):// 开头的链接');
      return;
    }
    setFetching(true);
    const info = await fetchSiteInfoWithFavicon(url);
    setFetching(false);
    if (!info || (!info.title && !info.icon && !info.description)) {
      message.warning('未能获取网站信息，请手动填写');
      return;
    }
    const patch: Partial<FormValues> = {};
    if (!form.getFieldValue('title') && info.title) patch.title = info.title;
    if (!form.getFieldValue('subTitle') && info.description) patch.subTitle = info.description.slice(0, 30);
    if (!form.getFieldValue('icon') && info.icon) patch.icon = info.icon;
    if (Object.keys(patch).length === 0) {
      message.info('字段均已填写，未覆盖');
      return;
    }
    form.setFieldsValue(patch);
    message.success('已自动获取网站信息');
  };

  const save = async () => {
    let v: FormValues;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    // icon 输入框默认隐藏（未注册字段不进 validateFields）——显式从 form store 读取自动获取值
    v.icon = v.icon || form.getFieldValue('icon') || '';
    if (cardId === 'new') {
      setCards([...cards, { id: newCardId(), title: v.title, subTitle: v.subTitle || '', url: v.url || '', icon: v.icon, group: v.group || '', displayStyle: v.displayStyle || 'default', size: v.size, fontSize: v.fontSize, type: (v.type as HomeCard['type']) || 'link', config: v.config || '' }]);
      message.success('卡片已添加');
    } else if (cardId) {
      // 编辑保留原卡未在表单中的字段（如历史 bgColor/fontColor，字段已从表单移除）
      setCards(cards.map((c) => (c.id === cardId ? { ...c, title: v.title, subTitle: v.subTitle || '', url: v.url || '', icon: v.icon, group: v.group || '', displayStyle: v.displayStyle || 'default', size: v.size, fontSize: v.fontSize, type: (v.type as HomeCard['type']) || 'link', config: v.config || '' } : c)));
      message.success('卡片已更新');
    }
    onClose();
    form.resetFields();
  };

  const isLink = !form.getFieldValue('type') || form.getFieldValue('type') === 'link';

  return (
    <Modal
      title={cardId === 'new' ? '添加卡片' : '编辑卡片'}
      open={open}
      onCancel={onClose}
      onOk={save}
      okText="保存"
      width={480}
      zIndex={1100}
      destroyOnClose
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" requiredMark={false} className="mt-3">
        <Form.Item name="title" label="卡片名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="如：GitHub" />
        </Form.Item>
        <Form.Item name="subTitle" label="副标题">
          <Input placeholder="如：代码托管平台" />
        </Form.Item>
        <Form.Item name="type" label="卡片类型">
          <Select
            virtual={false}
            options={[{ value: 'link', label: '链接卡片' }, ...WIDGET_TYPES]}
          />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
          {({ getFieldValue }) =>
            getFieldValue('type') && getFieldValue('type') !== 'link' ? (
              <Form.Item name="config" label="组件配置（JSON）" rules={[{ validator: (_, val) => { try { if (!val) return Promise.resolve(); JSON.parse(val); return Promise.resolve(); } catch { return Promise.reject(new Error('JSON 格式不正确')); } } }]}>
                <Input.TextArea rows={2} placeholder='如 {"date":"2026-12-31"}（倒数日）' />
              </Form.Item>
            ) : null
          }
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
          {({ getFieldValue }) =>
            !getFieldValue('type') || getFieldValue('type') === 'link' ? (
              <Form.Item name="url" label="卡片链接" rules={[{ required: true, message: '请输入链接' }, { pattern: /^https?:\/\//i, message: '需以 http(s):// 开头' }]}>
                <Input placeholder="https://" />
              </Form.Item>
            ) : null
          }
        </Form.Item>
        {isLink && (
          <Button size="small" icon={<CloudDownloadOutlined />} loading={fetching} onClick={autoFill} className="mb-3">
            获取网站信息
          </Button>
        )}
        {manualIcon ? (
          <Form.Item name="icon" label="图标 URL（手动填写）">
            <Input placeholder="https://…/favicon.ico" />
          </Form.Item>
        ) : (
          <Button size="small" type="link" onClick={() => setManualIcon(true)} className="mb-3 px-0">
            手动填写图标 URL
          </Button>
        )}
        <Form.Item name="displayStyle" label="展示样式">
          <Select
            options={[
              { value: 'default', label: '默认（图标+名称）' },
              { value: 'image', label: '纯图' },
              { value: 'text', label: '纯文本' },
            ]}
          />
        </Form.Item>
        {/* 对齐参考站编辑弹窗：文本字号 / 卡片大小（六选项，默认一行两列） */}
        <Form.Item name="fontSize" label="文本字号">
          <InputNumber min={9} max={32} placeholder="默认" className="w-full" />
        </Form.Item>
        <Form.Item name="size" label="卡片大小">
          <Select
            allowClear
            placeholder="一行一列（默认）"
            options={[
              { value: '1x1', label: '一行一列' },
              { value: '2x1', label: '一行两列' },
              { value: '4x1', label: '一行四列' },
              { value: '1x2', label: '两行一列' },
              { value: '2x2', label: '两行两列' },
              { value: '4x2', label: '两行四列' },
            ]}
          />
        </Form.Item>
        <Form.Item name="group" label="所属分组">
          <Select
            allowClear
            options={(settings.cardGroups || []).map((g) => ({ value: g, label: g }))}
            placeholder="未分组"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
