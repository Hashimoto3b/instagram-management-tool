import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProfile, getMedia, getMediaInsights, calcEngagementRate } from '@/lib/instagram'

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { accessToken, isCompetitor = false } = body

  if (!accessToken) {
    return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 400 })
  }

  try {
    const profile = await getProfile(accessToken)

    const account = await prisma.account.upsert({
      where: { instagramId: profile.id },
      update: {
        username: profile.username,
        name: profile.name,
        biography: profile.biography,
        followersCount: profile.followers_count,
        followsCount: profile.follows_count,
        mediaCount: profile.media_count,
        profilePictureUrl: profile.profile_picture_url,
        website: profile.website,
        accessToken: isCompetitor ? null : accessToken,
        isCompetitor,
      },
      create: {
        instagramId: profile.id,
        username: profile.username,
        name: profile.name,
        biography: profile.biography,
        followersCount: profile.followers_count,
        followsCount: profile.follows_count,
        mediaCount: profile.media_count,
        profilePictureUrl: profile.profile_picture_url,
        website: profile.website,
        accessToken: isCompetitor ? null : accessToken,
        isCompetitor,
      },
    })

    if (!isCompetitor) {
      const medias = await getMedia(profile.id, accessToken, 20)
      for (const media of medias) {
        const insights = await getMediaInsights(media.id, accessToken)
        const engagementRate = calcEngagementRate(
          media.like_count ?? 0,
          media.comments_count ?? 0,
          profile.followers_count
        )
        await prisma.post.upsert({
          where: { instagramMediaId: media.id },
          update: {
            likeCount: media.like_count ?? 0,
            commentsCount: media.comments_count ?? 0,
            reach: insights.reach ?? 0,
            impressions: insights.impressions ?? 0,
            saved: insights.saved ?? 0,
            shares: insights.shares ?? 0,
            engagementRate,
          },
          create: {
            instagramMediaId: media.id,
            accountId: account.id,
            mediaType: media.media_type,
            caption: media.caption,
            mediaUrl: media.media_url,
            thumbnailUrl: media.thumbnail_url,
            permalink: media.permalink,
            timestamp: new Date(media.timestamp),
            likeCount: media.like_count ?? 0,
            commentsCount: media.comments_count ?? 0,
            reach: insights.reach ?? 0,
            impressions: insights.impressions ?? 0,
            saved: insights.saved ?? 0,
            shares: insights.shares ?? 0,
            engagementRate,
          },
        })
      }
    }

    return NextResponse.json(account)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
