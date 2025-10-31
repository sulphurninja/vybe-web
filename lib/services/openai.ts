// Try multiple env variable names
const OPENAI_API_KEY = 
  process.env.OPENAI_API_KEY || 
  process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
  '';

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
  console.warn('   Make sure to set OPENAI_API_KEY in your .env.local file');
}

export interface AIEventSuggestion {
  title: string;
  type: 'restaurant' | 'house_party' | 'activity';
  description?: string;
  dateTime?: string;
  city?: string;
  suggestions?: {
    places?: string[];
    times?: string[];
    cuisines?: string[];
  };
}

/**
 * Use OpenAI GPT to generate event suggestions from user input
 */
export async function generateEventFromPrompt(
  prompt: string, 
  userLocation?: { lat: number; lng: number; city?: string }
): Promise<AIEventSuggestion> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are VYBE's AI event planning assistant. Your role is to help users create amazing social experiences by intelligently structuring their event ideas.

TASK: Analyze the user's input and generate a structured event suggestion.

EVENT TYPES (choose the most appropriate):
- "restaurant": Dining out, grabbing food, restaurant meetups
- "house_party": House parties, home gatherings, indoor celebrations  
- "activity": Entertainment, sports, outdoor activities, games, concerts, movies

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
CURRENT TIME: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${userLocation ? `USER LOCATION: ${userLocation.city || 'Unknown'} (Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)})` : 'USER LOCATION: Not provided'}

RESPONSE FORMAT (strict JSON, no markdown):
{
  "title": "Engaging 3-7 word event title that captures the vibe",
  "type": "restaurant" | "house_party" | "activity",
  "description": "Optional 1-2 sentence description",
  "dateTime": "ISO 8601 datetime if mentioned (e.g., 2024-12-25T19:00:00)",
  "city": "City name if mentioned",
  "needsMoreInfo": true | false,
  "question": "Friendly question asking for missing critical info (only if needsMoreInfo is true)",
  "questionType": "date_time" | "location" | null,
  "suggestions": {
    "places": ["specific, real venue/location names - 3-5 items"],
    "times": ["suggested times in readable format - 2-3 items"],
    "cities": ["nearby city names - 3-5 items"],
    "cuisines": ["cuisine types for restaurant/house_party only - 3-5 items"]
  }
}

INTELLIGENCE GUIDELINES:
- Infer event type from context (e.g., "grab dinner" → restaurant, "movie night" → activity)
- Extract implicit information (e.g., "Friday evening" → calculate next Friday)
- Generate relevant, realistic suggestions based on the event type
- For restaurants: suggest popular cuisines and dining styles
- For activities: suggest specific venues or activity types
- For house parties: suggest themes, food types, or entertainment ideas
- Times should be appropriate for the event type (dinner: 6-9pm, party: 8pm-late, brunch: 11am-2pm)
- Use the user's exact city/location if provided
- Create an exciting, specific title that would make people want to attend

DATE/TIME PROCESSING:
- ALWAYS calculate dates relative to TODAY'S DATE provided above
- "next Friday" = the upcoming Friday after today (calculate exact date)
- "this weekend" = the coming Saturday/Sunday
- "tomorrow" = exactly 1 day from today
- "next week" = 7 days from today
- When user says "Friday" without "next", assume they mean the nearest upcoming Friday
- Default time: 7:00 PM for dinner, 8:00 PM for parties, 2:00 PM for activities (if not specified)
- ALWAYS return exact ISO 8601 datetime, never relative strings

CRITICAL INFO VALIDATION:
- If dateTime is NOT provided by user, set "needsMoreInfo": true, "questionType": "date_time", and ask "When would you like to schedule this event?"
- If city/location is NOT provided, set "needsMoreInfo": true, "questionType": "location", and ask "Where should this event take place?"
- Only ask ONE question at a time - prioritize date/time over location
- If both are provided, set "needsMoreInfo": false and "questionType": null
- Make questions conversational and friendly

SUGGESTIONS BY QUESTION TYPE:
- For "date_time" questions: populate "times" array with 3-5 specific date/time options (e.g., "Tomorrow 7:00 PM", "This Friday 8:00 PM", "This Saturday 6:00 PM")
- For "location" questions: populate "cities" array with 3-5 nearby cities/neighborhoods based on USER LOCATION
  * If user is in NYC area: suggest Manhattan, Brooklyn, Queens, Bronx, Staten Island
  * If user is in LA area: suggest Downtown LA, Santa Monica, Hollywood, Pasadena, Long Beach
  * If user is in Chicago: suggest Loop, River North, Wicker Park, Lincoln Park, Pilsen
  * If user is in SF Bay: suggest San Francisco, Oakland, Berkeley, Palo Alto, San Jose
  * If location unknown: suggest major popular cities (NYC, LA, Chicago, SF, Boston)
  * ALWAYS consider the user's coordinates and suggest the nearest neighborhoods/cities
