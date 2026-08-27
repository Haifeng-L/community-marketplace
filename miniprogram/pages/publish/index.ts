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
      wx.showModal({ title:'发布成功', content:'物品已展示到广场；如有违规或争议，居民可举报后由管理员处理。', showCancel:false, success:() => {
        this.setData({ images:[], form:{ title:'', price:'', description:'', sellerName:'', building:'', contactValue:'', negotiable:true }, agreed:false, remain: { title: LIMITS.title, description: LIMITS.description, sellerName: LIMITS.sellerName, building: LIMITS.building, contactValue: LIMITS.contactValue } })
        wx.navigateTo({ url:'/pages/my-listings/index' })
      } })
    } finally { this.setData({ submitting:false }) }
  },
  openPrivacyContract,
})
