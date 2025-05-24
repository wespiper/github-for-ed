import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';
import { IAssignmentTemplate } from './AssignmentTemplate';

export interface ICourseAssignment extends MongooseDocument {
  _id: Types.ObjectId;
  template: Types.ObjectId | IAssignmentTemplate;
  course: Types.ObjectId | ICourse;
  instructor: Types.ObjectId | IUser;
  
  // Course-Specific Configuration (Overrides Template Defaults)
  dueDate?: Date;
  allowLateSubmissions: boolean;
  maxCollaborators?: number;
  
  // Course-Specific Content (Optional Additions)
  customInstructions?: string; // Additional instructions specific to this course
  customNotes?: string; // Internal notes for the instructor
  
  // Course-Specific Requirements (Overrides)
  courseSpecificRequirements?: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    allowedResources?: string[];
  };
  
  // Stage-Specific Due Dates (Optional)
  stageDueDates?: {
    stageId: string;
    dueDate: Date;
  }[];
  
  // Course Deployment Status
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';
  publishedAt?: Date;
  
  // Assignment Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  createSubmission(studentId: string, data?: any): Promise<any>;
  getEffectiveRequirements(): Promise<any>;
  getEffectiveConfiguration(): Promise<any>;
}

const courseAssignmentSchema = new Schema<ICourseAssignment>({
  template: {
    type: Schema.Types.ObjectId,
    ref: 'AssignmentTemplate',
    required: [true, 'Template reference is required'],
    index: true
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
  customInstructions: {
    type: String,
    maxlength: [5000, 'Custom instructions cannot exceed 5000 characters']
  },
  customNotes: {
    type: String,
    maxlength: [2000, 'Custom notes cannot exceed 2000 characters']
  },
  courseSpecificRequirements: {
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
  stageDueDates: [{
    stageId: {
      type: String,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
courseAssignmentSchema.index({ course: 1, status: 1 });
courseAssignmentSchema.index({ instructor: 1, status: 1 });
courseAssignmentSchema.index({ template: 1, status: 1 });
courseAssignmentSchema.index({ dueDate: 1, status: 1 });
courseAssignmentSchema.index({ course: 1, dueDate: 1 });

// Unique constraint: one deployment per template per course (prevent duplicates)
courseAssignmentSchema.index({ template: 1, course: 1 }, { unique: true });

// Virtual for submission count
courseAssignmentSchema.virtual('submissionCount', {
  ref: 'AssignmentSubmission',
  localField: '_id',
  foreignField: 'assignment',
  count: true
});

// Virtual for active submissions
courseAssignmentSchema.virtual('activeSubmissions', {
  ref: 'AssignmentSubmission',
  localField: '_id',
  foreignField: 'assignment',
  match: { status: { $in: ['draft', 'in_progress'] } }
});

// Virtual to check if assignment is overdue
courseAssignmentSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'completed';
});

// Virtual to calculate days remaining
courseAssignmentSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual to get template data (for populated queries)
courseAssignmentSchema.virtual('templateData', {
  ref: 'AssignmentTemplate',
  localField: 'template',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
courseAssignmentSchema.pre('save', function(next) {
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Validate stage due dates reference valid stages (would need template population)
  // This validation will be done at the API level since we need template data
  
  next();
});

// Post-save middleware to increment template usage
courseAssignmentSchema.post('save', async function(doc) {
  // Only increment usage count when first published
  if (doc.isModified('status') && doc.status === 'published') {
    try {
      await mongoose.model('AssignmentTemplate').findByIdAndUpdate(
        doc.template,
        { $inc: { usageCount: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing template usage count:', error);
    }
  }
});

// Static methods
courseAssignmentSchema.statics.findByCourse = function(courseId: string, filters: any = {}) {
  return this.find({ 
    course: courseId,
    status: { $ne: 'archived' },
    ...filters 
  }).populate('instructor', 'firstName lastName email')
    .populate('template', 'title type learningObjectives')
    .populate('submissionCount')
    .sort({ createdAt: -1 });
};

courseAssignmentSchema.statics.findByInstructor = function(instructorId: string, filters: any = {}) {
  return this.find({ 
    instructor: instructorId,
    status: { $ne: 'archived' },
    ...filters 
  }).populate('course', 'title')
    .populate('template', 'title type')
    .populate('submissionCount')
    .sort({ createdAt: -1 });
};

courseAssignmentSchema.statics.findByTemplate = function(templateId: string, filters: any = {}) {
  return this.find({ 
    template: templateId,
    status: { $ne: 'archived' },
    ...filters 
  }).populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .populate('submissionCount')
    .sort({ createdAt: -1 });
};

courseAssignmentSchema.statics.findUpcoming = function(courseId?: string) {
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
    .populate('template', 'title type')
    .sort({ dueDate: 1 });
};

courseAssignmentSchema.statics.findDueSoon = function(days: number = 7, courseId?: string) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  const filter: any = {
    status: 'published',
    dueDate: { 
      $gte: now,
      $lte: futureDate
    }
  };
  
  if (courseId) {
    filter.course = courseId;
  }
  
  return this.find(filter)
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .populate('template', 'title type')
    .sort({ dueDate: 1 });
};

// Method to create submission
courseAssignmentSchema.methods.createSubmission = function(studentId: string, data: any = {}) {
  const AssignmentSubmission = mongoose.model('AssignmentSubmission');
  return AssignmentSubmission.create({
    assignment: this._id,
    student: studentId,
    course: this.course,
    ...data
  });
};

// Method to get effective requirements (merge template + course overrides)
courseAssignmentSchema.methods.getEffectiveRequirements = async function() {
  await this.populate('template');
  const template = this.template as IAssignmentTemplate;
  
  return {
    ...template.requirements,
    ...this.courseSpecificRequirements
  };
};

// Method to get effective configuration
courseAssignmentSchema.methods.getEffectiveConfiguration = async function() {
  await this.populate('template');
  const template = this.template as IAssignmentTemplate;
  
  return {
    title: template.title,
    description: template.description,
    instructions: template.instructions + (this.customInstructions ? `\n\n${this.customInstructions}` : ''),
    type: template.type,
    learningObjectives: template.learningObjectives,
    writingStages: template.writingStages,
    aiSettings: template.aiSettings,
    collaboration: template.collaboration,
    versionControl: template.versionControl,
    grading: template.grading,
    requirements: await this.getEffectiveRequirements(),
    dueDate: this.dueDate,
    allowLateSubmissions: this.allowLateSubmissions,
    maxCollaborators: this.maxCollaborators,
    stageDueDates: this.stageDueDates
  };
};

export const CourseAssignment = mongoose.model<ICourseAssignment>('CourseAssignment', courseAssignmentSchema);