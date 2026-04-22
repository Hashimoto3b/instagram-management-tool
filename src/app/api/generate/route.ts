import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const { accountId, theme, targetAudience, style } = await req.json()

  if (!theme) {
    return NextResponse.json({ error: 'テーマが必要です' }, { status: 400 })
  }

  let account = null
  let latestReport = null

  if (accountId) {
    account = await prisma.account.findUnique({ where: { id: accountId } })
    latestReport = await prisma.report.findFirst({
      where: { accountId, type: 'analysis' },
      orderBy: { createdAt: 'desc' },
    })
  }

  try {
    const result = await generateContent({
      accountUsername: account?.username ?? 'your_account',
      followersCount: account?.followersCount ?? 0,
      theme,
      targetAudience,
      style,
      analysisContext: latestReport?.content?.slice(0, 500),
    })

    const saved = await prisma.generatedContent.create({
      data: {
        accountId: accountId ?? null,
        theme,
        caption: result.captions[0] ?? '',
        hashtags: result.hashtags.join(' '),
        imageIdea: result.imageIdeas[0],
      },
    })

    return NextResponse.json({ ...result, savedId: saved.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const contents = await prisma.generatedContent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(contents)
}
