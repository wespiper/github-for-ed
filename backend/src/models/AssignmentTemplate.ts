import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';

export interface IAssignmentTemplate extends MongooseDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  instructions: string;
  instructor: Types.ObjectId | IUser;
  
  // Assignment Configuration
  type: 'individual' | 'collaborative' | 'peer-review';
  
  // Writing Requirements (Template Defaults)
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
  
  // Grading and Feedback Template
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
  
  // Template Metadata
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  isPublic: boolean; // Allow other educators to use this template
  usageCount: number; // Track how many times template has been deployed
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const assignmentTemplateSchema = new Schema<IAssignmentTemplate>({
  title: {
    type: String,
    required: [true, 'Template title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Template description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  instructions: {
    type: String,
    required: [true, 'Template instructions are required'],
    maxlength: [10000, 'Instructions cannot exceed 10000 characters']
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
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
assignmentTemplateSchema.index({ instructor: 1, status: 1 });
assignmentTemplateSchema.index({ status: 1, isPublic: 1 });
assignmentTemplateSchema.index({ tags: 1, status: 1 });
assignmentTemplateSchema.index({ type: 1, status: 1 });
assignmentTemplateSchema.index({ usageCount: -1, status: 1 }); // For popularity sorting
assignmentTemplateSchema.index({ 'learningObjectives.category': 1 });
assignmentTemplateSchema.index({ 'learningObjectives.bloomsLevel': 1 });

// Text search index
assignmentTemplateSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for deployments count
assignmentTemplateSchema.virtual('deploymentCount', {
  ref: 'CourseAssignment',
  localField: '_id',
  foreignField: 'template',
  count: true
});

// Pre-save middleware
assignmentTemplateSchema.pre('save', function(next) {
  // Validate collaboration settings
  if (this.type === 'collaborative' && !this.collaboration.enabled) {
    this.collaboration.enabled = true;
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
assignmentTemplateSchema.statics.findByInstructor = function(instructorId: string, filters: any = {}) {
  return this.find({ 
    instructor: instructorId,
    status: { $ne: 'archived' },
    ...filters 
  }).populate('deploymentCount')
    .sort({ updatedAt: -1 });
};

assignmentTemplateSchema.statics.findPublicTemplates = function(filters: any = {}) {
  return this.find({ 
    status: 'published',
    isPublic: true,
    ...filters 
  }).populate('instructor', 'firstName lastName')
    .populate('deploymentCount')
    .sort({ usageCount: -1, updatedAt: -1 });
};

assignmentTemplateSchema.statics.findByTag = function(tag: string, instructorId?: string) {
  const filter: any = {
    tags: tag,
    status: { $ne: 'archived' }
  };
  
  if (instructorId) {
    filter.$or = [
      { instructor: instructorId },
      { isPublic: true, status: 'published' }
    ];
  } else {
    filter.isPublic = true;
    filter.status = 'published';
  }
  
  return this.find(filter)
    .populate('instructor', 'firstName lastName')
    .populate('deploymentCount')
    .sort({ usageCount: -1, updatedAt: -1 });
};

assignmentTemplateSchema.statics.findByLearningObjectiveCategory = function(category: string, instructorId?: string) {
  const filter: any = {
    'learningObjectives.category': category,
    status: { $ne: 'archived' }
  };
  
  if (instructorId) {
    filter.$or = [
      { instructor: instructorId },
      { isPublic: true, status: 'published' }
    ];
  } else {
    filter.isPublic = true;
    filter.status = 'published';
  }
  
  return this.find(filter)
    .populate('instructor', 'firstName lastName')
    .populate('deploymentCount')
    .sort({ usageCount: -1, updatedAt: -1 });
};

assignmentTemplateSchema.statics.searchTemplates = function(searchTerm: string, instructorId?: string) {
  const filter: any = {
    $text: { $search: searchTerm },
    status: { $ne: 'archived' }
  };
  
  if (instructorId) {
    filter.$or = [
      { instructor: instructorId },
      { isPublic: true, status: 'published' }
    ];
  } else {
    filter.isPublic = true;
    filter.status = 'published';
  }
  
  return this.find(filter, { score: { $meta: 'textScore' } })
    .populate('instructor', 'firstName lastName')
    .populate('deploymentCount')
    .sort({ score: { $meta: 'textScore' }, usageCount: -1 });
};

// Method to increment usage count
assignmentTemplateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

export const AssignmentTemplate = mongoose.model<IAssignmentTemplate>('AssignmentTemplate', assignmentTemplateSchema);