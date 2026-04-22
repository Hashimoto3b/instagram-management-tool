import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export interface AnalysisInput {
  username: string
  followersCount: number
  mediaCount: number
  posts: {
    mediaType: string
    caption?: string
    likeCount: number
    commentsCount: number
    engagementRate: number
    timestamp: string
  }[]
  competitorData?: {
    username: string
    followersCount: number
    posts: {
      mediaType: string
      caption?: string
      likeCount: number
      commentsCount: number
    }[]
  }[]
}

export async function analyzeAccount(input: AnalysisInput): Promise<string> {
  const prompt = `
あなたはInstagramマーケティングの専門家です。以下のデータを分析して、日本語で詳細なレポートを作成してください。

## 自社アカウント情報
- ユーザー名: @${input.username}
- フォロワー数: ${input.followersCount.toLocaleString()}人
- 投稿数: ${input.mediaCount}件

## 最近の投稿パフォーマンス（上位20件）
${input.posts.map((p, i) => `
${i + 1}. ${p.mediaType} | ${new Date(p.timestamp).toLocaleDateString('ja-JP')}
   いいね: ${p.likeCount} / コメント: ${p.commentsCount} / エンゲージメント率: ${p.engagementRate}%
   キャプション冒頭: ${p.caption?.slice(0, 80) ?? '(なし)'}
`).join('')}

${input.competitorData && input.competitorData.length > 0 ? `
## 競合アカウント情報
${input.competitorData.map(c => `
### @${c.username}（フォロワー: ${c.followersCount.toLocaleString()}人）
投稿例:
${c.posts.slice(0, 5).map(p => `  - ${p.mediaType}: いいね ${p.likeCount} / コメント ${p.commentsCount}`).join('\n')}
`).join('')}
` : ''}

以下の項目を含む分析レポートを作成してください：

1. **現状分析サマリー** - エンゲージメント率の評価、強みと弱み
2. **コンテンツ傾向分析** - どの投稿タイプ・テーマが好まれているか
3. **投稿時間の分析** - 反応が良い時間帯・曜日
4. **改善提案（5つ）** - 具体的なアクション項目
5. **ハッシュタグ戦略** - 推奨ハッシュタグカテゴリ
${input.competitorData ? '6. **競合比較・ギャップ分析** - 競合が成功している要素と自社の差分' : ''}
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export interface ContentGenerationInput {
  accountUsername: string
  followersCount: number
  theme: string
  targetAudience?: string
  style?: string
  analysisContext?: string
}

export async function generateContent(input: ContentGenerationInput): Promise<{
  captions: string[]
  hashtags: string[]
  imageIdeas: string[]
}> {
  const prompt = `
あなたはInstagramコンテンツ専門のクリエイターです。以下の条件で投稿コンテンツを生成してください。

## アカウント情報
- ユーザー名: @${input.accountUsername}
- フォロワー数: ${input.followersCount.toLocaleString()}人
- 投稿テーマ: ${input.theme}
- ターゲット: ${input.targetAudience ?? '一般ユーザー'}
- スタイル: ${input.style ?? 'プロフェッショナル'}
${input.analysisContext ? `\n## 分析コンテキスト\n${input.analysisContext}` : ''}

以下を生成してください。必ずJSON形式のみで返してください（説明文は不要）：

{
  "captions": [
    "キャプション案1（改行あり、ハッシュタグなし、200字程度）",
    "キャプション案2",
    "キャプション案3"
  ],
  "hashtags": [
    "#ハッシュタグ1",
    "#ハッシュタグ2"
  ],
  "imageIdeas": [
    "画像・動画案1の詳細説明",
    "画像・動画案2の詳細説明",
    "画像・動画案3の詳細説明"
  ]
}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { captions: [], hashtags: [], imageIdeas: [] }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return { captions: [], hashtags: [], imageIdeas: [] }
  }
}
