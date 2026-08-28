const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const LISTING_EXPIRE_DAYS = 90
const BLOCKED_TERMS = ['二维码', '加微信', '兼职', '贷款', '博彩', '赌博', '色情', '枪支', '毒品', '香烟', '烟草', '处方药']

function assertAllowedContent(title, description) {
  const content = `${String(title || '')} ${String(description || '')}`.toLowerCase()
  const blocked = BLOCKED_TERMS.find(term => content.includes(term.toLowerCase()))
  if (blocked) throw new Error(`发布内容含有限制词“${blocked}”，请修改后再发布`)
}

function buildExpiresAt() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + LISTING_EXPIRE_DAYS)
  return expiresAt
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext(); const { id, ...patch } = event
  if (!id) throw new Error('缺少物品ID')
  const user = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()
  if (user.data[0]?.disabled) throw new Error('当前账号已被限制发布，请联系管理员')
  const allowed = ['title','category','description','price','condition','images','sellerName','building','contactType','contactValue','negotiable']
  const data = Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.includes(key)))
  const existing = await db.collection('listings').where({ _id: id, openid: wxContext.OPENID }).limit(1).get()
  if (!existing.data.length) throw new Error('无权修改或物品不存在')
  assertAllowedContent(data.title ?? existing.data[0].title, data.description ?? existing.data[0].description)
  data.auditStatus = 'checking'
  data.auditMessage = '图片检测中'
  data.status = 'active'
  data.offlineReason = ''
  data.expiresAt = buildExpiresAt()
  data.updatedAt = db.serverDate()
  await db.collection('listings').doc(id).update({ data })
  return { updated:true, expiresAt: data.expiresAt }
}
