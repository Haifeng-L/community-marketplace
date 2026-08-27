import type { ReportAction, ReportRecord } from '../types/report'

function ensureCloudInitialized() {
  const app = getApp<IAppOption>()
  if (!wx.cloud) throw new Error('当前基础库不支持 CloudBase')
  if (!app.globalData.envId) throw new Error('未配置 CloudBase 环境 ID')
  if (!app.globalData.cloudBootstrapped) {
    wx.cloud.init({ env: app.globalData.envId, traceUser: true })
    app.globalData.cloudBootstrapped = true
  }
}

export const reportService = {
  async listMine(): Promise<ReportRecord[]> {
    ensureCloudInitialized()
    const result = await wx.cloud.callFunction({ name: 'listMyReports' }) as unknown as { result: { data: ReportRecord[] } }
    return result.result.data
  },
  async listAll(): Promise<ReportRecord[]> {
    ensureCloudInitialized()
    const result = await wx.cloud.callFunction({ name: 'listReports' }) as unknown as { result: { data: ReportRecord[] } }
    return result.result.data
  },
  async create(input: Pick<ReportRecord, 'listingId' | 'listingTitle' | 'reason' | 'note'>): Promise<void> {
    ensureCloudInitialized()
    await wx.cloud.callFunction({ name: 'createReport', data: input })
  },
  async handle(id: string, action: ReportAction): Promise<void> {
    ensureCloudInitialized()
    await wx.cloud.callFunction({ name: 'handleReport', data: { id, action } })
  },
}