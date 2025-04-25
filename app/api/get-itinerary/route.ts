import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Get itinerary
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select(`
        id,
        destination,
        start_date,
        duration,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single()

    if (itineraryError) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Get preferences
    const { data: preferenceLinks, error: prefLinksError } = await supabase
      .from("itinerary_preferences")
      .select("preference_id")
      .eq("itinerary_id", id)

    if (prefLinksError) {
      throw prefLinksError
    }

    let preferences = []
    if (preferenceLinks.length > 0) {
      const prefIds = preferenceLinks.map((link) => link.preference_id)
      const { data: prefsData, error: prefsError } = await supabase
        .from("preferences")
        .select("id, name, icon, description")
        .in("id", prefIds)

      if (prefsError) {
        throw prefsError
      }

      preferences = prefsData
    }

    // Get days and activities
    const { data: days, error: daysError } = await supabase
      .from("days")
      .select(`
        id,
        day_number,
        date,
        activities (
          id,
          name,
          time_of_day,
          description,
          order_index
        )
      `)
      .eq("itinerary_id", id)
      .order("day_number", { ascending: true })

    if (daysError) {
      throw daysError
    }

    // Format days and activities
    const formattedDays = days.map((day) => ({
      id: day.id,
      dayNumber: day.day_number,
      date: day.date,
      activities: day.activities
        .sort((a, b) => a.order_index - b.order_index)
        .map((activity) => ({
          id: activity.id,
          name: activity.name,
          timeOfDay: activity.time_of_day,
          description: activity.description,
          orderIndex: activity.order_index,
        })),
    }))

    return NextResponse.json({
      itinerary: {
        ...itinerary,
        startDate: itinerary.start_date,
        days: formattedDays,
        preferences,
      },
    })
  } catch (error) {
    console.error("Error fetching itinerary details:", error)
    return NextResponse.json({ error: "Failed to fetch itinerary details" }, { status: 500 })
  }
}
