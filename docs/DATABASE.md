# 邻里闲置：数据库与云函数

## 集合

- `users`：`openid`、`role`（`user/admin/owner`）、`disabled`、`displayName`、`avatarUrl`、`verifiedAt`
- `listings`：物品和发布者信息，`status` 为 `pending/active/reserved/sold/offline/rejected`
- `categories`：分类和排序
- `reports`：举报原因、处理状态和处理记录
- `auditLogs`：管理审核、封禁、配置修改等操作记录
- `promotions`：独立推广内容，默认不启用
- `settings`：社区名称、邀请码、有效期、推广开关

## 建议索引

在 CloudBase 数据库控制台为以下字段建立索引：

- `listings`: `status + createdAt`
- `listings`: `category + status + createdAt`
- `listings`: `openid + createdAt`
- `reports`: `status + createdAt`
- `auditLogs`: `targetType + targetId + createdAt`

## 权限原则

不要让前端直接拥有管理员写权限。普通用户的创建、更新状态、举报都应该走云函数；管理审核必须在 `reviewListing`、`handleReport` 这类云函数里再次根据 `users.role` 校验，不能只信任前端传入的角色。

## 本地演示与云端切换

目前页面仍保留本地缓存演示。接入 CloudBase 后，`miniprogram/services/session.ts` 会同步当前微信用户，`mine` 页面会根据 `role` 自动显示或隐藏管理员入口。