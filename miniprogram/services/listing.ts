import type { Listing } from '../types/listing'

function ensureCloudInitialized() {
  const app = getApp<IAppOption>()
  if (!wx.cloud) throw new Error('当前基础库不支持 CloudBase')
  if (!app.globalData.envId) throw new Error('未配置 CloudBase 环境 ID')
  if (!app.globalData.cloudBootstrapped) {
    wx.cloud.init({ env: app.globalData.envId, traceUser: true })
    app.globalData.cloudBootstrapped = true
  }
}

async function uploadImages(paths: string[]): Promise<string[]> {
  ensureCloudInitialized()
  const results = await Promise.all(paths.map((filePath, index) => wx.cloud.uploadFile({
    cloudPath: `listings/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.jpg`,
    filePath,
  })))
  return results.map(result => result.fileID)
}

async function deleteCloudFiles(fileIDs: string[]) {
  if (!fileIDs.length) return
  try { await wx.cloud.deleteFile({ fileList: fileIDs }) } catch (error) { console.warn('delete unsafe listing images failed', error) }
}

function triggerImageCheck(id: string) {
  void wx.cloud.callFunction({ name: 'checkListingImages', data: { id } }).catch(error => {
    console.error('background image check failed', error)
  })
}

export const listingService = {
  async list(): Promise<Listing[]> {
    ensureCloudInitialized()
    const result = await wx.cloud.callFunction({ name: 'listListings' }) as unknown as { result: { data: Listing[] } }
    return result.result.data
  },
  async listMine(): Promise<Listing[]> {
    ensureCloudInitialized()
    const result = await wx.cloud.callFunction({ name: 'listListings', data: { scope: 'mine' } }) as unknown as { result: { data: Listing[] } }
    return result.result.data
  },
  async get(id: string): Promise<Listing | undefined> {
    ensureCloudInitialized()
    const result = await wx.cloud.callFunction({ name: 'getListing', data: { id } }) as unknown as { result: { data?: Listing } }
    return result.result.data
  },
  async create(input: Omit<Listing, 'id' | 'createdAt' | 'expiresAt' | 'views' | 'status'>): Promise<Listing> {
    const images = await uploadImages(input.images)
    try {
      const result = await wx.cloud.callFunction({ name: 'createListing', data: { ...input, images } }) as unknown as { result: { id: string; expiresAt?: string } }
      triggerImageCheck(result.result.id)
      return { ...input, id: result.result.id, status: 'active', auditStatus: 'checking', auditMessage: '图片检测中', views: 0, createdAt: new Date().toISOString().slice(0, 10), expiresAt: result.result.expiresAt || '', images }
    } catch (error) {
      await deleteCloudFiles(images)
      throw error
    }
  },
  async updateStatus(id: string, status: Listing['status']): Promise<void> {
    ensureCloudInitialized()
    await wx.cloud.callFunction({ name: 'updateListingStatus', data: { id, status } })
  },
  async retryImageCheck(id: string): Promise<void> {
    ensureCloudInitialized()
    await wx.cloud.callFunction({ name: 'checkListingImages', data: { id } })
  },
}
