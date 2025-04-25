import { OpenAI } from "openai"
import type { Day, Itinerary, ItineraryFormData } from "@/types"
import { addDays, format } from "date-fns"
import { generateMockItinerary } from "./mock-itinerary"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateItinerary(formData: ItineraryFormData): Promise<Itinerary> {
  const { destination, startDate, duration, preferences } = formData

  // Format preferences for the prompt
  const preferencesText = preferences.length > 0 ? preferences.join(", ") : "a variety of activities"

  // Create the prompt for OpenAI
  const prompt = `
    Create a detailed travel itinerary for a trip to ${destination} starting on ${startDate} for ${duration} days. 
    The traveler is interested in: ${preferencesText}.
    
    Include a day-by-day breakdown with the following details for each activity:
    - Activity name
    - Suggested time of day (Morning, Afternoon, Evening)
    - Short description of the activity
    
    Ensure the itinerary includes a balance of exploration, relaxation, and cultural experiences.
    
    Format your response as a JSON object with the following structure:
    {
      "days": [
        {
          "dayNumber": 1,
          "activities": [
            {
              "name": "Activity name",
              "timeOfDay": "Morning/Afternoon/Evening",
              "description": "Brief description"
            }
          ]
        }
      ]
    }
  `

  try {
    console.log("Calling OpenAI API with prompt:", prompt.substring(0, 100) + "...")

    // Call OpenAI API with more robust error handling
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Fallback to a more widely available model
      messages: [
        { role: "system", content: "You are a helpful travel planner assistant that responds only with valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    // Parse the response
    const content = response.choices[0].message.content
    if (!content) {
      console.error("No content returned from OpenAI")
      throw new Error("No content returned from OpenAI")
    }

    console.log("OpenAI response received:", content.substring(0, 100) + "...")

    // Parse the JSON response with error handling
    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content)
      throw new Error("Invalid response format from OpenAI")
    }

    // Validate the response structure
    if (!parsedResponse.days || !Array.isArray(parsedResponse.days)) {
      console.error("Invalid response structure:", parsedResponse)
      throw new Error("Invalid response structure from OpenAI")
    }

    // Generate dates for each day
    const startDateObj = new Date(startDate)
    const days: Day[] = parsedResponse.days.map((day: any) => ({
      dayNumber: day.dayNumber,
      date: format(addDays(startDateObj, day.dayNumber - 1), "yyyy-MM-dd"),
      activities: day.activities.map((activity: any, index: number) => ({
        name: activity.name,
        timeOfDay: activity.timeOfDay,
        description: activity.description,
        orderIndex: index,
      })),
    }))

    // Create the itinerary object
    return {
      destination,
      startDate,
      duration,
      days,
      preferences: [],
    }
  } catch (error) {
    console.error("Error generating itinerary with OpenAI:", error)
    console.log("Falling back to mock itinerary generator")

    // Fallback to mock itinerary generator
    return generateMockItinerary(formData)
  }
}
