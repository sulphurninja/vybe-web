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

// Create compound indexes that handle both registered users and guests properly
// For registered users with voterId - ONLY unique in standard mode, not in quick poll
VoteSchema.index(
  { eventId: 1, voterId: 1, category: 1, isQuickPoll: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      voterId: { $type: "string" },
      isQuickPoll: false
    }
  }
);

// For guests with guestToken - ONLY unique in standard mode, not in quick poll
VoteSchema.index(
  { eventId: 1, guestToken: 1, category: 1, isQuickPoll: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      guestToken: { $type: "string" },
      isQuickPoll: false
    }
  }
);

const VoteModel = models.Vote || model("Vote", VoteSchema);

// Cleanup old indexes and create new ones on connection
(async () => {
  try {
    // Try to drop old problematic indexes if they exist
    await VoteModel.collection.dropIndex("eventId_1_voterId_1_category_1").catch(() => {});
    await VoteModel.collection.dropIndex("eventId_1_guestToken_1_category_1").catch(() => {});
  } catch (err: any) {
    // Indexes might not exist, that's OK
  }
})();

export default VoteModel;
