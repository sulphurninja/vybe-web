import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'event_invite',
      'event_update',
      'event_message',
      'voting_reminder',
      'event_reminder',
      'user_joined',
      'vote_cast',
      'event_finalized'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related entities
  eventId: { type: String, index: true },
  optionId: String,
  fromUserId: String,
  
  // Notification state
  read: { type: Boolean, default: false },
  readAt: Date,
  
  // Action link (optional)
  actionUrl: String, // e.g., '/event/123'
  
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

// Auto-delete old notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default models.Notification || model("Notification", NotificationSchema);

