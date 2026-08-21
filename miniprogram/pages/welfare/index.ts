Page({
  data: { enabled: false },
  onShow() { this.setData({ enabled: getApp<IAppOption>().globalData.welfareEnabled }) },
  copyCode() { wx.setClipboardData({ data:'邻里福利口令待配置', success: () => wx.showToast({ title:'已复制' }) }) },
})
