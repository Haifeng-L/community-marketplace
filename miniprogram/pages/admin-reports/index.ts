import { canAccessAdmin, refreshCurrentUser } from '../../services/session'
import { reportService } from '../../services/report'
import type { ReportAction, ReportRecord, ReportStatus } from '../../types/report'

const actionOptions: Array<{ label: string; action: ReportAction; confirm?: string }> = [
  { label: '开始核实', action: 'startReview' },
  { label: '违规下架', action: 'hideListing', confirm: '确认举报成立并下架该物品吗？' },
  { label: '标记已出', action: 'markSold', confirm: '确认将该物品标记为已出吗？' },
  { label: '要求修改', action: 'requestEdit', confirm: '该物品将暂时下架，等待发布者修改。是否继续？' },
  { label: '警告发布者', action: 'warnUser', confirm: '确认记录一次警告吗？' },
  { label: '举报不成立', action: 'dismiss', confirm: '确认未发现违规并驳回举报吗？' },
]

Page({
  data: {
    reports: [] as ReportRecord[],
    visibleReports: [] as ReportRecord[],
    selectedStatus: 'pending',
    counts: { pending: 0, reviewing: 0, finished: 0, all: 0 },
    statusText: { pending: '待处理', reviewing: '核实中', resolved: '已处理', dismissed: '不予处理' } as Record<ReportStatus, string>,
  },
  async onShow() {
    const user = await refreshCurrentUser()
    if (!canAccessAdmin(user)) {
      wx.showModal({ title: '无管理权限', content: '当前微信账号不是管理员，无法进入举报处理台。', showCancel: false })
      return
    }
    await this.load()
  },
  async load() {
    const reports = await reportService.listAll()
    const counts = {
      pending: reports.filter(item => item.status === 'pending').length,
      reviewing: reports.filter(item => item.status === 'reviewing').length,
      finished: reports.filter(item => ['resolved', 'dismissed'].includes(item.status)).length,
      all: reports.length,
    }
    this.setData({ reports, counts }, () => this.applyFilter())
  },
  selectStatus(event: any) {
    this.setData({ selectedStatus: event.currentTarget.dataset.status }, () => this.applyFilter())
  },
  applyFilter() {
    const { reports, selectedStatus } = this.data
    const visibleReports = selectedStatus === 'all'
      ? reports
      : selectedStatus === 'finished'
        ? reports.filter(item => ['resolved', 'dismissed'].includes(item.status))
        : reports.filter(item => item.status === selectedStatus)
    this.setData({ visibleReports })
  },
  goDetail(event: any) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },
  process(event: any) {
    const reportId = event.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: actionOptions.map(item => item.label),
      success: result => this.confirmAction(reportId, actionOptions[result.tapIndex]),
    })
  },
  confirmAction(reportId: string, option: { label: string; action: ReportAction; confirm?: string }) {
    const execute = async () => {
      try {
        await reportService.handle(reportId, option.action)
        wx.showToast({ title: '处理完成' })
        await this.load()
      } catch (error) {
        wx.showModal({ title: '处理失败', content: error instanceof Error ? error.message : '请稍后重试', showCancel: false })
      }
    }
    if (!option.confirm) { execute(); return }
    wx.showModal({ title: option.label, content: option.confirm, success: result => { if (result.confirm) execute() } })
  },
})