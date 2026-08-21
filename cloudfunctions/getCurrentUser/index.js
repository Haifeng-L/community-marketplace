const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function buildUser(openid, user = {}) {
  return {
    openid,
    role: user.role === 'admin' || user.role === 'owner' ? user.role : 'user',
    disabled: typeof user.disabled === 'boolean' ? user.disabled : false,
    displayName: user.displayName ? String(user.displayName) : '微信用户',
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : '',
    verifiedAt: user.verifiedAt ?? null,
  }
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const collection = db.collection('users')
  const existing = await collection.where({ openid: OPENID }).limit(1).get()

  if (!existing.data.length) {
    const data = buildUser(OPENID)
    const result = await collection.add({ data })
    return { data: { _id: result._id, ...data } }
  }

  const user = existing.data[0]
  const data = buildUser(OPENID, user)
  const patch = {}

  if (!user.role) patch.role = data.role
  if (typeof user.disabled !== 'boolean') patch.disabled = false
  if (!user.displayName) patch.displayName = data.displayName
  if (typeof user.avatarUrl !== 'string') patch.avatarUrl = data.avatarUrl
  if (user.verifiedAt === undefined) patch.verifiedAt = data.verifiedAt

  if (Object.keys(patch).length) {
    await collection.doc(user._id).update({ data: patch })
  }

  return { data: { _id: user._id, ...data } }
}