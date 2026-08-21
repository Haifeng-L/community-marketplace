import { canAccessAdmin, refreshCurrentUser } from '../../services/session'
import { listingService } from '../../services/listing'
import { reportService } from '../../services/report'
import type { Listing } from '../../types/listing'

Page({
  data: { pending: [] as Listing[], pendingReports: 0 },
  async onShow() {
    const user = await refreshCurrentUser()
    if (!canAccessAdmin(user)) {
      wx.showModal({ title: '无管理权限', content: '当前微信账号不是管理员，无法进入审核台。', showCancel: false })
      return
    }
    await this.load()
  },
  async load() {
    const [pending, reports] = await Promise.all([listingService.listPending(), reportService.listAll()])
    this.setData({ pending, pendingReports: reports.filter(item => ['pending', 'reviewing'].includes(item.status)).length })
  },
  async approve(event: any) {
    await listingService.review(event.currentTarget.dataset.id, 'approve')
    wx.showToast({ title:'已通过' })
    await this.load()
  },
  async reject(event: any) {
    await listingService.review(event.currentTarget.dataset.id, 'reject')
    wx.showToast({ title:'已驳回' })
    await this.load()
  },
  goDetail(event: any) { wx.navigateTo({ url:`/pages/detail/index?id=${event.currentTarget.dataset.id}` }) },
  goReports() { wx.navigateTo({ url:'/pages/admin-reports/index' }) },
})