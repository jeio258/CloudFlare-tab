// 卡片 id 生成（前端本地唯一）
let seq = 0;
export const newCardId = () => `c${Date.now().toString(36)}${(seq += 1).toString(36)}`;
