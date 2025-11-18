import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Option from "@/lib/services/models/Option";
import Vote from "@/lib/services/models/Vote";
import Event from "@/lib/services/models/Event";
import UserVotingPreference from "@/lib/services/models/UserVotingPreference";

type Ctx = { params: Promise<{ id: string; optionId: string }> };

// Delete an option
export async function DELETE(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;
    
    console.log(`🗑️ DELETE option request - eventId: ${params.id}, optionId: ${params.optionId}, userId: ${userId}`);
    
    // Find the event to check if user is the host
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    console.log(`🗑️ Event found - hostId: ${event.hostId}, createdBy: ${event.createdBy}`);
    
    // Check if user is the host (check both hostId and createdBy for backwards compatibility)
    if (userId && userId !== event.hostId && userId !== event.createdBy) {
      console.log(`🗑️ Permission denied - userId ${userId} is not host`);
      return NextResponse.json({ error: "Only the event host can delete options" }, { status: 403 });
    }
    
    // Find the option
    const option = await Option.findOne({
      _id: params.optionId,
      eventId: params.id
    });
    
    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }
    
    console.log(`🗑️ Deleting option: ${option.label}`);
    
    // Delete all votes associated with this option (legacy Vote model)
    await Vote.deleteMany({ optionId: params.optionId });
    
    // Delete all voting preferences that include this option
    await UserVotingPreference.updateMany(
      { 
        eventId: params.id,
        'preferences.optionId': params.optionId
      },
      {
        $pull: { preferences: { optionId: params.optionId } }
      }
    );
    
    // Delete the option
    await Option.findByIdAndDelete(params.optionId);
    
    console.log(`✅ Option deleted successfully`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Option and associated votes deleted successfully" 
    });
  } catch (error: any) {
    console.error('Error deleting option:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
