"use client"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
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
  source?: string
}

// Weather API helpers
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
const WEATHER_UNITS = 'metric';

async function getLatLonForCity(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return { lat: data[0].lat, lon: data[0].lon };
  }
  return null;
}

async function getWeatherForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${WEATHER_UNITS}`;
  const res = await fetch(url);
  return await res.json();
}

function getWeatherSummaryForItinerary(itinerary, forecast) {
  const summary = {};
  const timeMap = { morning: 9, afternoon: 15, evening: 21 };
  for (const day of itinerary.days) {
    const date = day.date;
    summary[date] = { morning: null, afternoon: null, evening: null };
    for (const [timeOfDay, hour] of Object.entries(timeMap)) {
      const target = forecast.list.find((item) => {
        const dt = new Date(item.dt_txt);
        return dt.getFullYear() === new Date(date).getFullYear() &&
               dt.getMonth() === new Date(date).getMonth() &&
               dt.getDate() === new Date(date).getDate() &&
               dt.getHours() === hour;
      });
      if (target) {
        summary[date][timeOfDay] = {
          temp: target.main.temp,
          description: target.weather[0].description,
          icon: target.weather[0].icon,
        };
      }
    }
  }
  return summary;
}

export default function ItineraryDisplay({ itinerary, preferences = [], source = "unknown" }: ItineraryDisplayProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("day-1")
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        // Try to get lat/lon from itinerary (if available in future)
        let lat = itinerary.lat, lon = itinerary.lon;
        console.log('[Weather] Destination:', itinerary.destination);
        if (!lat || !lon) {
          const coords = await getLatLonForCity(itinerary.destination);
          console.log('[Weather] Geocoded coords:', coords);
          if (!coords) throw new Error('Could not find coordinates for destination');
          lat = coords.lat; lon = coords.lon;
        }
        console.log('[Weather] Using coords:', lat, lon);
        const forecast = await getWeatherForecast(lat, lon);
        console.log('[Weather] Forecast API response:', forecast);
        const summary = getWeatherSummaryForItinerary(itinerary, forecast);
        console.log('[Weather] Weather summary:', summary);
        setWeatherSummary(summary);
      } catch (err) {
        console.error('[Weather] Error:', err);
        setWeatherError('Weather unavailable');
      } finally {
        setWeatherLoading(false);
      }
    }
    if (itinerary && itinerary.days && itinerary.destination) {
      fetchWeather();
    }
  }, [itinerary]);

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
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                source === "openrouter" 
                  ? "bg-green-100 text-green-800" 
                  : source === "openai" 
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {source === "openrouter" 
                  ? "AI Generated (DeepSeek)" 
                  : source === "openai" 
                  ? "AI Generated (OpenAI)"
                  : "Mock Data"}
              </span>
            </div>
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
                    <CardHeader className="pb-2 bg-gray-50">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">
                          {getPreferenceEmoji(activity.name) || getTimeEmoji(activity.timeOfDay)}
                        </span>
                        <CardTitle className="text-lg font-semibold">{activity.name}</CardTitle>
                        {/* Weather for this activity's time of day */}
                        {weatherSummary && (
                          (() => {
                            const w = weatherSummary[day.date]?.[activity.timeOfDay.toLowerCase()];
                            return w ? (
                              <span className="flex items-center ml-4 text-sm bg-blue-100 rounded px-2 py-1">
                                <img src={`https://openweathermap.org/img/wn/${w.icon}.png`} alt={w.description} className="w-6 h-6 mr-1" />
                                {Math.round(w.temp)}°C, {w.description}
                              </span>
                            ) : (
                              <span className="ml-4 text-xs text-muted-foreground">N/A</span>
                            );
                          })()
                        )}
                      </div>
                      <CardDescription className="text-sm">{activity.timeOfDay}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <p className="text-sm leading-relaxed">{activity.description}</p>
                      <div className="space-y-2 mt-2">
                        {activity.location && (
                          <p className="text-sm"><strong>Location:</strong> {activity.location}</p>
                        )}
                        {activity.categories && (
                          <p className="text-sm"><strong>Type:</strong> {activity.categories}</p>
                        )}
                        {activity.address && (
                          <p className="text-sm"><strong>Address:</strong> {activity.address}</p>
                        )}
                        {activity.durationMinutes && (
                          <p className="text-sm"><strong>Duration:</strong> {activity.durationMinutes} mins</p>
                        )}
                        {activity.transportation && (
                          <p className="text-sm"><strong>Transportation:</strong> {activity.transportation}</p>
                        )}
                        {activity.localTip && (
                          <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-md mt-2"><strong>Local Tip:</strong> {activity.localTip}</p>
                        )}
                      </div>
                      {activity.bookingLink && (
                        <a 
                          href={activity.bookingLink} 
                          target="_blank" 
                          className="mt-3 inline-block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Book Now
                        </a>
                      )}
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
