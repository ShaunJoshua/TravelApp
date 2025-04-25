"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, List, Home } from "lucide-react"

export default function NavBar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold">TravelPlanner</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive("/") ? "bg-primary/10 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
            <Link
              href="/trips"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive("/trips")
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              My Trips
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
