import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/services/models/Event";
import User from "@/lib/services/models/User";
import Notification from "@/lib/services/models/Notification";
import { sendPushNotification } from "@/lib/services/pushNotifications";

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
    
    // Get user info
    const user = await User.findById(userId);
    const userName = user?.name || user?.username || user?.email || 'Someone';
    
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
    
    // Create notification for event host
    const host = await User.findById(event.createdBy || event.hostId);
    
    if (host) {
      const notification = await Notification.create({
        userId: host._id,
        type: 'user_joined',
        title: '🎉 New participant!',
        message: `${userName} joined your "${event.title}" event`,
        eventId: params.id,
        fromUserId: userId,
        fromUserName: userName,
        actionUrl: `/event/${params.id}`,
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      console.log(`📬 Created user_joined notification for host ${host._id}`);

      // Send push notification if host enabled it
      if (host.expoPushToken && host.preferences?.notifications?.push) {
        await sendPushNotification(
          host.expoPushToken,
          '🎉 New participant!',
          `${userName} joined "${event.title}"`,
          {
            type: 'user_joined',
            eventId: params.id,
            notificationId: notification._id,
          }
        );
      }
    }
    
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

