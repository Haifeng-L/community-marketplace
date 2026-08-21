const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
async function assertAdmin(openid) {
  const result = await db.collection('users').where({ openid, role: db.command.in(['admin', 'owner']), disabled: false }).count()
  if (!result.total) throw new Error('无管理员权限')
}
exports.main = async () => {
  const wxContext = cloud.getWXContext()
  await assertAdmin(wxContext.OPENID)
  const result = await db.collection('reports').orderBy('createdAt', 'desc').limit(100).get()
  return { data: result.data.map(item => ({ ...item, id: item._id })) }
}