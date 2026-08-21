import type { CloudUser } from './user'

declare global {
  interface IAppOption {
    globalData: {
      cloudBootstrapped: boolean
      cloudEnabled: boolean
      currentUser: CloudUser | null
      envId: string
      communityName: string
      welfareEnabled: boolean
    }
  }
}

export {}