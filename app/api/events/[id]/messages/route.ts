import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Message from "@/lib/models/Message";
import Event from "@/lib/models/Event";
import User from "@/lib/models/User";

type Ctx = { params: Promise<{ id: string }> };

// GET - Fetch messages for an event
export async function GET(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const before = searchParams.get('before'); // For pagination

  try {
    const query: any = { 
      eventId: params.id,
      deleted: false 
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const body = await req.json();

  const { userId, userName, text, type = 'text', replyTo, userAvatar } = body;

  if (!userId || !userName || !text) {
    return NextResponse.json({ error: "User ID, name, and text are required" }, { status: 400 });
  }

  try {
    // Verify event exists
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const message = await Message.create({
      eventId: params.id,
      userId,
      userName,
      userAvatar,
      text,
      type,
      replyTo,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}

// PATCH - Update a message (edit, add reaction, mark as read)
export async function PATCH(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const body = await req.json();

  const { messageId, action, userId, text, emoji } = body;

  if (!messageId || !action) {
    return NextResponse.json({ error: "Message ID and action are required" }, { status: 400 });
  }

  try {
    const message = await Message.findOne({ 
      _id: messageId, 
      eventId: params.id 
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    switch (action) {
      case 'edit':
        if (message.userId !== userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        message.text = text;
        message.edited = true;
        message.editedAt = new Date();
        break;

      case 'react':
        if (!emoji) {
          return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
        }
        // Remove existing reaction from this user
        message.reactions = message.reactions.filter((r: any) => r.userId !== userId);
        // Add new reaction
        message.reactions.push({ emoji, userId, createdAt: new Date() });
        break;

      case 'unreact':
        if (!emoji) {
          return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
        }
        message.reactions = message.reactions.filter(
          (r: any) => !(r.userId === userId && r.emoji === emoji)
        );
        break;

      case 'read':
        // Add user to readBy if not already there
        if (!message.readBy.some((r: any) => r.userId === userId)) {
          message.readBy.push({ userId, readAt: new Date() });
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await message.save();
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: error.message || 'Failed to update message' }, { status: 500 });
  }
}

// DELETE - Delete a message
export async function DELETE(req: Request, context: Ctx) {
  await db();
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');
  const userId = searchParams.get('userId');

  if (!messageId || !userId) {
    return NextResponse.json({ error: "Message ID and User ID are required" }, { status: 400 });
  }

  try {
    const message = await Message.findOne({ 
      _id: messageId, 
      eventId: params.id 
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only the message sender can delete
    if (message.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    return NextResponse.json({ message: "Message deleted" });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete message' }, { status: 500 });
  }
}
