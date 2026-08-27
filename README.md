# 邻里闲置

这是一个面向小区居民的公益闲置信息工具，使用微信小程序正式 AppID 和 CloudBase 作为唯一后端：

- 首页、分类、广场搜索
- 发布闲置与图片上传
- 物品详情与联系方式
- 我的发布、我的举报
- 发布即展示、敏感词拦截与举报处理
- 微信用户身份、昵称头像和角色权限

## 运行前置

1. 复制 `project.private.config.example.json` 为 `project.private.config.json`，在其中填写本地正式小程序 AppID（该文件已被 Git 忽略）。
2. 使用正式小程序 AppID 导入 `D:\myProjects\community-marketplace`。
3. 在 `miniprogram/config/runtime.ts` 配置 CloudBase 环境 ID。
4. 创建数据库集合并配置权限。
5. 部署 `cloudfunctions/` 下全部云函数。
6. 首次打开“我的”页面后，点击头像或昵称，授权同步微信昵称和头像。

项目不提供本地缓存后端；CloudBase 未配置或云函数未部署时，核心功能不可用。