- Always provide helpful, contextual suggestions based on what you're asking and the user's location

EXAMPLES:

Example 1 - Complete info provided:
Input: "Let's grab Italian food this Friday at 7pm in Manhattan"
Output: {"title":"Friday Italian Night","type":"restaurant","dateTime":"2024-01-19T19:00:00","city":"Manhattan","needsMoreInfo":false,"suggestions":{"places":["Carbone","L'Artusi","Via Carota"],"times":["7:00 PM","7:30 PM","8:00 PM"],"cuisines":["Italian","Pasta","Pizza"]}}

Example 2 - Missing date/time (asking for date):
Input: "I want to organize a dinner with friends"
Output: {"title":"Dinner with Friends","type":"restaurant","needsMoreInfo":true,"questionType":"date_time","question":"When would you like to have this dinner?","suggestions":{"times":["Tomorrow 7:00 PM","This Friday 7:30 PM","This Saturday 7:00 PM","This Sunday 6:00 PM"],"cuisines":["Italian","Mexican","Asian"]}}

Example 3 - Missing location (asking for city):
Input: "Game night this Saturday at 8pm"
Output: {"title":"Saturday Game Night","type":"activity","dateTime":"2024-01-20T20:00:00","needsMoreInfo":true,"questionType":"location","question":"Where would you like to host this game night?","suggestions":{"cities":["Manhattan","Brooklyn","Queens","Jersey City","Hoboken"]}}

Example 4 - User provides relative date:
Input: "next Friday evening"
Output: {"title":"Friday Evening Plans","type":"restaurant","dateTime":"2024-02-02T19:00:00","needsMoreInfo":true,"questionType":"location","question":"Perfect! What city should we look in?","suggestions":{"cities":["Manhattan","Brooklyn","Los Angeles","Chicago","Boston"]}}

Example 5 - Complete with relative date:
Input: "tomorrow at 6pm in Manhattan"
Output: {"title":"Manhattan Dinner","type":"restaurant","dateTime":"2024-01-31T18:00:00","city":"Manhattan","needsMoreInfo":false,"questionType":null,"suggestions":{"places":["Carbone","The Smith","Gramercy Tavern"],"cuisines":["Italian","American","Steakhouse"]}}

Always return ONLY valid JSON, no explanations or markdown.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error('Error generating event from prompt:', error);
    // Return a fallback suggestion
    return {
      title: prompt.slice(0, 50),
      type: 'restaurant',
      description: 'AI-suggested event based on your input',
    };
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Detect audio format from blob type
    const audioType = audioBlob.type;
    let filename = 'audio.webm';
    
    if (audioType.includes('mp4') || audioType.includes('m4a')) {
      filename = 'audio.m4a';
    } else if (audioType.includes('mp3')) {
      filename = 'audio.mp3';
    } else if (audioType.includes('wav')) {
      filename = 'audio.wav';
    } else if (audioType.includes('mpeg')) {
      filename = 'audio.mpeg';
    }

    console.log(`🎤 Transcribing audio: ${filename} (${audioBlob.size} bytes)`);

    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // English for better accuracy
    formData.append('response_format', 'json');
    formData.append('temperature', '0'); // More accurate transcription

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API request failed: ${response.status}`);
    }

    const data = await response.json();
    const transcription = data.text || '';
    
    console.log(`✅ Transcription successful: "${transcription.substring(0, 50)}..."`);
    
    return transcription;
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

/**
 * Generate smart suggestions for event options based on event type and context
 */
export async function generateEventOptions(
  eventType: string,
  category: string,
  context?: string
): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are helping generate voting options for social events. Return ONLY a JSON array of 4-6 short, specific suggestions. No explanations, just the array.`,
          },
          {
            role: 'user',
            content: `Generate ${category} options for a ${eventType} event. ${context || ''}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return [];
    }

    // Parse the JSON array response
    const options = JSON.parse(content);
    return Array.isArray(options) ? options : [];
  } catch (error) {
    console.error('Error generating event options:', error);
    return [];
  }
}



