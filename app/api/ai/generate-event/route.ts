import { NextResponse } from "next/server";
import { generateEventFromPrompt } from "@/lib/services/openai";

export async function POST(req: Request) {
  try {
    const { prompt, userLocation } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('🌍 User location:', userLocation);

    const suggestion = await generateEventFromPrompt(prompt, userLocation);

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error('AI event generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate event' },
      { status: 500 }
    );
  }
}
