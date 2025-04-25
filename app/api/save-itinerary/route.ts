import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { itinerary, email } = await request.json()
    const supabase = getServerClient()

    // Create or get user
    let userId
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (userError) {
      // User doesn't exist, create a new one
      const { data: newUser, error: createError } = await supabase.from("users").insert({ email }).select("id").single()

      if (createError) {
        throw createError
      }
      userId = newUser.id
    } else {
      userId = existingUser.id
    }

    // Insert the itinerary
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .insert({
        user_id: userId,
        destination: itinerary.destination,
        start_date: itinerary.startDate,
        duration: itinerary.duration,
      })
      .select("id")
      .single()

    if (itineraryError) {
      throw itineraryError
    }

    const itineraryId = itineraryData.id

    // Insert preferences
    if (itinerary.preferences && itinerary.preferences.length > 0) {
      const preferenceLinks = itinerary.preferences.map((prefId: string) => ({
        itinerary_id: itineraryId,
        preference_id: prefId,
      }))

      const { error: prefError } = await supabase.from("itinerary_preferences").insert(preferenceLinks)

      if (prefError) {
        throw prefError
      }
    }

    // Insert days and activities
    for (const day of itinerary.days) {
      const { data: dayData, error: dayError } = await supabase
        .from("days")
        .insert({
          itinerary_id: itineraryId,
          day_number: day.dayNumber,
          date: day.date,
        })
        .select("id")
        .single()

      if (dayError) {
        throw dayError
      }

      const dayId = dayData.id

      // Insert activities
      const activities = day.activities.map((activity, index) => ({
        day_id: dayId,
        name: activity.name,
        time_of_day: activity.timeOfDay,
        description: activity.description,
        order_index: activity.orderIndex || index,
      }))

      const { error: activitiesError } = await supabase.from("activities").insert(activities)

      if (activitiesError) {
        throw activitiesError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Itinerary saved successfully",
      itineraryId,
    })
  } catch (error) {
    console.error("Error saving itinerary:", error)
    return NextResponse.json({ error: "Failed to save itinerary" }, { status: 500 })
  }
}
