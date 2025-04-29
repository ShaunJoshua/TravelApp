export const runtime = 'nodejs';

// Manually load .env.local into process.env
import fs from 'fs';
import path from 'path';
const envFilePath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) return;
    const [key, ...rest] = line.split('=');
    process.env[key.trim()] = rest.join('=').trim();
  });
}

import { type NextRequest, NextResponse } from "next/server"

import { generateMockItinerary } from "@/lib/mock-itinerary"
import { generateOpenRouterItinerary } from "@/lib/huggingface"
import type { ItineraryFormData } from "@/types"

export async function POST(request: NextRequest) {
  console.log("Debug: OPENROUTER_API_KEY present?", !!process.env.OPENROUTER_API_KEY);
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

    // Attempt OpenRouter generation
    console.log("Attempting OpenRouter generation...")
    try {
      const itinerary = await generateOpenRouterItinerary(formData)
      console.log("OpenRouter itinerary items count:", itinerary.days?.length)
      console.log("First OpenRouter activity sample:", itinerary.days?.[0]?.activities?.[0])
      console.log("Successfully generated itinerary with OpenRouter")
      return NextResponse.json({ itinerary, source: "openrouter" })
    } catch (error) {
      console.error("OpenRouter generation failed:", error)
      // Fall back to mock data
      console.log("Falling back to mock itinerary")
      const mockItinerary = generateMockItinerary(formData)
      return NextResponse.json({ 
        itinerary: mockItinerary, 
        source: "mock", 
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  } catch (error: any) {
    console.error("Error in generate-itinerary route:", error instanceof Error ? error.message : "Unknown error")
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Failed to process request: ${errorMessage}`,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
