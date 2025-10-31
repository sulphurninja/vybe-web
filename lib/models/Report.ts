import { Schema, model, models } from "mongoose";

const ReportSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['bug_report', 'feedback', 'feature_request', 'content_report', 'abuse_report', 'other'],
    required: true 
  },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  contactInfo: String,
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved', 'closed'], 
    default: 'pending' 
  },
  metadata: {
    deviceInfo: String,
    appVersion: String,
    platform: String,
  },
  adminNotes: String,
  resolvedAt: Date,
}, { timestamps: true });

// Indexes
ReportSchema.index({ userId: 1, status: 1 });
ReportSchema.index({ createdAt: -1 });

export default models.Report || model("Report", ReportSchema);


