const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async () => {
  const result = await db.collection('listings').where({ status: cloud.database().command.in(['active','reserved']) }).orderBy('createdAt','desc').limit(100).get()
  return { data: result.data.map(item => ({ ...item, id: item._id })) }
}
