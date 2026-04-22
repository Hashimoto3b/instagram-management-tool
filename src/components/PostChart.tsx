'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface Post {
  timestamp: string
  likeCount: number
  commentsCount: number
  engagementRate: number
  mediaType: string
}

interface Props {
  posts: Post[]
}

export default function PostChart({ posts }: Props) {
  const chartData = [...posts]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((p) => ({
      date: new Date(p.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      いいね: p.likeCount,
      コメント: p.commentsCount,
      エンゲージメント率: p.engagementRate,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">いいね・コメント推移</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="いいね" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="コメント" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">エンゲージメント率推移 (%)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}%`, 'エンゲージメント率']} />
            <Line
              type="monotone"
              dataKey="エンゲージメント率"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
