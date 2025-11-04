import { NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/services/googlePlaces";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId parameter is required' }, { status: 400 });
  }

  try {
    const place = await getPlaceDetails(placeId);

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    console.log('📍 Place details fetched:', { placeId, lat: place.geometry?.location?.lat, lng: place.geometry?.location?.lng });
    return NextResponse.json(place);
  } catch (error: any) {
    console.error('❌ Get place details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get place details' },
      { status: 500 }
    );
  }
}
