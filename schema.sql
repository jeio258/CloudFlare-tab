-- 全新数据库的完整 schema（幂等：可安全重复执行）
-- 已存在的旧库请按 migrations/batch*.sql 增量升级

CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  sex INTEGER DEFAULT 0,
  birthday TEXT DEFAULT '',
  user_type INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  status INTEGER NOT NULL DEFAULT 1,
  share_id TEXT,
  share_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_data(
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notices(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status INTEGER NOT NULL DEFAULT 1,
  time_code TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS default_data(
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS default_data_history(
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_share_id ON users(share_id);

-- 书签（卡片）行存储：每张卡片一行；ord 保留快照数组次序，push 时整表重建
-- 读取时按 ord 排序拼接还原为原始数组格式（导出/导入契约不变）
CREATE TABLE IF NOT EXISTS cards(
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  ord INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  sub_title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT '',
  icon_color TEXT DEFAULT '',
  color TEXT DEFAULT '',
  group_name TEXT DEFAULT '',
  display_style TEXT DEFAULT '',
  type TEXT DEFAULT 'link',
  config TEXT DEFAULT '',
  size TEXT DEFAULT '',
  font_size INTEGER,
  font_color TEXT DEFAULT '',
  bg_color TEXT DEFAULT '',
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id, ord);

-- 认证限流计数（固定窗口，见 functions/lib/ratelimit.ts）
CREATE TABLE IF NOT EXISTS auth_rate(
  rule TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);
