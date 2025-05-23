import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { IAssignment } from './Assignment';

export interface IAssignmentSubmission extends MongooseDocument {
  _id: Types.ObjectId;
  assignment: Types.ObjectId | IAssignment;
  author: Types.ObjectId | IUser;
  collaborators: (Types.ObjectId | IUser)[];
  
  // Content and Writing
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  
  // Submission Status
  status: 'draft' | 'in_progress' | 'submitted' | 'returned' | 'graded';
  submittedAt?: Date;
  lastSavedAt: Date;
  
  // Collaboration and Real-time Features
  collaboration: {
    isCollaborative: boolean;
    activeUsers: Types.ObjectId[];
    lastActiveAt: Date;
    conflictResolution: 'auto' | 'manual';
  };
  
  // Version Control and Writing Journey
  currentVersion: number;
  majorMilestones: {
    version: number;
    timestamp: Date;
    description: string;
    wordCount: number;
    author: Types.ObjectId | IUser;
  }[];
  
  // Comments and Feedback
  comments: {
    id: Types.ObjectId;
    author: Types.ObjectId | IUser;
    content: string;
    position?: {
      start: number;
      end: number;
    };
    type: 'comment' | 'suggestion' | 'question' | 'approval';
    resolved: boolean;
    createdAt: Date;
    replies?: {
      author: Types.ObjectId | IUser;
      content: string;
      createdAt: Date;
    }[];
  }[];
  
  // Writing Analytics (Educational Focus)
  analytics: {
    writingSessions: number;
    totalWritingTime: number; // in minutes
    averageSessionLength: number; // in minutes
    writingPattern: {
      date: Date;
      wordsWritten: number;
      timeSpent: number; // in minutes
      revisionsCount: number;
    }[];
    collaborationMetrics: {
      contributorStats: {
        user: Types.ObjectId | IUser;
        wordsContributed: number;
        editsCount: number;
        commentsCount: number;
      }[];
      conflictsResolved: number;
      realTimeMinutes: number;
    };
  };
  
  // Grading and Assessment
  grade?: {
    score?: number;
    maxScore?: number;
    rubricScores: {
      criteria: string;
      score: number;
      maxScore: number;
      feedback: string;
    }[];
    overallFeedback: string;
    gradedBy: Types.ObjectId | IUser;
    gradedAt: Date;
  };
  
