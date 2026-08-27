# 部署指南

## 1. 小程序与环境

1. 使用正式小程序 AppID 导入 `D:\myProjects\community-marketplace`。
2. 在 `miniprogram/config/runtime.ts` 填写 CloudBase 环境 ID。
3. 确认 CloudBase 环境已关联当前小程序 AppID。

## 2. 数据库

创建以下集合：

- `users`
- `listings`
- `categories`
- `reports`
- `auditLogs`
- `promotions`
- `settings`

建议先设置为“所有用户不可读写”，由云函数访问数据库。

## 3. 云函数

在微信开发者工具中，对 `cloudfunctions` 下每个函数选择“上传并部署：云端安装依赖”，包括：

- `getCurrentUser`
- `updateCurrentUser`
- `getConfig`
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

## 4. 首个管理员

首次打开小程序“我的”页面，`getCurrentUser` 会在 `users` 中创建当前用户。手工把该记录的 `role` 改为 `admin` 或 `owner`，并保持 `disabled=false`。

## 5. 微信资料与社区昵称

首次进入“我的”页面会显示轻量授权提示，不会在小程序启动时强制弹窗。用户主动同意隐私指引并授权后，调用 `updateCurrentUser` 保存微信原始昵称和头像；社区昵称初始使用微信昵称，之后可单独编辑，不会修改微信本身资料。

本次修改后，请在微信开发者工具中分别对以下云函数选择“上传并部署：云端安装依赖”：

- `getCurrentUser`
- `updateCurrentUser`

## 6. 上线前检查

- 完成主体信息、备案、隐私政策和类目要求。
- 真机测试发布、审核、举报、下架和过期流程。
- 检查 `users`、`listings`、`reports`、`auditLogs` 是否产生数据。
- 配置 `expireListings` 定时触发器。
