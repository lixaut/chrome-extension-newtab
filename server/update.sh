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
# crontab（每天一次；国务院公告在 11 月初，公告后最迟次日生效）:
#   15 7 * * * /opt/holiday/update.sh /var/www/holiday/holiday.json >> /var/log/holiday.log 2>&1
#
# 说明:
#   - 上游一年只更新一次（偶有年中补丁，如临时调整上班日），故无需高频
#   - 脚本幂等：内容没变就不写文件，多跑不会产生新版本
#   - 某次网络失败会在次日自动重试，不中断数据
#
set -euo pipefail

OUT="${1:-/var/www/holiday/holiday.json}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

node "$DIR/build-holiday.mjs" "$OUT"
