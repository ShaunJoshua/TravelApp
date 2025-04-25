import type { Itinerary, ItineraryFormData } from "@/types"
import { addDays, format } from "date-fns"

// Fallback mock data in case the OpenAI API fails
export function generateMockItinerary(formData: ItineraryFormData): Itinerary {
  const { destination, startDate, duration, preferences } = formData
  const days = []
  const startDateObj = new Date(startDate)

  // Generate mock activities based on preferences
  const activityTypes = [
    {
      type: "Nature & Parks",
      activities: [
        {
          name: "Hiking in the local trails",
          description:
            "Explore the beautiful natural landscapes and hiking trails around the area. Perfect for nature enthusiasts and photographers.",
        },
        {
          name: "Visit to the Botanical Garden",
          description:
            "Discover exotic plants and flowers in this beautifully maintained garden. A peaceful retreat from the busy city.",
        },
        {
          name: "Picnic in the Central Park",
          description:
            "Enjoy a relaxing picnic surrounded by greenery. Bring some local snacks and drinks for a perfect outdoor meal.",
        },
        {
          name: "Wildlife Sanctuary Tour",
          description:
            "Observe local wildlife in their natural habitat. Guided tours available with knowledgeable naturalists.",
        },
      ],
    },
    {
      type: "Museums & History",
      activities: [
        {
          name: "National History Museum Visit",
          description:
            "Explore artifacts and exhibits showcasing the rich history of the region. Allow at least 2-3 hours for a thorough visit.",
        },
        {
          name: "Guided Tour of the Old Town",
          description:
            "Walk through historic streets with a knowledgeable guide explaining the architectural and cultural significance of landmarks.",
        },
        {
          name: "Art Gallery Exhibition",
          description:
            "View contemporary and classic art pieces from local and international artists. The gallery often rotates special exhibitions.",
        },
        {
          name: "Archaeological Site Exploration",
          description: "Discover ancient ruins and learn about the civilizations that once thrived in this area.",
        },
      ],
    },
    {
      type: "Food & Drink",
      activities: [
        {
          name: "Culinary Walking Tour",
          description:
            "Sample local delicacies while walking through food districts. A great way to taste multiple specialties in one go.",
        },
        {
          name: "Cooking Class with Local Chef",
          description:
            "Learn to prepare traditional dishes with fresh, local ingredients. Take home recipes to recreate the flavors.",
        },
        {
          name: "Wine Tasting at Regional Vineyard",
          description:
            "Sample locally produced wines with expert commentary on flavor profiles and production methods.",
        },
        {
          name: "Street Food Market Exploration",
          description: "Wander through bustling food stalls offering authentic local cuisine at affordable prices.",
        },
      ],
    },
    {
      type: "Adventure Sports",
      activities: [
        {
          name: "White Water Rafting Experience",
          description:
            "Navigate through exciting rapids with experienced guides. Suitable for beginners and advanced rafters alike.",
        },
        {
          name: "Mountain Biking on Scenic Trails",
          description:
            "Ride through challenging terrain with breathtaking views. Bikes and safety equipment available for rent.",
        },
        {
          name: "Rock Climbing Adventure",
          description:
            "Scale natural rock formations with professional instructors ensuring safety while providing an adrenaline rush.",
        },
        {
          name: "Paragliding over the Valley",
          description: "Soar through the skies and enjoy a bird's eye view of the spectacular landscape below.",
        },
      ],
    },
    {
      type: "Shopping",
      activities: [
        {
          name: "Local Artisan Market",
          description:
            "Browse handcrafted goods made by local artisans. Perfect for finding unique souvenirs and gifts.",
        },
        {
          name: "Luxury Shopping District",
          description: "Explore high-end boutiques and designer stores for premium shopping experience.",
        },
        {
          name: "Antique Shop Hopping",
          description:
            "Hunt for vintage treasures and collectibles in charming antique shops scattered throughout the old district.",
        },
        {
          name: "Farmers Market Visit",
          description: "Purchase fresh local produce, artisanal foods, and handmade crafts directly from producers.",
        },
      ],
    },
    {
      type: "Relaxation & Wellness",
      activities: [
        {
          name: "Day Spa Treatment",
          description: "Indulge in massages, facials, and body treatments using local ingredients and techniques.",
        },
        {
          name: "Yoga Session by the Beach",
          description: "Find inner peace with a guided yoga session against the soothing backdrop of waves.",
        },
        {
          name: "Hot Springs Relaxation",
          description: "Soak in natural thermal waters known for their therapeutic properties and mineral content.",
        },
        {
          name: "Meditation Retreat",
          description: "Join a guided meditation session in a tranquil setting to rejuvenate your mind and spirit.",
        },
      ],
    },
    {
      type: "Nightlife",
      activities: [
        {
          name: "Live Music at Jazz Club",
          description: "Enjoy performances by talented musicians in an intimate setting with great acoustics.",
        },
        {
          name: "Rooftop Bar with City Views",
          description: "Sip craft cocktails while taking in panoramic views of the city skyline illuminated at night.",
        },
        {
          name: "Cultural Dance Performance",
          description: "Watch traditional dance performances that tell stories of local culture and history.",
        },
        {
          name: "Night Food Market Tour",
          description: "Experience the vibrant atmosphere of night markets offering local delicacies and street food.",
        },
      ],
    },
    {
      type: "Photography Spots",
      activities: [
        {
          name: "Sunrise Photography at Scenic Overlook",
          description: "Capture the golden light of dawn illuminating the landscape from a perfect vantage point.",
        },
        {
          name: "Architectural Photography Tour",
          description: "Focus on capturing the unique architectural elements that define the city's character.",
        },
        {
          name: "Wildlife Photography Excursion",
          description:
            "Photograph local wildlife in their natural habitat with guidance from experienced nature photographers.",
        },
        {
          name: "Night Photography Session",
          description:
            "Learn techniques for capturing city lights, stars, and night scenes with long exposure photography.",
        },
      ],
    },
  ]

  // Default activities if no preferences selected
  const defaultActivities = [
    {
      name: "City Sightseeing Tour",
      description:
        "Explore the main attractions and landmarks of the city with a knowledgeable guide providing historical context.",
    },
    {
      name: "Local Cuisine Tasting",
      description:
        "Sample authentic dishes that represent the culinary traditions of the region at a well-regarded local restaurant.",
    },
    {
      name: "Cultural Heritage Site Visit",
      description: "Discover the historical and cultural significance of one of the area's most important landmarks.",
    },
    {
      name: "Scenic Nature Walk",
      description:
        "Enjoy a leisurely stroll through beautiful natural surroundings, perfect for taking in the local flora and fauna.",
    },
    {
      name: "Shopping at Local Markets",
      description: "Browse through stalls offering everything from handcrafted souvenirs to fresh local produce.",
    },
    {
      name: "Relaxation Time at Popular Beach",
      description: "Unwind on sandy shores with the sound of waves providing a peaceful backdrop for relaxation.",
    },
  ]

  // Time periods for activities
  const timePeriods = ["Morning", "Afternoon", "Evening"]

  // Generate days
  for (let i = 0; i < duration; i++) {
    const dayNumber = i + 1
    const date = format(addDays(startDateObj, i), "yyyy-MM-dd")
    const dayActivities = []

    // Generate 3 activities per day (morning, afternoon, evening)
    for (let j = 0; j < 3; j++) {
      const timeOfDay = timePeriods[j]
      const activity = getRandomActivity(timeOfDay, preferences, activityTypes, defaultActivities, destination)

      dayActivities.push({
        name: activity.name,
        timeOfDay: timeOfDay,
        description: activity.description,
        orderIndex: j,
      })
    }

    days.push({
      dayNumber,
      date,
      activities: dayActivities,
    })
  }

  return {
    destination,
    startDate,
    duration,
    days,
    preferences: [],
  }
}

