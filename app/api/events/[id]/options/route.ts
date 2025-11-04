import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Option from "@/lib/services/models/Option";
import Event from "@/lib/services/models/Event";
import User from "@/lib/services/models/User";
import Notification from "@/lib/services/models/Notification";
import { sendPushNotification, sendBulkPushNotifications } from "@/lib/services/pushNotifications";

type Ctx = { params: Promise<{ id: string }> };

// Get all options for an event (with optional category filter)
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  
  const query: any = { eventId: params.id };
  if (category) {
    query.category = category;
  }
  
  const options = await Option.find(query)
    .sort({ category: 1, order: 1, createdAt: 1 })
    .lean();
    
  return NextResponse.json({ options });
}

// Create a new option
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const body = await req.json();
  
  console.log(`\n=== ADDING OPTION TO EVENT ${params.id} ===`);
  console.log(`Creator: ${body.createdBy}`);
  console.log(`Category: ${body.category}`);
  console.log(`Label: ${body.label}`);
  
  // Verify event exists
  const event = await Event.findById(params.id);
  if (!event) {
    console.error(`❌ Event not found: ${params.id}`);
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  
  console.log(`✅ Event found: ${event.title}`);
  console.log(`📍 Event participants: ${event.participants?.length || 0}`);
  console.log(`👥 Participant IDs: ${event.participants?.map((p: any) => p.userId).join(', ') || 'none'}`);
  
  const option = await Option.create({
    eventId: params.id,
    category: body.category || "general",
    label: body.label,
    description: body.description,
    dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
    venue: body.venue,
    createdBy: body.createdBy,
    order: body.order || 0,
  });
  
  console.log(`✅ Option created: ${option._id}`);
  
  // Create notifications for all participants except the option creator
  try {
    const participantUserIds = event.participants?.map((p: any) => p.userId) || [];
    console.log(`\n🔍 Looking for participants to notify...`);
    console.log(`   Total participants in event: ${participantUserIds.length}`);
    console.log(`   Creator (will be excluded): ${body.createdBy}`);
    
    // Build the query more explicitly
    const query: any = {
      _id: { $in: participantUserIds }
    };
    
    // Exclude the creator from notifications
    if (body.createdBy) {
      query._id.$ne = body.createdBy;
    }
    
    console.log(`📋 Database query:`, JSON.stringify(query, null, 2));
    
    const participants = await User.find(query);
    
    console.log(`✅ Found ${participants.length} users to notify`);
    participants.forEach(p => {
      console.log(`   - ${p.name || p.username} (${p._id})`);
    });

    const creatorUser = await User.findById(body.createdBy);
    const creatorName = creatorUser?.name || creatorUser?.username || 'Someone';
    
    console.log(`👤 Option creator: ${creatorName}`);

    // Determine category label for better messaging
    const categoryLabels: Record<string, string> = {
      place: '📍 Venue',
      location: '🏠 Location',
      date_time: '📅 Date & Time',
      cuisine: '🍽️ Cuisine Type',
      general: '✨ Option',
    };

    const categoryLabel = categoryLabels[body.category] || '📌 New option';

    if (participants.length > 0) {
      console.log(`\n📬 Creating option_added notifications for ${participants.length} participants`);

      // Create notifications and collect push tokens
      const pushTokens: string[] = [];

      for (const participant of participants) {
        const notification = await Notification.create({
          userId: participant._id,
          type: 'option_added',
          title: '📍 New option added',
          message: `${categoryLabel} "${option.label}" added to "${event.title}"`,
          eventId: params.id,
          optionId: option._id,
          fromUserId: body.createdBy,
          fromUserName: creatorName,
          actionUrl: `/event/${params.id}`,
          read: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        
        console.log(`   ✅ Created notification for ${participant.name || participant.username} (${participant._id})`);

        // Collect push tokens if notifications enabled
        if (
          participant.expoPushToken &&
          participant.preferences?.notifications?.push
        ) {
          pushTokens.push(participant.expoPushToken);
          console.log(`   🔔 Push token found for ${participant.name || participant.username}`);
        } else {
          if (!participant.expoPushToken) {
            console.log(`   ⚠️  No push token for ${participant.name || participant.username}`);
          }
          if (!participant.preferences?.notifications?.push) {
            console.log(`   🔕 Push notifications disabled for ${participant.name || participant.username}`);
          }
        }
      }

      // Send bulk push notifications
      if (pushTokens.length > 0) {
        console.log(`\n📱 Sending ${pushTokens.length} push notifications...`);
        await sendBulkPushNotifications(
          pushTokens,
          '📍 New option',
          `"${option.label}" added to "${event.title}"`,
          {
            type: 'option_added',
            eventId: params.id,
            optionId: option._id,
          }
        );
      } else {
        console.log(`\n⚠️  No push tokens available to send`);
      }
    } else {
      console.log(`⚠️  No participants found to notify`);
    }

    // Also notify host if they didn't create this option
    if (event.createdBy !== body.createdBy) {
      console.log(`\n👑 Notifying host separately...`);
      const host = await User.findById(event.createdBy || event.hostId);
      
      if (host) {
        const hostNotif = await Notification.create({
          userId: host._id,
          type: 'option_added',
          title: '📍 New option added',
          message: `${creatorName} added ${categoryLabel.toLowerCase()} "${option.label}"`,
          eventId: params.id,
          optionId: option._id,
          fromUserId: body.createdBy,
          fromUserName: creatorName,
          actionUrl: `/event/${params.id}`,
          read: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        
        console.log(`   ✅ Created host notification for ${host.name || host.username}`);

        // Send push to host
        if (host.expoPushToken && host.preferences?.notifications?.push) {
          console.log(`   📱 Sending host push notification...`);
          await sendPushNotification(
            host.expoPushToken,
            '📍 New option',
            `"${option.label}" added to "${event.title}"`,
            {
              type: 'option_added',
              eventId: params.id,
              optionId: option._id,
            }
          );
        } else {
          console.log(`   ⚠️  Host has no push token or notifications disabled`);
        }
      } else {
        console.log(`   ❌ Host not found`);
      }
    } else {
      console.log(`\n👤 Option creator is the host, skipping duplicate notification`);
    }
    
    console.log(`\n=== OPTION CREATION COMPLETE ===\n`);
  } catch (error) {
    console.error('❌ Error creating notifications for option:', error);
    // Don't fail the request if notifications fail
  }
  
  return NextResponse.json(option, { status: 201 });
}

