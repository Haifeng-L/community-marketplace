# 邻里闲置

这是一个面向小区居民的公益闲置信息工具，使用微信小程序正式 AppID 和 CloudBase 作为唯一后端：

- 首页、分类、广场搜索
- 发布闲置与图片上传
- 物品详情与联系方式
- 我的发布、我的举报
- 管理员审核与举报处理
- 微信用户身份、昵称头像和角色权限

## 运行前置

1. 使用正式小程序 AppID 导入 `D:\myProjects\community-marketplace`。
2. 在 `miniprogram/config/runtime.ts` 配置 CloudBase 环境 ID。
3. 创建数据库集合并配置权限。
4. 部署 `cloudfunctions/` 下全部云函数。
5. 首次打开“我的”页面后，点击头像或昵称，授权同步微信昵称和头像。

项目不提供本地缓存后端；CloudBase 未配置或云函数未部署时，核心功能不可用。