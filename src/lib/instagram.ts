const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0'

export interface InstagramProfile {
  id: string
  username: string
  name?: string
  biography?: string
  followers_count: number
  follows_count: number
  media_count: number
  profile_picture_url?: string
  website?: string
}

export interface InstagramMedia {
  id: string
  media_type: string
  caption?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp: string
  like_count?: number
  comments_count?: number
}

export interface InstagramInsights {
  reach?: number
  impressions?: number
  saved?: number
  shares?: number
}

export async function getProfile(accessToken: string): Promise<InstagramProfile> {
  const fields = 'id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website'
  const url = `${GRAPH_API_BASE}/me?fields=${fields}&access_token=${accessToken}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'Instagram API error')
  }
  return res.json()
}

export async function getMedia(accountId: string, accessToken: string, limit = 20): Promise<InstagramMedia[]> {
  const fields = 'id,media_type,caption,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
  const url = `${GRAPH_API_BASE}/${accountId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'Instagram API error')
  }
  const data = await res.json()
  return data.data ?? []
}

export async function getMediaInsights(mediaId: string, accessToken: string): Promise<InstagramInsights> {
  const metrics = 'reach,impressions,saved,shares'
  const url = `${GRAPH_API_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`

  try {
    const res = await fetch(url)
    if (!res.ok) return {}
    const data = await res.json()
    const insights: InstagramInsights = {}
    for (const item of data.data ?? []) {
      insights[item.name as keyof InstagramInsights] = item.values?.[0]?.value ?? 0
    }
    return insights
  } catch {
    return {}
  }
}

export function calcEngagementRate(likes: number, comments: number, followers: number): number {
  if (followers === 0) return 0
  return Math.round(((likes + comments) / followers) * 10000) / 100
}
