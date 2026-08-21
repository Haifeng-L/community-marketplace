const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { title, category, description, price, condition, images, sellerName, building, contactType, contactValue, negotiable } = event
  if (!title || !category || !description || !sellerName || !contactValue || !Array.isArray(images) || !images.length) throw new Error('缺少必填字段')
  if (String(title).length > 30 || String(description).length > 500 || images.length > 6) throw new Error('字段长度或图片数量不符合要求')
  const now = new Date(); const expiresAt = new Date(now); expiresAt.setDate(expiresAt.getDate() + 30)
  const result = await db.collection('listings').add({ data: { openid: wxContext.OPENID, title:String(title).trim(), category, description:String(description).trim(), price:Number(price), condition, images, sellerName:String(sellerName).trim(), building:building ? String(building).trim() : '', contactType, contactValue:String(contactValue).trim(), negotiable:Boolean(negotiable), status:'pending', auditStatus:'pending', views:0, createdAt:db.serverDate(), expiresAt } })
  return { id: result._id }
}
