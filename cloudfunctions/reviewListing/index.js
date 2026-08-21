const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
async function assertAdmin(openid) {
  const result = await db.collection('users').where({ openid, role:db.command.in(['admin','owner']), disabled:false }).count()
  if (!result.total) throw new Error('无管理员权限')
}
exports.main = async (event) => {
  const wxContext = cloud.getWXContext(); await assertAdmin(wxContext.OPENID)
  const { id, decision, reason='' } = event
  if (!id || !['approve','reject'].includes(decision)) throw new Error('审核参数不合法')
  const status = decision === 'approve' ? 'active' : 'rejected'
  await db.collection('listings').doc(id).update({ data:{ status, auditStatus:status, auditReason:reason, auditedAt:db.serverDate(), auditedBy:wxContext.OPENID } })
  await db.collection('auditLogs').add({ data:{ targetType:'listing', targetId:id, action:decision, reason, operatorOpenid:wxContext.OPENID, createdAt:db.serverDate() } })
  return { status }
}
