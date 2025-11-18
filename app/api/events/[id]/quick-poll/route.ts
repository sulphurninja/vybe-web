import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/services/models/Event";
import Option from "@/lib/services/models/Option";
import UserVotingPreference from "@/lib/services/models/UserVotingPreference";

type Ctx = { params: Promise<{ id: string }> };

// Get quick poll status and results
export async function GET(_req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  
  const event = await Event.findById(params.id).lean();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  
  // Get all options grouped by category
  const options = await Option.find({ eventId: params.id })
    .sort({ category: 1, order: 1 })
    .lean();
    
  // Get all voting preferences for this quick poll
  const preferences = await UserVotingPreference.find({ 
    eventId: params.id, 
    isQuickPoll: true 
  }).lean();
  
  // Group options by category
  const optionsByCategory = options.reduce((acc: any, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});
  
  // Count unique voters
  const uniqueVoters = new Set(preferences.map(p => p.voterName || p.guestToken || p.deviceId)).size;
  
  return NextResponse.json({
    event,
    optionsByCategory,
    preferences,
    totalVoters: uniqueVoters
  });
}

// Submit ranked preferences for quick poll (all categories at once)
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { voterName, preferences: categoryPreferences } = await req.json();
  
  if (!voterName) {
    return NextResponse.json({ error: "Voter name required" }, { status: 400 });
  }
  
  const event = await Event.findById(params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  
  // Generate a unique guest token for this voter
  const guestToken = `quick_${params.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const results = [];
  
  try {
    // Process each category's ranked preferences
    // categoryPreferences format: { [category]: [{ optionId, rank }, ...] }
    for (const [category, rankings] of Object.entries(categoryPreferences)) {
      // Get option names from database
      const rankedPrefs = [];
      for (const ranking of rankings as any[]) {
        const option = await Option.findById(ranking.optionId);
        if (option) {
          rankedPrefs.push({
            optionId: ranking.optionId,
            optionName: option.label,
            rank: ranking.rank
          });
        }
      }
      
      // Delete existing preference if any
      await UserVotingPreference.deleteOne({
        eventId: params.id,
        voterName,
        category,
        isQuickPoll: true
      });
      
      // Create new preference
      const preference = await UserVotingPreference.create({
        eventId: params.id,
        voterName,
        guestToken,
        deviceId: guestToken, // Use same token for quick polls
        category,
        preferences: rankedPrefs,
        isQuickPoll: true,
        votedAt: new Date()
      });
      
      results.push(preference);
    }
    
    // Update participant voted timestamp
    await Event.updateOne(
      { 
        _id: params.id,
        'quickPollParticipants.name': voterName 
      },
      { 
        $set: { 'quickPollParticipants.$.votedAt': new Date() } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      voterName,
      guestToken,
      preferences: results 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Quick poll submission error:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to submit vote" 
    }, { status: 500 });
  }
}



