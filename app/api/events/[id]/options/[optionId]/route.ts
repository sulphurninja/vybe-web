import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Option from "@/lib/models/Option";
import Vote from "@/lib/models/Vote";

type Ctx = { params: Promise<{ id: string; optionId: string }> };

// Delete an option
export async function DELETE(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  
  try {
    // Find the option
    const option = await Option.findOne({
      _id: params.optionId,
      eventId: params.id
    });
    
    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }
    
    // Delete all votes associated with this option
    await Vote.deleteMany({ optionId: params.optionId });
    
    // Delete the option
    await Option.findByIdAndDelete(params.optionId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Option and associated votes deleted successfully" 
    });
  } catch (error: any) {
    console.error('Error deleting option:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
