import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Invite from "@/lib/models/Invite";
import Event from "@/lib/models/Event";

type Ctx = { params: Promise<{ id: string }> };

// GET all invites for an event
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const invites = await Invite.find({ eventId: params.id });
  return NextResponse.json({ invites });
}

// POST new invite(s)
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const body = await req.json();
  
  // Support batch invites
  const { invites, userId, guestToken, role, email, phone, name } = body;
  
  if (invites && Array.isArray(invites)) {
    // Batch invite
    const results = [];
    for (const invite of invites) {
      const doc = await Invite.findOneAndUpdate(
        { 
          eventId: params.id, 
          ...(invite.email ? { email: invite.email } : {}),
          ...(invite.phone ? { phone: invite.phone } : {})
        },
        { 
          eventId: params.id, 
          userId: invite.userId,
          guestToken: invite.guestToken || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: invite.email,
          phone: invite.phone,
          name: invite.name,
          role: invite.role || 'guest',
          status: 'pending',
          invitedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      results.push(doc);
    }
    
    // TODO: Send SMS/Email/Push notifications here
    // For now, just log
    console.log(`Sent ${results.length} invites for event ${params.id}`);
    
    return NextResponse.json({ invites: results }, { status: 201 });
  } else {
    // Single invite
    const doc = await Invite.findOneAndUpdate(
      { 
        eventId: params.id, 
        ...(userId ? { userId } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {})
      },
      { 
        eventId: params.id, 
        userId, 
        guestToken: guestToken || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        phone,
        name,
        role: role || 'guest',
        status: 'pending',
        invitedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    
    // TODO: Send SMS/Email/Push notification here
    console.log(`Sent invite to ${email || phone || userId} for event ${params.id}`);
    
    return NextResponse.json(doc, { status: 201 });
  }
}
