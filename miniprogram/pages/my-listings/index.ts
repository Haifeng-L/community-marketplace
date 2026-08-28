import { listingService } from '../../services/listing'
import type { Listing, ListingStatus } from '../../types/listing'

const statusText: Record<ListingStatus, string> = {
  active: '在售',
  reserved: '已预定',
  sold: '已出',
  offline: '已下架',
  pending: '待审核',
  rejected: '未通过',
}

function withStatusText(listings: Listing[]) {
  return listings.map(item => {
    const auditLabel = item.auditStatus === 'checking'
      ? '图片检测中'
      : item.auditStatus === 'risky'
        ? '图片未通过'
        : ''
    return { ...item, statusLabel: auditLabel || statusText[item.status] || item.status }
  })
}

Page({
  data: { listings: [] as Array<Listing & { statusLabel: string }> },
  async onShow() { await this.reload() },
  async reload() { this.setData({ listings: withStatusText(await listingService.listMine()) }) },
  async updateStatus(event: any) {
    const { id, status } = event.currentTarget.dataset
    await listingService.updateStatus(id, status)
    await this.reload()
    wx.showToast({ title: status === 'active' ? '已重新上架' : '状态已更新' })
  },
  async retryImageCheck(event: any) {
    const { id } = event.currentTarget.dataset
    wx.showLoading({ title: '正在检测' })
    try {
      await listingService.retryImageCheck(id)
      await this.reload()
      wx.showToast({ title: '检测已完成' })
    } catch (error) {
      wx.showModal({
        title: '检测失败',
        content: error instanceof Error ? error.message : '请稍后重试',
        showCancel: false,
      })
    } finally {
      wx.hideLoading()
    }
  },
  goDetail(event: any) { wx.navigateTo({ url:`/pages/detail/index?id=${event.currentTarget.dataset.id}` }) },
})
