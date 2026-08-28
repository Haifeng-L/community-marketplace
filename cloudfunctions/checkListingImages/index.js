const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function getContentType(fileContent, fileID) {
  if (fileContent?.[0] === 0x89 && fileContent?.[1] === 0x50) return 'image/png'
  if (fileContent?.[0] === 0xff && fileContent?.[1] === 0xd8) return 'image/jpeg'
  if (fileContent?.[0] === 0x47 && fileContent?.[1] === 0x49) return 'image/gif'
  const lower = String(fileID || '').split('?')[0].toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

function getErrorCode(error) {
  return Number(error?.errCode ?? error?.errcode ?? 0)
}

function getErrorMessage(error) {
  return String(error?.errMsg || error?.message || error || '图片检测失败').slice(0, 500)
}

async function checkImage(fileID) {
  if (!String(fileID || '').startsWith('cloud://')) throw new Error('图片文件异常，请重新上传')
  const file = await cloud.downloadFile({ fileID })
  await cloud.openapi.security.imgSecCheck({
    media: {
      contentType: getContentType(file.fileContent, fileID),
      value: file.fileContent,
    },
  })
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!event.id) throw new Error('缺少物品ID')

  const result = await db.collection('listings').doc(event.id).get()
  const listing = result.data
  if (!listing) throw new Error('物品不存在')
  if (listing.openid !== OPENID) throw new Error('无权检测该物品')
  if (!Array.isArray(listing.images) || !listing.images.length) throw new Error('物品没有可检测图片')

  await db.collection('listings').doc(event.id).update({
    data: {
      auditStatus: 'checking',
      auditMessage: '图片检测中',
      auditError: '',
      auditUpdatedAt: db.serverDate(),
    },
  })

  try {
    await Promise.all(listing.images.map(checkImage))
    await db.collection('listings').doc(event.id).update({
      data: {
        auditStatus: 'pass',
        auditMessage: '图片检测通过',
        auditError: '',
        auditUpdatedAt: db.serverDate(),
        updatedAt: db.serverDate(),
      },
    })
    return { checked: true, passed: true }
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 87014) {
      await db.collection('listings').doc(event.id).update({
        data: {
          status: 'offline',
          offlineReason: 'image_risky',
          auditStatus: 'risky',
          auditMessage: '图片未通过内容安全检测',
          auditError: getErrorMessage(error),
          auditUpdatedAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      })
      return { checked: true, passed: false, risky: true }
    }

    await db.collection('listings').doc(event.id).update({
      data: {
        auditStatus: 'checking',
        auditMessage: '图片检测暂未完成，请稍后重试',
        auditError: getErrorMessage(error),
        auditUpdatedAt: db.serverDate(),
      },
    })
    throw error
  }
}
