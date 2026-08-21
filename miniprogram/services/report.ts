import { listingService } from './listing'
import type { ReportAction, ReportRecord, ReportStatus } from '../types/report'

const REPORTS_KEY = 'community_marketplace_reports'

function cloudEnabled(): boolean {
  return Boolean(getApp<IAppOption>().globalData.cloudEnabled && wx.cloud)
}

function getStored(): ReportRecord[] {
  const stored = wx.getStorageSync<ReportRecord[]>(REPORTS_KEY)
  return Array.isArray(stored) ? stored : []
}

const actionResult: Record<ReportAction, { status: ReportStatus; result: string }> = {
  startReview: { status: 'reviewing', result: '管理员正在核实相关信息' },
  hideListing: { status: 'resolved', result: '举报成立，相关物品已下架' },
  markSold: { status: 'resolved', result: '物品已标记为已出，不再展示' },
  requestEdit: { status: 'resolved', result: '已暂时下架，并要求发布者修改信息后重新提交' },
  warnUser: { status: 'resolved', result: '已提醒并警告发布者遵守社区规则' },
  dismiss: { status: 'dismissed', result: '经核实暂未发现违规，举报不成立' },
}

export const reportService = {
  async listMine(): Promise<ReportRecord[]> {
    if (cloudEnabled()) {
      const result = await wx.cloud.callFunction({ name: 'listMyReports' }) as unknown as { result: { data: ReportRecord[] } }
      return result.result.data
    }
    return getStored().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async listAll(): Promise<ReportRecord[]> {
    if (cloudEnabled()) {
      const result = await wx.cloud.callFunction({ name: 'listReports' }) as unknown as { result: { data: ReportRecord[] } }
      return result.result.data
    }
    return getStored().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async create(input: Pick<ReportRecord, 'listingId' | 'listingTitle' | 'reason' | 'note'>): Promise<void> {
    if (cloudEnabled()) {
      await wx.cloud.callFunction({ name: 'createReport', data: input })
      return
    }
    const duplicated = getStored().some(item => item.listingId === input.listingId && ['pending', 'reviewing'].includes(item.status))
    if (duplicated) throw new Error('你已经举报过该物品，管理员正在处理')
    const record: ReportRecord = {
      ...input,
      id: `report-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    wx.setStorageSync(REPORTS_KEY, [record, ...getStored()])
  },
  async handle(id: string, action: ReportAction): Promise<void> {
    if (cloudEnabled()) {
      await wx.cloud.callFunction({ name: 'handleReport', data: { id, action } })
      return
    }
    const reports = getStored()
    const target = reports.find(item => item.id === id)
    if (!target) throw new Error('举报记录不存在')
    if (action === 'hideListing' || action === 'requestEdit') await listingService.updateStatus(target.listingId, 'offline')
    if (action === 'markSold') await listingService.updateStatus(target.listingId, 'sold')
    const handled = actionResult[action]
    const next = reports.map(item => item.id === id ? {
      ...item,
      status: handled.status,
      result: handled.result,
      action,
      operatorName: '演示管理员',
      handledAt: new Date().toISOString().slice(0, 10),
    } : item)
    wx.setStorageSync(REPORTS_KEY, next)
  },
}