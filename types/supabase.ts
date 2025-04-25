export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          day_id: string
          name: string
          time_of_day: string
          description: string | null
          order_index: number
        }
        Insert: {
          id?: string
          day_id: string
          name: string
          time_of_day: string
          description?: string | null
          order_index: number
        }
        Update: {
          id?: string
          day_id?: string
          name?: string
          time_of_day?: string
          description?: string | null
          order_index?: number
        }
      }
      days: {
        Row: {
          id: string
          itinerary_id: string
          day_number: number
          date: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          day_number: number
          date: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          day_number?: number
          date?: string
        }
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          destination: string
          start_date: string
          duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination: string
          start_date: string
          duration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination?: string
          start_date?: string
          duration?: number
          created_at?: string
          updated_at?: string
        }
      }
      itinerary_preferences: {
        Row: {
          itinerary_id: string
          preference_id: string
        }
        Insert: {
          itinerary_id: string
          preference_id: string
        }
        Update: {
          itinerary_id?: string
          preference_id?: string
        }
      }
      preferences: {
        Row: {
          id: string
          name: string
          icon: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          icon: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          description?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}
