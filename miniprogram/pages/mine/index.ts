import { canAccessAdmin, getCloudLabel, getCurrentUser, getRoleLabel, isCloudMode, refreshCurrentUser } from '../../services/session'

Page({
  data: {
    displayName: '微信用户',
    isAdmin: false,
    roleLabel: '本地演示',
    cloudLabel: '本地演示模式',
    profileHint: '演示模式 · 接入 CloudBase 后可识别微信身份',
  },
  async onShow() {
    await this.refreshProfile()
  },
  async refreshProfile() {
    const user = isCloudMode() ? await refreshCurrentUser() : getCurrentUser()
    this.setData({
      displayName: user?.displayName || '微信用户',
      isAdmin: canAccessAdmin(user),
      roleLabel: getRoleLabel(user),
      cloudLabel: getCloudLabel(),
      profileHint: isCloudMode()
        ? `身份已同步 · ${user?.openid ? `ID ${user.openid.slice(-6)}` : '等待云端返回身份'}`
        : '当前为本地演示模式，接入 CloudBase 后会自动按微信身份区分角色',
    })
  },
  goMyListings() { wx.navigateTo({ url:'/pages/my-listings/index' }) },
  goMyReports() { wx.navigateTo({ url:'/pages/my-reports/index' }) },
  goAdmin() {
    if (!this.data.isAdmin) {
      wx.showToast({ title: '暂无管理权限', icon: 'none' })
      return
    }
    wx.navigateTo({ url:'/pages/admin-review/index' })
  },
  goRules() { wx.navigateTo({ url:'/pages/rules/index' }) },
  goWelfare() { wx.navigateTo({ url:'/pages/welfare/index' }) },
  showAbout() { wx.showModal({ title:'关于', content:'三湘邻里闲置是面向本小区居民的公益信息工具，不参与交易、不收取佣金。', showCancel:false }) },
})