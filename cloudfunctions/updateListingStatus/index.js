const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const LISTING_EXPIRE_DAYS = 90

function buildExpiresAt() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + LISTING_EXPIRE_DAYS)
  return expiresAt
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { id, status } = event
  if (!id || !['active', 'reserved', 'sold', 'offline'].includes(status)) throw new Error('状态不合法')

  const currentResult = await db.collection('listings').where({ _id:id, openid:wxContext.OPENID }).limit(1).get()
  const listing = currentResult.data[0]
  if (!listing) throw new Error('无权操作或物品不存在')
  if (status === 'active' && !['offline', 'reserved'].includes(listing.status)) throw new Error('当前状态不能重新上架')
  if (status === 'active' && listing.auditStatus === 'checking') throw new Error('图片仍在检测中，请稍后再试')
  if (status === 'active' && listing.auditStatus === 'risky') throw new Error('图片未通过检测，请修改图片后再重新上架')

  const data = { status, updatedAt:db.serverDate() }
  if (status === 'active') {
    data.expiresAt = buildExpiresAt()
    data.offlineReason = ''
  }
  if (status === 'offline') data.offlineReason = 'manual'

  await db.collection('listings').doc(id).update({ data })
  return { updated:true, expiresAt: data.expiresAt }
}
