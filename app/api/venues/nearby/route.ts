import { NextResponse } from "next/server";
import { searchNearbyPlaces } from "@/lib/services/googlePlaces";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '2000';
  const type = searchParams.get('type') || 'restaurant';

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  try {
    const places = await searchNearbyPlaces(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      parseInt(radius),
      type
    );

    // Transform to expected format
    const venues = places.map(place => ({
      placeId: place.placeId,
      name: place.name,
      address: place.address,
      city: place.city,
      rating: place.rating,
      photoUrl: place.photoUrl,
      latitude: place.coordinates?.lat,
      longitude: place.coordinates?.lng,
    }));

    console.log(`✅ Returning ${venues.length} nearby venues`);
    return NextResponse.json({ venues });
  } catch (error: any) {
    console.error('Error fetching nearby venues:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch nearby venues' },
      { status: 500 }
    );
  }
}

