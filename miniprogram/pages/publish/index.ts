import { categories } from '../../services/catalog'
import { listingService } from '../../services/listing'
import { openPrivacyContract, requirePrivacyAuthorization } from '../../services/privacy'

const LIMITS = {
  title: 50,
  description: 500,
  sellerName: 50,
  building: 20,
  contactValue: 50,
  contactPhone: 11,
  priceMax: 9999999.99,
} as const

function getPublishErrorMessage(error: unknown): string {
  console.error('publish listing failed', error)
  const raw = error instanceof Error
    ? error.message
    : String((error as { errMsg?: string; message?: string } | undefined)?.errMsg
      || (error as { message?: string } | undefined)?.message
      || error
      || '')

  const knownMessages = [
    '图片可能含有违规内容，请更换后再发布',
    '图片内容安全检测不可用，请确认云函数 openapi 权限后重试',
    '图片上传异常，请重新选择图片',
    '当前账号已被限制发布，请联系管理员',
    '缺少必填字段',
  ]
  const known = knownMessages.find(message => raw.includes(message))
  if (known) return known
  if (raw.includes('security.imgSecCheck') || raw.includes('openapi')) {
    return '图片内容安全接口调用失败，请确认 createListing 已重新部署并开通接口权限'
  }
  if (raw.includes('-504003') || raw.includes('FUNCTIONS_TIME_LIMIT_EXCEEDED') || raw.includes('timed out') || raw.includes('TIMEDOUT')) {
    return 'createListing 执行超时，请在云开发控制台把该函数超时时间设置为10秒'
  }
  if (raw.includes('cloud.callFunction') || raw.includes('errCode')) {
    const detail = raw.replace(/\s+/g, ' ').trim()
    return `云函数错误：${detail.slice(-240)}`
  }
  return raw || '发布失败，请稍后重试'
}

