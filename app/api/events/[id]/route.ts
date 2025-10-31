import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Event from "@/lib/models/Event";
import Option from "@/lib/models/Option";
import Invite from "@/lib/models/Invite";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const eventId = params.id;
  
  console.log('🔍 Fetching event by ID:', eventId);
  
  const e = await Event.findById(eventId).lean();
  if (!e) {
    console.log('❌ Event not found:', eventId);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  console.log('✅ Event found:', e._id);
  
  // Get options and invites
  const options = await Option.find({ eventId: eventId }).sort({ order: 1, createdAt: 1 }).lean();
  const invites = await Invite.find({ eventId: eventId }).lean();
  
  console.log(`📊 Loaded ${options.length} options and ${invites.length} invites`);
  
  return NextResponse.json({ ...e, options, invites });
}

export async function PATCH(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const patch = await req.json();
  const e = await Event.findByIdAndUpdate(params.id, patch, { new: true }).lean();
  return NextResponse.json(e);
}

export async function DELETE(_req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  await Event.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
