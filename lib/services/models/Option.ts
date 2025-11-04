import { Schema, model, models } from "mongoose";

const OptionSchema = new Schema({
  eventId: { type: String, index: true, required: true },
  
  // Category this option belongs to
  category: { 
    type: String, 
    enum: ["place", "date_time", "cuisine", "location", "general"],
    default: "general"
  },
  
  label: { type: String, required: true },
  description: String,
  
  // For date_time options
  dateTime: Date,
  
  // Venue details (for place/location options)
  venue: {
    name: String,
    address: String,
    city: String,
    placeId: String,  // Google Places ID
    rating: Number,
    priceLevel: Number,
    photoUrl: String,
    photos: [String],
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  
  // Voting
  votes: { type: Number, default: 0 },
  voters: [{ 
    voterId: String,
    voterName: String,  // For quick poll
    votedAt: { type: Date, default: Date.now }
  }],
  
  // Meta
  createdBy: String,  // User ID
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes
OptionSchema.index({ eventId: 1, category: 1, createdAt: -1 });
OptionSchema.index({ eventId: 1, createdAt: -1 });

export default models.Option || model("Option", OptionSchema);

 