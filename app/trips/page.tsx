import type { Metadata } from "next"
import SavedItineraries from "@/components/saved-itineraries"

export const metadata: Metadata = {
  title: "Your Saved Trips - Travel Planner",
  description: "View and manage your saved travel itineraries.",
}

export default function TripsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Your Saved Trips</h1>
          <p className="mt-3 text-xl text-gray-600">View and manage your saved travel itineraries</p>
        </div>

        <SavedItineraries />
      </div>
    </div>
  )
}
