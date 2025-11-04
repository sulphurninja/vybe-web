import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/services/models/Event";
import Invite from "@/lib/services/models/Invite";

type Ctx = { params: Promise<{ id: string }> };

// POST - Guest joins event with name (no sign up required)
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { guestName } = await req.json();

  if (!guestName || guestName.trim().length === 0) {
    return NextResponse.json(
      { error: "Guest name is required" },
      { status: 400 }
    );
  }

  // Check if event exists
  const event = await Event.findById(params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Generate a unique guest token
  const guestToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create temporary guest profile (as an invite with guest status)
  const guestInvite = await Invite.create({
    eventId: params.id,
    guestToken,
    name: guestName,
    role: "guest",
    status: "accepted",
    joinedAt: new Date(),
  });

  // Return guest token and event data
  return NextResponse.json(
    {
      guestToken,
      guestName,
      event: {
        _id: event._id,
        title: event.title,
        type: event.type,
        dateTimeStart: event.dateTimeStart,
        city: event.city,
        description: event.description,
      },
      message: "Welcome to the VYBE! 🎉",
    },
    { status: 200 }
  );
}

