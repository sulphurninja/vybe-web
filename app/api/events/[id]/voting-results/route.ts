import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import UserVotingPreferenceModel from "@/lib/services/models/UserVotingPreference";
import EventModel from "@/lib/services/models/Event";
import Option from "@/lib/services/models/Option";

interface OptionScore {
  optionId: string;
  optionName: string;
  bordaScore: number;
  totalVotes: number;
  rank: number;
  preferenceBreakdown: { [key: string]: number };
  percentage: number;
  venue?: any; // Include venue data
}

/**
 * Calculate Borda Count scores for voting options
 * Used for both quick polls and online voting
 * 
 * Borda Count: 
 * - 1st preference: N points (N = number of options)
 * - 2nd preference: N-1 points
 * - ...
 * - Last preference: 1 point
 */
function calculateBordaScores(preferences: any[]): OptionScore[] {
  if (preferences.length === 0) {
    return [];
  }

  // Get unique options and count
  const optionMap = new Map<string, { name: string; scores: number[] }>();

  for (const pref of preferences) {
    const numOptions = pref.preferences?.length || 1;

    for (const preference of pref.preferences || []) {
      const { optionId, optionName, rank } = preference;

      if (!optionMap.has(optionId)) {
        optionMap.set(optionId, { 
          name: optionName, 
          scores: [] 
        });
      }

      // Borda score: numOptions - rank + 1
      // (rank 1 = numOptions points, rank N = 1 point)
      const bordaScore = numOptions - rank + 1;
      optionMap.get(optionId)!.scores.push(bordaScore);
    }
  }

  // Calculate totals and percentages
  const optionScores: OptionScore[] = [];
  let totalBordaPoints = 0;

  for (const [optionId, data] of optionMap) {
    const totalScore = data.scores.reduce((a, b) => a + b, 0);
    totalBordaPoints += totalScore;

    optionScores.push({
      optionId,
      optionName: data.name,
      bordaScore: totalScore,
      totalVotes: data.scores.length,
      rank: 0, // Will be set after sorting
      preferenceBreakdown: {},
      percentage: 0, // Will be calculated
    });
  }

  // Sort by Borda score descending
  optionScores.sort((a, b) => b.bordaScore - a.bordaScore);

  // Assign ranks and calculate percentages
  for (let i = 0; i < optionScores.length; i++) {
    optionScores[i].rank = i + 1;
    optionScores[i].percentage =
      totalBordaPoints > 0
        ? (optionScores[i].bordaScore / totalBordaPoints) * 100
        : 0;
  }

  // Calculate preference breakdown
  for (const pref of preferences) {
    const numOptions = pref.preferences?.length || 1;

    for (const preference of pref.preferences || []) {
      const option = optionScores.find(
        (o) => o.optionId === preference.optionId
      );
      if (option) {
        const rankKey = `rank${preference.rank}`;
        option.preferenceBreakdown[rankKey] =
          (option.preferenceBreakdown[rankKey] || 0) + 1;
      }
    }
  }

  return optionScores;
}

/**
 * Detect ties and apply tie-breaking logic
 */
