import { Schema, model, models } from "mongoose";

const EventSchema = new Schema({
  hostId: { type: String, required: true },
  createdBy: { type: String, index: true }, // User ID of creator
  type: { type: String, enum: ["restaurant","house_party","activity"], required: true },
  title: { type: String, required: true },
  description: String,
  dateTimeStart: { type: Date, required: true },
  city: String,
  area: String,
  status: { type: String, enum: ["draft","voting","finalized","past"], default: "voting" },
  
  // Participants tracking
  participants: [{
    userId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ["host", "participant"], default: "participant" }
  }],
  
  // Voting configuration
  votingMode: { type: String, enum: ["standard", "quick_poll"], default: "standard" },
  votingCategories: [{
    type: String,
    enum: ["place", "date_time", "cuisine", "location"]
  }],
  
  // Quick Poll settings
  quickPollEnabled: { type: Boolean, default: false },
  
  // Anonymous voting allowed
  allowAnonymousVoting: { type: Boolean, default: true },
  
  // Privacy settings
  isPublic: { type: Boolean, default: true }, // Public events appear in discovery
  
  // Location for proximity-based discovery
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  
  // Winners per category
  winners: {
    place: String,  // Option ID
    date_time: String,
    cuisine: String,
    location: String,
  },
  
  // Legacy winner (for backward compatibility)
  winnerOptionId: String,
}, { timestamps: true });

export default models.Event || model("Event", EventSchema);

 