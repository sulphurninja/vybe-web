import { Schema, model, models } from "mongoose";

const InviteSchema = new Schema({
  eventId: { type: String, index: true, required: true },
  userId: String,
  guestToken: String,     // for guest link participation
  email: String,          // for email invites
  phone: String,          // for SMS invites
  name: String,           // guest name (for guests without accounts)
  role: { type: String, enum: ["participant","guest","host"], default: "participant" },
  rsvp: { type: String, enum: ["going","maybe","no"] },
  status: { type: String, enum: ["pending","accepted","declined"], default: "pending" },
  invitedAt: { type: Date, default: Date.now },
  joinedAt: Date,         // when guest actually joined
}, { timestamps: true });

InviteSchema.index({ eventId: 1, userId: 1 }, { unique: true, sparse: true });
InviteSchema.index({ eventId: 1, guestToken: 1 }, { unique: true, sparse: true });
InviteSchema.index({ eventId: 1, email: 1 }, { unique: true, sparse: true });
InviteSchema.index({ eventId: 1, phone: 1 }, { unique: true, sparse: true });

export default models.Invite || model("Invite", InviteSchema);
