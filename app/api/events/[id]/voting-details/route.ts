import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import UserVotingPreference from "@/lib/services/models/UserVotingPreference";
import Event from "@/lib/services/models/Event";

type Ctx = { params: Promise<{ id: string }> };

// Get detailed voting data (who voted for which options)
export async function GET(req: NextRequest, context: Ctx) {
  await db();
  const params = await context.params;
  const eventId = params.id;

  try {
    console.log(`📊 Fetching voting details for event: ${eventId}`);

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all voting preferences for this event
    const allPreferences = await UserVotingPreference.find({ eventId }).lean();

    console.log(`🗳️ Total voting preferences: ${allPreferences.length}`);

    // Build detailed voting data per category
    const detailsByCategory: Record<string, any> = {};

    for (const category of event.votingCategories || []) {
      // Get preferences for this category
      const categoryPrefs = allPreferences.filter(
        (pref: any) => pref.category === category
      );

      // Build map of option -> voters
      const optionVoters: Record<string, any[]> = {};

      categoryPrefs.forEach((pref: any) => {
        if (!pref.preferences || !Array.isArray(pref.preferences)) return;

        pref.preferences.forEach((choice: any) => {
          const optionKey = choice.optionName || choice.optionId;
          
          if (!optionVoters[optionKey]) {
            optionVoters[optionKey] = [];
          }

          // Find participant info
          const participant = event.participants?.find(
            (p: any) => p.userId === pref.userId
          );

          optionVoters[optionKey].push({
            userId: pref.userId,
            userName: participant?.userName || pref.voterName || "User",
            rank: choice.rank,
            isGuest: !!pref.guestToken,
          });
        });
      });

      // Sort voters by rank for each option
      Object.keys(optionVoters).forEach((optionKey) => {
        optionVoters[optionKey].sort((a, b) => a.rank - b.rank);
      });

      detailsByCategory[category] = {
        category,
        optionVoters,
        totalVoters: categoryPrefs.length,
      };

      console.log(
        `✅ ${category}: ${Object.keys(optionVoters).length} options with votes`
      );
    }

    return NextResponse.json({
      eventId,
      detailsByCategory,
    });
  } catch (error: any) {
    console.error("Error fetching voting details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch voting details" },
      { status: 500 }
    );
  }
}

