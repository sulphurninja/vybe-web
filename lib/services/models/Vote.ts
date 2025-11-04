import { Schema, model, models } from "mongoose";

const VoteSchema = new Schema({
  eventId: { type: String, index: true, required: true },
  category: { 
    type: String, 
    enum: ["place", "date_time", "cuisine", "location", "general"],
    default: "general"
  },
  optionId: { type: String, required: true },
  voterId: String,
  voterName: String,  // For quick poll mode
  guestToken: String,
  isQuickPoll: { type: Boolean, default: false },
  castAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Drop the old problematic indexes if they exist
// Create compound indexes that handle both registered users and guests properly
// For registered users with voterId
VoteSchema.index(
  { eventId: 1, voterId: 1, category: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { voterId: { $type: "string" } }
  }
);

// For guests with guestToken
VoteSchema.index(
  { eventId: 1, guestToken: 1, category: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { guestToken: { $type: "string" } }
  }
);

export default models.Vote || model("Vote", VoteSchema);
