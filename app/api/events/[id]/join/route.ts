import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/models/Event";
import User from "@/lib/models/User";

type Ctx = { params: Promise<{ id: string }> };

// Join an event
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { userId } = await req.json();
  
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }
  
  try {
    const event = await Event.findById(params.id);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Check if user is already a participant
    const isParticipant = event.participants?.some((p: any) => p.userId === userId);
    
    if (isParticipant) {
      return NextResponse.json({ message: "Already joined" });
    }
    
    // Add user to participants
    await Event.findByIdAndUpdate(params.id, {
      $push: {
        participants: {
          userId,
          joinedAt: new Date(),
          role: 'participant'
        }
      }
    });
    
    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.eventsJoined': 1 },
      lastActive: new Date()
    });
    
    return NextResponse.json({ message: "Successfully joined event" });
  } catch (error: any) {
    console.error('Error joining event:', error);
    return NextResponse.json({ error: error.message || 'Failed to join event' }, { status: 500 });
  }
}

// Leave an event
export async function DELETE(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }
  
  try {
    const event = await Event.findById(params.id);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Check if user is the host
    if (event.createdBy === userId || event.hostId === userId) {
      return NextResponse.json({ error: "Host cannot leave their own event" }, { status: 400 });
    }
    
    // Remove user from participants
    await Event.findByIdAndUpdate(params.id, {
      $pull: {
        participants: { userId }
      }
    });
    
    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.eventsJoined': -1 },
      lastActive: new Date()
    });
    
    return NextResponse.json({ message: "Successfully left event" });
  } catch (error: any) {
    console.error('Error leaving event:', error);
    return NextResponse.json({ error: error.message || 'Failed to leave event' }, { status: 500 });
  }
}

