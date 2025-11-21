import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Schema, model, models } from "mongoose";

// Support Report Model
const ReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['bug', 'feature', 'content', 'abuse', 'other'],
    required: true 
  },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  attachments: [String],
  metadata: {
    platform: String,
    appVersion: String,
    deviceInfo: String,
  },
}, { timestamps: true });

const Report = models.Report || model("Report", ReportSchema);

export async function POST(req: Request) {
  await db();
  
  try {
    const body = await req.json();
    
    console.log('📋 Received report submission:', body);
    
    const { userId, email, name, category, subject, description, metadata } = body;
    
    // Validate required fields
    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!name) missingFields.push('name');
    if (!category) missingFields.push('category');
    if (!subject) missingFields.push('subject');
    if (!description) missingFields.push('description');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields,
          received: { email, name, category, subject, description: description ? 'present' : 'missing' }
        },
        { status: 400 }
      );
    }
    
    // Validate category
    const validCategories = ['bug', 'feature', 'content', 'abuse', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Determine priority based on category
    let priority = 'medium';
    if (category === 'bug' || category === 'abuse') {
      priority = 'high';
    } else if (category === 'feature' || category === 'other') {
      priority = 'low';
    }
    
    const report = await Report.create({
      userId: userId || undefined,
      email,
      name,
      category,
      subject,
      description,
      priority,
      metadata: metadata || {},
    });
    
    console.log('✅ Support report created:', report._id, category);
    
    // TODO: Send email notification to support team
    // TODO: Send confirmation email to user
    
    return NextResponse.json({
      success: true,
      reportId: report._id,
      message: 'Report submitted successfully. We\'ll get back to you soon!',
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Submit report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// Get user's reports
export async function GET(req: Request) {
  await db();
  
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }
  
  try {
    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reports' },
      { status: 500 }
    );
  }
}


































