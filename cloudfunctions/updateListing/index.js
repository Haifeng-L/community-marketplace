const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const wxContext = cloud.getWXContext(); const { id, ...patch } = event
  if (!id) throw new Error('缺少物品ID')
  const allowed = ['title','category','description','price','condition','images','sellerName','building','contactType','contactValue','negotiable']
  const data = Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.includes(key))); data.auditStatus='pending'; data.status='pending'
  const result = await db.collection('listings').where({ _id:id, openid:wxContext.OPENID }).update({ data })
  if (!result.stats.updated) throw new Error('无权修改或物品不存在')
  return { updated:true }
}
