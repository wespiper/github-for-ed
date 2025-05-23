import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';

export interface IAssignment extends MongooseDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  instructions: string;
  course: Types.ObjectId | ICourse;
  instructor: Types.ObjectId | IUser;
  
  // Assignment Configuration
  type: 'individual' | 'collaborative' | 'peer-review';
  dueDate?: Date;
  allowLateSubmissions: boolean;
  maxCollaborators?: number;
  
  // Writing Requirements
  requirements: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    allowedResources?: string[];
  };
  
  // Collaboration Settings
  collaboration: {
    enabled: boolean;
    allowRealTimeEditing: boolean;
    allowComments: boolean;
    allowSuggestions: boolean;
    requireApprovalForChanges: boolean;
  };
  
  // Version Control Settings
  versionControl: {
    autoSaveInterval: number; // in seconds
    createVersionOnSubmit: boolean;
    allowVersionRevert: boolean;
    trackAllChanges: boolean;
  };
  
  // AI Integration (Future-Ready)
  aiSettings: {
    enabled: boolean;
    allowedAssistanceTypes: ('grammar' | 'style' | 'structure' | 'research' | 'citations')[];
    requireReflection: boolean;
    boundaryLevel: 'strict' | 'moderate' | 'permissive';
  };
  
  // Assignment Status
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';
  publishedAt?: Date;
  
  // Grading and Feedback
  grading: {
    enabled: boolean;
    totalPoints?: number;
    rubric?: {
      criteria: string;
      points: number;
      description: string;
    }[];
    allowPeerReview: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  instructions: {
    type: String,
    required: [true, 'Assignment instructions are required'],
    maxlength: [10000, 'Instructions cannot exceed 10000 characters']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
    index: true
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor reference is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['individual', 'collaborative', 'peer-review'],
    default: 'individual',
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  allowLateSubmissions: {
    type: Boolean,
    default: true
  },
  maxCollaborators: {
    type: Number,
    min: [2, 'Must allow at least 2 collaborators'],
    max: [10, 'Cannot exceed 10 collaborators']
  },
  requirements: {
    minWords: {
      type: Number,
      min: 0
    },
    maxWords: {
      type: Number,
      min: 0
    },
    requiredSections: [{
      type: String,
      trim: true
    }],
    citationStyle: {
      type: String,
      enum: ['APA', 'MLA', 'Chicago', 'IEEE']
    },
    allowedResources: [{
      type: String,
      trim: true
    }]
  },
  collaboration: {
    enabled: {
      type: Boolean,
      default: false
    },
    allowRealTimeEditing: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowSuggestions: {
      type: Boolean,
      default: true
    },
    requireApprovalForChanges: {
      type: Boolean,
      default: false
    }
  },
  versionControl: {
    autoSaveInterval: {
      type: Number,
      default: 30,
      min: [10, 'Auto-save interval cannot be less than 10 seconds'],
      max: [300, 'Auto-save interval cannot exceed 5 minutes']
    },
    createVersionOnSubmit: {
      type: Boolean,
      default: true
    },
    allowVersionRevert: {
      type: Boolean,
      default: false
    },
    trackAllChanges: {
      type: Boolean,
      default: true
    }
  },
  aiSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    allowedAssistanceTypes: [{
      type: String,
      enum: ['grammar', 'style', 'structure', 'research', 'citations']
    }],
    requireReflection: {
      type: Boolean,
      default: true
    },
    boundaryLevel: {
      type: String,
      enum: ['strict', 'moderate', 'permissive'],
      default: 'moderate'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    index: true
  },
  grading: {
    enabled: {
      type: Boolean,
      default: false
    },
    totalPoints: {
      type: Number,
      min: 0
    },
    rubric: [{
      criteria: {
        type: String,
        required: true,
        trim: true
      },
      points: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        trim: true
      }
    }],
    allowPeerReview: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
assignmentSchema.index({ course: 1, status: 1 });
assignmentSchema.index({ instructor: 1, status: 1 });
assignmentSchema.index({ dueDate: 1, status: 1 });
assignmentSchema.index({ type: 1, status: 1 });

// Virtual for submission count
assignmentSchema.virtual('submissionCount', {
  ref: 'AssignmentSubmission',
  localField: '_id',
  foreignField: 'assignment',
  count: true
});

// Virtual for active submissions
assignmentSchema.virtual('activeSubmissions', {
  ref: 'AssignmentSubmission',
  localField: '_id',
  foreignField: 'assignment',
  match: { status: { $in: ['draft', 'in_progress'] } }
});

// Virtual to check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'completed';
});

// Virtual to calculate days remaining
assignmentSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware
assignmentSchema.pre('save', function(next) {
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Validate collaboration settings
  if (this.type === 'collaborative' && !this.collaboration.enabled) {
    this.collaboration.enabled = true;
  }
  
  // Set default max collaborators for collaborative assignments
  if (this.type === 'collaborative' && !this.maxCollaborators) {
    this.maxCollaborators = 5;
  }
  
  next();
});

// Static methods
assignmentSchema.statics.findByCourse = function(courseId: string, filters: any = {}) {
  return this.find({ 
    course: courseId,
    status: { $ne: 'archived' },
    ...filters 
  }).populate('instructor', 'firstName lastName email')
    .populate('submissionCount')
    .sort({ createdAt: -1 });
};

assignmentSchema.statics.findByInstructor = function(instructorId: string, filters: any = {}) {
  return this.find({ 
    instructor: instructorId,
    status: { $ne: 'archived' },
    ...filters 
  }).populate('course', 'title')
    .populate('submissionCount')
    .sort({ createdAt: -1 });
};

assignmentSchema.statics.findUpcoming = function(courseId?: string) {
  const filter: any = {
    status: 'published',
    dueDate: { $gte: new Date() }
  };
  
  if (courseId) {
    filter.course = courseId;
  }
  
  return this.find(filter)
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ dueDate: 1 });
};

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);