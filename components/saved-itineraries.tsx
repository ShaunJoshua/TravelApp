"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin, Calendar, Clock } from "lucide-react"

interface SavedItinerary {
  id: string
  destination: string
  start_date: string
  duration: number
  created_at: string
}

export default function SavedItineraries() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItineraries = async () => {
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/get-itineraries?email=${encodeURIComponent(email)}`)

      if (!response.ok) {
        throw new Error("Failed to fetch itineraries")
      }

      const data = await response.json()
      setItineraries(data.itineraries || [])
    } catch (err) {
      console.error("Error fetching itineraries:", err)
      setError("Failed to fetch your itineraries. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const viewItinerary = (id: string) => {
    router.push(`/trips/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="email"
          placeholder="Enter your email to view saved itineraries"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button onClick={fetchItineraries} disabled={isLoading || !email} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "View My Itineraries"
          )}
        </Button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      {itineraries.length === 0 && !isLoading && !error && email && (
        <div className="text-center py-8">
          <p className="text-gray-500">No saved itineraries found for this email.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itineraries.map((itinerary) => (
          <Card key={itinerary.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {itinerary.destination}
              </CardTitle>
              <CardDescription className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {format(parseISO(itinerary.start_date), "MMMM d, yyyy")}
              </CardDescription>
              <CardDescription className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {itinerary.duration} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Created on {format(parseISO(itinerary.created_at), "MMMM d, yyyy")}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => viewItinerary(itinerary.id)} variant="outline" className="w-full">
                View Itinerary
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
