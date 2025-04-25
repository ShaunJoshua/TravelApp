"use client"

import React, { useEffect, useState } from "react"
import type { Preference } from "@/types"
import { getBrowserClient } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PreferenceSelectorProps {
  selectedPreferences: string[]
  onChange: (preferences: string[]) => void
}

export default function PreferenceSelector({ selectedPreferences, onChange }: PreferenceSelectorProps) {
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const DEFAULT_PREFERENCES: Preference[] = [
    { id: "beach", name: "Beach", icon: "🏖️", description: "Beach" },
    { id: "hiking", name: "Hiking", icon: "🥾", description: "Hiking" },
    { id: "nightlife", name: "Nightlife", icon: "🌃", description: "Nightlife" },
    { id: "museums", name: "Museums", icon: "🏛️", description: "Museums" },
    { id: "food_wine", name: "Food & Wine", icon: "🍷", description: "Food & Wine" },
    { id: "shopping", name: "Shopping", icon: "🛍️", description: "Shopping" },
    { id: "wildlife", name: "Wildlife", icon: "🐾", description: "Wildlife" },
    { id: "photography", name: "Photography", icon: "📷", description: "Photography" },
    { id: "adventure_sports", name: "Adventure Sports", icon: "🏄", description: "Adventure Sports" },
    { id: "historical_sites", name: "Historical Sites", icon: "🏰", description: "Historical Sites" },
    { id: "local_culture", name: "Local Culture", icon: "🗺️", description: "Local Culture" },
    { id: "relaxation", name: "Relaxation", icon: "🛀", description: "Relaxation" },
    { id: "family_friendly", name: "Family Friendly", icon: "👪", description: "Family Friendly" },
    { id: "romantic", name: "Romantic", icon: "❤️", description: "Romantic" },
    { id: "budget_travel", name: "Budget Travel", icon: "💰", description: "Budget Travel" },
  ]
  const [searchTerm, setSearchTerm] = useState<string>("")
  const filteredPreferences = preferences.filter((pref: Preference) =>
    pref.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const supabase = getBrowserClient()
        const { data, error } = await supabase.from("preferences").select("*").order("name")

        if (error) {
          throw error
        }

        setPreferences([...(data || []), ...DEFAULT_PREFERENCES.filter((dp: Preference) => !(data || []).some((d: Preference) => d.id === dp.id))])
      } catch (error) {
        console.error("Error fetching preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreferences()
  }, [])

  const togglePreference = (id: string) => {
    if (selectedPreferences.includes(id)) {
      onChange(selectedPreferences.filter((prefId) => prefId !== id))
    } else {
      onChange([...selectedPreferences, id])
    }
  }

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
        {filteredPreferences.map((preference: Preference) => (
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
