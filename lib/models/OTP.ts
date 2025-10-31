import { Schema, model, models } from "mongoose";

const OTPSchema = new Schema({
  // Contact info
  phoneOrEmail: { type: String, required: true, index: true },
  type: { type: String, enum: ['phone', 'email'], required: true },
  
  // OTP details
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  
  // Tracking
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  
  // Metadata
  purpose: { type: String, enum: ['signup', 'login', 'reset'], default: 'signup' },
  ip: String,
  userAgent: String,
}, { timestamps: true });

// Indexes
OTPSchema.index({ phoneOrEmail: 1, verified: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired docs

export default models.OTP || model("OTP", OTPSchema);