function breakTies(
  optionScores: OptionScore[],
  preferences: any[]
): {
  winner: OptionScore | null;
  isTied: boolean;
  tieBreaker: string | null;
} {
  if (optionScores.length === 0) {
    return { winner: null, isTied: false, tieBreaker: null };
  }

  const topScore = optionScores[0].bordaScore;
  const tiedOptions = optionScores.filter(
    (o) => o.bordaScore === topScore
  );

  if (tiedOptions.length === 1) {
    return {
      winner: tiedOptions[0],
      isTied: false,
      tieBreaker: null,
    };
  }

  // Tie-breaking logic: use weighted preference score
  // Weight: 1st preference = 1.5x, 2nd preference = 1.0x, etc.
  console.log(`🤝 Tie detected between ${tiedOptions.length} options`);

  const tieScores = new Map<string, number>();

  for (const tiedOption of tiedOptions) {
    let weightedScore = 0;
    let totalPrefs = 0;

    for (const pref of preferences) {
      for (const preference of pref.preferences || []) {
        if (preference.optionId === tiedOption.optionId) {
          totalPrefs++;
          // Weight: 1st = 3, 2nd = 2, 3rd = 1
          const weight = Math.max(1, 4 - preference.rank);
          weightedScore += weight;
        }
      }
    }

    if (totalPrefs > 0) {
      tieScores.set(tiedOption.optionId, weightedScore);
    }
  }

  // Find winner by weighted score
  let bestOption = tiedOptions[0];
  let bestScore = tieScores.get(tiedOptions[0].optionId) || 0;

  for (const option of tiedOptions) {
    const score = tieScores.get(option.optionId) || 0;
    if (score > bestScore) {
      bestScore = score;
      bestOption = option;
    }
  }

  return {
    winner: bestOption,
    isTied: true,
    tieBreaker:
      tiedOptions.length > 1
        ? `Tie between ${tiedOptions.length} options, broken by preference distribution`
        : "Borda count",
  };
}

