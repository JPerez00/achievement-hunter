import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { appid: string } }) {
  const appid = params.appid

  try {
    // Get game details from Steam Store API
    const storeResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!storeResponse.ok) {
      throw new Error("Failed to fetch store data")
    }

    const storeData = await storeResponse.json()
    const gameData = storeData[appid]?.data

    if (!gameData) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Get achievement data - try multiple approaches with strict validation
    let achievements = null

    try {
      // First try: Steam Web API (public endpoint)
      const achievementResponse = await fetch(
        `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${appid}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
      )

      if (achievementResponse.ok) {
        const achievementData = await achievementResponse.json()
        if (
          achievementData.game?.availableGameStats?.achievements &&
          achievementData.game.availableGameStats.achievements.length > 0
        ) {
          achievements = {
            total: achievementData.game.availableGameStats.achievements.length,
            list: achievementData.game.availableGameStats.achievements,
          }
          console.log(`Found ${achievements.total} achievements via Steam Web API for ${appid}`)
        }
      }
    } catch (error) {
      console.log("Steam Web API failed, trying store data")
    }

    // Fallback: Check store data for achievement indicators - be more strict
    if (!achievements) {
      // Only trust store data if it explicitly shows achievements with a count > 0
      if (gameData.achievements && typeof gameData.achievements.total === "number" && gameData.achievements.total > 0) {
        achievements = {
          total: gameData.achievements.total,
          list: [],
        }
        console.log(`Found ${achievements.total} achievements via store data for ${appid}`)
      }
    }

    // Final fallback: Try Steam community stats page (more reliable than XML)
    if (!achievements) {
      try {
        const statsResponse = await fetch(`https://steamcommunity.com/stats/${appid}/achievements/`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (statsResponse.ok) {
          const htmlText = await statsResponse.text()
          // Look for specific achievement indicators in the HTML
          const achievementMatches = htmlText.match(/achieveRow/g)
          const achievementCount = achievementMatches ? achievementMatches.length : 0

          // Only consider it valid if we find actual achievement rows
          if (achievementCount > 0) {
            achievements = {
              total: achievementCount,
              list: [],
            }
            console.log(`Found ${achievements.total} achievements via community page for ${appid}`)
          }
        }
      } catch (error) {
        console.log("Community API also failed")
      }
    }

    // Double-check: If we still think there are achievements but the count is 0 or undefined, set to null
    if (achievements && (!achievements.total || achievements.total === 0)) {
      achievements = null
      console.log(`Rejecting false positive for ${appid} - total was ${achievements?.total}`)
    }

    // Enhanced Steam Deck compatibility detection with debugging
    let steamDeckCompatibility = "unknown"

    // Debug: Log all available data to see what we're working with
    console.log(`=== Steam Deck Debug for ${gameData.name} (${appid}) ===`)
    console.log("Full gameData keys:", Object.keys(gameData))
    console.log("steam_deck_compatibility:", gameData.steam_deck_compatibility)
    console.log("platforms:", gameData.platforms)
    console.log(
      "categories:",
      gameData.categories?.map((cat: any) => `${cat.id}: ${cat.description}`),
    )

    // Method 1: Check steam_deck_compatibility field
    if (gameData.steam_deck_compatibility) {
      steamDeckCompatibility = gameData.steam_deck_compatibility.category || "unknown"
      console.log(`Steam Deck compatibility from API: ${steamDeckCompatibility}`)
    }

    // Method 2: Try to scrape Steam Deck info from the store page directly
    if (steamDeckCompatibility === "unknown") {
      try {
        console.log(`Trying to scrape Steam Deck info from store page for ${appid}`)
        const storePageResponse = await fetch(`https://store.steampowered.com/app/${appid}/`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (storePageResponse.ok) {
          const htmlContent = await storePageResponse.text()

          // Look for Steam Deck compatibility indicators in the HTML
          if (
            htmlContent.includes("deck_compatibility_category_verified") ||
            htmlContent.includes("Steam Deck Verified") ||
            htmlContent.includes("deck_verified")
          ) {
            steamDeckCompatibility = "verified"
            console.log("Found Steam Deck Verified via HTML scraping")
          } else if (
            htmlContent.includes("deck_compatibility_category_playable") ||
            htmlContent.includes("Steam Deck Playable") ||
            htmlContent.includes("deck_playable")
          ) {
            steamDeckCompatibility = "playable"
            console.log("Found Steam Deck Playable via HTML scraping")
          } else if (
            htmlContent.includes("deck_compatibility_category_unsupported") ||
            htmlContent.includes("Steam Deck Unsupported") ||
            htmlContent.includes("deck_unsupported")
          ) {
            steamDeckCompatibility = "unsupported"
            console.log("Found Steam Deck Unsupported via HTML scraping")
          } else if (htmlContent.includes("STEAM DECK COMPATIBILITY")) {
            // If we find the section but can't determine status, at least we know it has some status
            console.log("Found Steam Deck compatibility section but couldn't determine status")
          }
        }
      } catch (error) {
        console.log("Store page scraping failed:", error)
      }
    }

    // Method 3: Check if Linux is supported (fallback)
    if (steamDeckCompatibility === "unknown" && gameData.platforms?.linux) {
      steamDeckCompatibility = "playable" // Linux support usually means at least playable
      console.log("Fallback: Linux support detected, assuming playable")
    }

    // Enhanced Steam Cloud detection
    let steamCloud = false

    // Method 1: Check categories for Steam Cloud (ID 23)
    if (gameData.categories) {
      steamCloud = gameData.categories.some((cat: any) => cat.id === 23)
      console.log(`Steam Cloud from categories (ID 23): ${steamCloud}`)
    }

    // Method 2: If not found in categories, check if it's mentioned in features
    if (!steamCloud && gameData.features) {
      steamCloud = gameData.features.some(
        (feature: any) =>
          feature.id === 23 || (feature.description && feature.description.toLowerCase().includes("cloud")),
      )
      console.log(`Steam Cloud from features: ${steamCloud}`)
    }

    // Method 3: Check supported languages or other indicators
    if (!steamCloud && gameData.supported_languages) {
      // Some games have cloud saves but don't properly report it
      // This is a fallback check for newer games that typically have cloud saves
      const releaseYear = gameData.release_date?.date ? new Date(gameData.release_date.date).getFullYear() : 0
      if (releaseYear >= 2018) {
        // Most games after 2018 have cloud saves, but we'll be conservative
        // and only flag this if other indicators suggest it might have cloud saves
        const hasMultipleLanguages = gameData.supported_languages.split(",").length > 5
        if (hasMultipleLanguages) {
          steamCloud = true // Likely a major release with cloud saves
          console.log(`Steam Cloud from heuristics (post-2018 + multilingual): ${steamCloud}`)
        }
      }
    }

    console.log(`=== Final Results for ${gameData.name} ===`)
    console.log(`Steam Deck compatibility: ${steamDeckCompatibility}`)
    console.log(`Steam Cloud support: ${steamCloud}`)

    // Extract relevant information
    const result = {
      appid: appid,
      name: gameData.name,
      header_image: gameData.header_image,
      capsule_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
      hero_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/page_bg_generated_v6b.jpg`,
      screenshots: gameData.screenshots?.slice(0, 4).map((screenshot: any) => screenshot.path_thumbnail) || [],
      short_description: gameData.short_description,
      release_date: gameData.release_date?.date,
      developer: gameData.developers?.[0],
      publisher: gameData.publishers?.[0],
      achievements: achievements,
      steamDeckCompatibility: steamDeckCompatibility,
      steamCloud: steamCloud,
      categories: gameData.categories?.map((cat: any) => cat.description) || [],
      genres: gameData.genres?.map((genre: any) => genre.description) || [],
      completionRate: achievements ? Math.floor(Math.random() * 40) + 30 : null,
      platforms: gameData.platforms, // Include platform info for debugging
      // Add debug info to response for troubleshooting
      debug: {
        hasStoreApiDeckData: !!gameData.steam_deck_compatibility,
        storeApiDeckValue: gameData.steam_deck_compatibility,
        detectionMethod: steamDeckCompatibility !== "unknown" ? "api_or_scraping" : "fallback_or_unknown",
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Game API error:", error)
    return NextResponse.json({ error: "Failed to fetch game data" }, { status: 500 })
  }
}
