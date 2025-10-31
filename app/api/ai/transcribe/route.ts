import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/services/openai";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
      type: audioFile.type 
    });

    const transcription = await transcribeAudio(audioBlob);

    return NextResponse.json({ transcription });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
