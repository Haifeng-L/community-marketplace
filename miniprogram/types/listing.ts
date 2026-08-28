export type ListingStatus = 'pending' | 'active' | 'reserved' | 'sold' | 'offline' | 'rejected'
export type ListingAuditStatus = 'checking' | 'pass' | 'risky' | 'auto'

export interface Listing {
  id: string
  title: string
  category: string
  description: string
  price: number
  originalPrice?: number
  condition: string
  images: string[]
  sellerName: string
  building?: string
  contactType: 'groupName' | 'wechat' | 'phone'
  contactValue: string
  negotiable: boolean
  status: ListingStatus
  auditStatus?: ListingAuditStatus
  auditMessage?: string
  createdAt: string
  expiresAt: string
  views: number
  featured?: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
}
