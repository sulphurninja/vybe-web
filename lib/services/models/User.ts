import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  phone: String,
  phoneVerified: { type: Boolean, default: false },
  avatar: String,
  bio: String,
  
  // Guest user fields
  isGuest: { type: Boolean, default: false },
  guestToken: { type: String, sparse: true, unique: true },
  
  // Auth
  passwordHash: String,  // For email/password auth
  authProviders: [{
    provider: { type: String, enum: ['google', 'apple', 'phone'] },
    providerId: String,
  }],
  
  // Profile
  stats: {
    eventsCreated: { type: Number, default: 0 },
    eventsJoined: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
  },
  
  // Preferences
  preferences: {
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      eventInvites: { type: Boolean, default: true },
      eventUpdates: { type: Boolean, default: true },
      eventMessages: { type: Boolean, default: true },
      votingReminders: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowInvites: { type: String, enum: ['everyone', 'friends', 'none'], default: 'everyone' },
      allowMessages: { type: String, enum: ['everyone', 'friends', 'none'], default: 'everyone' },
      showActivity: { type: Boolean, default: true },
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, default: 'en' },
  },
  
  // Push notification token
  pushToken: String,
  
  // Expo push token for mobile notifications
  expoPushToken: String,
  
  // Status
  status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ guestToken: 1 });

export default models.User || model("User", UserSchema);

