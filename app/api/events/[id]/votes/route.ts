import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Vote from "@/lib/models/Vote";
import Option from "@/lib/models/Option";
import User from "@/lib/models/User";

type Ctx = { params: Promise<{ id: string }> };

// Get votes for an event
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  
  const query: any = { eventId: params.id };
  if (category) {
    query.category = category;
  }
  
  const votes = await Vote.find(query).lean();
  return NextResponse.json({ votes });
}

// Cast or update a vote
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { 
    optionId, 
    category = "general",
    voterId, 
    voterName,
    guestToken,
    isQuickPoll = false 
  } = await req.json();
  
  const filter: any = { 
    eventId: params.id, 
    category,
    ...(voterId ? { voterId } : { guestToken }) 
  };
  
  // Check if user already voted in this category
  const existingVote = await Vote.findOne(filter);
  
  // Update or create vote
  const doc = await Vote.findOneAndUpdate(
    filter,
    { 
      ...filter, 
      optionId, 
      voterName,
      isQuickPoll,
      castAt: new Date() 
    },
    { upsert: true, new: true }
  );
  
  // Update vote counts on options
  if (existingVote && existingVote.optionId.toString() !== optionId) {
    // User changed their vote - decrement old option
    await Option.findByIdAndUpdate(existingVote.optionId, { 
      $inc: { votes: -1 },
      $pull: { voters: { voterId: voterId || guestToken } }
    });
  }
  
  const isNewVote = !existingVote;
  const isChangedVote = existingVote && existingVote.optionId.toString() !== optionId;
  
  if (isNewVote || isChangedVote) {
    // New vote or changed vote - increment new option
    await Option.findByIdAndUpdate(optionId, { 
      $inc: { votes: 1 },
      $addToSet: { 
        voters: { 
          voterId: voterId || guestToken,
          voterName,
          votedAt: new Date()
        } 
      }
    });
    
    // Update user stats if logged in user
    if (voterId && isNewVote) {
      await User.findByIdAndUpdate(voterId, {
        $inc: { 'stats.totalVotes': 1 },
        lastActive: new Date()
      });
    }
  }
  
  return NextResponse.json(doc, { status: 201 });
}
