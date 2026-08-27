const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const BLOCKED_TERMS = ['二维码', '加微信', '兼职', '贷款', '博彩', '赌博', '色情', '枪支', '毒品', '香烟', '烟草', '处方药']

const LIMITS = {
  title: 50,
  description: 500,
  sellerName: 50,
  building: 20,
  contactValue: 50,
  contactPhone: 11,
  priceMax: 9999999.99,
}

function assertAllowedContent(title, description) {
  const content = `${String(title || '')} ${String(description || '')}`.toLowerCase()
  const blocked = BLOCKED_TERMS.find(term => content.includes(term.toLowerCase()))
  if (blocked) throw new Error(`发布内容含有限制词"${blocked}"，请修改后再发布`)
}

async function assertEnabledUser(openid) {
  const result = await db.collection('users').where({ openid }).limit(1).get()
  if (result.data[0]?.disabled) throw new Error('当前账号已被限制发布，请联系管理员')
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { title, category, description, price, condition, images, sellerName, building, contactType, contactValue, negotiable } = event
  if (!title || !category || !description || !sellerName || !contactValue || !Array.isArray(images) || !images.length) throw new Error('缺少必填字段')
  if (String(title).length > LIMITS.title) throw new Error(`物品名称不超过${LIMITS.title}字`)
  if (String(description).length > LIMITS.description) throw new Error(`物品描述不超过${LIMITS.description}字`)
  if (String(sellerName).length > LIMITS.sellerName) throw new Error(`群内昵称不超过${LIMITS.sellerName}字`)
  if (building && String(building).length > LIMITS.building) throw new Error(`楼栋不超过${LIMITS.building}字`)
  if (contactType === 'phone' && String(contactValue).length > LIMITS.contactPhone) throw new Error('手机号最多11位')
  if (contactType !== 'phone' && String(contactValue).length > LIMITS.contactValue) throw new Error(`联系信息不超过${LIMITS.contactValue}字`)
  if (images.length > 6) throw new Error('最多6张图片')
  const priceNum = Number(price)
  if (isNaN(priceNum) || priceNum < 0) throw new Error('价格不合法')
  if (priceNum > LIMITS.priceMax) throw new Error(`价格不能超过${LIMITS.priceMax}`)
  assertAllowedContent(title, description)
  await assertEnabledUser(wxContext.OPENID)
  const now = new Date(); const expiresAt = new Date(now); expiresAt.setDate(expiresAt.getDate() + 30)
  const result = await db.collection('listings').add({ data: { openid: wxContext.OPENID, title:String(title).trim(), category, description:String(description).trim(), price:priceNum, condition, images, sellerName:String(sellerName).trim(), building:building ? String(building).trim() : '', contactType, contactValue:String(contactValue).trim(), negotiable:Boolean(negotiable), status:'active', auditStatus:'auto', views:0, createdAt:db.serverDate(), expiresAt } })
  return { id: result._id }
}
