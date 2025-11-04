import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,  // For fast lookups by user
  },
  type: {
    type: String,
    enum: ['user_joined', 'event_update', 'option_added', 'event_message', 'voting_reminder', 'event_reminder', 'event_invite', 'event_finalized'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  eventId: {
    type: String,
    index: true,
  },
  optionId: {
    type: String,
  },
  fromUserId: {
    type: String,
  },
  fromUserName: {
    type: String,
  },
  actionUrl: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    // TTL index - auto-delete after 30 days
    index: { expireAfterSeconds: 2592000 },
  },
}, { timestamps: true });

// Compound index for common queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

