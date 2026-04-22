import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      posts: { orderBy: { timestamp: 'desc' }, take: 20 },
      reports: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(account)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.post.deleteMany({ where: { accountId: id } })
  await prisma.report.deleteMany({ where: { accountId: id } })
  await prisma.account.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
