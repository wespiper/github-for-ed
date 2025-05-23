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
  
  // Learning Objectives (Educational Focus)
  learningObjectives: {
    id: string;
    description: string;
    category: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
    bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
    assessmentCriteria: string[];
    weight: number; // percentage of overall grade
  }[];

  // Writing Process Stages (Scaffold Learning)
  writingStages: {
    id: string;
    name: string;
    description: string;
    order: number;
    required: boolean;
    minWords?: number;
    maxWords?: number;
    durationDays?: number;
    allowAI: boolean;
    aiAssistanceLevel: 'none' | 'minimal' | 'moderate' | 'comprehensive';
  }[];

  // AI Integration (Educational Boundaries)
  aiSettings: {
    enabled: boolean;
    globalBoundary: 'strict' | 'moderate' | 'permissive';
    allowedAssistanceTypes: ('grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')[];
    requireReflection: boolean;
    reflectionPrompts: string[];
    stageSpecificSettings: {
      stageId: string;
      allowedTypes: string[];
      boundaryLevel: 'strict' | 'moderate' | 'permissive';
      customPrompts: string[];
    }[];
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
  learningObjectives: [{
    id: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: [true, 'Learning objective description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: String,
      enum: ['knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation'],
      required: true
    },
    bloomsLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      required: true
    },
    assessmentCriteria: [{
      type: String,
      trim: true,
      maxlength: [200, 'Assessment criteria cannot exceed 200 characters']
    }],
    weight: {
      type: Number,
      required: true,
      min: [0, 'Weight cannot be negative'],
      max: [100, 'Weight cannot exceed 100%']
    }
  }],

  writingStages: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Writing stage name is required'],
      trim: true,
      maxlength: [100, 'Stage name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Writing stage description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Order must be at least 1']
    },
    required: {
      type: Boolean,
      default: true
    },
    minWords: {
      type: Number,
      min: 0
    },
    maxWords: {
      type: Number,
      min: 0
    },
    durationDays: {
      type: Number,
      min: [1, 'Duration must be at least 1 day'],
      max: [365, 'Duration cannot exceed 365 days']
    },
    allowAI: {
      type: Boolean,
      default: false
    },
    aiAssistanceLevel: {
      type: String,
      enum: ['none', 'minimal', 'moderate', 'comprehensive'],
      default: 'none'
    }
  }],

  aiSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    globalBoundary: {
      type: String,
      enum: ['strict', 'moderate', 'permissive'],
      default: 'moderate'
    },
    allowedAssistanceTypes: [{
      type: String,
      enum: ['grammar', 'style', 'structure', 'research', 'citations', 'brainstorming', 'outlining']
    }],
    requireReflection: {
      type: Boolean,
      default: true
    },
    reflectionPrompts: [{
      type: String,
      trim: true,
      maxlength: [500, 'Reflection prompt cannot exceed 500 characters']
    }],
    stageSpecificSettings: [{
      stageId: {
        type: String,
        required: true
      },
      allowedTypes: [{
        type: String,
        enum: ['grammar', 'style', 'structure', 'research', 'citations', 'brainstorming', 'outlining']
      }],
      boundaryLevel: {
        type: String,
        enum: ['strict', 'moderate', 'permissive'],
        required: true
      },
      customPrompts: [{
        type: String,
        trim: true,
        maxlength: [500, 'Custom prompt cannot exceed 500 characters']
      }]
    }]
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

  // Validate learning objectives weights sum to 100%
  if (this.learningObjectives && this.learningObjectives.length > 0) {
    const totalWeight = this.learningObjectives.reduce((sum, obj) => sum + obj.weight, 0);
    if (totalWeight !== 100) {
      return next(new Error('Learning objectives weights must sum to 100%'));
    }
  }

  // Validate writing stages have unique orders
  if (this.writingStages && this.writingStages.length > 0) {
    const orders = this.writingStages.map(stage => stage.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      return next(new Error('Writing stages must have unique order values'));
    }
  }

  // Validate AI stage settings reference valid stages
  if (this.aiSettings.stageSpecificSettings && this.writingStages) {
    const stageIds = new Set(this.writingStages.map(stage => stage.id));
    for (const setting of this.aiSettings.stageSpecificSettings) {
      if (!stageIds.has(setting.stageId)) {
        return next(new Error(`AI setting references invalid stage ID: ${setting.stageId}`));
      }
    }
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

// Educational workflow methods
assignmentSchema.statics.findByLearningObjectiveCategory = function(category: string, courseId?: string) {
  const filter: any = {
    'learningObjectives.category': category,
    status: { $ne: 'archived' }
  };
  
  if (courseId) {
    filter.course = courseId;
  }
  
  return this.find(filter)
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ createdAt: -1 });
};

assignmentSchema.statics.findByBloomsLevel = function(bloomsLevel: number, courseId?: string) {
  const filter: any = {
    'learningObjectives.bloomsLevel': bloomsLevel,
    status: { $ne: 'archived' }
  };
  
  if (courseId) {
    filter.course = courseId;
  }
  
  return this.find(filter)
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ createdAt: -1 });
};

assignmentSchema.statics.findWithAIEnabled = function(courseId?: string) {
  const filter: any = {
    'aiSettings.enabled': true,
    status: { $ne: 'archived' }
  };
  
  if (courseId) {
    filter.course = courseId;
  }
  
  return this.find(filter)
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ createdAt: -1 });
};

assignmentSchema.statics.findMultiStageAssignments = function(courseId?: string) {
  const filter: any = {
    $expr: { $gt: [{ $size: '$writingStages' }, 1] },
    status: { $ne: 'archived' }
  };
  
  if (courseId) {
    filter.course = courseId;
  }
  
  return this.find(filter)
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ createdAt: -1 });
};

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);