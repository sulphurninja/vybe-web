import { NextResponse } from "next/server";
import { searchPlaces, searchNearbyPlaces } from "@/lib/services/googlePlaces";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = parseInt(searchParams.get('radius') || '5000');
  const type = searchParams.get('type') || undefined;

  if (!query && (!lat || !lng)) {
    return NextResponse.json(
      { error: 'Either query or location (lat/lng) is required' },
      { status: 400 }
    );
  }

  try {
    let places = [];

    if (query) {
      const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
      
      // Use text search for query-based searches (returns more results)
      places = await searchPlaces(query, location, radius, type);
      
      // If query search returns few results and we have location, also try nearby search
      if (places.length < 5 && location && type) {
        console.log('⚠️ Few results from text search, trying nearby search...');
        const nearbyPlaces = await searchNearbyPlaces(location, radius, type, query);
        
        // Merge results, avoiding duplicates
        const existingIds = new Set(places.map(p => p.placeId));
        const newPlaces = nearbyPlaces.filter(p => !existingIds.has(p.placeId));
        places = [...places, ...newPlaces];
        
        console.log(`✅ Combined results: ${places.length} total places`);
      }
    } else if (lat && lng) {
      // Pure location-based search
      places = await searchNearbyPlaces(
        { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius,
        type,
        searchParams.get('keyword') || undefined
      );
    }

    console.log(`🎯 Returning ${places.length} places`);
    return NextResponse.json({ places });
  } catch (error: any) {
    console.error('Venue search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search venues' },
      { status: 500 }
    );
  }
}