/**
 * GET /api/events/[id]/voting-results
 * Calculate and return current voting results with Borda scores
 * 
 * Query params:
 * - category: specific category to calculate (optional)
 * - calculateWinner: if true, finalize results (default: false)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();

    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const calculateWinner = searchParams.get("calculateWinner") === "true";

    console.log(`📊 Voting results requested for event: ${eventId}`);

    if (!eventId) {
      console.log('❌ Event ID missing');
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch event to get voting categories
    const event = await EventModel.findOne({ _id: eventId }).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isQuickPoll = event.quickPollEnabled || false;
    console.log(`📊 Event voting mode: ${isQuickPoll ? 'Quick Poll' : 'Online Voting'}`);

    // Fetch preferences for both modes (both use ranked voting now)
    const query: any = { eventId };
    if (category) query.category = category;
    
    if (isQuickPoll) {
      query.isQuickPoll = true;
    }

    const allPreferences = await UserVotingPreferenceModel.find(query).lean();
    console.log(`📊 Found ${allPreferences.length} preferences for ${isQuickPoll ? 'quick poll' : 'online voting'}`);

    // Group preferences by category
    const resultsByCategory: { [key: string]: any } = {};

    // Get categories from event or from preferences
    let categories: string[];
    if (category) {
      categories = [category];
    } else if (event.votingCategories && event.votingCategories.length > 0) {
      // Use categories from event
      categories = event.votingCategories;
    } else {
      // Fallback to categories from preferences
      categories = [...new Set(allPreferences.map((p) => p.category))];
    }

    for (const cat of categories) {
      const categoryData = allPreferences.filter(p => p.category === cat);

      // Fetch category options
      const categoryOptions = await Option.find({
        eventId: eventId,
        category: cat
      }).lean();

      // If no votes yet, create option scores with 0 votes
      let optionScores: OptionScore[];
      
      if (categoryData.length === 0) {
        console.log(`📋 Category ${cat} has ${categoryOptions.length} options but no votes`);
        
        // Create option scores with 0 votes
        optionScores = categoryOptions.map((opt: any, idx: number) => {
          const optScore: any = {
            optionId: opt._id?.toString() || opt.id || opt.label,
            optionName: opt.label,
            bordaScore: 0,
            totalVotes: 0,
            rank: idx + 1,
            preferenceBreakdown: {},
            percentage: 0,
          };
          
          // Include venue data if it exists
          if (opt.venue) {
            optScore.venue = {
              photoUrl: opt.venue.photoUrl,
              address: opt.venue.address,
              city: opt.venue.city,
              name: opt.venue.name,
              placeId: opt.venue.placeId,
              rating: opt.venue.rating,
              priceLevel: opt.venue.priceLevel,
              photos: opt.venue.photos,
              latitude: opt.venue.latitude,
              longitude: opt.venue.longitude,
              coordinates: opt.venue.coordinates,
            };
          }
          
          return optScore;
        });
        
        resultsByCategory[cat] = {
          category: cat,
          totalVoters: 0,
          optionScores,
          winner: null,
          isTied: false,
          tieBreaker: null,
          status: "no_votes",
        };
        continue;
      }

      // Calculate Borda scores (both modes use ranked voting now)
      optionScores = calculateBordaScores(categoryData);
      
      console.log(`📊 ${isQuickPoll ? 'Quick poll' : 'Online'} Borda scores for ${cat}:`, optionScores.map(s => ({
        option: s.optionName,
        bordaScore: s.bordaScore,
        totalVotes: s.totalVotes,
        percentage: s.percentage.toFixed(1) + '%'
      })));
      
      // Create multiple maps for flexible lookup
      const venueMapById = new Map(categoryOptions.map(opt => [
        opt._id?.toString(),
        opt.venue
      ]));
      
      const venueMapByLabel = new Map(categoryOptions.map(opt => [
        opt.label,
        opt.venue
      ]));
      
      optionScores = optionScores.map(score => {
        console.log(`🔍 Looking for venue data for optionId: ${score.optionId} (${score.optionName})`);
        
        // Try multiple ways to find the venue data
        let venue = venueMapById.get(score.optionId);
        
        if (!venue) {
          // Try by label if optionId didn't match
          venue = venueMapByLabel.get(score.optionName);
          console.log(`🔍 Label lookup for "${score.optionName}": ${venue ? 'FOUND' : 'NOT FOUND'}`);
        }
        
        if (venue) {
          console.log(`✅ Found venue for ${score.optionName}:`, {
            photoUrl: venue.photoUrl,
            address: venue.address,
            coordinates: venue.coordinates,
          });
          
          return {
            ...score,
            venue: {
              photoUrl: venue.photoUrl,
              address: venue.address,
              city: venue.city,
              name: venue.name,
              placeId: venue.placeId,
              rating: venue.rating,
              priceLevel: venue.priceLevel,
              photos: venue.photos,
              latitude: venue.latitude,
              longitude: venue.longitude,
              coordinates: venue.coordinates,
            }
          };
        }
        
        console.log(`⚠️ No venue found for ${score.optionName}`);
        return score;
      });

      // Break ties if calculating winner (both modes use Borda count now)
      let winner = null;
      let isTied = false;
      let tieBreaker = null;

      if (calculateWinner) {
        const tieResult = breakTies(optionScores, categoryData);
        winner = tieResult.winner ? {
          optionId: tieResult.winner.optionId,
          optionName: tieResult.winner.optionName,
          score: tieResult.winner.bordaScore,
          percentage: tieResult.winner.percentage.toFixed(2),
          explanation: tieResult.tieBreaker,
        } : null;
        isTied = tieResult.isTied;
        tieBreaker = tieResult.tieBreaker;
      }

      console.log(`✅ Enriched option scores for ${cat}:`, JSON.stringify(optionScores.map(s => ({
        optionId: s.optionId,
        optionName: s.optionName,
        hasVenue: !!s.venue,
        venuePhotoUrl: s.venue?.photoUrl,
        venueAddress: s.venue?.address,
        venueCoordinates: s.venue?.coordinates,
      })), null, 2));

      // Calculate total voters (both modes use preferences now)
      const totalVoters = new Set(categoryData.map((p: any) => p.userId || p.guestToken || p.deviceId || p.voterName).filter(Boolean)).size;

      resultsByCategory[cat] = {
        category: cat,
        totalVoters,
        optionScores,
        winner,
        isTied,
        tieBreaker,
        status: calculateWinner ? "finalized" : "voting_active",
      };
    }

    console.log(`📊 Voting results calculated for event ${eventId}:`, {
      categories: Object.keys(resultsByCategory),
      calculateWinner,
    });

    return NextResponse.json(resultsByCategory);
  } catch (error: any) {
    console.error("❌ Error calculating voting results:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    return NextResponse.json(
      { error: "Failed to calculate voting results", details: error?.message },
      { status: 500 }
    );
  }
}

