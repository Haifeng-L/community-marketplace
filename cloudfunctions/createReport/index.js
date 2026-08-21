const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { listingId, listingTitle = '', reason, note = '' } = event
  if (!listingId || !reason) throw new Error('举报信息不完整')
  const duplicate = await db.collection('reports').where({
    listingId,
    reporterOpenid: wxContext.OPENID,
    status: db.command.in(['pending', 'reviewing']),
  }).count()
  if (duplicate.total) throw new Error('你已经举报过该物品，管理员正在处理')
  await db.collection('reports').add({ data: {
    listingId, listingTitle, reason, note,
    reporterOpenid: wxContext.OPENID,
    status: 'pending',
    createdAt: db.serverDate(),
  } })
  await db.collection('listings').doc(listingId).update({ data: { reportCount: db.command.inc(1) } })
  return { submitted: true }
}