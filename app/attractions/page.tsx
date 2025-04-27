'use client'

import { useState } from 'react'
import { AttractionsList } from '@/components/attractions-list'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MapPin } from 'lucide-react'

export default function AttractionsPage() {
  const [destination, setDestination] = useState('')
  const [category, setCategory] = useState('attractions')
  const [searchedDestination, setSearchedDestination] = useState('')
  const [searchedCategory, setSearchedCategory] = useState('attractions')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchedDestination(destination)
    setSearchedCategory(category)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Local Sightseeing Attractions</h1>
        <p className="text-muted-foreground mb-8">Discover popular attractions and places to visit</p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Attractions</CardTitle>
            <CardDescription>
              Enter a destination to discover local attractions and sightseeing spots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Enter destination (e.g., Paris, Tokyo, New York)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attractions">All Attractions</SelectItem>
                    <SelectItem value="sights">Sights</SelectItem>
                    <SelectItem value="museums">Museums</SelectItem>
                    <SelectItem value="parks">Parks</SelectItem>
                    <SelectItem value="historical">Historical</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="flex gap-2 items-center">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {searchedDestination && (
          <div className="mt-8">
            <AttractionsList destination={searchedDestination} category={searchedCategory} />
          </div>
        )}

        {!searchedDestination && (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No destination selected</h3>
            <p className="text-muted-foreground max-w-md">
              Enter a destination above to discover popular attractions and places to visit
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
