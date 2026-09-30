#!/usr/bin/env bash
# 重启本地 dev 服务（workerd + local D1，端口 8799，读 .dev.vars）。幂等：可重复执行。
set -uo pipefail
cd "$(dirname "$0")/.."
# 括号技巧：避免 pkill 匹配到自身命令行；只杀 gotab 的 workerd（不误伤 Firedre）
pkill -9 -f "gotab/node_modules/wrangler/[w]rangler-dist" 2>/dev/null || true
pkill -9 -f "gotab/.*[w]orkerd" 2>/dev/null || true
sleep 2
npx wrangler pages dev dist --local --port 8799 >/tmp/gotab-dev.log 2>&1 &
for i in $(seq 1 60); do
  sleep 2
  curl -s -m 2 http://127.0.0.1:8799/api/getSiteConfig >/dev/null 2>&1 && { echo "ready after ${i}x2s"; exit 0; }
done
echo "FAILED: dev server 未在 120s 内就绪（检查 /tmp/gotab-dev.log，可能是 workerd 崩溃循环/OOM）"
exit 1
