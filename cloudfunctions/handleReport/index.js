const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function assertAdmin(openid) {
  const result = await db.collection('users').where({ openid, role: db.command.in(['admin', 'owner']), disabled: false }).get()
  if (!result.data.length) throw new Error('无管理员权限')
  return result.data[0]
}

const actions = {
  startReview: { status: 'reviewing', result: '管理员正在核实相关信息' },
  hideListing: { status: 'resolved', result: '举报成立，相关物品已下架', listingStatus: 'offline', offlineReason: 'reported' },
  markSold: { status: 'resolved', result: '物品已标记为已出，不再展示', listingStatus: 'sold' },
  requestEdit: { status: 'resolved', result: '已暂时下架，并要求发布者修改信息后重新提交', listingStatus: 'offline', offlineReason: 'requires_edit' },
  warnUser: { status: 'resolved', result: '已提醒并警告发布者遵守社区规则' },
  dismiss: { status: 'dismissed', result: '经核实暂未发现违规，举报不成立' },
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const admin = await assertAdmin(wxContext.OPENID)
  const { id, action } = event
  const config = actions[action]
  if (!id || !config) throw new Error('处理参数不合法')

  const reportResult = await db.collection('reports').doc(id).get()
  const report = reportResult.data
  if (!report) throw new Error('举报记录不存在')
  const listingResult = await db.collection('listings').doc(report.listingId).get()
  const listing = listingResult.data
  if (listing && listing.openid === wxContext.OPENID) throw new Error('管理员不能处理自己发布物品的举报')

  if (listing && config.listingStatus) {
    const listingPatch = { status: config.listingStatus, updatedAt: db.serverDate() }
    if (config.offlineReason) listingPatch.offlineReason = config.offlineReason
    await db.collection('listings').doc(report.listingId).update({ data: listingPatch })
  }

  await db.collection('reports').doc(id).update({ data: {
    status: config.status,
    result: config.result,
    action,
    operatorOpenid: wxContext.OPENID,
    operatorName: admin.displayName || '管理员',
    handledAt: db.serverDate(),
  } })
  await db.collection('auditLogs').add({ data: {
    targetType: 'report',
    targetId: id,
    listingId: report.listingId,
    action,
    result: config.result,
    operatorOpenid: wxContext.OPENID,
    createdAt: db.serverDate(),
  } })
  return { status: config.status, result: config.result }
}