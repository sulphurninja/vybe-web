import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import UserVotingPreference from "@/lib/services/models/UserVotingPreference";
import Event from "@/lib/services/models/Event";

type Ctx = { params: Promise<{ id: string }> };

// Get voting status for an event (who voted, who didn't)
export async function GET(req: NextRequest, context: Ctx) {
  await db();
  const params = await context.params;
  const eventId = params.id;

  try {
    console.log(`📊 Fetching voting status for event: ${eventId}`);

    // Get event with participants
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const participants = event.participants || [];
    const votingCategories = event.votingCategories || [];

    // Get all voting preferences for this event
    const allPreferences = await UserVotingPreference.find({ eventId }).lean();

    console.log(`👥 Total participants: ${participants.length}`);
    console.log(`🗳️ Total preferences: ${allPreferences.length}`);

    // Build voting status per category
    const statusByCategory: Record<string, any> = {};

    for (const category of votingCategories) {
      // Get who voted for this category
      const categoryVoters = allPreferences.filter(
        (pref: any) => pref.category === category
      );

      const voterIds = new Set(categoryVoters.map((v: any) => v.userId));

      // Separate participants into voted/not voted
      const voted = participants.filter((p: any) =>
        voterIds.has(p.userId)
      );
      const notVoted = participants.filter((p: any) =>
        !voterIds.has(p.userId)
      );

      statusByCategory[category] = {
        category,
        totalParticipants: participants.length,
        totalVoted: voted.length,
        totalNotVoted: notVoted.length,
        percentageVoted: participants.length > 0
          ? Math.round((voted.length / participants.length) * 100)
          : 0,
        voted: voted.map((p: any) => ({
          userId: p.userId,
          userName: p.userName || "User",
          votedAt: categoryVoters.find((v: any) => v.userId === p.userId)
            ?.updatedAt,
        })),
        notVoted: notVoted.map((p: any) => ({
          userId: p.userId,
          userName: p.userName || "User",
        })),
      };

      console.log(
        `✅ ${category}: ${voted.length}/${participants.length} voted`
      );
    }

    return NextResponse.json({
      eventId,
      statusByCategory,
    });
  } catch (error: any) {
    console.error("Error fetching voting status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch voting status" },
      { status: 500 }
    );
  }
}

