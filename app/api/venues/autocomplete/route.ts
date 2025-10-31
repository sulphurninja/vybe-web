import { NextResponse } from "next/server";

// Load environment variables
const GOOGLE_PLACES_API_KEY = 
  process.env.GOOGLE_PLACES_API_KEY || 
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input');
  const types = searchParams.get('types') || '(cities)';
  
  if (!input) {
    return NextResponse.json(
      { error: "Input parameter is required" },
      { status: 400 }
    );
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('⚠️ Google Places API key not found in environment variables');
    return NextResponse.json(
      { error: "Google Places API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Call Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    url.searchParams.append('types', types);
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    console.log('🌍 Fetching autocomplete suggestions for:', input);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Google Places API error', status: data.status },
        { status: 400 }
      );
    }

    console.log(`✅ Found ${data.predictions?.length || 0} autocomplete suggestions`);

    return NextResponse.json({
      predictions: data.predictions || [],
      status: data.status,
    });
  } catch (error: any) {
    console.error('💥 Error fetching autocomplete suggestions:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch autocomplete suggestions' },
      { status: 500 }
    );
  }
}

