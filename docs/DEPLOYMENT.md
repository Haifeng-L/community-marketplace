# 部署指南

## A. 先跑本地演示（零成本）
1. 安装微信开发者工具。
2. 导入项目根目录 `D:\myProjects\community-marketplace`。
3. 使用测试号或自己的 AppID。
4. 编译，检查首页、广场、发布、详情、我的发布、管理员审核。
5. 使用真机预览，确认图片选择、复制联系方式和页面布局。

当前版本的数据仍可先跑本地缓存，适合原型和流程演示。

## B. 接入 CloudBase

1. 在微信公众平台创建小程序，获取 AppID。
2. 在 CloudBase 创建环境，记录环境 ID。
3. 把 `miniprogram/config/runtime.ts` 中的 `CLOUD_ENV_ID` 填成你的环境 ID。
4. 重新编译后，`App` 会自动初始化 `wx.cloud`，并把 `cloudEnabled` 切到 `true`。
5. 创建 `users`、`listings`、`categories`、`reports`、`auditLogs`、`promotions`、`settings` 集合。
6. 上传并部署 `cloudfunctions/` 下的云函数，至少包含：
   - `getConfig`
   - `getCurrentUser`
   - `createListing`
   - `listListings`
   - `getListing`
   - `updateListing`
   - `updateListingStatus`
   - `listPendingListings`
   - `reviewListing`
   - `createReport`
   - `listMyReports`
   - `listReports`
   - `handleReport`
   - `expireListings`
7. 首次进入后，`getCurrentUser` 会自动在 `users` 集合里创建当前微信用户记录。
8. 把第一个管理员账号手工改成 `role = admin` 或 `role = owner`，之后前端和云函数都会按 `users.role` 校验。
9. 配置数据库安全规则：普通用户只能看公开数据、修改自己的记录；管理操作全部走云函数。
10. 配置定时触发器，每天执行 `expireListings`。

## C. 线上前检查
- 完成小程序主体信息和备案要求。
- 确认隐私政策、内容审核和类目要求。
- 真机测试至少 2 台设备。
- 用测试账号演练发布、审核、举报、下架、过期流程。
- 关闭演示管理口子，避免普通用户直接进入审核页。

## D. 发布建议

正式发布前至少保留一个 Git 版本标签，例如 `v0.1.0-mvp`。每次变更先在体验版验证，再提交审核。