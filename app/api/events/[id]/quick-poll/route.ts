import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/models/Event";
import Option from "@/lib/models/Option";
import Vote from "@/lib/models/Vote";

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
    
  // Get all votes
  const votes = await Vote.find({ eventId: params.id, isQuickPoll: true }).lean();
  
  // Group options by category
  const optionsByCategory = options.reduce((acc: any, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});
  
  return NextResponse.json({
    event,
    optionsByCategory,
    votes,
    totalVoters: new Set(votes.map(v => v.voterName || v.guestToken)).size
  });
}

// Submit a complete quick poll vote (all categories at once)
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { voterName, votes: voteChoices } = await req.json();
  
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
    // Process each category vote
    for (const { category, optionId } of voteChoices) {
      // Check if a vote already exists for this combination
      const existingVote = await Vote.findOne({
        eventId: params.id,
        category,
        guestToken
      });
      
      // If there's an existing vote for a different option, decrement that option's count
      if (existingVote && existingVote.optionId.toString() !== optionId) {
        await Option.findByIdAndUpdate(existingVote.optionId, {
          $inc: { votes: -1 },
          $pull: { voters: { voterId: guestToken } }
        });
      }
      
      // Create or update vote
      const vote = await Vote.findOneAndUpdate(
        { eventId: params.id, category, guestToken },
        {
          eventId: params.id,
          category,
          optionId,
          voterName,
          guestToken,
          isQuickPoll: true,
          castAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      // Only increment if this is a new vote or changed vote
      if (!existingVote || existingVote.optionId.toString() !== optionId) {
        await Option.findByIdAndUpdate(optionId, {
          $inc: { votes: 1 },
          $addToSet: {
            voters: {
              voterId: guestToken,
              voterName,
              votedAt: new Date()
            }
          }
        });
      }
      
      results.push(vote);
    }
    
    return NextResponse.json({ 
      success: true, 
      voterName,
      guestToken,
      votes: results 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Quick poll submission error:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to submit vote" 
    }, { status: 500 });
  }
}