// Helper function to get a random activity based on preferences
function getRandomActivity(
  timeOfDay: string,
  preferences: string[],
  activityTypes: { type: string; activities: { name: string; description: string }[] }[],
  defaultActivities: { name: string; description: string }[],
  destination: string,
): { name: string; description: string } {
  // If no preferences, use default activities
  if (!preferences.length) {
    const randomIndex = Math.floor(Math.random() * defaultActivities.length)
    const activity = defaultActivities[randomIndex]
    return {
      name: activity.name + ` in ${destination}`,
      description: activity.description,
    }
  }

  // Get a random preference type
  const randomPrefIndex = Math.floor(Math.random() * preferences.length)
  const prefType = preferences[randomPrefIndex]

  // Find matching activity type
  const matchingType = activityTypes.find((type) => type.type === prefType)

  if (matchingType) {
    const randomActivityIndex = Math.floor(Math.random() * matchingType.activities.length)
    const activity = matchingType.activities[randomActivityIndex]
    return {
      name: activity.name + ` in ${destination}`,
      description: activity.description,
    }
  }

  // Fallback to default activities
  const randomIndex = Math.floor(Math.random() * defaultActivities.length)
  const activity = defaultActivities[randomIndex]
  return {
    name: activity.name + ` in ${destination}`,
    description: activity.description,
  }
}
