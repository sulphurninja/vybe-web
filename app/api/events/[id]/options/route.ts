import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Option from "@/lib/models/Option";
import Event from "@/lib/models/Event";

type Ctx = { params: Promise<{ id: string }> };

// Get all options for an event (with optional category filter)
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  
  const query: any = { eventId: params.id };
  if (category) {
    query.category = category;
  }
  
  const options = await Option.find(query)
    .sort({ category: 1, order: 1, createdAt: 1 })
    .lean();
    
  return NextResponse.json({ options });
}

// Create a new option
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const body = await req.json();
  
  // Verify event exists
  const event = await Event.findById(params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  
  const option = await Option.create({
    eventId: params.id,
    category: body.category || "general",
    label: body.label,
    description: body.description,
    dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
    venue: body.venue,
    createdBy: body.createdBy,
    order: body.order || 0,
  });
  
  return NextResponse.json(option, { status: 201 });
}

