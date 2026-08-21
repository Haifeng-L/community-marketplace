import { categories } from '../../services/seed'
import { listingService } from '../../services/listing'
import type { Listing } from '../../types/listing'

Page({
  data: {
    categories,
    latest: [] as Listing[],
    notice: '邻里闲置，循环利用。请当面验货，谨防诈骗。',
    welfareEnabled: false,
  },
  async onShow() {
    const app = getApp<IAppOption>()
    const list = await listingService.list()
    this.setData({
      latest: list.filter(item => item.status === 'active').slice(0, 6),
      welfareEnabled: app.globalData.welfareEnabled,
    })
  },
  goMarketplace(event: WechatMiniprogram.BaseEvent) {
    const category = event.currentTarget.dataset.category || ''
    wx.setStorageSync('marketplace_category', category)
    wx.switchTab({ url: '/pages/marketplace/index' })
  },
  goDetail(event: WechatMiniprogram.BaseEvent) {
    wx.navigateTo({ url: `/pages/detail/index?id=${event.currentTarget.dataset.id}` })
  },
  goRules() { wx.navigateTo({ url: '/pages/rules/index' }) },
  goWelfare() { wx.navigateTo({ url: '/pages/welfare/index' }) },
})
