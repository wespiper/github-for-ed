import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';

export interface IDocument extends MongooseDocument {
  _id: Types.ObjectId;
  title: string;
  content: string;
  course: Types.ObjectId | ICourse;
  author: Types.ObjectId | IUser;
  collaborators: (Types.ObjectId | IUser)[];
  assignment?: Types.ObjectId | import('./Assignment').IAssignment;
  submission?: Types.ObjectId | import('./AssignmentSubmission').IAssignmentSubmission;
  type: 'draft' | 'assignment_work' | 'collaborative';
  status: 'active' | 'archived' | 'deleted';
  settings: {
    autoSave: boolean;
    autoSaveInterval: number; // in seconds
    allowCollaboration: boolean;
    versionLimit?: number;
  };
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number; // in minutes
    lastEditedAt: Date;
    lastEditedBy: Types.ObjectId | IUser;
  };
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    default: '',
    maxlength: [500000, 'Content cannot exceed 500,000 characters'] // ~100k words
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
    index: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    index: true
  },
  submission: {
    type: Schema.Types.ObjectId,
    ref: 'AssignmentSubmission',
    index: true
  },
  type: {
    type: String,
    enum: ['draft', 'assignment_work', 'collaborative'],
    default: 'draft',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  settings: {
    autoSave: {
      type: Boolean,
      default: true
    },
    autoSaveInterval: {
      type: Number,
      default: 30, // 30 seconds
      min: [10, 'Auto-save interval cannot be less than 10 seconds'],
      max: [300, 'Auto-save interval cannot exceed 5 minutes']
    },
    allowCollaboration: {
      type: Boolean,
      default: false
    },
    versionLimit: {
      type: Number,
      min: [1, 'Version limit must be at least 1'],
      max: [100, 'Version limit cannot exceed 100']
    }
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0,
      min: 0
    },
    characterCount: {
      type: Number,
      default: 0,
      min: 0
    },
    readingTime: {
      type: Number,
      default: 0,
      min: 0
    },
    lastEditedAt: {
      type: Date,
      default: Date.now
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
documentSchema.index({ course: 1, author: 1 });
documentSchema.index({ assignment: 1, author: 1 });
documentSchema.index({ submission: 1, author: 1 });
documentSchema.index({ author: 1, status: 1 });
documentSchema.index({ 'metadata.lastEditedAt': -1 });

// Virtual for version count
documentSchema.virtual('versionCount', {
  ref: 'DocumentVersion',
  localField: '_id',
  foreignField: 'document',
  count: true
});

// Pre-save middleware to update metadata
documentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate word count (simple word count by splitting on whitespace)
    const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
    this.metadata.wordCount = words.length;
    
    // Calculate character count (excluding spaces)
    this.metadata.characterCount = this.content.replace(/\s/g, '').length;
    
    // Calculate reading time (average 200 words per minute)
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
    
    // Update last edited timestamp
    this.metadata.lastEditedAt = new Date();
  }
  next();
});

// Static method to find documents by course and optional filters
documentSchema.statics.findByCourse = function(courseId: string, filters: any = {}) {
  return this.find({ 
    course: courseId, 
    status: 'active',
    ...filters 
  }).populate('author', 'firstName lastName email')
    .populate('collaborators', 'firstName lastName email')
    .populate('metadata.lastEditedBy', 'firstName lastName')
    .sort({ 'metadata.lastEditedAt': -1 });
};

// Static method to find user's documents
documentSchema.statics.findByAuthor = function(authorId: string, filters: any = {}) {
  return this.find({ 
    author: authorId, 
    status: 'active',
    ...filters 
  }).populate('course', 'title')
    .populate('collaborators', 'firstName lastName email')
    .sort({ 'metadata.lastEditedAt': -1 });
};

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);