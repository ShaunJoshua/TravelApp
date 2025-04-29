'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ExternalLink, Loader2, AlertCircle, Info } from 'lucide-react'

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
        // For now, we'll use mock data since we removed the API
        const mockAttractions: Attraction[] = [
          {
            name: `${destination} Main Square`,
            address: `City Center, ${destination}`,
            category: "Plaza",
            latitude: undefined,
            longitude: undefined
          },
          {
            name: `${destination} Historical Museum`,
            address: `Museum District, ${destination}`,
            category: "Museum",
            latitude: undefined,
            longitude: undefined
          },
          {
            name: `${destination} Central Park`,
            address: `Green Zone, ${destination}`,
            category: "Park",
            latitude: undefined,
            longitude: undefined
          }
        ];
        
        setAttractions(mockAttractions);
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
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>Error loading attractions: {error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    )
  }

  if (attractions.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-center text-amber-700">
          <Info className="h-5 w-5 mr-2" />
          <p>No attractions found for {destination}.</p>
        </div>
        <p className="mt-2 text-sm text-amber-600">
          Try adjusting your search criteria or try a different category.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Top Attractions in {destination}</h2>
      <p className="text-muted-foreground">Discover the best sights and experiences</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attractions.map((attraction) => (
          <Card key={attraction.fsq_id || attraction.name} className="overflow-hidden shadow-lg rounded-xl bg-card border border-border">
            {/* Image section */}
            <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
                alt={attraction.name}
                className="object-cover w-full h-full"
                style={{ maxHeight: '160px' }}
                loading="lazy"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-foreground mb-1">{attraction.name}</CardTitle>
              {attraction.category && (
                <Badge variant="outline" className="w-fit mb-1">
                  {attraction.category}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-start mb-2">
                <MapPin className="h-4 w-4 mr-1 shrink-0 mt-1 text-primary" />
                <p className="text-sm text-muted-foreground break-words">{attraction.address}</p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="ml-2 p-1 h-6 w-6"
                  title="Copy address"
                  onClick={() => navigator.clipboard.writeText(attraction.address)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7.5 2.25V6.75A2.25 2.25 0 014.75 4.5h6.5A2.25 2.25 0 0113.5 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-6.5A2.25 2.25 0 013 17.25zm16.5-2.25v-6.5A2.25 2.25 0 0017.25 6.5h-2.5" />
                  </svg>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              {attraction.latitude !== undefined && attraction.longitude !== undefined && (
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
