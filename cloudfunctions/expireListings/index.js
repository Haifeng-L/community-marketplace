const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async () => {
  const now = new Date()
  const result = await db.collection('listings').where({ status:db.command.in(['active','reserved']), expiresAt:db.command.lt(now) }).update({ data:{ status:'offline', offlineReason:'expired', updatedAt:db.serverDate() } })
  return { updated:result.stats.updated }
}
