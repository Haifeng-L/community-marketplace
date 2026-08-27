const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const displayName = String(event.displayName || '').trim()
  const wechatNickname = typeof event.wechatNickname === 'string' ? event.wechatNickname.trim() : ''
  const avatarUrl = typeof event.avatarUrl === 'string' ? event.avatarUrl : ''
  const wechatAvatarUrl = typeof event.wechatAvatarUrl === 'string' ? event.wechatAvatarUrl : ''
  if (!displayName || displayName.length < 2 || displayName.length > 20) throw new Error('社区昵称需为 2-20 个字符')
  const existing = await db.collection('users').where({ openid: OPENID }).limit(1).get()
  if (!existing.data.length) throw new Error('用户记录不存在，请先刷新我的页面')
  const user = existing.data[0]
  await db.collection('users').doc(user._id).update({ data: { displayName, wechatNickname, avatarUrl, wechatAvatarUrl, updatedAt: db.serverDate() } })
  return { data: { _id: user._id, openid: OPENID, role: user.role || 'user', disabled: user.disabled === true, displayName, wechatNickname, avatarUrl, wechatAvatarUrl, verifiedAt: user.verifiedAt ?? null } }
}