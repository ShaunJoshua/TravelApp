import type { Day, Itinerary, ItineraryFormData } from "@/types"
import { addDays, format } from "date-fns"
import { fetchPlaceInfo, fetchWikiSummary, fetchUnsplashPhoto, fetchFoursquareDetails } from "."
import { generateMockItinerary } from "./mock-itinerary"
import { fetchLocalAttractions } from "@/lib/api-helpers";

// Use user-provided default OpenRouter key if process.env not set
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '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';

/**
 * Generate a travel itinerary using OpenRouter R1T Chimera model
 * Model: tngtech/openrouter-r1t-chimera:free
 */
export async function generateOpenRouterItinerary(formData: ItineraryFormData): Promise<Itinerary> {
  const { destination, startDate, duration, preferences } = formData
  const startDateObj = new Date(startDate)

  try {
    // Ground the itinerary with real popular attractions
    let attractionsListText = "";
    try {
      const topPlaces = await fetchLocalAttractions(destination);
      attractionsListText = topPlaces.map((p: any) => p.name).slice(0, 10).join(", ");
      console.log("Popular attractions for grounding:", attractionsListText);
    } catch (err) {
      console.error("Error fetching local attractions for grounding:", err);
    }

    // Create a detailed prompt for the Mixtral model
    const prompt = `<s>[INST] You are a local travel expert in ${destination} who specializes in highly personalized itineraries.
    
Create a detailed ${duration}-day trip for someone starting on ${startDate} who specifically requested these interests: ${preferences}. 

IMPORTANT: You must respond with a valid JSON object that follows this exact structure:
{
  "days": [
    {
      "day": 1,
      "date": "${format(startDateObj, "yyyy-MM-dd")}",
      "activities": [
        {
          "name": "Activity Name",
          "timeOfDay": "Morning/Afternoon/Evening",
          "description": "2-3 sentence description",
          "location": "Venue address",
          "categories": "Type of venue (e.g., museum, park, restaurant)"
        }
      ]
    }
  ]
}

For each activity, include the following fields:
- name: The real venue name
- timeOfDay: Morning, Afternoon, or Evening
- description: A brief 2-3 sentence description of the activity
- location: The venue address
- categories: The type of venue (e.g., museum, park, restaurant)

Ensure all venues are real and relevant to ${destination}.

IMPORTANT INSTRUCTIONS:
1. DIRECTLY MATCH activities to the user's stated interests
2. Include ONLY real, specific venues and attractions in ${destination}
3. Activities should be diverse across the trip
4. BALANCE the day with a mix of preferences
5. Base your selections ENTIRELY on the given interests
6. RESPOND ONLY WITH THE JSON OBJECT, NO OTHER TEXT

[/INST]</s>`

    // Print API configuration information
    console.log("=== OpenRouter R1T Chimera API CONFIGURATION ===");
    console.log("Destination:", destination);
    console.log("Duration:", duration);
    console.log("OpenRouter key in use:", OPENROUTER_KEY !== undefined);
    console.log("=== END CONFIGURATION ===");

    // Check if API key is available
    if (!OPENROUTER_KEY || OPENROUTER_KEY === 'hf_dummy_key_for_testing') {
      console.error("No valid OpenRouter API key found. Using mock data instead.");
      return generateMockItinerary(formData);
    }

    // Call OpenRouter API with Mixtral 8x7B model
    console.log("Calling OpenRouter API with prompt length:", prompt.length);
    const response = await fetch(
      `https://openrouter.ai/api/v1/chat/completions`,
      {
        headers: { 
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://travelapp.example.com",
          "X-Title": "Travel App",
          "Content-Type": "application/json" 
        },
        method: "POST",
        body: JSON.stringify({ 
          model: "tngtech/deepseek-r1t-chimera:free",
          messages: [
            { 
              "role": "user", 
              "content": prompt 
            }
          ],
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9
        })
      }
    );

    if (!response.ok) {
      console.error(`OpenRouter API Error: Status ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    console.log("Received response from OpenRouter API!");
    
    // Debug: parse and log raw response
    const result = await response.json();
    let parsedResult: any = result;
    if (Array.isArray(result) && result.length > 0) {
      parsedResult = result[0];
    }
    try {
      console.log("Raw OpenRouter response:", JSON.stringify(result).substring(0, 500));
    } catch {}
    console.log("Parsed OpenRouter result:", JSON.stringify(parsedResult).substring(0, 500));
    
    // Extract generated text
    const content = parsedResult.choices?.[0]?.message?.content;
    console.log("OpenRouter generated text:", content);

    if (!result || !content) {
      console.error("Invalid response format from OpenRouter API:", JSON.stringify(result).substring(0, 200));
      throw new Error("Invalid response format from OpenRouter API: Missing content in response");
    }
    
    console.log("Successfully parsed response from OpenRouter API!");
    
    // Isolate JSON from generated text
    let jsonText = content;
    
    // Handle code blocks in response (```json ... ```)
    if (jsonText.startsWith('```')) {
      // Remove the opening ```json or ``` tag
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '');
      // Remove the closing ``` tag if present
      jsonText = jsonText.replace(/\s*```\s*$/, '');
    }
    
    // Drop everything before the closing tag
    const parts = jsonText.split(/<\/s>\s*/);
    if (parts.length > 1) {
      jsonText = parts[parts.length - 1];
    }
    // Remove any code fences or trailing content
    jsonText = jsonText.trim();
    // Ensure JSON starts at first brace
    const braceIndex = jsonText.indexOf('{');
    if (braceIndex === -1) {
      console.error("Invalid OpenRouter generated text, no JSON object found:", content);
      throw new Error("No JSON object found in OpenRouter response");
    }
    jsonText = jsonText.substring(braceIndex);
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(jsonText);
    } catch (err) {
      console.error("Error parsing OpenRouter JSON string:", jsonText);
      throw new Error(`Failed to parse OpenRouter response as JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Validate response structure
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      throw new Error("Invalid response structure: Response is not an object");
    }

    // Support both 'days' and legacy 'itinerary' keys
    if (!Array.isArray(parsedResponse.days)) {
      if (Array.isArray(parsedResponse.itinerary)) {
        parsedResponse.days = parsedResponse.itinerary;
      } else {
        throw new Error("Invalid response structure: missing 'days' or 'itinerary' array");
      }
    }

    // Validate days array
    if (!Array.isArray(parsedResponse.days) || parsedResponse.days.length === 0) {
      throw new Error("Invalid response structure: 'days' array is empty or invalid");
    }

    // Parse and enhance the itinerary with details
    const days: Day[] = [];

    // Process each day
    for (const day of parsedResponse.days) {
      // Handle different response formats - day.day, day.dayNumber or use index
      const dayNumber = day.day || day.dayNumber || (parsedResponse.days.indexOf(day) + 1);
      const date = day.date || format(addDays(startDateObj, dayNumber - 1), "yyyy-MM-dd");
      
      const activities = day.activities.map((act: any, idx: number) => ({
        ...act,
        orderIndex: idx
      }));
      
      days.push({ dayNumber, date, activities });
    }

    // Return the complete itinerary
    return {
      destination,
      startDate, 
      duration,
      days,
      preferences,
    };
  } catch (error) {
    console.error("Error generating itinerary with OpenRouter:", error);
    console.log("Falling back to mock itinerary generator");
    
    // Fallback to mock itinerary generator
    return generateMockItinerary(formData);
  }
}

// Enhance an activity with location-specific details from multiple sources
async function enhanceActivity(name: string, timeOfDay: string, destination: string, idx: number, preferences: string[]): Promise<any> {
  try {
    // Get place info from OpenStreetMap
    const place = await fetchPlaceInfo(`${name} ${destination}`);
    
    // Get information from Wikipedia
    let summary = await fetchWikiSummary(name);
    
    // Customize description based on timeOfDay and venue type
    let enhancedDescription = summary;
    if (!enhancedDescription) {
      if (name.toLowerCase().includes("restaurant") || name.toLowerCase().includes("café") || name.toLowerCase().includes("cafe")) {
        enhancedDescription = `${name} is a popular dining spot in ${destination}, known for its local cuisine. It's especially vibrant during the ${timeOfDay.toLowerCase()}.`;
      } else if (name.toLowerCase().includes("museum") || name.toLowerCase().includes("gallery")) {
        enhancedDescription = `${name} is a fascinating cultural venue showcasing ${destination}'s heritage through impressive exhibits and collections.`;
      } else if (name.toLowerCase().includes("park") || name.toLowerCase().includes("garden")) {
        enhancedDescription = `${name} offers a peaceful retreat from the bustle of ${destination}, with beautiful scenery and walking paths to enjoy.`;
      } else {
        enhancedDescription = `${name} is a must-visit attraction in ${destination}, particularly enjoyable during the ${timeOfDay.toLowerCase()}.`;
      }
    }
    
    // Get a photo from Unsplash
    const photoUrl = await fetchUnsplashPhoto(`${name} ${destination}`);
    
    // Create custom local tips based on user interests
    let localTip = '';
    if (preferences.some(p => p.includes("photography"))) {
      if (timeOfDay === 'Morning') {
        localTip = "The morning light here creates perfect photography conditions. Bring your camera!";
      } else if (timeOfDay === 'Evening') {
        localTip = "The golden hour lighting just before sunset makes this spot a photographer's dream.";
      }
    } else if (preferences.some(p => p.includes("budget"))) {
      localTip = `${Math.random() > 0.5 ? 'Ask about discounted tickets or free entry hours.' : 'Consider purchasing a city pass for better value if visiting multiple attractions.'}`;
    } else if (preferences.some(p => p.includes("family"))) {
      localTip = "This place is particularly family-friendly, with activities for all ages.";
    } else if (timeOfDay === 'Morning') {
      localTip = `Visit early to avoid the crowds. ${Math.random() > 0.5 ? 'This place gets busy after 11am.' : 'Morning light makes for great photos here.'}`;
    } else if (timeOfDay === 'Afternoon') {
      localTip = `${Math.random() > 0.5 ? 'The ideal time to visit is 2-4pm when tour groups are less frequent.' : 'Consider booking in advance as this is a popular afternoon spot.'}`;
    } else {
      localTip = `${Math.random() > 0.5 ? 'In the evening, the atmosphere becomes more intimate and relaxed.' : 'Check their website for evening events or special hours.'}`;
    }
    
    // Generate plausible transportation options
    const transportOptions = ['Walk', 'Taxi', 'Subway', 'Bus', 'Tram', 'Bike Share'];
    const transportation = transportOptions[Math.floor(Math.random() * transportOptions.length)];
    
    // Create a plausible booking link
    const cleanName = name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
    const bookingLink = `https://www.${destination.toLowerCase().replace(/\s+/g, '')}.com/visit/${cleanName}`;
    
    return {
      name,
      timeOfDay,
      description: enhancedDescription,
      location: name,
      address: place.address || `${destination}`,
      durationMinutes: Math.floor(Math.random() * 60) + 90, // 90-150 mins
      bookingLink,
      transportation,
      categories: inferCategory(name, preferences),
      photoUrl,
      localTip,
      orderIndex: idx,
    };
  } catch (error) {
    console.error(`Error enhancing activity ${name}:`, error);
    // Return basic fallback if enhancement fails
    return {
      name,
      timeOfDay,
      description: `Enjoy ${name} during your visit to ${destination}.`,
      location: name,
      address: `${destination}`,
      durationMinutes: 120,
      bookingLink: '',
      transportation: 'Various options available',
      orderIndex: idx,
    };
  }
}

// Helper to infer a category from the place name and user preferences
function inferCategory(name: string, preferences: string[]): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('museum') || nameLower.includes('gallery')) return 'Museum/Gallery';
  if (nameLower.includes('park') || nameLower.includes('garden')) return 'Park/Garden';
  if (nameLower.includes('restaurant') || nameLower.includes('café') || nameLower.includes('cafe')) return 'Restaurant/Café';
  if (nameLower.includes('beach') || nameLower.includes('shore')) return 'Beach/Waterfront';
  if (nameLower.includes('market') || nameLower.includes('shop')) return 'Shopping';
  if (nameLower.includes('trail') || nameLower.includes('hike')) return 'Hiking/Outdoors';
  if (nameLower.includes('temple') || nameLower.includes('church') || nameLower.includes('mosque')) return 'Religious Site';
  if (nameLower.includes('monument') || nameLower.includes('memorial')) return 'Monument';
  
  // If no match found, infer from user preferences
  for (const pref of preferences) {
    if (pref.includes('museum') && nameLower.includes('history')) return 'Museum/Gallery';
    if (pref.includes('hiking') && (nameLower.includes('mountain') || nameLower.includes('peak'))) return 'Hiking/Outdoors';
    if (pref.includes('wildlife') && (nameLower.includes('zoo') || nameLower.includes('sanctuary'))) return 'Wildlife';
    if (pref.includes('shopping') && (nameLower.includes('mall') || nameLower.includes('center'))) return 'Shopping';
  }
  
  return 'Attraction';
}