Page({
  data: {
    categories,
    categoryIndex: 0,
    conditionOptions: ['全新未用','九成新','八成新','七成新','有明显使用痕迹'],
    conditionIndex: 2,
    contactOptions: ['群内昵称','微信号','手机号'],
    contactIndex: 0,
    images: [] as string[],
    form: { title:'', price:'', description:'', sellerName:'', building:'', contactValue:'', negotiable:true },
    agreed: false,
    submitting: false,
    limits: LIMITS,
    remain: { title: LIMITS.title, description: LIMITS.description, sellerName: LIMITS.sellerName, building: LIMITS.building, contactValue: LIMITS.contactValue },
  },
  onField(event: WechatMiniprogram.Input) {
    const field = event.currentTarget.dataset.field as keyof typeof this.data.form
    let value: string = event.detail.value
    if (field === 'price') {
      const cleaned = value.replace(/[^\d.]/g, '')
      const parts = cleaned.split('.')
      if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join('')}`
      const num = Number(value)
      if (value !== '' && !isNaN(num) && num > LIMITS.priceMax) value = String(LIMITS.priceMax)
    }
    this.setData({ [`form.${field}`]: value }, () => this.updateRemain(field))
  },
  onContactType(event: WechatMiniprogram.PickerChange) {
    const contactIndex = Number(event.detail.value)
    const form = { ...this.data.form, contactValue: '' }
    this.setData({ contactIndex, form }, () => this.updateRemain('contactValue'))
  },
  updateRemain(field: keyof typeof this.data.form) {
    const val = String(this.data.form[field] || '')
    this.setData({ [`remain.${field}`]: (this.data.limits as Record<string, number>)[field] - val.length })
  },
  onCategory(event: WechatMiniprogram.PickerChange) { this.setData({ categoryIndex: Number(event.detail.value) }) },
  onCondition(event: WechatMiniprogram.PickerChange) { this.setData({ conditionIndex: Number(event.detail.value) }) },
  onNegotiable(event: WechatMiniprogram.SwitchChange) { this.setData({ 'form.negotiable': event.detail.value }) },
  onAgreement(event: WechatMiniprogram.CheckboxGroupChange) { this.setData({ agreed: event.detail.value.length > 0 }) },
  goRules() { wx.navigateTo({ url: '/pages/rules/index' }) },
  async chooseImages() {
    try { await requirePrivacyAuthorization() } catch { return wx.showToast({ title: '同意隐私指引后才能上传图片', icon: 'none' }) }
    const remain = 6 - this.data.images.length
    if (remain <= 0) return wx.showToast({ title:'最多6张图片', icon:'none' })
    wx.chooseMedia({ count: remain, mediaType:['image'], sizeType:['compressed'], success: result => {
      const paths = result.tempFiles.map(file => file.tempFilePath)
      this.setData({ images: [...this.data.images, ...paths] })
    } })
  },
  removeImage(event: WechatMiniprogram.BaseEvent) {
    const index = Number(event.currentTarget.dataset.index)
    this.setData({ images: this.data.images.filter((_, i) => i !== index) })
  },
  async submit() {
    const { form, categories, categoryIndex, conditionOptions, conditionIndex, contactIndex, images, agreed } = this.data
    if (!form.title.trim()) return wx.showToast({ title:'请填写物品名称', icon:'none' })
    if (form.title.length > LIMITS.title) return wx.showToast({ title:`物品名称不超过${LIMITS.title}字`, icon:'none' })
    if (form.price === '' || Number(form.price) < 0) return wx.showToast({ title:'请填写正确价格', icon:'none' })
    if (Number(form.price) > LIMITS.priceMax) return wx.showToast({ title:`价格不能超过${LIMITS.priceMax}`, icon:'none' })
    if (!form.description.trim()) return wx.showToast({ title:'请填写物品描述', icon:'none' })
    if (form.description.length > LIMITS.description) return wx.showToast({ title:`描述不超过${LIMITS.description}字`, icon:'none' })
    if (!form.sellerName.trim()) return wx.showToast({ title:'请填写群内昵称', icon:'none' })
    if (form.sellerName.length > LIMITS.sellerName) return wx.showToast({ title:`昵称不超过${LIMITS.sellerName}字`, icon:'none' })
    if (form.building.length > LIMITS.building) return wx.showToast({ title:`楼栋不超过${LIMITS.building}字`, icon:'none' })
    if (!form.contactValue.trim()) return wx.showToast({ title:'请填写联系信息', icon:'none' })
    const contactType = (['groupName','wechat','phone'] as const)[contactIndex]
    if (contactType === 'phone' && form.contactValue.length > LIMITS.contactPhone) return wx.showToast({ title:'手机号最多11位', icon:'none' })
    if (contactType !== 'phone' && form.contactValue.length > LIMITS.contactValue) return wx.showToast({ title:`联系信息不超过${LIMITS.contactValue}字`, icon:'none' })
    if (!images.length) return wx.showToast({ title:'请至少选择1张图片', icon:'none' })
    if (!agreed) return wx.showToast({ title:'请先同意发布规则', icon:'none' })
    try { await requirePrivacyAuthorization() } catch { return wx.showToast({ title: '同意隐私指引后才能提交发布', icon: 'none' }) }
    this.setData({ submitting:true })
    try {
      await listingService.create({
        title: form.title.trim(), category: categories[categoryIndex].id, description: form.description.trim(),
        price: Number(form.price), condition: conditionOptions[conditionIndex], images,
        sellerName: form.sellerName.trim(), building: form.building.trim(),
        contactType,
        contactValue: form.contactValue.trim(), negotiable: form.negotiable,
      })
      wx.showModal({ title:'发布成功', content:'物品已保存，可在“我的发布”中查看；图片检测通过后会自动展示到广场。', showCancel:false, success:() => {
        this.setData({ images:[], form:{ title:'', price:'', description:'', sellerName:'', building:'', contactValue:'', negotiable:true }, agreed:false, remain: { title: LIMITS.title, description: LIMITS.description, sellerName: LIMITS.sellerName, building: LIMITS.building, contactValue: LIMITS.contactValue } })
        wx.navigateTo({ url:'/pages/my-listings/index' })
      } })
    } catch (error) {
      wx.showModal({
        title: '发布失败',
        content: getPublishErrorMessage(error),
        showCancel: false,
      })
    } finally { this.setData({ submitting:false }) }
  },
  openPrivacyContract,
})
