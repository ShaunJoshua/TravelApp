'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ExternalLink, Loader2 } from 'lucide-react'

// Define the attraction type
interface Attraction {
  name: string
  address: string
  latitude?: number
  longitude?: number
  category?: string
  fsq_id?: string
}

interface AttractionsListProps {
  destination: string
  category?: string
}

export function AttractionsList({ destination, category = 'attractions' }: AttractionsListProps) {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAttractions() {
      if (!destination) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(
          `/api/local-attractions?destination=${encodeURIComponent(destination)}&category=${encodeURIComponent(category)}`
        )
        
        if (!response.ok) {
          throw new Error(`Error fetching attractions: ${response.statusText}`)
        }
        
        const data = await response.json()
        setAttractions(data.attractions || [])
      } catch (error) {
        console.error('Failed to fetch attractions:', error)
        setError(error instanceof Error ? error.message : 'Failed to load attractions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAttractions()
  }, [destination, category])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading attractions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <p>Error loading attractions: {error}</p>
      </div>
    )
  }

  if (attractions.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
        <p>No attractions found for {destination}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Top Attractions in {destination}</h2>
      <p className="text-muted-foreground">Discover the best sights and experiences</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attractions.map((attraction) => (
          <Card key={attraction.fsq_id || attraction.name} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{attraction.name}</CardTitle>
              {attraction.category && (
                <Badge variant="outline" className="w-fit">
                  {attraction.category}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-1 shrink-0 mt-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{attraction.address}</p>
              </div>
            </CardContent>
            <CardFooter>
              {attraction.latitude && attraction.longitude && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Map
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
