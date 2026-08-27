import { CLOUD_ENV_ID, COMMUNITY_NAME, WELFARE_ENABLED } from './config/runtime'

App<IAppOption>({
  globalData: {
    cloudBootstrapped: false,
    currentUser: null,
    envId: CLOUD_ENV_ID,
    communityName: COMMUNITY_NAME,
    welfareEnabled: WELFARE_ENABLED,
  },
  onLaunch() {
    if (!wx.cloud) throw new Error('当前基础库不支持 CloudBase')
    if (!this.globalData.envId) throw new Error('未配置 CloudBase 环境 ID')
    wx.cloud.init({ env: this.globalData.envId, traceUser: true })
    this.globalData.cloudBootstrapped = true
  },

})