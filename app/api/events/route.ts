import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/services/models/Event";
import Option from "@/lib/services/models/Option";
import User from "@/lib/services/models/User";
import { generateEventCover } from "@/lib/services/imageCollage";

export async function GET(req: Request) {
  await db();
  
  // Get userId from query params to filter user's events
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  // Build query - filter by user if provided
  let query: any = {};
  if (userId) {
    // Find events where user is creator OR participant
    query = {
      $or: [
        { createdBy: userId },
        { 'participants.userId': userId }
      ]
    };
    console.log(`📍 Fetching events for user: ${userId}`);
  } else {
    console.log(`📍 Fetching all events (no userId filter)`);
  }
  
  const events = await Event.find(query).sort({ createdAt: -1 }).limit(50).lean();
  
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
  
  // PHASE 2: Validate required fields
  if (!body.title || !body.type) {
    return NextResponse.json(
      { error: "Title and type are required" },
      { status: 400 }
    );
  }
  
  if (!body.votingCategories || body.votingCategories.length === 0) {
    return NextResponse.json(
      { error: "At least one voting category is required" },
      { status: 400 }
    );
  }
  
  // PHASE 2: Build event data (location and dateTimeStart are now optional - decided by voting)
  const eventData: any = {
    hostId: body.hostId,
    type: body.type,
    title: body.title,
    description: body.description || "",
    votingMode: body.votingMode || "standard",
    votingCategories: body.votingCategories, // PHASE 2: User provides this (not auto-determined)
    quickPollEnabled: body.quickPollEnabled || false,
    allowAnonymousVoting: body.allowAnonymousVoting !== false,
    status: "voting",
  };
  
  // PHASE 2: Only add dateTimeStart if provided (optional now)
  if (body.dateTimeStart) {
    eventData.dateTimeStart = new Date(body.dateTimeStart);
    console.log('📅 Date/Time provided:', eventData.dateTimeStart);
  } else {
    console.log('📅 Date/Time will be decided by voting');
  }
  
  // PHASE 2: Only add location data if provided (optional now)
  if (body.location && body.location.latitude && body.location.longitude) {
    eventData.location = {
      latitude: body.location.latitude,
      longitude: body.location.longitude,
      address: body.location.address || null,
    };
    console.log('📍 Location data added:', eventData.location);
  } else if (body.latitude && body.longitude) {
    eventData.location = {
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address || null,
    };
    console.log('📍 Location data added (legacy format):', eventData.location);
  } else {
    console.log('📍 Location will be decided by voting');
  }
  
  // PHASE 2: Add invited participants (standard mode)
  if (body.invitedParticipants && Array.isArray(body.invitedParticipants)) {
    eventData.invitedParticipants = body.invitedParticipants.map((p: any) => ({
      userId: p.userId,
      email: p.email,
      invitedAt: new Date(),
    }));
    console.log('👥 Invited participants:', eventData.invitedParticipants.length);
  }
  
  // PHASE 2: Add quick poll participants (quick poll mode)
  if (body.quickPollEnabled && body.quickPollParticipants && Array.isArray(body.quickPollParticipants)) {
    eventData.quickPollParticipants = body.quickPollParticipants.map((name: string) => ({
      name,
    }));
    console.log('🎮 Quick poll participants:', eventData.quickPollParticipants.length);
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
    
    // Fetch user's name
    const user = await User.findById(body.userId).select('name username email').lean();
    if (user) {
      const userName = user.name || user.username || user.email || 'Creator';
      eventData.createdByName = userName;
      // Update participants to include creator's name
      eventData.participants = [{
        userId: body.userId,
        userName,
        role: 'host',
        joinedAt: new Date()
      }];
      console.log('✅ Set creator name:', userName);
    }
    
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
  
  // PHASE 2: Create Option documents from votingOptions
  if (body.votingOptions && Object.keys(body.votingOptions).length > 0) {
    console.log('🎯 Creating voting options from:', body.votingOptions);
    
    try {
      const optionsToCreate = [];
      
      for (const [category, options] of Object.entries(body.votingOptions)) {
        console.log(`📋 Processing ${category} category with ${Array.isArray(options) ? options.length : 0} options`);
        
        if (Array.isArray(options)) {
          options.forEach((opt: any) => {
            console.log(`🔍 Raw option received for ${category}:`, {
              label: opt.label,
              hasVenue: !!opt.venue,
              venuePhotoUrl: opt.venue?.photoUrl,
              venueAddress: opt.venue?.address,
              venueCoordinates: opt.venue?.coordinates,
              allKeys: Object.keys(opt),
            });
            
            const optionData: any = {
              eventId: created._id.toString(),
              category: category,
              label: opt.label || opt.name || (typeof opt === 'string' ? opt : 'Option'),
              votes: 0,
            };

            // Store venue data if it exists (for place/location categories)
            if (opt.venue && typeof opt.venue === 'object') {
              const venueObj: any = {};
              
              // Only store fields that actually exist and have values
              if (opt.venue.name) venueObj.name = opt.venue.name;
              if (opt.venue.address) venueObj.address = opt.venue.address;
              if (opt.venue.city) venueObj.city = opt.venue.city;
              if (opt.venue.placeId) venueObj.placeId = opt.venue.placeId;
              if (opt.venue.rating) venueObj.rating = opt.venue.rating;
              if (opt.venue.priceLevel) venueObj.priceLevel = opt.venue.priceLevel;
              if (opt.venue.photoUrl) venueObj.photoUrl = opt.venue.photoUrl;
              if (opt.venue.photos && Array.isArray(opt.venue.photos) && opt.venue.photos.length > 0) venueObj.photos = opt.venue.photos;
              
              // Handle coordinates - try multiple formats
              const lat = opt.venue.latitude || opt.venue.coordinates?.lat;
              const lng = opt.venue.longitude || opt.venue.coordinates?.lng;
              
              if (lat) venueObj.latitude = lat;
              if (lng) venueObj.longitude = lng;
              
              if (lat && lng) {
                venueObj.coordinates = {
                  lat: lat,
                  lng: lng,
                };
              } else if (opt.venue.coordinates && opt.venue.coordinates.lat && opt.venue.coordinates.lng) {
                venueObj.coordinates = opt.venue.coordinates;
              }
              
              if (Object.keys(venueObj).length > 0) {
                optionData.venue = venueObj;
                console.log(`✅ Storing venue data for ${opt.label}:`, {
                  hasPhotoUrl: !!venueObj.photoUrl,
                  hasAddress: !!venueObj.address,
                  hasCoordinates: !!venueObj.coordinates,
                  fullVenue: venueObj,
                });
              } else {
                console.log(`⚠️ Venue object exists but is empty for ${opt.label}`);
              }
            } else {
              console.log(`⚠️ No venue data found for ${opt.label}`);
            }

            // Store date/time data if it exists
            if (opt.dateTime) optionData.dateTime = opt.dateTime;
            if (opt.date) optionData.date = opt.date;
            if (opt.time) optionData.time = opt.time;
            if (opt.startDate) optionData.startDate = opt.startDate;
            if (opt.endDate) optionData.endDate = opt.endDate;

            optionsToCreate.push(optionData);
          });
        }
      }
      
      if (optionsToCreate.length > 0) {
        const createdOptions = await Option.insertMany(optionsToCreate);
        console.log(`✅ Created ${createdOptions.length} voting options`);
      }
    } catch (optionError: any) {
      console.error('⚠️ Error creating voting options:', optionError);
      // Don't fail the event creation if options fail
    }
  } else {
    console.log('ℹ️ No voting options provided');
  }
  
  return NextResponse.json(created, { status: 201 });
}

