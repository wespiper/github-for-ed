import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  subject: string;
  instructor: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  
  // Course Configuration
  isPublic: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
  
  // Course Settings
  settings: {
    allowSelfEnrollment: boolean;
    requireApprovalToJoin: boolean;
    allowStudentDiscussions: boolean;
    gradingScale: 'points' | 'percentage' | 'letter';
  };
  
  // Status
  status: 'draft' | 'published' | 'archived';
  
  // Legacy fields (for backward compatibility)
  isActive: boolean;
  enrollmentCode: string;
  tags: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Course Configuration
  isPublic: {
    type: Boolean,
    default: false
  },
  maxStudents: {
    type: Number,
    min: 1,
    max: 1000
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  
  // Course Settings
  settings: {
    allowSelfEnrollment: {
      type: Boolean,
      default: false
    },
    requireApprovalToJoin: {
      type: Boolean,
      default: true
    },
    allowStudentDiscussions: {
      type: Boolean,
      default: true
    },
    gradingScale: {
      type: String,
      enum: ['points', 'percentage', 'letter'],
      default: 'points'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Legacy fields (for backward compatibility)
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentCode: {
    type: String,
    unique: true,
    uppercase: true,
    sparse: true // Allow null values
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

courseSchema.index({ instructor: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ tags: 1 });

// Generate unique enrollment code
courseSchema.pre<ICourse>('save', async function(next) {
  if (!this.enrollmentCode) {
    let code: string;
    let exists = true;
    
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCourse = await mongoose.model('Course').findOne({ enrollmentCode: code });
      exists = !!existingCourse;
    }
    
    this.enrollmentCode = code!;
  }
  next();
});

export const Course = mongoose.model<ICourse>('Course', courseSchema);