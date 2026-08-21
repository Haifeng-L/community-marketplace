export type CloudRole = 'user' | 'admin' | 'owner'

export interface CloudUser {
  _id?: string
  openid: string
  role: CloudRole
  disabled: boolean
  displayName: string
  avatarUrl?: string
  verifiedAt?: string | null
}