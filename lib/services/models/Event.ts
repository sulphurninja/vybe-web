import { Schema, model, models } from "mongoose";

const EventSchema = new Schema({
  hostId: { type: String, required: true },
  createdBy: { type: String, index: true }, // User ID of creator
  createdByName: { type: String }, // Name of creator
  type: { type: String, enum: ["restaurant","house_party","activity"], required: true },
  title: { type: String, required: true },
  description: String,
  
  // PHASE 2: Location and date/time decided by voting (not pre-set)
  dateTimeStart: { type: Date, required: false },
  city: String,
  area: String,
  
  // Location for proximity-based discovery (can be set after voting)
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  
  status: { type: String, enum: ["draft","voting","finalized","past"], default: "voting" },
  
  // PHASE 2: Invited participants list (for standard mode)
  invitedParticipants: [{
    userId: { type: String, required: true },
    email: String,
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: Date
  }],
  
  // PHASE 2: Quick poll participants (for pass-the-phone mode)
  quickPollParticipants: [{
    name: String,
    votedAt: Date
  }],
  
  // Participants tracking (who has joined/participated)
  participants: [{
    userId: { type: String, required: true },
    userName: { type: String }, // Name of participant
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ["host", "participant"], default: "participant" }
  }],
  
  // PHASE 2: Voting configuration (REQUIRED - voting topics are mandatory now)
  votingMode: { type: String, enum: ["standard", "quick_poll"], default: "standard" },
  votingCategories: [{
    type: String,
    enum: ["place", "date_time", "cuisine", "location"],
    required: true
  }],
  
  // Quick Poll settings
  quickPollEnabled: { type: Boolean, default: false },
  
  // Anonymous voting allowed
  allowAnonymousVoting: { type: Boolean, default: true },
  
  // PHASE 2: All events are private/invite-only (remove isPublic)
  // Privacy is implicit - only invited users can access
  
  // Winners per category (determined after voting ends)
  winners: {
    place: String,  // Option ID
    date_time: String,
    cuisine: String,
    location: String,
  },
  
  // Voting end time (optional - host can end early)
  votingEndsAt: Date,
  
  // Whether voting has been finalized
  votingFinalized: { type: Boolean, default: false },
  
  // Legacy winner (for backward compatibility)
  winnerOptionId: String,
}, { timestamps: true });

export default models.Event || model("Event", EventSchema);

 