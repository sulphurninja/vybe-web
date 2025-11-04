import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/services/models/Event";
import Option from "@/lib/services/models/Option";
import User from "@/lib/services/models/User";
import { generateEventCover } from "@/lib/services/imageCollage";

export async function GET() {
  await db();
  const events = await Event.find().sort({ createdAt: -1 }).limit(50).lean();
  
  console.log(`📍 Fetching ${events.length} events with location data...`);
  
  // Add top voted venue image and log location info
  const eventsWithCovers = await Promise.all(
    events.map(async (event) => {
      const options = await Option.find({ eventId: event._id.toString() })
        .sort({ votes: -1 })
        .lean();
      
      // Get the top voted venue option
      const topVenueOption = options.find(opt => opt.venue && opt.venue.photoUrl);
      
      // Log location info for debugging
      if (event.location?.latitude && event.location?.longitude) {
        console.log(`   ✅ ${event.title}: location ${event.location.latitude}, ${event.location.longitude}`);
      } else {
        console.log(`   ⚠️  ${event.title}: NO LOCATION DATA`);
      }
      
      return {
        ...event,
        topVenueImage: topVenueOption?.venue?.photoUrl || null,
      };
    })
  );
  
  console.log(`✅ Returning ${eventsWithCovers.length} events with location data`);
  return NextResponse.json({ events: eventsWithCovers });
}

export async function POST(req: Request) {
  await db();
  const body = await req.json();
  
  console.log('🎯 Creating event with body:', JSON.stringify(body, null, 2));
  
  // Determine voting categories based on event type
  let votingCategories = ["place", "date_time"];
  if (body.type === "house_party") {
    votingCategories = ["location", "date_time", "cuisine"];
  }
  
  const eventData: any = {
    hostId: body.hostId,
    type: body.type,
    title: body.title,
    description: body.description,
    dateTimeStart: new Date(body.dateTimeStart),
    city: body.city,
    area: body.area,
    votingMode: body.votingMode || "standard",
    votingCategories: body.votingCategories || votingCategories,
    quickPollEnabled: body.quickPollEnabled || false,
    allowAnonymousVoting: body.allowAnonymousVoting !== false,
  };
  
  // Add location data if provided
  if (body.location && body.location.latitude && body.location.longitude) {
    eventData.location = {
      latitude: body.location.latitude,
      longitude: body.location.longitude,
      address: body.location.address || null,
    };
    console.log('📍 Location data added:', eventData.location);
  } else if (body.latitude && body.longitude) {
    // Support legacy format
    eventData.location = {
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address || null,
    };
    console.log('📍 Location data added (legacy format):', eventData.location);
  } else {
    console.log('⚠️ No location data provided for event');
  }
  
  // Track user if logged in
  if (body.userId) {
    console.log('✅ User ID found, setting createdBy:', body.userId);
    eventData.createdBy = body.userId;
    eventData.participants = [{
      userId: body.userId,
      role: 'host',
      joinedAt: new Date()
    }];
    
    // Update user stats
    await User.findByIdAndUpdate(body.userId, {
      $inc: { 'stats.eventsCreated': 1 },
      lastActive: new Date()
    });
    console.log('✅ Updated user stats for:', body.userId);
  } else {
    console.log('⚠️ No userId provided in request body');
  }
  
  console.log('🎯 Final event data:', JSON.stringify(eventData, null, 2));
  const created = await Event.create(eventData);
  console.log('✅ Event created:', created._id);
  
  return NextResponse.json(created, { status: 201 });
}

