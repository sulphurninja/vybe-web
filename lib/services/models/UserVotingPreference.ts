import { Schema, model, models } from "mongoose";

/**
 * UserVotingPreference Model - PHASE 2 Voting System
 * Stores ranked voting preferences for each user per event category
 * 
 * Used for Borda Count voting system
 */
const UserVotingPreferenceSchema = new Schema({
  eventId: { type: String, required: true, index: true },
  userId: { type: String, index: true }, // For registered users
  voterName: String, // For quick polls (pass-the-phone mode)
  deviceId: String, // For quick polls (same device)
  guestToken: { type: String, index: true }, // For guest voting
  
  // Voting category (place, date_time, cuisine, location)
  category: { type: String, required: true, index: true },
  
  // Array of preferences ranked 1st, 2nd, 3rd, etc.
  preferences: [{
    optionId: { type: String, required: true },
    optionName: { type: String, required: true },
    rank: { type: Number, required: true }, // 1 = 1st choice, 2 = 2nd choice, etc.
  }],
  
  // Metadata
  isQuickPoll: { type: Boolean, default: false },
  votedAt: { type: Date, default: Date.now },
  
}, { timestamps: true });

export default models.UserVotingPreference || model("UserVotingPreference", UserVotingPreferenceSchema);
