import { listingService } from '../../services/listing'
import { reportService } from '../../services/report'
import type { Listing } from '../../types/listing'

Page({
  data: { item: null as Listing | null, statusText: '' },
  async onLoad(options: Record<string, string>) {
    if (!options.id) return
    const item = await listingService.get(options.id)
    const texts: Record<string,string> = { active:'在售', reserved:'已预定', sold:'已出', pending:'待审核', offline:'已下架', rejected:'未通过' }
    this.setData({ item: item || null, statusText: item ? texts[item.status] : '' })
  },
  copyContact() {
    const item = this.data.item
    if (!item) return
    wx.setClipboardData({ data: item.contactValue, success: () => wx.showToast({ title: '联系方式已复制' }) })
  },
  report() {
    const item = this.data.item
    if (!item) return
    const reasons = ['疑似广告','虚假信息','违禁物品','疑似诈骗','已出未下架','其他']
    wx.showActionSheet({
      itemList: reasons,
      success: async result => {
        try {
          await reportService.create({
            listingId: item.id,
            listingTitle: item.title,
            reason: reasons[result.tapIndex],
          })
          wx.showModal({
            title: '举报已提交',
            content: '管理员会尽快处理，你可以在“我的－我的举报”中查看进度。',
            showCancel: false,
          })
        } catch (error) {
          wx.showModal({
            title: '无法提交',
            content: error instanceof Error ? error.message : '请稍后重试',
            showCancel: false,
          })
        }
      },
      fail: error => {
        if (!String(error.errMsg).includes('cancel')) wx.showToast({ title:'提交失败，请重试', icon:'none' })
      },
    })
  },
})