  // AI Integration (Future-Ready)
  aiInteractions: {
    sessionId: string;
    type: 'grammar' | 'style' | 'structure' | 'research' | 'citations';
    prompt: string;
    response: string;
    accepted: boolean;
    reflection?: string;
    timestamp: Date;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>({
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment reference is required'],
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
  title: {
    type: String,
    required: [true, 'Submission title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    default: '',
    maxlength: [1000000, 'Content cannot exceed 1,000,000 characters']
  },
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
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'submitted', 'returned', 'graded'],
    default: 'draft',
    index: true
  },
  submittedAt: {
    type: Date,
    index: true
  },
  lastSavedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  collaboration: {
    isCollaborative: {
      type: Boolean,
      default: false
    },
    activeUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    conflictResolution: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto'
    }
  },
  currentVersion: {
    type: Number,
    default: 1,
    min: 1
  },
  majorMilestones: [{
    version: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    wordCount: {
      type: Number,
      required: true,
      min: 0
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  comments: [{
    id: {
      type: Schema.Types.ObjectId,
      default: () => new Types.ObjectId()
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    position: {
      start: Number,
      end: Number
    },
    type: {
      type: String,
      enum: ['comment', 'suggestion', 'question', 'approval'],
      default: 'comment'
    },
    resolved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    replies: [{
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Reply cannot exceed 1000 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  analytics: {
    writingSessions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalWritingTime: {
      type: Number,
      default: 0,
      min: 0
    },
    averageSessionLength: {
      type: Number,
      default: 0,
      min: 0
    },
    writingPattern: [{
      date: {
        type: Date,
        required: true
      },
      wordsWritten: {
        type: Number,
        required: true,
        min: 0
      },
      timeSpent: {
        type: Number,
        required: true,
        min: 0
      },
      revisionsCount: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    collaborationMetrics: {
      contributorStats: [{
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        wordsContributed: {
          type: Number,
          default: 0,
          min: 0
        },
        editsCount: {
          type: Number,
          default: 0,
          min: 0
        },
        commentsCount: {
          type: Number,
          default: 0,
          min: 0
        }
      }],
      conflictsResolved: {
        type: Number,
        default: 0,
        min: 0
      },
      realTimeMinutes: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  grade: {
    score: {
      type: Number,
      min: 0
    },
    maxScore: {
      type: Number,
      min: 0
    },
    rubricScores: [{
      criteria: {
        type: String,
        required: true,
        trim: true
      },
      score: {
        type: Number,
        required: true,
        min: 0
      },
      maxScore: {
        type: Number,
        required: true,
        min: 0
      },
      feedback: {
        type: String,
        trim: true
      }
    }],
    overallFeedback: {
      type: String,
      trim: true
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date
    }
  },
  aiInteractions: [{
    sessionId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['grammar', 'style', 'structure', 'research', 'citations'],
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    response: {
      type: String,
      required: true
    },
    accepted: {
      type: Boolean,
      default: false
    },
    reflection: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
assignmentSubmissionSchema.index({ assignment: 1, author: 1 });
assignmentSubmissionSchema.index({ assignment: 1, status: 1 });
assignmentSubmissionSchema.index({ author: 1, status: 1 });
assignmentSubmissionSchema.index({ 'collaboration.isCollaborative': 1, 'collaboration.lastActiveAt': -1 });
assignmentSubmissionSchema.index({ submittedAt: -1 });
assignmentSubmissionSchema.index({ lastSavedAt: -1 });

// Virtual for version count
assignmentSubmissionSchema.virtual('versionCount', {
  ref: 'DocumentVersion',
  localField: '_id',
  foreignField: 'document',
  count: true
});

// Virtual for reading time estimation
assignmentSubmissionSchema.virtual('estimatedReadingTime').get(function() {
  return Math.ceil(this.wordCount / 200); // Average 200 words per minute
});

// Add to interface
declare module './AssignmentSubmission' {
  interface IAssignmentSubmission {
    estimatedReadingTime: number;
  }
}

// Virtual for collaboration status
assignmentSubmissionSchema.virtual('isActivelyCollaborating').get(function() {
  if (!this.collaboration.isCollaborative) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.collaboration.lastActiveAt > fiveMinutesAgo;
});

// Virtual for grade percentage
assignmentSubmissionSchema.virtual('gradePercentage').get(function() {
  if (!this.grade || !this.grade.score || !this.grade.maxScore) return null;
  return Math.round((this.grade.score / this.grade.maxScore) * 100);
});

// Pre-save middleware
assignmentSubmissionSchema.pre('save', function(next) {
  // Update word and character counts
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    this.characterCount = this.content.replace(/\s/g, '').length;
    this.lastSavedAt = new Date();
  }
  
  // Set submitted timestamp
  if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  // Update analytics
  if (this.isModified('analytics.writingSessions')) {
    const totalTime = this.analytics.totalWritingTime;
    const sessions = this.analytics.writingSessions;
    this.analytics.averageSessionLength = sessions > 0 ? totalTime / sessions : 0;
  }
  
  next();
});

// Static methods
assignmentSubmissionSchema.statics.findByAssignment = function(assignmentId: string, filters: any = {}) {
  return this.find({
    assignment: assignmentId,
    ...filters
  }).populate('author', 'firstName lastName email')
    .populate('collaborators', 'firstName lastName email')
    .sort({ lastSavedAt: -1 });
};

assignmentSubmissionSchema.statics.findByStudent = function(studentId: string, filters: any = {}) {
  return this.find({
    $or: [
      { author: studentId },
      { collaborators: studentId }
    ],
    ...filters
  }).populate('assignment', 'title dueDate')
    .sort({ lastSavedAt: -1 });
};

assignmentSubmissionSchema.statics.findActiveCollaborations = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.find({
    'collaboration.isCollaborative': true,
    'collaboration.lastActiveAt': { $gte: fiveMinutesAgo }
  }).populate('author collaborators', 'firstName lastName email')
    .populate('assignment', 'title');
};

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', assignmentSubmissionSchema);