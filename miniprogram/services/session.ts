import type { CloudUser } from '../types/user'

const CURRENT_USER_KEY = 'community_marketplace_current_user'
const ADMIN_ROLES: CloudUser['role'][] = ['admin', 'owner']

function cloudEnabled(): boolean {
  return Boolean(getApp<IAppOption>().globalData.cloudEnabled && wx.cloud)
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
  if (user) {
    wx.setStorageSync(CURRENT_USER_KEY, user)
  } else {
    wx.removeStorageSync(CURRENT_USER_KEY)
  }
}

export function getCurrentUser(): CloudUser | null {
  const app = getApp<IAppOption>()
  if (app.globalData.currentUser) return app.globalData.currentUser
  const stored = wx.getStorageSync<CloudUser | null>(CURRENT_USER_KEY)
  const normalized = normalizeUser(stored)
  if (normalized) {
    app.globalData.currentUser = normalized
    return normalized
  }
  return null
}

export function isCloudMode(): boolean {
  return cloudEnabled()
}

export function canAccessAdmin(user: CloudUser | null = getCurrentUser()): boolean {
  if (!cloudEnabled()) return true
  return Boolean(user && !user.disabled && ADMIN_ROLES.includes(user.role))
}

export function getRoleLabel(user: CloudUser | null = getCurrentUser()): string {
  if (!cloudEnabled()) return '本地演示'
  if (!user) return '待同步身份'
  if (user.disabled) return '账号已禁用'
  if (user.role === 'owner') return '平台管理员'
  if (user.role === 'admin') return '社区管理员'
  return '普通居民'
}

export function getCloudLabel(): string {
  return cloudEnabled() ? 'CloudBase 已接入' : '本地演示模式'
}

export async function refreshCurrentUser(): Promise<CloudUser | null> {
  if (!cloudEnabled()) return getCurrentUser()
  try {
    const result = await wx.cloud.callFunction({ name: 'getCurrentUser' }) as unknown as {
      result?: { data?: CloudUser | null }
    }
    const user = normalizeUser(result.result?.data)
    cacheCurrentUser(user)
    return user
  } catch {
    return getCurrentUser()
  }
}