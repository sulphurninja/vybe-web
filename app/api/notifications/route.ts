import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Notification from "@/lib/services/models/Notification";

// GET - Get user's notifications
export async function GET(req: Request) {
  await db();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const query: any = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(req: Request) {
  await db();
  const body = await req.json();

  const { userId, type, title, message, eventId, optionId, fromUserId, actionUrl } = body;

  if (!userId || !type || !title || !message) {
    return NextResponse.json({ error: "User ID, type, title, and message are required" }, { status: 400 });
  }

  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      eventId,
      optionId,
      fromUserId,
      actionUrl,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req: Request) {
  await db();
  const body = await req.json();
  const { notificationIds, userId, markAllRead } = body;

  try {
    if (markAllRead && userId) {
      // Mark all notifications for user as read
      await Notification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );
      return NextResponse.json({ message: "All notifications marked as read" });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { read: true, readAt: new Date() }
      );
      return NextResponse.json({ message: "Notifications marked as read" });
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to update notifications' }, { status: 500 });
  }
}

// DELETE - Delete notification(s)
export async function DELETE(req: Request) {
  await db();
  const { searchParams } = new URL(req.url);
  const notificationId = searchParams.get('id');
  const userId = searchParams.get('userId');
  const deleteAll = searchParams.get('deleteAll') === 'true';

  try {
    if (deleteAll && userId) {
      // Delete all notifications for user
      await Notification.deleteMany({ userId });
      return NextResponse.json({ message: "All notifications deleted" });
    } else if (notificationId) {
      // Delete specific notification
      await Notification.findByIdAndDelete(notificationId);
      return NextResponse.json({ message: "Notification deleted" });
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete notifications' }, { status: 500 });
  }
}

