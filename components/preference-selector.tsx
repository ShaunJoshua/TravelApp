      "use client"

import React, { useEffect, useState } from "react"
import type { Preference } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PreferenceSelectorProps {
  selectedPreferences: string[]
  onChange: (preferences: string[]) => void
}

export default function PreferenceSelector({ selectedPreferences, onChange }: PreferenceSelectorProps) {
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fixed emoji encoding with escaped sequences
  const DEFAULT_PREFERENCES: Preference[] = [
    { id: "beach", name: "Beach", icon: "🏖️", description: "Beach vacations and coastal activities" },
    { id: "hiking", name: "Hiking", icon: "🥾", description: "Hiking trails and outdoor adventures" },
    { id: "nightlife", name: "Nightlife", icon: "🌃", description: "Bars, clubs and evening entertainment" },
    { id: "museums", name: "Museums", icon: "🏛️", description: "Museums and art galleries" },
    { id: "food_wine", name: "Food & Wine", icon: "🍷", description: "Culinary experiences and wine tasting" },
    { id: "shopping", name: "Shopping", icon: "🛍️", description: "Shopping districts and markets" },
    { id: "wildlife", name: "Wildlife", icon: "🦁", description: "Animal watching and wildlife reserves" },
    { id: "photography", name: "Photography", icon: "📷", description: "Scenic spots perfect for photos" },
    { id: "adventure", name: "Adventure", icon: "🧗", description: "Thrilling and adventurous activities" },
    { id: "history", name: "History", icon: "🏰", description: "Historical sites and landmarks" },
    { id: "culture", name: "Culture", icon: "🎭", description: "Local traditions and cultural experiences" },
    { id: "relaxation", name: "Relaxation", icon: "🧘", description: "Spas and wellness retreats" },
    { id: "family", name: "Family", icon: "👨‍👩‍👧‍👦", description: "Family-friendly activities" },
    { id: "romantic", name: "Romantic", icon: "❤️", description: "Perfect for couples" },
    { id: "budget", name: "Budget", icon: "💰", description: "Affordable travel options" }
  ]
  
  // Set preferences immediately on component load
  useEffect(() => {
    setPreferences(DEFAULT_PREFERENCES)
    setIsLoading(false)
  }, [])
  
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // Filter preferences based on search term
  const filteredPreferences = preferences.filter((pref: Preference) =>
    pref.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Toggle a preference selection
  const togglePreference = (id: string) => {
    if (selectedPreferences.includes(id)) {
      onChange(selectedPreferences.filter((prefId) => prefId !== id))
    } else {
      onChange([...selectedPreferences, id])
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[...Array(8)].map((_: unknown, i: number) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Label htmlFor="preference-search">Search interests</Label>
        <Input
          id="preference-search"
          placeholder="e.g., beach, food"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {preferences.map((preference: Preference) => (
          <button
            key={preference.id}
            type="button"
            onClick={() => togglePreference(preference.id)}
            className={`flex items-center p-3 rounded-lg border transition-colors ${
              selectedPreferences.includes(preference.id)
                ? "bg-primary/10 border-primary text-primary"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="text-2xl mr-2">{preference.icon}</span>
            <span className="text-sm font-medium">{preference.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
