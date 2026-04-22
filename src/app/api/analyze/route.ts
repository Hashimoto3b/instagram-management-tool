import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeAccount } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const { accountId } = await req.json()

  if (!accountId) {
    return NextResponse.json({ error: 'accountIdが必要です' }, { status: 400 })
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { posts: { orderBy: { timestamp: 'desc' }, take: 20 } },
  })

  if (!account) {
    return NextResponse.json({ error: 'アカウントが見つかりません' }, { status: 404 })
  }

  const competitors = await prisma.account.findMany({
    where: { isCompetitor: true },
    include: { posts: { orderBy: { likeCount: 'desc' }, take: 10 } },
  })

  try {
    const analysisText = await analyzeAccount({
      username: account.username,
      followersCount: account.followersCount,
      mediaCount: account.mediaCount,
      posts: account.posts.map((p) => ({
        mediaType: p.mediaType,
        caption: p.caption ?? undefined,
        likeCount: p.likeCount,
        commentsCount: p.commentsCount,
        engagementRate: p.engagementRate,
        timestamp: p.timestamp.toISOString(),
      })),
      competitorData: competitors.map((c) => ({
        username: c.username,
        followersCount: c.followersCount,
        posts: c.posts.map((p) => ({
          mediaType: p.mediaType,
          caption: p.caption ?? undefined,
          likeCount: p.likeCount,
          commentsCount: p.commentsCount,
        })),
      })),
    })

    const report = await prisma.report.create({
      data: {
        accountId: account.id,
        type: 'analysis',
        content: analysisText,
      },
    })

    return NextResponse.json({ report, content: analysisText })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
