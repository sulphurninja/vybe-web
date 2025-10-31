import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/services/twilio";

export async function POST(req: Request) {
  const body = await req.json();

  const { eventId, eventTitle, eventLink, contacts } = body;

  if (!eventId || !eventTitle || !eventLink || !contacts || !Array.isArray(contacts)) {
    return NextResponse.json({ error: "Event ID, title, link, and contacts are required" }, { status: 400 });
  }

  try {
    const results = [];
    const errors = [];

    for (const contact of contacts) {
      if (!contact.phone) {
        continue; // Skip contacts without phone numbers
      }

      try {
        const message = `🎉 You're invited to ${eventTitle}!\n\nJoin the vibe: ${eventLink}`;
        const result = await sendSMS(contact.phone, message);
        
        results.push({
          contact: contact.name,
          phone: contact.phone,
          success: result.success,
          sid: result.sid,
        });
      } catch (error: any) {
        console.error(`Failed to send SMS to ${contact.name}:`, error);
        errors.push({
          contact: contact.name,
          phone: contact.phone,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('SMS invite error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS invites' }, { status: 500 });
  }
}

