const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  const query = event.scope === 'mine'
    ? { openid: OPENID }
    : { status: db.command.in(['active','reserved']) }
  const result = await db.collection('listings').where(query).orderBy('createdAt','desc').limit(100).get()
  const data = event.scope === 'mine'
    ? result.data
    : result.data.filter(item => !['checking', 'risky'].includes(item.auditStatus))
  return { data: data.map(item => ({ ...item, id: item._id })) }
}
