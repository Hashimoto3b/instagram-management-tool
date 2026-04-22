'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Sparkles, FileText, Camera, RefreshCw, Copy, Check } from 'lucide-react'
// Camera icon is used as substitute for Instagram icon (not available in lucide-react)
import AccountCard from '@/components/AccountCard'
import PostChart from '@/components/PostChart'

interface Account {
  id: string
  username: string
  name?: string
  followersCount: number
  followsCount: number
  mediaCount: number
  profilePictureUrl?: string
  biography?: string
  isCompetitor: boolean
}

interface Post {
  id: string
  mediaType: string
  caption?: string
  likeCount: number
  commentsCount: number
  engagementRate: number
  timestamp: string
  permalink?: string
}

interface AccountDetail extends Account {
  posts: Post[]
  reports: { id: string; content: string; createdAt: string }[]
}

type Tab = 'dashboard' | 'content'

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addToken, setAddToken] = useState('')
  const [addIsCompetitor, setAddIsCompetitor] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')
  const [generateTheme, setGenerateTheme] = useState('')
  const [generateAudience, setGenerateAudience] = useState('')
  const [generateStyle, setGenerateStyle] = useState('プロフェッショナル')
  const [generatedContent, setGeneratedContent] = useState<{
    captions: string[]
    hashtags: string[]
    imageIdeas: string[]
  } | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState('')

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/accounts')
    const data = await res.json()
    setAccounts(data)
  }, [])

  const fetchAccountDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/accounts/${id}`)
    const data = await res.json()
    setAccountDetail(data)
    if (data.reports?.[0]) {
      setAnalysisResult(data.reports[0].content)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountDetail(selectedAccountId)
    }
  }, [selectedAccountId, fetchAccountDetail])

  const handleAddAccount = async () => {
    if (!addToken.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: addToken, isCompetitor: addIsCompetitor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchAccounts()
      setShowAddModal(false)
      setAddToken('')
      setSelectedAccountId(data.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このアカウントを削除しますか？')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    await fetchAccounts()
    if (selectedAccountId === id) {
      setSelectedAccountId(null)
      setAccountDetail(null)
    }
  }

  const handleAnalyze = async (id: string) => {
    setAnalyzing(true)
    setAnalysisResult('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysisResult(data.content)
      setTab('dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI分析エラー')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!generateTheme.trim()) return
    setGenerating(true)
    setGeneratedContent(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          theme: generateTheme,
          targetAudience: generateAudience,
          style: generateStyle,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedContent(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コンテンツ生成エラー')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const myAccounts = accounts.filter((a) => !a.isCompetitor)
  const competitors = accounts.filter((a) => a.isCompetitor)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
              <Camera className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Camera統合管理ツール</h1>
              <p className="text-xs text-gray-400">AI powered by Claude</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            アカウント追加
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-72 space-y-4 shrink-0">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">自社アカウント</h2>
            {myAccounts.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                <Camera className="mx-auto text-gray-300 mb-2" size={28} />
                <p className="text-sm text-gray-400">アカウントを追加してください</p>
              </div>
            ) : (
              myAccounts.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onDelete={handleDelete}
                  onAnalyze={handleAnalyze}
                  onSelect={setSelectedAccountId}
                  selected={selectedAccountId === acc.id}
                />
              ))
            )}
          </div>

          {competitors.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">競合アカウント</h2>
              {competitors.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onDelete={handleDelete}
                  onSelect={setSelectedAccountId}
                  selected={selectedAccountId === acc.id}
                />
              ))}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {!selectedAccountId ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Camera className="mx-auto text-gray-200 mb-4" size={56} />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">アカウントを選択してください</h2>
              <p className="text-gray-400 text-sm">左のサイドバーからアカウントを追加・選択してください</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTab('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'dashboard'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <FileText size={14} />
                  ダッシュボード
                </button>
                <button
                  onClick={() => setTab('content')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'content'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Sparkles size={14} />
                  コンテンツ生成
                </button>
              </div>

              {tab === 'dashboard' && accountDetail && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'フォロワー', value: accountDetail.followersCount.toLocaleString() },
                      {
                        label: '平均いいね',
                        value:
                          accountDetail.posts.length > 0
                            ? Math.round(
                                accountDetail.posts.reduce((s, p) => s + p.likeCount, 0) / accountDetail.posts.length
                              ).toLocaleString()
                            : '—',
                      },
                      {
                        label: '平均エンゲージメント率',
                        value:
                          accountDetail.posts.length > 0
                            ? `${(
                                accountDetail.posts.reduce((s, p) => s + p.engagementRate, 0) /
                                accountDetail.posts.length
                              ).toFixed(2)}%`
                            : '—',
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  {accountDetail.posts.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <h2 className="font-semibold text-gray-700 mb-4">投稿パフォーマンス</h2>
                      <PostChart posts={accountDetail.posts} />
                    </div>
                  )}

                  {/* AI Analysis */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-700">AI分析レポート</h2>
                      <button
                        onClick={() => handleAnalyze(selectedAccountId)}
                        disabled={analyzing}
                        className="flex items-center gap-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={analyzing ? 'animate-spin' : ''} />
                        {analyzing ? '分析中...' : '再分析'}
                      </button>
                    </div>
                    {analyzing ? (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        <RefreshCw className="animate-spin mx-auto mb-2" size={20} />
                        AIが分析中です...（1〜2分かかります）
                      </div>
                    ) : analysisResult ? (
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {analysisResult}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        <Sparkles className="mx-auto mb-2 text-gray-300" size={24} />
                        「AI分析レポートを生成」ボタンを押して分析を開始してください
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'content' && (
                <div className="space-y-4">
                  {/* Generate Form */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-700 mb-4">投稿コンテンツを生成</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">投稿テーマ <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={generateTheme}
                          onChange={(e) => setGenerateTheme(e.target.value)}
                          placeholder="例: 新商品のPR、夏のキャンペーン、ライフスタイル提案"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">ターゲット層</label>
                          <input
                            type="text"
                            value={generateAudience}
                            onChange={(e) => setGenerateAudience(e.target.value)}
                            placeholder="例: 20〜30代女性"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">スタイル</label>
                          <select
                            value={generateStyle}
                            onChange={(e) => setGenerateStyle(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          >
                            <option>プロフェッショナル</option>
                            <option>カジュアル・親しみやすい</option>
                            <option>エモーショナル・共感型</option>
                            <option>情報発信・教育型</option>
                            <option>エンタメ・ユーモア型</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleGenerate}
                        disabled={generating || !generateTheme.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Sparkles size={15} />
                        {generating ? 'AI生成中...' : 'コンテンツを生成する'}
                      </button>
                    </div>
                  </div>

                  {/* Generated Results */}
                  {generatedContent && (
                    <div className="space-y-4">
                      {/* Captions */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-700 mb-3">キャプション案</h3>
                        <div className="space-y-3">
                          {generatedContent.captions.map((caption, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-3 relative group">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">{caption}</p>
                              <button
                                onClick={() => copyToClipboard(caption, i)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-purple-500"
                              >
                                {copiedIndex === i ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-700">ハッシュタグ（{generatedContent.hashtags.length}個）</h3>
                          <button
                            onClick={() => copyToClipboard(generatedContent.hashtags.join(' '), 99)}
                            className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                          >
                            {copiedIndex === 99 ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            一括コピー
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-purple-50 text-purple-600 text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-purple-100"
                              onClick={() => copyToClipboard(tag, 100 + i)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Image Ideas */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-700 mb-3">画像・動画案</h3>
                        <div className="space-y-2">
                          {generatedContent.imageIdeas.map((idea, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded-full shrink-0">
                                案{i + 1}
                              </span>
                              <p className="text-sm text-gray-700">{idea}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm">
          <p>{error}</p>
          <button onClick={() => setError('')} className="ml-2 underline text-xs">閉じる</button>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">アカウントを追加</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Camera アクセストークン</label>
                <input
                  type="password"
                  value={addToken}
                  onChange={(e) => setAddToken(e.target.value)}
                  placeholder="EAAxxxxxxx..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <p className="text-xs text-gray-400 mt-1">Meta for Developers でアクセストークンを取得してください</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCompetitor"
                  checked={addIsCompetitor}
                  onChange={(e) => setAddIsCompetitor(e.target.checked)}
                  className="accent-purple-500"
                />
                <label htmlFor="isCompetitor" className="text-sm text-gray-600">競合アカウントとして追加</label>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowAddModal(false); setError('') }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddAccount}
                disabled={loading || !addToken.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '取得中...' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
