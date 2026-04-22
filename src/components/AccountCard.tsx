'use client'

import { Users, Image, Trash2, BarChart2 } from 'lucide-react'

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

interface Props {
  account: Account
  onDelete: (id: string) => void
  onAnalyze?: (id: string) => void
  onSelect: (id: string) => void
  selected: boolean
}

export default function AccountCard({ account, onDelete, onAnalyze, onSelect, selected }: Props) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all ${
        selected ? 'border-purple-500' : 'border-transparent hover:border-gray-200'
      }`}
      onClick={() => onSelect(account.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {account.profilePictureUrl ? (
            <img
              src={account.profilePictureUrl}
              alt={account.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
              {account.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">@{account.username}</p>
              {account.isCompetitor && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">競合</span>
              )}
            </div>
            {account.name && <p className="text-sm text-gray-500">{account.name}</p>}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(account.id) }}
          className="text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-gray-800">{account.followersCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Users size={10} /> フォロワー
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{account.followsCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400">フォロー中</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{account.mediaCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Image size={10} /> 投稿数
          </p>
        </div>
      </div>

      {!account.isCompetitor && onAnalyze && (
        <button
          onClick={(e) => { e.stopPropagation(); onAnalyze(account.id) }}
          className="mt-3 w-full flex items-center justify-center gap-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 py-2 rounded-lg transition-colors"
        >
          <BarChart2 size={14} />
          AI分析レポートを生成
        </button>
      )}
    </div>
  )
}
