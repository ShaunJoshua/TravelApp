"use client"

import { Input } from "@/components/ui/input"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import type { Itinerary, Preference } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ItineraryDisplayProps {
  itinerary: Itinerary
  preferences?: Preference[]
}

export default function ItineraryDisplay({ itinerary, preferences = [] }: ItineraryDisplayProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("day-1")

  // Get time of day emoji
  const getTimeEmoji = (timeOfDay: string) => {
    switch (timeOfDay.toLowerCase()) {
      case "morning":
        return "🌅"
      case "afternoon":
        return "☀️"
      case "evening":
        return "🌙"
      default:
        return "⏰"
    }
  }

  // Get preference emoji if available
  const getPreferenceEmoji = (activityName: string) => {
    if (!preferences.length) return null

    const matchedPreference = preferences.find((pref) => activityName.toLowerCase().includes(pref.name.toLowerCase()))

    return matchedPreference ? matchedPreference.icon : null
  }

  const handleSave = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to save this itinerary",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/save-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itinerary,
          email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save itinerary")
      }

      toast({
        title: "Itinerary saved!",
        description: "Your itinerary has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving itinerary:", error)
      toast({
        title: "Save failed",
        description: "Failed to save your itinerary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Trip to {itinerary.destination}</CardTitle>
          <CardDescription>
            {format(parseISO(itinerary.startDate), "MMMM d, yyyy")} - {itinerary.duration} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {preferences.map((pref) => (
              <div
                key={pref.id}
                className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
              >
                <span className="mr-1">{pref.icon}</span>
                {pref.name}
              </div>
            ))}
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 mb-4 overflow-x-auto">
              {itinerary.days.map((day) => (
                <TabsTrigger key={day.dayNumber} value={`day-${day.dayNumber}`}>
                  Day {day.dayNumber}
                </TabsTrigger>
              ))}
            </TabsList>

            {itinerary.days.map((day) => (
              <TabsContent key={day.dayNumber} value={`day-${day.dayNumber}`} className="space-y-4">
                <h3 className="font-medium text-lg">
                  Day {day.dayNumber} - {format(parseISO(day.date), "EEEE, MMMM d")}
                </h3>

                {day.activities.map((activity, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">
                          {getPreferenceEmoji(activity.name) || getTimeEmoji(activity.timeOfDay)}
                        </span>
                        <CardTitle className="text-base">{activity.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{activity.timeOfDay}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{activity.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Input
            type="email"
            placeholder="Enter your email to save this itinerary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Itinerary
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
