import { OpenAI } from "openai"
import type { Day, Itinerary, ItineraryFormData } from "@/types"
import { addDays, format } from "date-fns"
import { generateMockItinerary } from "./mock-itinerary"
import { fetchPlaceInfo, fetchWikiSummary, fetchUnsplashPhoto, fetchFoursquareDetails } from './api-helpers'

// Initialize OpenAI client with a dummy key if not available in environment
// This prevents initialization errors, though API calls will still fail
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-initialization-only'
})

// Helper: Get travel suggestions from Hugging Face free Inference API (Claude alternative)
async function getSkeleton(destination: string, startDate: string, duration: number, preferences: string[]): Promise<any> {
  const preferencesText = preferences.length > 0 ? preferences.join(", ") : "a variety of activities"
  
  // First try to use our existing OpenAI client for skeleton generation
  try {
    const skeletonPrompt = `You are a local travel expert in ${destination} who specializes in highly personalized itineraries.
    
    Create a detailed ${duration}-day trip for someone starting on ${startDate} who specifically requested these interests: ${preferencesText}.
    
    IMPORTANT INSTRUCTIONS:
    1. DIRECTLY MATCH activities to the user's stated interests - for example:
       - If they like "museums" include actual museums
       - If they like "wildlife" include nature reserves or animal experiences
       - If they like "shopping" include markets or shopping districts
    2. Include ONLY real, specific venues and attractions in ${destination}
    3. Activities should be diverse across the trip (don't suggest same type every day)
    4. BALANCE the day with a mix of activities that match different preferences
    5. Base your selections ENTIRELY on the user's stated interests
    
    Respond ONLY with valid JSON matching this exact format:
    {
      "days": [
        {
          "dayNumber": 1,
          "activities": [
            { "name": "Real Place Name", "timeOfDay": "Morning/Afternoon/Evening" }
          ]
        }
      ]
    }`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a travel assistant that responds only with JSON skeleton." },
        { role: "user", content: skeletonPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error("No content returned")
    
    return JSON.parse(content)
  } catch (error) {
    console.error("OpenAI skeleton generation failed, trying fallback", error)
    
    // Fallback to mock skeleton if OpenAI fails
    return {
      days: Array.from({ length: duration }, (_, i) => ({
        dayNumber: i + 1,
        activities: [
          { name: `Top Museum in ${destination}`, timeOfDay: "Morning" },
          { name: `Popular Park in ${destination}`, timeOfDay: "Afternoon" },
          { name: `Famous Restaurant in ${destination}`, timeOfDay: "Evening" },
          { name: `Historic Site in ${destination}`, timeOfDay: "Afternoon" }
        ]
      }))
    }
  }
}

// Enhance an activity with location-specific details from multiple sources
async function enhanceActivity(name: string, timeOfDay: string, destination: string, idx: number, preferences: string[]): Promise<any> {
  try {
    // Try to get rich place details from Foursquare
    const fsDetails = await fetchFoursquareDetails(name, destination);
    
    // Fallback to OSM if Foursquare fails
    const place = await fetchPlaceInfo(`${name} ${destination}`)
    
    // Get Wikipedia summary for historical/cultural context
    let summary = await fetchWikiSummary(name);
    
    // Customize description based on timeOfDay and venue type
    let enhancedDescription = summary;
    if (!enhancedDescription) {
      const category = fsDetails?.categories || '';
      if (category.includes('Restaurant') || category.includes('Café')) {
        enhancedDescription = `${name} is a popular ${category.toLowerCase()} in ${destination}, known for its local cuisine. It's especially vibrant during the ${timeOfDay.toLowerCase()}.`;
      } else if (category.includes('Museum') || category.includes('Gallery')) {
        enhancedDescription = `${name} is a fascinating ${category.toLowerCase()} showcasing ${destination}'s heritage through impressive exhibits and collections.`;
      } else if (category.includes('Park') || category.includes('Garden')) {
        enhancedDescription = `${name} offers a peaceful retreat from the bustle of ${destination}, with beautiful scenery and walking paths to enjoy.`;
      } else {
        enhancedDescription = `${name} is a must-visit attraction in ${destination}, particularly enjoyable during the ${timeOfDay.toLowerCase()}.`;
      }
    }
    
    // Try to get a relevant photo
    const photoUrl = await fetchUnsplashPhoto(`${name} ${destination}`);
    
    // Create custom local tips based on venue type and time of day
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
    
    // Generate plausible transportation options based on destination
    const transportOptions = ['Walk', 'Taxi', 'Subway', 'Bus', 'Tram', 'Bike Share'];
    const transportation = transportOptions[Math.floor(Math.random() * transportOptions.length)];
    
    // Create a more plausible booking link
    const bookingLink = fsDetails?.name ? 
      `https://www.${destination.toLowerCase().replace(/\s+/g, '')}.com/visit/${name.toLowerCase().replace(/\s+/g, '-')}` : '';
    
    return {
      name,
      timeOfDay,
      description: enhancedDescription,
      location: fsDetails?.name || place.location,
      address: fsDetails?.address || place.address,
      durationMinutes: Math.floor(Math.random() * 60) + 90, // 90-150 mins
      bookingLink,
      transportation,
      categories: fsDetails?.categories || '',
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

export async function generateItinerary(formData: ItineraryFormData): Promise<Itinerary> {
  const { destination, startDate, duration, preferences: preferenceIds } = formData
  
  // Convert preference IDs to their full descriptions to give the model more context
  const DEFAULT_PREFERENCES: {[key: string]: string} = {
    "beach": "Beach vacations and coastal activities",
    "hiking": "Hiking trails and outdoor adventures",
    "nightlife": "Bars, clubs and evening entertainment",
    "museums": "Museums and art galleries",
    "food_wine": "Culinary experiences and wine tasting",
    "shopping": "Shopping districts and markets",
    "wildlife": "Animal watching and wildlife reserves",
    "photography": "Scenic spots perfect for photos",
    "adventure": "Thrilling and adventurous activities",
    "history": "Historical sites and landmarks",
    "culture": "Local traditions and cultural experiences",
    "relaxation": "Spas and wellness retreats",
    "family": "Family-friendly activities",
    "romantic": "Perfect for couples",
    "budget": "Affordable travel options"
  }
  
  // Get full preference descriptions instead of just IDs for better context
  const preferences = preferenceIds.map(id => {
    const description = DEFAULT_PREFERENCES[id] || id;
    return `${id} (${description})`;
  });

  try {
    console.log("Generating skeleton itinerary for", destination)
    
    // Get skeleton from our helper (OpenAI with fallback)
    const skeleton = await getSkeleton(destination, startDate, duration, preferences)

    console.log("Skeleton generated, enriching with details...")
    
    // Parse skeleton and enrich each activity
    const startDateObj = new Date(startDate)
    const days: Day[] = []
    for (const day of skeleton.days) {
      const date = format(addDays(startDateObj, day.dayNumber - 1), "yyyy-MM-dd")
      const activitiesPromises = day.activities.map(async (act: any, idx: number) => {
        // Use the enhanced activity function for richer details
        return enhanceActivity(act.name, act.timeOfDay, destination, idx, preferences);
      });
      
      const activities = await Promise.all(activitiesPromises);
      days.push({ dayNumber: day.dayNumber, date, activities })
    }

    // Create the itinerary object
    return { destination, startDate, duration, days, preferences }
  } catch (error) {
    console.error("Error generating itinerary:", error)
    console.log("Falling back to mock itinerary generator")

    // Fallback to mock itinerary generator
    return generateMockItinerary(formData)
  }
}
