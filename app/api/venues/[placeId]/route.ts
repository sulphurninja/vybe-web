import { NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/services/googlePlaces";

type Ctx = { params: Promise<{ placeId: string }> };

export async function GET(_req: Request, context: Ctx) {
  const params = await context.params;
  const { placeId } = params;

  if (!placeId) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
  }

  try {
    const place = await getPlaceDetails(placeId);

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    return NextResponse.json({ place });
  } catch (error: any) {
    console.error('Get place details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get place details' },
      { status: 500 }
    );
  }
}




