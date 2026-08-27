import { canAccessAdmin, getCurrentUser, getRoleLabel, refreshCurrentUser, updateCurrentUserProfile } from '../../services/session'
import { openPrivacyContract, requirePrivacyAuthorization } from '../../services/privacy'

Page({
  data: {
    displayName: '微信用户', avatarUrl: '', isAdmin: false, roleLabel: '身份同步中',
    profileHint: '完善资料后，邻居更容易认出你', showProfilePrompt: false, editingName: false, draftName: '',
  },
  async onShow() {
    try { await this.refreshProfile() }
    catch (error) { wx.showModal({ title: 'CloudBase 连接失败', content: error instanceof Error ? error.message : '请稍后重试', showCancel: false }) }
  },
  async refreshProfile() {
    const user = await refreshCurrentUser()
    this.setData({
      displayName: user?.displayName || '微信用户', avatarUrl: user?.avatarUrl || '',
      isAdmin: canAccessAdmin(user), roleLabel: getRoleLabel(user),
      profileHint: user?.wechatNickname ? '微信资料已同步' : '完善资料后，邻居更容易认出你',
      showProfilePrompt: !user?.wechatNickname, draftName: user?.displayName || '',
    })
  },
  handlePrivacyAgree() { this.updateProfile() },
  startEditName() {
    const user = getCurrentUser()
    this.setData({ editingName: true, draftName: user?.displayName || this.data.displayName || '' })
  },
  onNameInput(event: WechatMiniprogram.Input) { this.setData({ draftName: event.detail.value }) },
  cancelEditName() { this.setData({ editingName: false, draftName: this.data.displayName }) },
  async saveName() {
    const name = String(this.data.draftName || '').trim()
    if (name.length < 2 || name.length > 20) { wx.showToast({ title: '社区昵称需为2-20个字', icon: 'none' }); return }
    const user = getCurrentUser()
    try {
      const updated = await updateCurrentUserProfile({
        displayName: name, wechatNickname: user?.wechatNickname || '',
        avatarUrl: user?.avatarUrl || this.data.avatarUrl || '', wechatAvatarUrl: user?.wechatAvatarUrl || '',
      })
      this.setData({ displayName: updated?.displayName || name, editingName: false, profileHint: '社区昵称已更新' })
      wx.showToast({ title: '已保存' })
    } catch (error) { wx.showModal({ title: '保存失败', content: error instanceof Error ? error.message : '请先部署 updateCurrentUser', showCancel: false }) }
  },
  async updateProfile() {
    try { await requirePrivacyAuthorization() } catch { return wx.showToast({ title: '同意隐私指引后才能同步微信资料', icon: 'none' }) }
    if (typeof wx.getUserProfile !== 'function') {
      wx.showModal({ title: '当前版本不支持', content: '请升级微信开发者工具或使用真机预览。', showCancel: false })
      return
    }
    wx.getUserProfile({
      desc: '用于在邻里闲置中显示你的昵称和头像',
      success: async ({ userInfo }) => {
        try {
          const user = await updateCurrentUserProfile({
            displayName: userInfo.nickName, wechatNickname: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl, wechatAvatarUrl: userInfo.avatarUrl,
          })
          this.setData({
            displayName: user?.displayName || userInfo.nickName, avatarUrl: user?.avatarUrl || userInfo.avatarUrl,
            profileHint: '微信资料已同步', showProfilePrompt: false, draftName: user?.displayName || userInfo.nickName,
          })
          wx.showToast({ title: '资料已同步' })
        } catch (error) { wx.showModal({ title: '同步失败', content: error instanceof Error ? error.message : '请先部署 updateCurrentUser', showCancel: false }) }
      },
      fail: (error) => {
        console.warn('[Profile] user denied or profile unavailable', error)
        wx.showModal({ title: '未完成微信资料授权', content: '请先同意小程序隐私保护指引，再点击授权资料。若仍无弹窗，请到微信开发者工具的隐私设置中完善隐私保护指引。', showCancel: false })
      },
    })
  },
  goMyListings() { wx.navigateTo({ url:'/pages/my-listings/index' }) },
  goMyReports() { wx.navigateTo({ url:'/pages/my-reports/index' }) },
  goAdmin() { if (!this.data.isAdmin) { wx.showToast({ title: '暂无管理权限', icon: 'none' }); return }; wx.navigateTo({ url:'/pages/admin-review/index' }) },
  goRules() { wx.navigateTo({ url:'/pages/rules/index' }) },
  goWelfare() { wx.navigateTo({ url:'/pages/welfare/index' }) },
  showAbout() { wx.showModal({ title:'关于', content:'邻里闲置是面向本小区居民的公益信息工具，不参与交易、不收取佣金。', showCancel:false }) },
  openPrivacyContract,
})
