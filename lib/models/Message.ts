import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  eventId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: String,
  
  // Message content
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'system', 'poll', 'location', 'image'], 
    default: 'text' 
  },
  
  // Message metadata
  replyTo: { type: String }, // Message ID this is replying to
  edited: { type: Boolean, default: false },
  editedAt: Date,
  
  // Reactions
  reactions: [{
    emoji: String,
    userId: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Read receipts
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  
  // Status
  deleted: { type: Boolean, default: false },
  deletedAt: Date,
  
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// Indexes for performance
MessageSchema.index({ eventId: 1, createdAt: -1 });
MessageSchema.index({ eventId: 1, deleted: 1 });
MessageSchema.index({ userId: 1, createdAt: -1 });

export default models.Message || model("Message", MessageSchema);
