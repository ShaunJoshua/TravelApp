import { type NextRequest, NextResponse } from "next/server"
import { fetchLocalAttractions } from "@/lib/api-helpers"

// Define the sample attraction type
interface SampleAttraction {
  name: string;
  address: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
}

// Define the sample attractions map type
interface SampleAttractionsMap {
  [key: string]: SampleAttraction[];
}

// Sample data to use when API key is missing
const SAMPLE_ATTRACTIONS: SampleAttractionsMap = {
  "paris": [
    { name: "Eiffel Tower", address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France", category: "Landmark", latitude: 48.8584, longitude: 2.2945 },
    { name: "Louvre Museum", address: "Rue de Rivoli, 75001 Paris, France", category: "Museum", latitude: 48.8606, longitude: 2.3376 },
    { name: "Notre-Dame Cathedral", address: "6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris, France", category: "Historical Site", latitude: 48.8530, longitude: 2.3499 },
    { name: "Arc de Triomphe", address: "Place Charles de Gaulle, 75008 Paris, France", category: "Monument", latitude: 48.8738, longitude: 2.2950 },
    { name: "Montmartre", address: "75018 Paris, France", category: "District", latitude: 48.8867, longitude: 2.3431 },
  ],
  "new york": [
    { name: "Empire State Building", address: "20 W 34th St, New York, NY 10001, USA", category: "Skyscraper", latitude: 40.7484, longitude: -73.9857 },
    { name: "Central Park", address: "New York, NY, USA", category: "Park", latitude: 40.7812, longitude: -73.9665 },
    { name: "Statue of Liberty", address: "New York, NY 10004, USA", category: "Monument", latitude: 40.6892, longitude: -74.0445 },
    { name: "Times Square", address: "Manhattan, NY 10036, USA", category: "Plaza", latitude: 40.7580, longitude: -73.9855 },
    { name: "Metropolitan Museum of Art", address: "1000 5th Ave, New York, NY 10028, USA", category: "Museum", latitude: 40.7794, longitude: -73.9632 },
  ],
  "tokyo": [
    { name: "Tokyo Skytree", address: "1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japan", category: "Tower", latitude: 35.7101, longitude: 139.8107 },
    { name: "Senso-ji Temple", address: "2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan", category: "Temple", latitude: 35.7147, longitude: 139.7966 },
    { name: "Shinjuku Gyoen National Garden", address: "11 Naitomachi, Shinjuku City, Tokyo 160-0014, Japan", category: "Garden", latitude: 35.6852, longitude: 139.7100 },
    { name: "Meiji Shrine", address: "1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan", category: "Shrine", latitude: 35.6764, longitude: 139.6993 },
    { name: "Tokyo Disneyland", address: "1-1 Maihama, Urayasu, Chiba 279-0031, Japan", category: "Theme Park", latitude: 35.6329, longitude: 139.8804 },
  ]
};

/**
 * API route for fetching local attractions for a destination
 * Allows optional filtering by category
 */
export async function GET(request: NextRequest) {
  try {
    // Get the destination and optional category from the URL
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination')
    const category = searchParams.get('category') || 'attractions'
    
    if (!destination) {
      return NextResponse.json({ error: "Missing required 'destination' parameter" }, { status: 400 })
    }
    
    console.log(`Fetching local attractions for ${destination}, category: ${category}`)
    console.log("Foursquare API Key Status:", process.env.FOURSQUARE_API_KEY ? "VALID KEY PRESENT" : "NO VALID KEY")
    
    // Check if API key exists
    if (!process.env.FOURSQUARE_API_KEY) {
      console.log("No Foursquare API key found - using sample data instead")
      
      // Find sample data for the destination (case insensitive)
      const destLower = destination.toLowerCase()
      const sampleData = Object.keys(SAMPLE_ATTRACTIONS).find(key => 
        destLower.includes(key) || key.includes(destLower)
      )
      
      if (sampleData) {
        return NextResponse.json({
          destination,
          category,
          attractions: SAMPLE_ATTRACTIONS[sampleData],
          count: SAMPLE_ATTRACTIONS[sampleData].length,
          source: "sample"
        })
      } else {
        // If no matching sample data, return a default set
        const defaultAttractions = [
          { 
            name: `${destination} Main Square`, 
            address: `City Center, ${destination}`, 
            category: "Plaza", 
            latitude: null, 
            longitude: null 
          },
          { 
            name: `${destination} Historical Museum`, 
            address: `Museum District, ${destination}`, 
            category: "Museum", 
            latitude: null, 
            longitude: null 
          },
          { 
            name: `${destination} Central Park`, 
            address: `Green Zone, ${destination}`, 
            category: "Park", 
            latitude: null, 
            longitude: null 
          }
        ]
        
        return NextResponse.json({
          destination,
          category,
          attractions: defaultAttractions,
          count: defaultAttractions.length,
          source: "default"
        })
      }
    }
    
    // Get real attractions from Foursquare if API key exists
    const attractions = await fetchLocalAttractions(destination, category)
    
    // If no attractions were found, fall back to sample data
    if (attractions.length === 0) {
      console.log("No attractions found via API - falling back to sample data")
      
      const destLower = destination.toLowerCase()
      const sampleData = Object.keys(SAMPLE_ATTRACTIONS).find(key => 
        destLower.includes(key) || key.includes(destLower)
      )
      
      if (sampleData) {
        return NextResponse.json({
          destination,
          category,
          attractions: SAMPLE_ATTRACTIONS[sampleData],
          count: SAMPLE_ATTRACTIONS[sampleData].length,
          source: "sample-fallback"
        })
      }
    }
    
    // Return the real attractions
    return NextResponse.json({
      destination,
      category,
      attractions,
      count: attractions.length,
      source: "foursquare"
    })
  } catch (error: any) {
    console.error("Error in local-attractions route:", error instanceof Error ? error.message : "Unknown error")
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      {
        error: `Failed to fetch attractions: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
