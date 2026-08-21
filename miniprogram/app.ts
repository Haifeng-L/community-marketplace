import { CLOUD_ENV_ID, COMMUNITY_NAME, WELFARE_ENABLED } from './config/runtime'
import { refreshCurrentUser } from './services/session'

let cloudBootstrapPromise: Promise<void> | null = null

function bootstrapCloud() {
  const app = getApp<IAppOption>()
  if (!app.globalData.cloudEnabled || !wx.cloud) return Promise.resolve()
  if (app.globalData.cloudBootstrapped) return Promise.resolve()
  if (!cloudBootstrapPromise) {
    wx.cloud.init({
      env: app.globalData.envId || undefined,
      traceUser: true,
    })
    app.globalData.cloudBootstrapped = true
    cloudBootstrapPromise = refreshCurrentUser().catch(() => null).then(() => undefined)
  }
  return cloudBootstrapPromise
}

App<IAppOption>({
  globalData: {
    cloudBootstrapped: false,
    cloudEnabled: Boolean(CLOUD_ENV_ID),
    currentUser: null,
    envId: CLOUD_ENV_ID,
    communityName: COMMUNITY_NAME,
    welfareEnabled: WELFARE_ENABLED,
  },
  onLaunch() {
    void bootstrapCloud()
  },
  onShow() {
    void bootstrapCloud()
  },
})