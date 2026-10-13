#!/usr/bin/env bash
#
# 节假日数据定时更新入口（部署到服务器）
#
# 部署:
#   mkdir -p /opt/holiday
#   cp build-holiday.mjs update.sh /opt/holiday/
#   chmod +x /opt/holiday/update.sh
#
# 手动验证:
#   /opt/holiday/update.sh /var/www/holiday/holiday.json
#   curl -i https://<域名>/holiday/holiday.json
#
# Webhook 通知:
#   数据更新时向飞书群机器人推送摘要，地址配置在 /opt/holiday/.env:
#     FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx
#   参考 .env.example；不配置则不通知
#
# crontab（每天一次）:
#   9 5 * * * /opt/holiday/update.sh /var/www/holiday/holiday.json >> /var/log/holiday.log 2>&1
#
# 说明:
#   - 上游一年只更新一次（偶有年中补丁，如临时调整上班日），故无需高频
#   - 脚本幂等：内容没变就不写文件，多跑不会产生新版本
#   - 某次网络失败会在次日自动重试，不中断数据
#
set -euo pipefail

OUT="${1:-/var/www/holiday/holiday.json}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 可选配置（如 FEISHU_WEBHOOK），同目录 .env 不存在则跳过
if [ -f "$DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$DIR/.env"
  set +a
fi

node "$DIR/build-holiday.mjs" "$OUT"
