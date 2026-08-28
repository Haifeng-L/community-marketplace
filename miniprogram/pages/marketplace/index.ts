import { categories } from '../../services/catalog'
import { listingService } from '../../services/listing'
import type { Listing } from '../../types/listing'

Page({
  filterTimer: undefined as number | undefined,
  data: {
    categories: [{ id: '', name: '全部', icon: '🏘️' }, ...categories],
    selectedCategory: '',
    keyword: '',
    allListings: [] as Listing[],
    visibleListings: [] as Listing[],
  },
  async onShow() {
    const selectedCategory = wx.getStorageSync<string>('marketplace_category') || ''
    wx.removeStorageSync('marketplace_category')
    const allListings = (await listingService.list()).filter(item => ['active','reserved'].includes(item.status))
    this.setData({ allListings, selectedCategory }, () => this.applyFilters())
  },
  onUnload() {
    this.clearFilterTimer()
  },
  onKeyword(event: WechatMiniprogram.Input) {
    this.setData({ keyword: event.detail.value }, () => this.debounceApplyFilters())
  },
  selectCategory(event: WechatMiniprogram.BaseEvent) {
    this.setData({ selectedCategory: event.currentTarget.dataset.id }, () => this.applyFilters())
  },
  debounceApplyFilters() {
    this.clearFilterTimer()
    this.filterTimer = setTimeout(() => this.applyFilters(), 300) as unknown as number
  },
  clearFilterTimer() {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer)
      this.filterTimer = undefined
    }
  },
  applyFilters() {
    this.clearFilterTimer()
    const { allListings, selectedCategory, keyword } = this.data as { allListings: Listing[]; selectedCategory: string; keyword: string }
    const query = keyword.trim().toLowerCase()
    const visibleListings = allListings.filter((item: Listing) => {
      const categoryMatched = !selectedCategory || item.category === selectedCategory
      const keywordMatched = !query || `${item.title}${item.description}`.toLowerCase().includes(query)
      return categoryMatched && keywordMatched
    })
    this.setData({ visibleListings })
  },
  goDetail(event: WechatMiniprogram.BaseEvent) {
    wx.navigateTo({ url: `/pages/detail/index?id=${event.currentTarget.dataset.id}` })
  },
})
