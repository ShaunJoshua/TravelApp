export interface Preference {
  id: string
  name: string
  icon: string
  description: string
}

export interface ItineraryFormData {
  destination: string
  startDate: string
  duration: number
  preferences: string[]
}

export interface Activity {
  id?: string
  name: string
  timeOfDay: string
  description: string
  location?: string
  address?: string
  durationMinutes?: number
  bookingLink?: string
  transportation?: string
  orderIndex?: number
}

export interface Day {
  id?: string
  dayNumber: number
  date: string
  activities: Activity[]
}

export interface Itinerary {
  id?: string
  destination: string
  startDate: string
  duration: number
  days: Day[]
  preferences: Preference[]
  userId?: string
  createdAt?: string
  updatedAt?: string
}
