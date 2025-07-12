"use client"

import type React from "react"

import { useState } from "react"
import {
  Search,
  Gamepad2,
  Trophy,
  Cloud,
  Monitor,
  Users,
  User,
  UserCheck,
  Zap,
  Calendar,
  Building,
  Building2,
  Info,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface GameResult {
  appid: string
  name: string
  header_image?: string
  capsule_image?: string
  hero_image?: string
  screenshots?: string[]
  short_description?: string
  release_date?: string
  developer?: string
  publisher?: string
  achievements?: {
    total: number
    list: Array<{
      name: string
      displayName: string
      description: string
      icon: string
      icongray: string
    }>
  } | null
  steamDeckCompatibility?: string
  steamCloud?: boolean
  categories?: string[]
  genres?: string[]
  completionRate?: number | null
  platforms?: {
    windows?: boolean
    mac?: boolean
    linux?: boolean
  }
  debug?: {
    hasStoreApiDeckData: boolean
    storeApiDeckValue: any
    detectionMethod: string
  }
}

interface SearchResult {
  appid: string
  name: string
  img_icon_url?: string
  capsule_image?: string
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  const searchGames = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const getGameInfo = async (appid: string, name: string) => {
    setLoading(true)
    setShowSuggestions(false)
    setSearchQuery(name)

    try {
      const response = await fetch(`/api/game/${appid}`)
      const data = await response.json()
      setGameResult(data)
    } catch (error) {
      console.error("Game info error:", error)
      setGameResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchResults.length > 0) {
      getGameInfo(searchResults[0].appid, searchResults[0].name)
    }
  }

  const getAchievementStatus = (game: GameResult) => {
    if (!game.achievements || !game.achievements.total || game.achievements.total === 0) {
      return { status: "No Achievements", color: "bg-red-500/90", textColor: "text-red-100", icon: "❌" }
    }
    return { status: "Has Achievements", color: "bg-green-500/90", textColor: "text-green-100", icon: "🏆" }
  }

  const getSteamDeckBadge = (compatibility?: string) => {
    switch (compatibility?.toLowerCase()) {
      case "verified":
        return { icon: "✅", text: "Verified", color: "bg-green-500/20 text-green-300 border-green-500/30" }
      case "playable":
        return { icon: "🟡", text: "Playable", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" }
      case "unsupported":
        return { icon: "❌", text: "Unsupported", color: "bg-red-500/20 text-red-300 border-red-500/30" }
      case "unknown":
      default:
        return { icon: "❓", text: "Unknown", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" }
    }
  }

  const getPlayModes = (categories?: string[]) => {
    const modes = []
    if (categories?.includes("Single-player")) modes.push({ icon: <User className="w-4 h-4" />, text: "Single-player" })
    if (categories?.includes("Multi-player")) modes.push({ icon: <Users className="w-4 h-4" />, text: "Multiplayer" })
    if (categories?.includes("Co-op")) modes.push({ icon: <UserCheck className="w-4 h-4" />, text: "Co-op" })
    return modes
  }

  const getPlatformInfo = (platforms?: { windows?: boolean; mac?: boolean; linux?: boolean }) => {
    if (!platforms) return null
    const supportedPlatforms = []
    if (platforms.windows) supportedPlatforms.push("Windows")
    if (platforms.mac) supportedPlatforms.push("Mac")
    if (platforms.linux) supportedPlatforms.push("Linux")
    return supportedPlatforms
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Achievement Hunter
            </h1>
          </div>
          <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Discover achievement status, Steam Deck compatibility, and more for your favorite Steam games
          </p>
        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto mb-12 relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search Steam games..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchGames(e.target.value)
                  }}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="pl-14 pr-6 py-6 text-lg bg-transparent border-0 text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                />
                {searching && (
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-10 max-h-80 overflow-y-auto">
                {searchResults.slice(0, 8).map((result, index) => (
                  <button
                    key={result.appid}
                    onClick={() => getGameInfo(result.appid, result.name)}
                    className={`w-full text-left px-6 py-4 hover:bg-slate-700/50 transition-colors flex items-center gap-4 ${
                      index !== searchResults.length - 1 ? "border-b border-slate-700/30" : ""
                    }`}
                  >
                    {result.capsule_image ? (
                      <img
                        src={result.capsule_image || "/placeholder.svg"}
                        alt=""
                        className="w-16 h-9 rounded-lg object-cover shadow-md flex-shrink-0"
                        onError={(e) => {
                          // Fallback to tiny image if capsule fails
                          const target = e.target as HTMLImageElement
                          target.src = result.img_icon_url || "/placeholder.svg?height=36&width=64"
                        }}
                      />
                    ) : (
                      <div className="w-16 h-9 bg-slate-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <Gamepad2 className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-white">{result.name}</div>
                      <div className="text-sm text-slate-400">App ID: {result.appid}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
              {/* Hero Banner Skeleton */}
              <div className="relative h-80">
                <Skeleton className="w-full h-full bg-slate-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <Skeleton className="h-10 w-96 mb-4 bg-slate-600" />
                  <Skeleton className="h-6 w-64 bg-slate-600" />
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-32 rounded-2xl bg-slate-700" />
                  <Skeleton className="h-32 rounded-2xl bg-slate-700" />
                  <Skeleton className="h-32 rounded-2xl bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Result */}
        {gameResult && !loading && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
              {/* Hero Banner */}
              <div className="relative h-80 overflow-hidden">
                {gameResult.hero_image || gameResult.header_image ? (
                  <>
                    <img
                      src={gameResult.hero_image || gameResult.header_image || "/placeholder.svg"}
                      alt={gameResult.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = gameResult.header_image || "/placeholder.svg?height=320&width=1200"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <Gamepad2 className="w-24 h-24 text-slate-500" />
                  </div>
                )}

                {/* Game Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-end gap-6">
                    {/* Game Capsule */}
                    <div className="flex-shrink-0">
                      <img
                        src={gameResult.capsule_image || gameResult.header_image || "/placeholder.svg"}
                        alt={gameResult.name}
                        className="w-48 h-28 object-cover rounded-xl shadow-2xl border-2 border-slate-600/50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=112&width=192"
                        }}
                      />
                    </div>

                    {/* Game Details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{gameResult.name}</h2>
                      {gameResult.short_description && (
                        <p className="text-slate-200 text-lg mb-4 line-clamp-2 drop-shadow-md">
                          {gameResult.short_description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge
                          className={`${getAchievementStatus(gameResult).color} ${getAchievementStatus(gameResult).textColor} border-0 px-4 py-2 text-sm font-semibold shadow-lg`}
                        >
                          {getAchievementStatus(gameResult).icon} {getAchievementStatus(gameResult).status}
                        </Badge>
                        {gameResult.release_date && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{gameResult.release_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Debug Toggle */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm"
                  >
                    <Info className="w-4 h-4" />
                    {showDebug ? "Hide" : "Show"} Debug Info
                  </button>
                </div>

                {/* Debug Info */}
                {showDebug && gameResult.debug && (
                  <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/30">
                    <h4 className="font-bold text-white mb-2">Debug Information</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <div>Has Store API Deck Data: {gameResult.debug.hasStoreApiDeckData ? "Yes" : "No"}</div>
                      <div>Store API Deck Value: {JSON.stringify(gameResult.debug.storeApiDeckValue)}</div>
                      <div>Detection Method: {gameResult.debug.detectionMethod}</div>
                      <div>App ID: {gameResult.appid}</div>
                    </div>
                  </div>
                )}

                {/* Developer/Publisher Info */}
                {(gameResult.developer || gameResult.publisher) && (
                  <div className="flex gap-8">
                    {gameResult.developer && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Building className="w-5 h-5" />
                        <span className="font-medium">Developer:</span>
                        <span>{gameResult.developer}</span>
                      </div>
                    )}
                    {gameResult.publisher && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium">Publisher:</span>
                        <span>{gameResult.publisher}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Achievement Details */}
                {gameResult.achievements && gameResult.achievements.total > 0 ? (
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-500/20 rounded-xl">
                        <Trophy className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Achievement Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-green-300 font-medium mb-2">Total Achievements</p>
                        <p className="text-4xl font-bold text-green-400">{gameResult.achievements.total}</p>
                      </div>
                      {gameResult.completionRate && (
                        <div className="text-center">
                          <p className="text-blue-300 font-medium mb-2">Avg. Completion Rate</p>
                          <p className="text-4xl font-bold text-blue-400">{gameResult.completionRate}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <Zap className="w-8 h-8 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">No Achievements Available</h3>
                        <p className="text-slate-300">This game doesn't support Steam achievements.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {gameResult.screenshots && gameResult.screenshots.length > 0 && (
                  <div>
                    <h4 className="font-bold text-white mb-4 text-lg">Screenshots</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {gameResult.screenshots.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot || "/placeholder.svg"}
                          alt={`${gameResult.name} screenshot ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl border border-slate-600/30 hover:border-blue-500/50 transition-colors cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Steam Deck */}
                  <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Monitor className="w-6 h-6 text-slate-300" />
                      <h4 className="font-bold text-white">Steam Deck</h4>
                    </div>
                    <Badge className={`${getSteamDeckBadge(gameResult.steamDeckCompatibility).color} border px-3 py-2`}>
                      {getSteamDeckBadge(gameResult.steamDeckCompatibility).icon}{" "}
                      {getSteamDeckBadge(gameResult.steamDeckCompatibility).text}
                    </Badge>
                    {/* Show supported platforms as additional info */}
                    {getPlatformInfo(gameResult.platforms) && (
                      <div className="mt-2 text-xs text-slate-400">
                        Platforms: {getPlatformInfo(gameResult.platforms)?.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Steam Cloud */}
                  <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Cloud className="w-6 h-6 text-slate-300" />
                      <h4 className="font-bold text-white">Steam Cloud</h4>
                    </div>
                    <Badge
                      className={`${gameResult.steamCloud ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"} border px-3 py-2`}
                    >
                      {gameResult.steamCloud ? "☁️ Supported" : "❌ Not Supported"}
                    </Badge>
                  </div>

                  {/* Play Modes */}
                  <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Gamepad2 className="w-6 h-6 text-slate-300" />
                      <h4 className="font-bold text-white">Play Modes</h4>
                    </div>
                    <div className="space-y-2">
                      {getPlayModes(gameResult.categories).length > 0 ? (
                        getPlayModes(gameResult.categories).map((mode, index) => (
                          <div key={index} className="flex items-center gap-2 text-slate-300">
                            {mode.icon}
                            <span className="text-sm">{mode.text}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm">No data available</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Genres */}
                {gameResult.genres && gameResult.genres.length > 0 && (
                  <div>
                    <h4 className="font-bold text-white mb-4 text-lg">Genres</h4>
                    <div className="flex flex-wrap gap-3">
                      {gameResult.genres.map((genre, index) => (
                        <Badge
                          key={index}
                          className="bg-slate-700/50 text-slate-200 border-slate-600/50 px-4 py-2 text-sm"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-slate-500 font-medium">Powered by Steam Web API • Developed by Jorge Perez</p>
        </div>
      </div>
    </div>
  )
}
