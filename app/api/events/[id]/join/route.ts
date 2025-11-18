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
  const body = await req.json();
  const { userId, guestToken, userName: providedUserName } = body;
  
  // Support both registered users and guest users
  if (!userId && !guestToken) {
    return NextResponse.json({ error: "User ID or guest token is required" }, { status: 400 });
  }
  
  try {
    const event = await Event.findById(params.id);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const participantId = userId || guestToken;
    const isGuest = !!guestToken && !userId;
    
    // Check if user/guest is already a participant
    const isParticipant = event.participants?.some((p: any) => p.userId === participantId);
    
    if (isParticipant) {
      console.log(`⚠️ User/guest ${participantId} already joined event ${params.id}`);
      return NextResponse.json({ message: "Already joined", alreadyJoined: true });
    }
    
    // Get user info
    let userName = providedUserName || 'Guest';
    let user = null;
    
    if (!isGuest && userId) {
      user = await User.findById(userId);
      userName = user?.name || user?.username || user?.email || 'Someone';
    } else if (isGuest) {
      // Create or find guest user profile
      user = await User.findOne({ guestToken });
      
      if (!user) {
        console.log(`✨ Creating guest user profile for ${userName}`);
        user = await User.create({
          guestToken,
          name: userName,
          username: userName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
          email: `${guestToken}@guest.vybe.app`,
          isGuest: true,
          stats: {
            eventsJoined: 0,
            eventsCreated: 0,
            totalVotes: 0,
          },
          preferences: {
            notifications: {
              push: false,
              email: false,
              sms: false,
            },
          },
        });
        console.log(`✅ Guest user profile created: ${user._id}`);
      } else {
        console.log(`✅ Found existing guest user profile: ${user._id}`);
        // Update name if changed
        if (user.name !== userName) {
          await User.findByIdAndUpdate(user._id, { name: userName });
        }
      }
    }
    
    // Add user/guest to participants (use atomic operation to prevent duplicates)
    const updateResult = await Event.findOneAndUpdate(
      { 
        _id: params.id,
        'participants.userId': { $ne: participantId } // Only add if not already in array
      },
      {
        $push: {
          participants: {
            userId: participantId,
            userName,
            joinedAt: new Date(),
            role: 'participant',
            isGuest: isGuest
          }
        }
      },
      { new: true }
    );
    
    if (!updateResult) {
      console.log(`⚠️ User/guest ${participantId} already in participants (atomic check)`);
      return NextResponse.json({ message: "Already joined", alreadyJoined: true });
    }
    
    // Update user stats
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { 'stats.eventsJoined': 1 },
        lastActive: new Date()
      });
    }
    
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

