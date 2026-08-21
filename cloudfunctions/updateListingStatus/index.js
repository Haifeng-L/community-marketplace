const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const wxContext = cloud.getWXContext(); const { id, status } = event
  if (!id || !['reserved','sold','offline'].includes(status)) throw new Error('状态不合法')
  const result = await db.collection('listings').where({ _id:id, openid:wxContext.OPENID }).update({ data:{ status, updatedAt:db.serverDate() } })
  if (!result.stats.updated) throw new Error('无权操作或物品不存在')
  return { updated:true }
}
