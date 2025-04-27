"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import PreferenceSelector from "./preference-selector"
import type { ItineraryFormData } from "@/types"

export default function ItineraryForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<ItineraryFormData>({
    destination: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    duration: 3,
    preferences: [],
  })
  const [date, setDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      setFormData({
        ...formData,
        startDate: format(selectedDate, "yyyy-MM-dd"),
      })
    }
  }

  const handlePreferencesChange = (preferences: string[]) => {
    setFormData({
      ...formData,
      preferences,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate form data
    if (!formData.destination.trim()) {
      setError("Please enter a destination")
      setIsLoading(false)
      return
    }

    if (formData.duration < 1 || formData.duration > 14) {
      setError("Duration must be between 1 and 14 days")
      setIsLoading(false)
      return
    }

    try {
      console.log("Submitting form data:", formData)

      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      // Now safely parse the JSON
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError)
        throw new Error("Invalid response format from server")
      }

      if (!data.itinerary || !data.itinerary.days || data.itinerary.days.length === 0) {
        console.error("Invalid itinerary data:", data)
        throw new Error("Received invalid itinerary data")
      }

      console.log("Itinerary generated successfully")
      console.log("Data source:", data.source || "unknown")

      // Store the generated itinerary in localStorage for now
      localStorage.setItem(
        "currentItinerary",
        JSON.stringify({
          ...data.itinerary,
          preferences: formData.preferences,
        }),
      )
      
      // Store the source information
      localStorage.setItem("itinerarySource", data.source || "mock")

      // Redirect to the results page
      router.push("/results")
    } catch (err: any) {
      console.error("Error generating itinerary:", err)
      setError(err.message || "Failed to generate itinerary. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="destination">Where are you going?</Label>
        <Input
          id="destination"
          placeholder="e.g., Paris, Tokyo, New York"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">When are you starting your trip?</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">How many days?</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          max="14"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-3">
        <Label>What are you interested in?</Label>
        <PreferenceSelector selectedPreferences={formData.preferences} onChange={handlePreferencesChange} />
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating your itinerary...
          </>
        ) : (
          "Generate Itinerary"
        )}
      </Button>
    </form>
  )
}
