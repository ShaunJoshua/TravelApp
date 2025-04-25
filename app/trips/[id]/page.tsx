"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Itinerary, Preference } from "@/types"
import ItineraryDisplay from "@/components/itinerary-display"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function TripDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItinerary() {
      if (!id) return

      try {
        const response = await fetch(`/api/get-itinerary?id=${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch itinerary")
        }

        const data = await response.json()
        setItinerary(data.itinerary)
        setPreferences(data.itinerary.preferences || [])
      } catch (err) {
        console.error("Error fetching itinerary:", err)
        setError("Failed to load the itinerary. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItinerary()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading itinerary...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error || "Itinerary not found"}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/trips")}>
              Back to Trips
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/trips")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trips
        </Button>

        <ItineraryDisplay itinerary={itinerary} preferences={preferences} />
      </div>
    </div>
  )
}
