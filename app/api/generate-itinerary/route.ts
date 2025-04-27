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
import { generateItinerary } from "@/lib/openai"
import { generateOpenRouterItinerary } from "@/lib/huggingface"
import type { ItineraryFormData } from "@/types"

export async function POST(request: NextRequest) {
  console.log("Debug: OPENROUTER_API_KEY present?", !!process.env.OPENROUTER_API_KEY, "OPENAI_API_KEY present?", !!process.env.OPENAI_API_KEY);
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

    // Track success of each API path
    let hfSuccess = false;
    let openaiSuccess = false;
    // Attempt Hugging Face generation
    console.log("Attempting OpenRouter generation...")
    try {
      const hfItinerary = await generateOpenRouterItinerary(formData)
      hfSuccess = true;
      console.log("OpenRouter itinerary items count:", hfItinerary.days?.length)
      console.log("First OpenRouter activity sample:", hfItinerary.days?.[0]?.activities?.[0])
      console.log("Successfully generated itinerary with OpenRouter")
      return NextResponse.json({ itinerary: hfItinerary, source: "openrouter" })
    } catch (hfError) {
      console.error("OpenRouter generation failed:", hfError)
    }

    // Attempt OpenAI fallback if key present
    if (process.env.OPENAI_API_KEY) {
      console.log("Attempting OpenAI fallback...")
      try {
        const itinerary = await generateItinerary(formData)
        openaiSuccess = true;
        console.log("OpenAI itinerary items count:", itinerary.days?.length)
        console.log("First OpenAI activity sample:", itinerary.days?.[0]?.activities?.[0])
        return NextResponse.json({ itinerary, source: "openai" })
      } catch (openaiError) {
        console.error("OpenAI fallback failed:", openaiError)
      }
    }

    // All API attempts failed, return mock
    console.log("OpenRouter success?", hfSuccess, "OpenAI success?", openaiSuccess)
    console.log("Using mock itinerary now")
    const mockItinerary = generateMockItinerary(formData)
    return NextResponse.json({ itinerary: mockItinerary, source: "mock", error: "All API calls failed" })
  } catch (error: any) {
    console.error("Error in generate-itinerary route:", error instanceof Error ? error.message : "Unknown error")
    // Cast to any to safely access message property or provide fallback
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Ensure we always return a valid JSON response
    return NextResponse.json(
      {
        error: `Failed to process request: ${errorMessage}`,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
