import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Use Steam Store API search
    const response = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Steam API request failed")
    }

    const data = await response.json()

    const results =
      data.items?.slice(0, 10).map((item: any) => ({
        appid: item.id.toString(),
        name: item.name,
        img_icon_url: item.tiny_image, // Use the full tiny_image URL directly
        capsule_image: `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/capsule_231x87.jpg`,
      })) || []

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ results: [] })
  }
}
