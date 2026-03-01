export interface PurposeRoundtableTeaser {
  id: string
  name: string
  intent: string
}

export interface CommunityTeaser {
  id: string
  name: string
  intent: string | null
  frontendUrl: string | null
  logoUrl: string | null
  memberCount: number
  purposeRoundtable: PurposeRoundtableTeaser | null
}

export interface PublicCommunityTeaser {
  id: string
  name: string
  intent: string | null
  logoUrl: string | null
  memberCount: number
  isMember: boolean
  hasInviteCode: boolean
}

export interface JoinCommunityResponse {
  communityId: string
  communityName: string
  frontendUrl: string | null
}
