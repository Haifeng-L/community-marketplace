# 部署指南

## 1. 小程序与环境

1. 复制 `project.private.config.example.json` 为 `project.private.config.json`，仅在本地填写正式小程序 AppID（该文件不会提交到 Git）。
2. 使用正式小程序 AppID 导入 `D:\myProjects\community-marketplace`。
3. 在 `miniprogram/config/runtime.ts` 填写 CloudBase 环境 ID。
4. 确认 CloudBase 环境已关联当前小程序 AppID。

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

在微信开发者工具中，对以下云函数选择“上传并部署：云端安装依赖”：

- `getCurrentUser`
- `updateCurrentUser`
- `getConfig`
- `createListing`
- `checkListingImages`
- `listListings`
- `getListing`
- `updateListing`
- `updateListingStatus`
- `createReport`
- `listMyReports`
- `listReports`
- `handleReport`
- `expireListings`

## 4. 首个管理员

首次打开小程序“我的”页面，`getCurrentUser` 会在 `users` 中创建当前用户。手工把该记录的 `role` 改为 `admin` 或 `owner`，并保持 `disabled=false`。

## 5. 微信资料与社区昵称

首次进入“我的”页面会显示轻量授权提示，不会在小程序启动时强制弹窗。用户主动同意隐私指引并授权后，调用 `updateCurrentUser` 保存微信原始昵称和头像；社区昵称初始使用微信昵称，之后可单独编辑，不会修改微信本身资料。

资料功能修改后，请在微信开发者工具中分别对以下云函数选择“上传并部署：云端安装依赖”：

- `getCurrentUser`
- `updateCurrentUser`

## 6. 发布与举报处理

- 物品发布后会直接展示到广场，不再逐条等待管理员审核。
- 云函数会拦截基础高风险词（如二维码引流、博彩、毒品等），并在发布/修改写库前调用微信内容安全接口检测图片；仍需保留举报入口和日常抽查。
- 居民举报后才进入管理员工作台。管理员可核实、下架、要求修改、警告或限制严重违规用户发布。

本次涉及 90 天过期、重新上架、异步图片内容安全和我的发布列表，请重新部署：

- `createListing`
- `checkListingImages`
- `updateListing`
- `listListings`
- `getListing`
- `updateListingStatus`
- `expireListings`
- `handleReport`

## 7. 上线前检查

- 完成主体信息、备案、隐私政策和类目要求。
- 真机测试直接发布、敏感词拦截、举报、下架、限制发布和过期流程。
- 检查 `users`、`listings`、`reports`、`auditLogs` 是否产生数据。
- 配置 `expireListings` 定时触发器；当前规则是 active/reserved 到期后转为 offline，offline 可由发布者重新上架并重新计算 90 天有效期。

## 8. 如何重新部署云函数（开发者工具）

1. 打开微信开发者工具，导入 `D:\myProjects\community-marketplace`，不要导入 `miniprogram` 子目录。
2. 顶部确认当前 AppID 和云开发环境是正式要使用的环境。
3. 左侧展开 `cloudfunctions`，对需要更新的函数逐个右键。
4. 选择“上传并部署：云端安装依赖”，等待控制台日志显示部署成功。
5. 在云开发控制台打开函数的“版本与配置”：`createListing` 设置为 10 秒，`checkListingImages` 设置为 30 秒，`updateListing` 设置为 10 秒。只有 `checkListingImages` 执行图片下载和内容安全检测，因此需要更长时间。
6. 本次至少部署：`createListing`、`checkListingImages`、`updateListing`、`updateListingStatus`、`listListings`、`getListing`、`expireListings`；若同时要同步举报处理改动，再部署 `handleReport`。
7. 部署后在开发者工具里重新编译，并分别真机测试：发布含正常图片的物品、违规图片拦截、手动下架后重新上架、过期任务执行、广场搜索输入。
