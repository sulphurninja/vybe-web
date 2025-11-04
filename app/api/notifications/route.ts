import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Notification from '@/lib/services/models/Notification';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id?: string }> };

// GET - Fetch notifications for a user
export async function GET(req: Request) {
  await db();
  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = parseInt(searchParams.get('skip') || '0');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const query: any = { userId };
    
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    console.log(`📬 Fetched ${notifications.length} notifications for user ${userId} (unread: ${unreadCount})`);

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount,
      hasMore: skip + limit < totalCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create a notification (internal API)
export async function POST(req: Request) {
  await db();
  
  const body = await req.json();
  const { userId, type, title, message, eventId, optionId, fromUserId, fromUserName, actionUrl } = body;

  if (!userId || !type || !title || !message) {
    return NextResponse.json(
      { error: 'userId, type, title, and message are required' },
      { status: 400 }
    );
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
      fromUserName,
      actionUrl,
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log(`📬 Created notification for user ${userId}: ${type}`);

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read
export async function PATCH(req: Request) {
  await db();
  
  const body = await req.json();
  const { notificationId, notificationIds, markAllAsRead, userId } = body;

  if (!notificationId && !notificationIds && !markAllAsRead) {
    return NextResponse.json(
      { error: 'notificationId, notificationIds, or markAllAsRead is required' },
      { status: 400 }
    );
  }

  try {
    if (markAllAsRead && userId) {
      // Mark all notifications as read for user
      const result = await Notification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );

      console.log(`📬 Marked ${result.modifiedCount} notifications as read for user ${userId}`);

      return NextResponse.json({
        message: `Marked ${result.modifiedCount} notifications as read`,
        modifiedCount: result.modifiedCount,
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark multiple notifications as read
      const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, read: false },
        { read: true, readAt: new Date() }
      );

      console.log(`📬 Marked ${result.modifiedCount} notifications as read`);

      return NextResponse.json({
        message: `Marked ${result.modifiedCount} notifications as read`,
        modifiedCount: result.modifiedCount,
      });
    } else if (notificationId) {
      // Mark single notification as read
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      console.log(`📬 Marked notification ${notificationId} as read`);

      return NextResponse.json(notification);
    }
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: 500 }
    );
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

