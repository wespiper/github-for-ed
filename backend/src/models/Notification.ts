import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';
import { IAssignment } from './Assignment';
import { IAssignmentSubmission } from './AssignmentSubmission';

export interface INotification extends MongooseDocument {
  _id: Types.ObjectId;
  recipient: Types.ObjectId | IUser;
  sender?: Types.ObjectId | IUser;
  
  // Notification Content
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  
  // Educational Context
  context: {
    course?: Types.ObjectId | ICourse;
    assignment?: Types.ObjectId | IAssignment;
    submission?: Types.ObjectId | IAssignmentSubmission;
    document?: Types.ObjectId;
    writingSession?: Types.ObjectId;
  };
  
  // Notification Metadata
  category: NotificationCategory;
  tags: string[];
  
  // Delivery and State
  channels: DeliveryChannel[];
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'archived';
  deliveredAt?: Date;
  readAt?: Date;
  
  // Educational Intervention Data
  intervention?: {
    type: InterventionType;
    severity: 'info' | 'warning' | 'critical';
    suggestedActions: string[];
    deadline?: Date;
    escalationRules?: {
      escalateAfter: number; // minutes
      escalateTo: Types.ObjectId[];
    };
    resolvedAt?: Date;
    resolvedBy?: Types.ObjectId | IUser;
    resolution?: string;
  };
  
  // Analytics and Metrics
  relatedMetrics?: {
    student?: Types.ObjectId | IUser;
    metricType: 'writing_progress' | 'skill_development' | 'assignment_milestone' | 'collaboration_activity';
    currentValue: number;
    previousValue?: number;
    threshold?: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  
  // Action Items
  actionRequired: boolean;
  actionUrl?: string;
  actionData?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

type NotificationType = 
  // Educational Interventions
  | 'writing_struggle_detected'
  | 'progress_milestone_reached'
  | 'skill_improvement_opportunity'
  | 'assignment_at_risk'
  | 'collaboration_issue'
  | 'writing_pattern_concern'
  | 'procrastination_detected'
  | 'productivity_decline'
  
  // Assignment & Progress
  | 'assignment_published'
  | 'assignment_due_soon'
  | 'assignment_overdue'
  | 'submission_received'
  | 'grade_posted'
  | 'feedback_available'
  
  // Collaboration
  | 'collaboration_request'
  | 'comment_added'
  | 'suggestion_made'
  | 'document_shared'
  | 'real_time_session_started'
  
  // System & Administrative
  | 'course_announcement'
  | 'system_maintenance'
  | 'account_activity';

type NotificationCategory = 
  | 'educational_intervention'
  | 'student_progress'
  | 'assignment_management'
  | 'collaboration'
  | 'administrative'
  | 'system';

type DeliveryChannel = 'in_app' | 'email' | 'push' | 'dashboard_widget';

type InterventionType =
  | 'writing_productivity_decline'
  | 'word_count_below_expected'
  | 'no_recent_activity'
  | 'frequent_deletions'
  | 'low_collaboration_participation'
  | 'assignment_procrastination'
  | 'skill_gap_identified'
  | 'collaboration_imbalance'
  | 'writing_quality_concern'
  | 'time_management_issue';

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  type: {
    type: String,
    enum: [
      // Educational Interventions
      'writing_struggle_detected',
      'progress_milestone_reached', 
      'skill_improvement_opportunity',
      'assignment_at_risk',
      'collaboration_issue',
      'writing_pattern_concern',
      'procrastination_detected',
      'productivity_decline',
      
      // Assignment & Progress
      'assignment_published',
      'assignment_due_soon',
      'assignment_overdue',
      'submission_received',
      'grade_posted',
      'feedback_available',
      
      // Collaboration
      'collaboration_request',
      'comment_added',
      'suggestion_made',
      'document_shared',
      'real_time_session_started',
      
      // System & Administrative
      'course_announcement',
      'system_maintenance',
      'account_activity'
    ],
    required: [true, 'Notification type is required'],
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  context: {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    submission: {
      type: Schema.Types.ObjectId,
      ref: 'AssignmentSubmission'
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document'
    },
    writingSession: {
      type: Schema.Types.ObjectId,
      ref: 'WritingSession'
    }
  },
  category: {
    type: String,
    enum: [
      'educational_intervention',
      'student_progress',
      'assignment_management', 
      'collaboration',
      'administrative',
      'system'
    ],
    required: [true, 'Category is required'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'push', 'dashboard_widget'],
    default: 'in_app'
  }],
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'archived'],
    default: 'pending',
    index: true
  },
  deliveredAt: {
    type: Date,
    index: true
  },
  readAt: {
    type: Date,
    index: true
  },
  intervention: {
    type: {
      type: String,
      enum: [
        'writing_productivity_decline',
        'word_count_below_expected',
        'no_recent_activity',
        'frequent_deletions',
        'low_collaboration_participation',
        'assignment_procrastination',
        'skill_gap_identified',
        'collaboration_imbalance',
        'writing_quality_concern',
        'time_management_issue'
      ]
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    },
    suggestedActions: [{
      type: String,
      trim: true,
      maxlength: [200, 'Suggested action cannot exceed 200 characters']
    }],
    deadline: {
      type: Date
    },
    escalationRules: {
      escalateAfter: {
        type: Number,
        min: [1, 'Escalation time must be at least 1 minute'],
        max: [10080, 'Escalation time cannot exceed 1 week (10080 minutes)']
      },
      escalateTo: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [500, 'Resolution cannot exceed 500 characters']
    }
  },
  relatedMetrics: {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    metricType: {
      type: String,
      enum: ['writing_progress', 'skill_development', 'assignment_milestone', 'collaboration_activity']
    },
    currentValue: {
      type: Number,
      required: function() { return this.relatedMetrics != null; }
    },
    previousValue: {
      type: Number
    },
    threshold: {
      type: Number
    },
    trend: {
      type: String,
      enum: ['improving', 'declining', 'stable'],
      required: function() { return this.relatedMetrics != null; }
    }
  },
  actionRequired: {
    type: Boolean,
    default: false,
    index: true
  },
  actionUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Action URL cannot exceed 500 characters']
  },
  actionData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, category: 1 });
