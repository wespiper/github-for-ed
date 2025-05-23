import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { IDocument } from './Document';

export interface IWritingSession extends MongooseDocument {
  _id: Types.ObjectId;
  document: Types.ObjectId | IDocument;
  user: Types.ObjectId | IUser;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  activity: {
    keystrokes: number;
    wordsAdded: number;
    wordsDeleted: number;
    charactersAdded: number;
    charactersDeleted: number;
    pauseCount: number; // number of pauses > 30 seconds
    totalPauseTime: number; // total pause time in seconds
  };
  snapshots: [{
    timestamp: Date;
    wordCount: number;
    characterCount: number;
    action: 'start' | 'pause' | 'resume' | 'end' | 'auto-save';
  }];
  productivity: {
    wordsPerMinute: number;
    consistencyScore: number; // 0-100, based on writing rhythm
    focusScore: number; // 0-100, based on pause patterns
  };
  createdAt: Date;
  updatedAt: Date;
}

const writingSessionSchema = new Schema<IWritingSession>({
  document: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Document reference is required'],
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true
  },
  endTime: {
    type: Date,
    index: true
  },
  duration: {
    type: Number,
    min: 0 // in seconds
  },
  activity: {
    keystrokes: {
      type: Number,
      default: 0,
      min: 0
    },
    wordsAdded: {
      type: Number,
      default: 0,
      min: 0
    },
    wordsDeleted: {
      type: Number,
      default: 0,
      min: 0
    },
    charactersAdded: {
      type: Number,
      default: 0,
      min: 0
    },
    charactersDeleted: {
      type: Number,
      default: 0,
      min: 0
    },
    pauseCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPauseTime: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  snapshots: [{
    timestamp: {
      type: Date,
      required: true
    },
    wordCount: {
      type: Number,
      required: true,
      min: 0
    },
    characterCount: {
      type: Number,
      required: true,
      min: 0
    },
    action: {
      type: String,
      enum: ['start', 'pause', 'resume', 'end', 'auto-save'],
      required: true
    }
  }],
  productivity: {
    wordsPerMinute: {
      type: Number,
      default: 0,
      min: 0
    },
    consistencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    focusScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for analytics and queries
writingSessionSchema.index({ user: 1, startTime: -1 }); // User's recent sessions
writingSessionSchema.index({ document: 1, startTime: -1 }); // Document's session history
writingSessionSchema.index({ startTime: -1 }); // Recent sessions across platform
writingSessionSchema.index({ user: 1, document: 1, startTime: -1 }); // User-document sessions

// Pre-save middleware to calculate metrics
writingSessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    // Calculate duration
    this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    
    // Calculate words per minute
    if (this.duration > 0) {
      const minutes = this.duration / 60;
      this.productivity.wordsPerMinute = Math.round(this.activity.wordsAdded / minutes);
    }
    
    // Calculate focus score based on pause patterns
    if (this.duration > 0) {
      const pauseRatio = this.activity.totalPauseTime / this.duration;
      this.productivity.focusScore = Math.max(0, Math.round(100 * (1 - pauseRatio)));
    }
    
    // Calculate consistency score based on writing rhythm
    if (this.snapshots.length > 2) {
      const intervals = [];
      for (let i = 1; i < this.snapshots.length; i++) {
        const timeDiff = this.snapshots[i].timestamp.getTime() - this.snapshots[i-1].timestamp.getTime();
        const wordDiff = this.snapshots[i].wordCount - this.snapshots[i-1].wordCount;
        if (wordDiff > 0 && timeDiff > 0) {
          intervals.push(wordDiff / (timeDiff / 60000)); // words per minute
        }
      }
      
      if (intervals.length > 0) {
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / mean;
        
        // Lower coefficient of variation = higher consistency
        this.productivity.consistencyScore = Math.max(0, Math.round(100 * (1 - Math.min(1, coefficientOfVariation))));
      }
    }
  }
  next();
});

// Static method to get user's writing analytics
writingSessionSchema.statics.getUserAnalytics = async function(userId: string, timeRange: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  const sessions = await this.find({
    user: userId,
    startTime: { $gte: startDate },
    endTime: { $exists: true }
  }).lean();
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalWritingTime: 0,
      averageSessionDuration: 0,
      totalWordsWritten: 0,
      averageWordsPerMinute: 0,
      averageFocusScore: 0,
      averageConsistencyScore: 0,
      writingStreak: 0
    };
  }
  
  const totalSessions = sessions.length;
  const totalWritingTime = sessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
  const averageSessionDuration = totalWritingTime / totalSessions;
  const totalWordsWritten = sessions.reduce((sum: number, session: any) => sum + session.activity.wordsAdded, 0);
  const averageWordsPerMinute = sessions.reduce((sum: number, session: any) => sum + session.productivity.wordsPerMinute, 0) / totalSessions;
  const averageFocusScore = sessions.reduce((sum: number, session: any) => sum + session.productivity.focusScore, 0) / totalSessions;
  const averageConsistencyScore = sessions.reduce((sum: number, session: any) => sum + session.productivity.consistencyScore, 0) / totalSessions;
  
  // Calculate writing streak (consecutive days with at least one session)
  const sessionDates = [...new Set(sessions.map((session: any) => 
    new Date(session.startTime).toDateString()
  ))].sort();
  
  let writingStreak = 0;
  let currentStreak = 0;
  const today = new Date().toDateString();
  let checkDate = new Date();
  
  for (let i = 0; i < timeRange; i++) {
    const dateStr = checkDate.toDateString();
    if (sessionDates.includes(dateStr)) {
      currentStreak++;
    } else if (dateStr !== today) {
      // Break streak only if it's not today (allow for today being incomplete)
      if (currentStreak > writingStreak) writingStreak = currentStreak;
      currentStreak = 0;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  writingStreak = Math.max(writingStreak, currentStreak);
  
  return {
    totalSessions,
    totalWritingTime,
    averageSessionDuration: Math.round(averageSessionDuration),
    totalWordsWritten,
    averageWordsPerMinute: Math.round(averageWordsPerMinute),
    averageFocusScore: Math.round(averageFocusScore),
    averageConsistencyScore: Math.round(averageConsistencyScore),
    writingStreak
  };
};

// Static method to get document writing timeline
writingSessionSchema.statics.getDocumentTimeline = function(documentId: string) {
  return this.find({ document: documentId })
    .populate('user', 'firstName lastName')
    .sort({ startTime: 1 })
    .select('startTime endTime duration activity productivity user');
};

// Virtual for session productivity rating
writingSessionSchema.virtual('productivityRating').get(function() {
  const scores = [this.productivity.focusScore, this.productivity.consistencyScore];
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  if (averageScore >= 80) return 'Excellent';
  if (averageScore >= 60) return 'Good';
  if (averageScore >= 40) return 'Fair';
  return 'Needs Improvement';
});

export const WritingSession = mongoose.model<IWritingSession>('WritingSession', writingSessionSchema);