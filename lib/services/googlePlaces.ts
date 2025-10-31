// Try multiple env variable names
const GOOGLE_PLACES_API_KEY = 
  process.env.GOOGLE_PLACES_API_KEY || 
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 
  '';

if (!GOOGLE_PLACES_API_KEY) {
  console.warn('⚠️  GOOGLE_PLACES_API_KEY not found in environment variables');
  console.warn('   Make sure to set GOOGLE_PLACES_API_KEY in your .env.local file');
}

export interface Place {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  photos?: string[];
  types?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  openNow?: boolean;
  phone?: string;
  website?: string;
}

/**
 * Search for nearby places using Google Places API
 * Note: Using textsearch which returns more results than findplacefromtext
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius: number = 5000,
  type?: string
): Promise<Place[]> {
  try {
    // Use textsearch for better results (up to 20 places per request)
    const params = new URLSearchParams({
      query: query,
      key: GOOGLE_PLACES_API_KEY,
    });

    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
      params.append('radius', radius.toString());
    }

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
    );

    if (!response.ok) {
      throw new Error('Google Places API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    console.log(`✅ Found ${data.results?.length || 0} places for query: "${query}"`);

    return (data.results || []).map((place: any) => formatPlace(place));
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Search nearby places using Nearby Search
 * Returns up to 20 results per request
 */
export async function searchNearbyPlaces(
  location: { lat: number; lng: number },
  radius: number = 5000,
  type?: string,
  keyword?: string
): Promise<Place[]> {
  try {
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      key: GOOGLE_PLACES_API_KEY,
      rankby: 'prominence', // Sort by prominence for better results
    });

    if (type) params.append('type', type);
    if (keyword) params.append('keyword', keyword);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
    );

    if (!response.ok) {
      throw new Error('Google Places API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    console.log(`✅ Found ${data.results?.length || 0} nearby places within ${radius}m`);

    return (data.results || []).map((place: any) => formatPlace(place));
  } catch (error) {
    console.error('Error searching nearby places:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<Place | null> {
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      fields: 'place_id,name,formatted_address,geometry,rating,price_level,photos,types,opening_hours,formatted_phone_number,website',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    if (!response.ok) {
      throw new Error('Google Places API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return null;
    }

    return formatPlace(data.result);
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Get photo URL from Google Places photo reference
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Format place data from Google Places API response
 */
function formatPlace(place: any): Place {
  const photos = place.photos
    ? place.photos.slice(0, 5).map((photo: any) => getPhotoUrl(photo.photo_reference, 800))
    : [];

  return {
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address || place.vicinity || '',
    city: extractCity(place.formatted_address),
    rating: place.rating,
    priceLevel: place.price_level,
    photoUrl: photos[0] || null,
    photos,
    types: place.types || [],
    coordinates: place.geometry?.location
      ? {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        }
      : undefined,
    openNow: place.opening_hours?.open_now,
    phone: place.formatted_phone_number,
    website: place.website,
  };
}

/**
 * Extract city from formatted address
 */
function extractCity(address: string): string | undefined {
  if (!address) return undefined;
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return undefined;
}


