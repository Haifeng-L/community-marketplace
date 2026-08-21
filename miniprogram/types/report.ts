export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type ReportAction = 'startReview' | 'hideListing' | 'markSold' | 'requestEdit' | 'warnUser' | 'dismiss'

export interface ReportRecord {
  id: string
  listingId: string
  listingTitle: string
  reason: string
  note?: string
  status: ReportStatus
  result?: string
  action?: ReportAction
  operatorName?: string
  createdAt: string
  handledAt?: string
}