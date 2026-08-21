import type { Listing } from '../types/listing'
import { seedListings } from './seed'

const LISTINGS_KEY = 'community_marketplace_listings'

function getStored(): Listing[] {
  const stored = wx.getStorageSync<Listing[]>(LISTINGS_KEY)
  if (Array.isArray(stored) && stored.length) return stored
  wx.setStorageSync(LISTINGS_KEY, seedListings)
  return seedListings
}

function cloudEnabled(): boolean {
  return Boolean(getApp<IAppOption>().globalData.cloudEnabled && wx.cloud)
}

async function saveLocalImage(filePath: string): Promise<string> {
  if (!filePath.startsWith('wxfile://tmp')) return filePath
  try {
    return wx.getFileSystemManager().saveFileSync(filePath)
  } catch {
    return filePath
  }
}

async function persistLocalImages(paths: string[]): Promise<string[]> {
  return Promise.all(paths.map(saveLocalImage))
}

async function migrateLocalImages(listings: Listing[]): Promise<Listing[]> {
  let changed = false
  const migrated = await Promise.all(listings.map(async item => {
    const images = await persistLocalImages(item.images || [])
    if (images.some((path, index) => path !== item.images[index])) changed = true
    return { ...item, images }
  }))
  if (changed) wx.setStorageSync(LISTINGS_KEY, migrated)
  return migrated
}

async function uploadImages(paths: string[]): Promise<string[]> {
  if (!cloudEnabled()) return paths
  const results = await Promise.all(paths.map((filePath, index) => wx.cloud.uploadFile({
    cloudPath: `listings/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.jpg`,
    filePath,
  })))
  return results.map(result => result.fileID)
}

export const listingService = {
  async list(): Promise<Listing[]> {
    if (cloudEnabled()) {
      const result = await wx.cloud.callFunction({ name: 'listListings' }) as unknown as { result: { data: Listing[] } }
      return result.result.data
    }
    const listings = await migrateLocalImages(getStored())
    return listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async get(id: string): Promise<Listing | undefined> {
    if (cloudEnabled()) {
      const result = await wx.cloud.callFunction({ name: 'getListing', data: { id } }) as unknown as { result: { data?: Listing } }
      return result.result.data
    }
    const listings = await migrateLocalImages(getStored())
    return listings.find(item => item.id === id)
  },
  async create(input: Omit<Listing, 'id' | 'createdAt' | 'expiresAt' | 'views' | 'status'>): Promise<Listing> {
    if (cloudEnabled()) {
      const images = await uploadImages(input.images)
      await wx.cloud.callFunction({ name: 'createListing', data: { ...input, images } })
      return { ...input, id: `cloud-${Date.now()}`, status: 'pending', views: 0, createdAt: new Date().toISOString().slice(0, 10), expiresAt: '', images }
    }
    const images = await persistLocalImages(input.images)
    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + 30)
    const item: Listing = {
      ...input,
      images,
      id: `local-${Date.now()}`,
      status: 'pending',
      views: 0,
      createdAt: now.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
    }
    wx.setStorageSync(LISTINGS_KEY, [item, ...getStored()])
    return item
  },
  async listPending(): Promise<Listing[]> {
    if (cloudEnabled()) {
      const result = await wx.cloud.callFunction({ name: 'listPendingListings' }) as unknown as { result: { data: Listing[] } }
      return result.result.data
    }
    const listings = await migrateLocalImages(getStored())
    return listings.filter(item => item.status === 'pending')
  },
  async review(id: string, decision: 'approve' | 'reject'): Promise<void> {
    if (cloudEnabled()) {
      await wx.cloud.callFunction({ name: 'reviewListing', data: { id, decision } })
      return
    }
    const status: Listing['status'] = decision === 'approve' ? 'active' : 'rejected'
    wx.setStorageSync(LISTINGS_KEY, getStored().map(item => item.id === id ? { ...item, status } : item))
  },
  async updateStatus(id: string, status: Listing['status']): Promise<void> {
    if (cloudEnabled()) {
      await wx.cloud.callFunction({ name: 'updateListingStatus', data: { id, status } })
      return
    }
    wx.setStorageSync(LISTINGS_KEY, getStored().map(item => item.id === id ? { ...item, status } : item))
  },
}