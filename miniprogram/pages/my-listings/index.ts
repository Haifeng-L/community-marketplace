import { listingService } from '../../services/listing'
import type { Listing } from '../../types/listing'

Page({
  data: { listings: [] as Listing[] },
  async onShow() { this.setData({ listings: await listingService.list() }) },
  async updateStatus(event: any) {
    const { id, status } = event.currentTarget.dataset
    await listingService.updateStatus(id, status)
    this.setData({ listings: await listingService.list() })
    wx.showToast({ title:'状态已更新' })
  },
  goDetail(event: any) { wx.navigateTo({ url:`/pages/detail/index?id=${event.currentTarget.dataset.id}` }) },
})
