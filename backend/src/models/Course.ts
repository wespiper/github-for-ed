import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  isActive: boolean;
  enrollmentCode: string;
  maxStudents?: number;
  tags: string[];
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
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  maxStudents: {
    type: Number,
    min: 1,
    max: 500
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