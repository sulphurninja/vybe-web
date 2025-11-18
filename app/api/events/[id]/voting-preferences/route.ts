import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import UserVotingPreferenceModel from "@/lib/services/models/UserVotingPreference";
import EventModel from "@/lib/services/models/Event";

/**
 * POST /api/events/[id]/voting-preferences
 * Submit ranked voting preferences for an event's voting options
 * 
 * Request body:
 * {
 *   eventId: string,
 *   category: "location" | "date_time" | "cuisine" | "place",
 *   preferences: [
 *     { optionId: string, optionName: string, rank: number },
 *     ...
 *   ],
 *   userId?: string,           // For registered users
 *   voterName?: string,        // For quick polls
 *   deviceId?: string,         // For quick polls (pass the phone)
 *   guestToken?: string,       // For guest voting
 *   isQuickPoll?: boolean      // If this is a quick poll vote
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();

    const { id: eventId } = await params;
    const body = await req.json();

    const {
      category = "general",
      preferences,
      userId,
      voterName,
      deviceId,
      guestToken,
      isQuickPoll = false,
    } = body;

    console.log(`💬 Voting preference received for event ${eventId}, category: ${category}`);

    // Validation
    if (!eventId) {
      console.log('❌ Event ID missing in voting preference');
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      return NextResponse.json(
        { error: "Preferences array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Verify all preferences have required fields
    for (const pref of preferences) {
      if (!pref.optionId || pref.rank === undefined) {
        return NextResponse.json(
          { error: "Each preference must have optionId and rank" },
          { status: 400 }
        );
      }
    }

    // Verify we have a voter identifier
    if (!userId && !guestToken && !deviceId && !voterName) {
      return NextResponse.json(
        { error: "Must provide userId, guestToken, deviceId, or voterName" },
        { status: 400 }
      );
    }

    // For standard voting, ensure one preference set per user
    if (!isQuickPoll) {
      // Delete previous preferences for this user/category if updating
      if (userId) {
        await UserVotingPreferenceModel.deleteMany({
          eventId,
          category,
          userId,
          isQuickPoll: false,
        });
      } else if (guestToken) {
        await UserVotingPreferenceModel.deleteMany({
          eventId,
          category,
          guestToken,
          isQuickPoll: false,
        });
      }
    }

    // Create new preference record
    const preferenceRecord = await UserVotingPreferenceModel.create({
      eventId,
      category,
      userId: userId || null,
      voterName: voterName || null,
      deviceId: deviceId || null,
      guestToken: guestToken || null,
      preferences,
      isQuickPoll,
      votedAt: new Date(),
    });

    console.log(`✅ Preference recorded for event ${eventId}, category ${category}:`, {
      isQuickPoll,
      voterIdentifier: userId || guestToken || deviceId || voterName,
      preferencesCount: preferences.length,
    });

    return NextResponse.json(preferenceRecord, { status: 201 });
  } catch (error) {
    console.error("❌ Error recording voting preference:", error);
    return NextResponse.json(
      { error: "Failed to record voting preference" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[id]/voting-preferences
 * Get all voting preferences for an event (for result calculation)
 * 
 * Query params:
 * - category: filter by category
 * - isQuickPoll: filter by quick poll status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id: eventId } = params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isQuickPoll = searchParams.get("isQuickPoll") === "true";

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Build query
    const query: any = { eventId };
    if (category) query.category = category;
    if (searchParams.has("isQuickPoll")) query.isQuickPoll = isQuickPoll;

    const preferences = await UserVotingPreferenceModel.find(query).lean();

    console.log(`📊 Retrieved ${preferences.length} preference records for event ${eventId}`);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("❌ Error fetching voting preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch voting preferences" },
      { status: 500 }
    );
  }
}

