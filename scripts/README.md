# 数据备份脚本说明

正式接入 CloudBase 后，可在这里增加导出脚本。建议每周导出：

- listings（去除不必要的联系方式备份）
- categories
- settings
- auditLogs

备份文件命名建议：`backups/YYYY-MM-DD/`，并保存到本机和另一个可靠位置。不要把包含联系方式的备份提交到 Git。
