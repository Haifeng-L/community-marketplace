# 三湘邻里闲置 MVP

这是一个面向小区居民的公益闲置信息工具，当前版本是**可直接导入微信开发者工具的本地演示版**：

- 首页、分类、广场搜索
- 发布闲置（本地存储演示）
- 物品详情与复制联系信息
- 我的发布、状态变更
- 管理员审核演示
- 社区规则、安全提示
- 邻里福利推广专区（默认关闭）

## 运行方式

1. 安装微信开发者工具。
2. 导入 `D:\myProjects\community-marketplace`。
3. AppID 暂时选择测试号或填入自己的小程序 AppID。
4. 勾选“详情 -> 本地设置 -> 不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书”。
5. 编译并在模拟器/真机预览。

## 当前限制

本版本为了零成本快速验证，数据使用本地缓存，换设备后数据不共享，图片也不会上传到云端。正式内测前需要按 `docs/DEPLOYMENT.md` 接入 CloudBase，并将 `miniprogram/app.ts` 中的 `cloudEnabled` 改为 `true`。

## 目录

- `miniprogram/`：微信小程序前端
- `cloudfunctions/`：CloudBase 云函数模板
- `docs/`：PRD、规则、隐私、部署和运维说明
- `scripts/`：备份和数据维护脚本占位