notificationSchema.index({ recipient: 1, priority: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ 'context.course': 1, type: 1 });
notificationSchema.index({ 'intervention.type': 1, 'intervention.severity': 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for time since creation
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for human-readable time
notificationSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
});

// Virtual for intervention status
notificationSchema.virtual('interventionStatus').get(function() {
  if (!this.intervention) return null;
  
  if (this.intervention.resolvedAt) return 'resolved';
  if (this.intervention.deadline && new Date() > this.intervention.deadline) return 'overdue';
  if (this.intervention.severity === 'critical') return 'critical';
  return 'active';
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set default channels based on category and priority
  if (!this.channels || this.channels.length === 0) {
    this.channels = ['in_app'];
    
    if (this.category === 'educational_intervention' || this.priority === 'urgent') {
      this.channels.push('dashboard_widget');
    }
    
    if (this.priority === 'urgent') {
      this.channels.push('email');
    }
  }
  
  // Set default tags based on type and category
  if (!this.tags || this.tags.length === 0) {
    this.tags = [this.category];
    
    if (this.intervention) {
      this.tags.push('intervention', this.intervention.severity);
    }
    
    if (this.priority === 'urgent') {
      this.tags.push('urgent');
    }
  }
  
  next();
});

// Static methods
notificationSchema.statics.findForUser = function(userId: string, filters: any = {}) {
  const query = { 
    recipient: userId,
    status: { $ne: 'archived' },
    ...filters 
  };
  
  return this.find(query)
    .populate('sender', 'firstName lastName email role')
    .populate('context.course', 'title')
    .populate('context.assignment', 'title dueDate')
    .populate('relatedMetrics.student', 'firstName lastName')
    .sort({ createdAt: -1 });
};

notificationSchema.statics.findUnreadForUser = function(userId: string) {
  return this.find({
    recipient: userId,
    status: { $in: ['pending', 'sent', 'delivered'] }
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findInterventionsForCourse = function(courseId: string, resolved: boolean = false) {
  const query: any = {
    'context.course': courseId,
    category: 'educational_intervention'
  };
  
  if (resolved) {
    query['intervention.resolvedAt'] = { $exists: true };
  } else {
    query['intervention.resolvedAt'] = { $exists: false };
  }
  
  return this.find(query)
    .populate('recipient', 'firstName lastName email')
    .populate('relatedMetrics.student', 'firstName lastName')
    .sort({ 'intervention.severity': 1, createdAt: -1 });
};

notificationSchema.statics.getNotificationStats = function(userId: string, timeframe: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        recipient: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending', 'sent', 'delivered']] }, 1, 0]
          }
        },
        urgent: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

notificationSchema.statics.markAsRead = function(notificationId: string, userId: string) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { 
      status: 'read',
      readAt: new Date()
    },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { 
      recipient: userId,
      status: { $in: ['pending', 'sent', 'delivered'] }
    },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);