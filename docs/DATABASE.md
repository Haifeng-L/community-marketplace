# 邻里闲置：数据库与云函数

## 集合

- `users`：`openid`、`role`（`user/admin/owner`）、`disabled`、`displayName`（社区昵称）、`avatarUrl`（当前展示头像）、`wechatNickname`（微信原始昵称）、`wechatAvatarUrl`（微信原始头像）、`verifiedAt`
- `listings`：物品和发布者信息
- `categories`：分类和排序
- `reports`：举报原因、处理状态和处理记录
- `auditLogs`：管理审核、封禁、配置修改等操作记录
- `promotions`：独立推广内容，默认不启用
- `settings`：社区配置

## 权限原则

前端不直接写数据库。普通用户和管理员都通过云函数访问数据；管理员云函数必须再次查询 `users.role`，不能只信任前端显示状态。

## 用户资料

微信 `openid` 可以由 CloudBase 云函数自动获得，但昵称和头像需要用户在"我的"页面主动点击并授权。授权后前端调用 `updateCurrentUser`，把社区展示昵称保存到 `users.displayName`，并把微信原始资料保存到 `users.wechatNickname`、`users.wechatAvatarUrl`。用户编辑的是社区昵称，不会修改微信本身昵称。

## 发布字段限制

前端和云函数 `createListing` 对发布物品的输入字段做双重校验，限制一致：

| 字段 | 限制 | 说明 |
| --- | --- | --- |
| 物品名称 `title` | 1–50 字 | 必填 |
| 物品描述 `description` | 1–500 字 | 必填 |
| 价格 `price` | 0–9999999.99 | 数字，0 表示免费 |
| 群内昵称 `sellerName` | 1–50 字 | 必填 |
| 楼栋 `building` | 0–20 字 | 选填 |
| 联系信息 `contactValue` | 群昵称/微信号 1–50 字；手机号 1–11 位 | 必填，按 `contactType` 区分 |
| 物品图片 `images` | 1–6 张 | 必填 |

前端在输入框旁实时显示剩余字数；云函数在写入数据库前再次校验长度、价格合法性和图片数量，不通过则抛错。
