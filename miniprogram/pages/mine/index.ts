import { canAccessAdmin, getCurrentUser, getRoleLabel, refreshCurrentUser, updateCurrentUserProfile } from '../../services/session'
import { openPrivacyContract, requirePrivacyAuthorization } from '../../services/privacy'

Page({
  data: {
    displayName: '微信用户', avatarUrl: '', isAdmin: false, roleLabel: '身份同步中',
    profileHint: '完善资料后，邻居更容易认出你', showProfilePrompt: false, editingName: false,
    draftName: '', draftAvatarUrl: '', savingProfile: false, profileLoaded: false,
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
      profileHint: user?.wechatNickname || user?.wechatAvatarUrl ? '头像昵称已完善' : '完善资料后，邻居更容易认出你',
      showProfilePrompt: !(user?.wechatNickname || user?.wechatAvatarUrl),
      draftName: user?.displayName || '', draftAvatarUrl: user?.avatarUrl || '',
      profileLoaded: true,
    })
  },
  async handlePrivacyAgree() {
    try { await requirePrivacyAuthorization() }
    catch { wx.showToast({ title: '同意隐私指引后才能完善资料', icon: 'none' }); return }
    this.openProfileEditor(true)
  },
  startEditName() { this.openProfileEditor(false) },
  openProfileEditor(fromPrivacyAgree: boolean) {
    const user = getCurrentUser()
    if (!fromPrivacyAgree && !(user?.wechatNickname || user?.wechatAvatarUrl)) {
      wx.showToast({ title: '请先点击去完善', icon: 'none' })
      return
    }
    this.setData({ editingName: true, draftName: user?.displayName || this.data.displayName || '', draftAvatarUrl: user?.avatarUrl || this.data.avatarUrl || '' })
  },
  onChooseAvatar(event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    this.setData({ draftAvatarUrl: event.detail.avatarUrl })
  },
  onNameInput(event: WechatMiniprogram.Input) { this.setData({ draftName: event.detail.value }) },
  cancelEditName() { this.setData({ editingName: false, draftName: this.data.displayName, draftAvatarUrl: this.data.avatarUrl }) },
  async uploadAvatarIfNeeded(avatarUrl: string): Promise<string> {
    if (!avatarUrl || avatarUrl.startsWith('cloud://') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl
    const user = getCurrentUser()
    const owner = user?.openid || user?._id || 'anonymous'
    const ext = avatarUrl.match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg'
    const cloudPath = `avatars/${owner}_${Date.now()}.${ext}`
    const result = await wx.cloud.uploadFile({ cloudPath, filePath: avatarUrl })
    return result.fileID
  },
  async saveName() {
    if (this.data.savingProfile) return
    const name = String(this.data.draftName || '').trim()
    if (name.length < 2 || name.length > 20) { wx.showToast({ title: '社区昵称需为2-20个字', icon: 'none' }); return }
    if (!this.data.draftAvatarUrl) { wx.showToast({ title: '请先选择头像', icon: 'none' }); return }
    try { await requirePrivacyAuthorization() } catch { wx.showToast({ title: '同意隐私指引后才能保存资料', icon: 'none' }); return }
    try {
      this.setData({ savingProfile: true })
      const avatarUrl = await this.uploadAvatarIfNeeded(this.data.draftAvatarUrl)
      const updated = await updateCurrentUserProfile({
        displayName: name, wechatNickname: name,
        avatarUrl, wechatAvatarUrl: avatarUrl,
      })
      this.setData({
        displayName: updated?.displayName || name, avatarUrl: updated?.avatarUrl || avatarUrl,
        editingName: false, showProfilePrompt: false, profileHint: '头像昵称已完善',
        draftName: updated?.displayName || name, draftAvatarUrl: updated?.avatarUrl || avatarUrl,
      })
      wx.showToast({ title: '已保存' })
    } catch (error) {
      wx.showModal({ title: '保存失败', content: error instanceof Error ? error.message : '请先部署 updateCurrentUser', showCancel: false })
    } finally { this.setData({ savingProfile: false }) }
  },
  goMyListings() { wx.navigateTo({ url:'/pages/my-listings/index' }) },
  goMyReports() { wx.navigateTo({ url:'/pages/my-reports/index' }) },
  goAdmin() { if (!this.data.isAdmin) { wx.showToast({ title: '暂无管理权限', icon: 'none' }); return }; wx.navigateTo({ url:'/pages/admin-review/index' }) },
  goRules() { wx.navigateTo({ url:'/pages/rules/index' }) },
  goWelfare() { wx.navigateTo({ url:'/pages/welfare/index' }) },
  showAbout() { wx.showModal({ title:'关于', content:'邻里闲置是面向本小区居民的公益信息工具，不参与交易、不收取佣金。', showCancel:false }) },
  openPrivacyContract,
})
