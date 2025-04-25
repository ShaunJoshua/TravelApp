import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Get user ID
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get itineraries
    const { data: itineraries, error: itinerariesError } = await supabase
      .from("itineraries")
      .select(`
        id,
        destination,
        start_date,
        duration,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (itinerariesError) {
      throw itinerariesError
    }

    return NextResponse.json({ itineraries })
  } catch (error) {
    console.error("Error fetching itineraries:", error)
    return NextResponse.json({ error: "Failed to fetch itineraries" }, { status: 500 })
  }
}
