import { canAccessAdmin, refreshCurrentUser } from '../../services/session'
import { reportService } from '../../services/report'

Page({
  data: { pendingReports: 0 },
  async onShow() {
    const user = await refreshCurrentUser()
    if (!canAccessAdmin(user)) {
      wx.showModal({ title: '无管理权限', content: '当前微信账号不是管理员，无法进入审核台。', showCancel: false })
      return
    }
    await this.load()
  },
  async load() {
    const reports = await reportService.listAll()
    this.setData({ pendingReports: reports.filter(item => ['pending', 'reviewing'].includes(item.status)).length })
  },
  goReports() { wx.navigateTo({ url:'/pages/admin-reports/index' }) },
})
