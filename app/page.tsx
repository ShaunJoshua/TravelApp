import type { Metadata } from "next"
import ItineraryForm from "@/components/itinerary-form"

export const metadata: Metadata = {
  title: "Travel Planner - Create Your Perfect Itinerary",
  description: "Generate personalized travel itineraries based on your preferences and travel dates.",
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">AI Travel Planner</h1>
          <p className="mt-3 text-xl text-gray-600">Create your perfect travel itinerary in seconds</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <ItineraryForm />
        </div>
      </div>
    </div>
  )
}
