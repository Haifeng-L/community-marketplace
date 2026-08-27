import type { CloudUser } from '../types/user'

const CURRENT_USER_KEY = 'community_marketplace_current_user'
const ADMIN_ROLES: CloudUser['role'][] = ['admin', 'owner']

function ensureCloudInitialized() {
  const app = getApp<IAppOption>()
  if (!wx.cloud) throw new Error('当前基础库不支持 CloudBase')
  if (!app.globalData.envId) throw new Error('未配置 CloudBase 环境 ID')
  if (!app.globalData.cloudBootstrapped) {
    wx.cloud.init({ env: app.globalData.envId, traceUser: true })
    app.globalData.cloudBootstrapped = true
  }
}

function normalizeUser(user: Partial<CloudUser> | null | undefined): CloudUser | null {
  if (!user || !user.openid) return null
  return {
    _id: user._id,
    openid: String(user.openid),
    role: user.role === 'admin' || user.role === 'owner' ? user.role : 'user',
    disabled: Boolean(user.disabled),
    displayName: String(user.displayName || '微信用户'),
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : '',
    verifiedAt: user.verifiedAt ?? null,
  }
}

function cacheCurrentUser(user: CloudUser | null) {
  const app = getApp<IAppOption>()
  app.globalData.currentUser = user
  if (user) wx.setStorageSync(CURRENT_USER_KEY, user)
  else wx.removeStorageSync(CURRENT_USER_KEY)
}

export function getCurrentUser(): CloudUser | null {
  const app = getApp<IAppOption>()
  if (app.globalData.currentUser) return app.globalData.currentUser
  const stored = wx.getStorageSync<CloudUser | null>(CURRENT_USER_KEY)
  const normalized = normalizeUser(stored)
  if (normalized) app.globalData.currentUser = normalized
  return normalized
}

export function canAccessAdmin(user: CloudUser | null = getCurrentUser()): boolean {
  return Boolean(user && !user.disabled && ADMIN_ROLES.includes(user.role))
}

export function getRoleLabel(user: CloudUser | null = getCurrentUser()): string {
  if (!user) return '身份同步中'
  if (user.disabled) return '账号已禁用'
  if (user.role === 'owner') return '项目领头人'
  if (user.role === 'admin') return '管理员'
  return '社区居民'
}

export async function refreshCurrentUser(): Promise<CloudUser | null> {
  ensureCloudInitialized()
  const result = await wx.cloud.callFunction({ name: 'getCurrentUser' }) as unknown as { result?: { data?: CloudUser | null } }
  const user = normalizeUser(result.result?.data)
  cacheCurrentUser(user)
  return user
}

export async function updateCurrentUserProfile(profile: {
  displayName: string
  wechatNickname?: string
  avatarUrl: string
  wechatAvatarUrl?: string
}): Promise<CloudUser | null> {
  ensureCloudInitialized()
  const result = await wx.cloud.callFunction({ name: 'updateCurrentUser', data: profile }) as unknown as { result?: { data?: CloudUser | null } }
  const user = normalizeUser(result.result?.data)
  cacheCurrentUser(user)
  return user
}
