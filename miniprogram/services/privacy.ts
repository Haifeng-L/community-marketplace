export function openPrivacyContract() {
  if (typeof wx.openPrivacyContract !== 'function') {
    wx.showToast({ title: '当前微信版本不支持', icon: 'none' })
    return
  }
  wx.openPrivacyContract({ fail: () => wx.showToast({ title: '隐私指引暂不可打开', icon: 'none' }) })
}

/** 在调用选图、用户资料等隐私相关能力前触发微信官方授权流程。 */
export function requirePrivacyAuthorization(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof wx.requirePrivacyAuthorize !== 'function') { resolve(); return }
    wx.requirePrivacyAuthorize({ success: () => resolve(), fail: () => reject(new Error('用户未同意隐私保护指引')) })
  })
}