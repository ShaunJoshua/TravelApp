/**
 * Collection of API helper functions for enhancing travel itineraries
 * These functions fetch data from various free public APIs
 */

/**
 * Fetch place information from OpenStreetMap Nominatim API
 */
export async function fetchPlaceInfo(query: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'TravelApp/1.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!res.ok) return { location: query, address: '' };
    
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const top = data[0];
      return {
        location: top.display_name.split(",")[0] || query,
        address: top.display_name,
        lat: top.lat,
        lon: top.lon
      };
    }
  } catch (error) {
    console.error("Error fetching place info:", error);
  }
  
  return { location: query, address: '' };
}

/**
 * Fetch summary from Wikipedia REST API
 */
export async function fetchWikiSummary(title: string) {
  try {
    // Format the title for Wikipedia API
    const formattedTitle = title
      .replace(/\s+/g, '_')
      .replace(/[^\w\s]/g, '')
      .trim();
      
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedTitle)}`;
    const res = await fetch(url);
    
    if (!res.ok) return '';
    
    const data = await res.json();
    return data.extract || '';
  } catch (error) {
    console.error("Error fetching Wikipedia summary:", error);
    return '';
  }
}

/**
 * Fetch photos from Unsplash API (free tier)
 */
export async function fetchUnsplashPhoto(query: string) {
  try {
    // If no API key is provided, return an empty string
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return '';
    }
    
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });
    
    if (!response.ok) return '';
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
    
    return '';
  } catch (error) {
    console.error("Error fetching Unsplash photo:", error);
    return '';
  }
}

/**
 * Fetch place details from Foursquare Places API (free tier)
 */
export async function fetchFoursquareDetails(name: string, location: string) {
  try {
    // If no API key is provided, return null
    if (!process.env.FOURSQUARE_API_KEY) {
      return null;
    }
    
    const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(name)}&near=${encodeURIComponent(location)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': process.env.FOURSQUARE_API_KEY
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const place = data.results[0];
      return {
        name: place.name,
        address: place.location?.formatted_address || '',
        latitude: place.geocodes?.main?.latitude,
        longitude: place.geocodes?.main?.longitude,
        categories: place.categories?.[0]?.name || '',
        rating: place.rating || '',
        photos: place.photos || []
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching Foursquare data:", error);
    return null;
  }
}

/**
 * Fetch local sightseeing attractions from Foursquare Places API
 */
export async function fetchLocalAttractions(destination: string, category: string = "attractions") {
  try {
    // If no API key is provided, return empty array
    if (!process.env.FOURSQUARE_API_KEY) {
      console.error("Foursquare API key not set");
      return [];
    }
    
    const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(category)}&near=${encodeURIComponent(destination)}&limit=10&sort=POPULARITY`;
    console.log(`Fetching attractions for ${destination}, category: ${category}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': process.env.FOURSQUARE_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error(`Foursquare API error: ${response.status} - ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Found ${data.results?.length || 0} attractions for ${destination}`);
    
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((place: any) => ({
        name: place.name,
        address: place.location?.formatted_address || '',
        latitude: place.geocodes?.main?.latitude,
        longitude: place.geocodes?.main?.longitude,
        category: place.categories?.[0]?.name || category,
        fsq_id: place.fsq_id
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching local attractions:", error);
    return [];
  }
}
