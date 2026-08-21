const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  if (!event.id) throw new Error('缺少物品ID')
  const result = await db.collection('listings').doc(event.id).get()
  await db.collection('listings').doc(event.id).update({ data:{ views:db.command.inc(1) } })
  return { data: result.data }
}
