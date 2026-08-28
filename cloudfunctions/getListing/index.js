const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  if (!event.id) throw new Error('缺少物品ID')
  const result = await db.collection('listings').doc(event.id).get()
  const listing = result.data
  if (!listing) throw new Error('物品不存在')
  const { OPENID } = cloud.getWXContext()
  const isOwner = listing.openid === OPENID
  const user = await db.collection('users').where({ openid: OPENID }).limit(1).get()
  const isAdmin = Boolean(user.data[0] && ['admin', 'owner'].includes(user.data[0].role) && !user.data[0].disabled)
  if (!['active', 'reserved'].includes(listing.status) && !isOwner && !isAdmin) throw new Error('物品已下架或不可查看')
  if (['checking', 'risky'].includes(listing.auditStatus) && !isOwner && !isAdmin) throw new Error('物品图片正在检测或未通过检测')
  await db.collection('listings').doc(event.id).update({ data:{ views:db.command.inc(1) } })
  return { data: { ...listing, id: listing._id } }
}
