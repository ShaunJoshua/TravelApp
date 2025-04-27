"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Itinerary } from "@/types"
import ItineraryDisplay from "@/components/itinerary-display"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ResultsPage() {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [source, setSource] = useState<string>("unknown")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Get the itinerary from localStorage
      const storedItinerary = localStorage.getItem("currentItinerary")
      const storedSource = localStorage.getItem("itinerarySource")

      if (storedItinerary) {
        const parsedItinerary = JSON.parse(storedItinerary)
        setItinerary(parsedItinerary)
        
        // Set the source if available
        if (storedSource) {
          setSource(storedSource)
        }
        
      } else {
        // Redirect to home if no itinerary is found
        setError("No itinerary found. Please generate a new one.")
        // Don't redirect immediately to allow the user to see the error
        setTimeout(() => router.push("/"), 3000)
      }
    } catch (err) {
      console.error("Error loading itinerary:", err)
      setError("Failed to load itinerary data. Please try again.")
    }
  }, [router])

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-4">{error}</h2>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Planner
        </Button>

        <ItineraryDisplay itinerary={itinerary} source={source} />
      </div>
    </div>
  )
}
