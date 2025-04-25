import { type NextRequest, NextResponse } from "next/server"
import { generateMockItinerary } from "@/lib/mock-itinerary"
import type { ItineraryFormData } from "@/types"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let formData: ItineraryFormData
    try {
      formData = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    // Validate the request
    if (!formData.destination || !formData.startDate || !formData.duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Generating itinerary for:", formData.destination)

    // Skip OpenAI and use mock data directly to avoid API issues
    const mockItinerary = generateMockItinerary(formData)

    return NextResponse.json({
      itinerary: mockItinerary,
      source: "mock", // Indicate this is mock data
    })
  } catch (error: any) {
    console.error("Error in generate-itinerary route:", error)
    // Ensure we always return a valid JSON response
    return NextResponse.json(
      {
        error: `Failed to process request: ${error.message}`,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
