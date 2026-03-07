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

// ── ShareMember Story ──────────────────────────────────────────────────────

export interface StorySummary {
  keycloakId: string
  name: string
  pictureUrl: string | null
  eidStatus: 'un_identified' | 'identified'
  memberSince: string
  highestSeatLevel: string | null
}

export interface Seat {
  roundtableId: string
  roundtableName: string
  roundtableType: string
  since: string
  until: string | null
}

export interface CommunityEngagement {
  communityId: string
  communityName: string
  logoUrl: string | null
  memberSince: string
  seats: Seat[]
}

export interface TrustChainPerson {
  keycloakId: string
  name: string
  eidStatus: 'un_identified' | 'identified'
}

export interface TrustChain {
  vouchedBy: TrustChainPerson[]
  vouchedFor: TrustChainPerson[]
}

export interface ActivitySignals {
  activeCommunityCount: number
  activeSeats: number
  longestSeatMonths: number
}

export interface TimelineEvent {
  type: 'joined_community' | 'gained_seat' | 'left_seat'
  date: string
  communityName: string
  detail: string | null
}

export interface Story {
  keycloakId: string
  name: string
  pictureUrl: string | null
  eidStatus: 'un_identified' | 'identified'
  memberSince: string
  signals: ActivitySignals
  trustChain: TrustChain
  communities: CommunityEngagement[]
  timeline: TimelineEvent[]
}
