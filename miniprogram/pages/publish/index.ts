import { categories } from '../../services/catalog'
import { listingService } from '../../services/listing'
import { openPrivacyContract, requirePrivacyAuthorization } from '../../services/privacy'

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
  },
  onField(event: any) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: event.detail.value })
  },
  onCategory(event: any) { this.setData({ categoryIndex: Number(event.detail.value) }) },
  onCondition(event: any) { this.setData({ conditionIndex: Number(event.detail.value) }) },
  onContactType(event: any) { this.setData({ contactIndex: Number(event.detail.value) }) },
  onNegotiable(event: any) { this.setData({ 'form.negotiable': event.detail.value }) },
  onAgreement(event: any) { this.setData({ agreed: event.detail.value.length > 0 }) },
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
  removeImage(event: any) {
    const index = Number(event.currentTarget.dataset.index)
    this.setData({ images: this.data.images.filter((_, i) => i !== index) })
  },
  async submit() {
    const { form, categories, categoryIndex, conditionOptions, conditionIndex, contactIndex, contactOptions, images, agreed } = this.data
    if (!form.title.trim()) return wx.showToast({ title:'请填写物品名称', icon:'none' })
    if (form.price === '' || Number(form.price) < 0) return wx.showToast({ title:'请填写正确价格', icon:'none' })
    if (!form.description.trim()) return wx.showToast({ title:'请填写物品描述', icon:'none' })
    if (!form.sellerName.trim() || !form.contactValue.trim()) return wx.showToast({ title:'请填写发布者和联系信息', icon:'none' })
    if (!images.length) return wx.showToast({ title:'请至少选择1张图片', icon:'none' })
    if (!agreed) return wx.showToast({ title:'请先同意发布规则', icon:'none' })
    try { await requirePrivacyAuthorization() } catch { return wx.showToast({ title: '同意隐私指引后才能提交发布', icon: 'none' }) }
    this.setData({ submitting:true })
    try {
      await listingService.create({
        title: form.title.trim(), category: categories[categoryIndex].id, description: form.description.trim(),
        price: Number(form.price), condition: conditionOptions[conditionIndex], images,
        sellerName: form.sellerName.trim(), building: form.building.trim(),
        contactType: (['groupName','wechat','phone'] as const)[contactIndex],
        contactValue: form.contactValue.trim(), negotiable: form.negotiable,
      })
      wx.showModal({ title:'提交成功', content:'物品已提交，等待管理员审核。', showCancel:false, success:() => {
        this.setData({ images:[], form:{ title:'', price:'', description:'', sellerName:'', building:'', contactValue:'', negotiable:true }, agreed:false })
        wx.navigateTo({ url:'/pages/my-listings/index' })
      } })
    } finally { this.setData({ submitting:false }) }
  },
  openPrivacyContract,
})
