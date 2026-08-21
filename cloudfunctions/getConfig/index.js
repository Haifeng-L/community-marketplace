const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async () => {
  const result = await db.collection('settings').where({ key:db.command.in(['communityName','welfareEnabled','inviteCode','listingExpireDays']) }).get()
  return result.data.reduce((map, item) => { map[item.key]=item.value; return map }, {})
}
