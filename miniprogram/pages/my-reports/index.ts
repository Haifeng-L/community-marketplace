import { reportService } from '../../services/report'
import type { ReportRecord } from '../../types/report'

Page({
  data: {
    reports: [] as ReportRecord[],
    statusText: { pending: '待处理', reviewing: '核实中', resolved: '已处理', dismissed: '不予处理' } as Record<string, string>,
  },
  async onShow() {
    this.setData({ reports: await reportService.listMine() })
  },
  goDetail(event: any) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },
})