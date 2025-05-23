import mongoose, { Document as MongooseDocument, Schema, Types, Model } from 'mongoose';
import { IUser } from './User';
import { IDocument } from './Document';

export interface IDocumentVersion extends MongooseDocument {
  _id: Types.ObjectId;
  document: Types.ObjectId | IDocument;
  version: number;
  content: string;
  title: string;
  changes: {
    type: 'auto' | 'manual' | 'collaboration';
    description?: string;
    addedChars: number;
    deletedChars: number;
    addedWords: number;
    deletedWords: number;
  };
  author: Types.ObjectId | IUser;
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    sessionDuration?: number; // in seconds
  };
  diff?: {
    additions: string[];
    deletions: string[];
    summary: string;
  };
  createdAt: Date;
}

const documentVersionSchema = new Schema<IDocumentVersion>({
  document: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Document reference is required'],
    index: true
  },
  version: {
    type: Number,
    required: [true, 'Version number is required'],
    min: [1, 'Version number must be at least 1']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [500000, 'Content cannot exceed 500,000 characters']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  changes: {
    type: {
      type: String,
      enum: ['auto', 'manual', 'collaboration'],
      required: [true, 'Change type is required'],
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    addedChars: {
      type: Number,
      default: 0,
      min: 0
    },
    deletedChars: {
      type: Number,
      default: 0,
      min: 0
    },
    addedWords: {
      type: Number,
      default: 0,
      min: 0
    },
    deletedWords: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  metadata: {
    wordCount: {
      type: Number,
      required: [true, 'Word count is required'],
      min: 0
    },
    characterCount: {
      type: Number,
      required: [true, 'Character count is required'],
      min: 0
    },
    readingTime: {
      type: Number,
      required: [true, 'Reading time is required'],
      min: 0
    },
    sessionDuration: {
      type: Number,
      min: 0 // in seconds
    }
  },
  diff: {
    additions: [{
      type: String
    }],
    deletions: [{
      type: String
    }],
    summary: {
      type: String,
      maxlength: [1000, 'Diff summary cannot exceed 1000 characters']
    }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
documentVersionSchema.index({ document: 1, version: -1 }); // Latest versions first
documentVersionSchema.index({ document: 1, createdAt: -1 }); // Chronological order
documentVersionSchema.index({ author: 1, createdAt: -1 }); // User's version history
documentVersionSchema.index({ 'changes.type': 1, createdAt: -1 }); // By change type

// Ensure unique version numbers per document
documentVersionSchema.index({ document: 1, version: 1 }, { unique: true });

// Pre-save middleware to calculate metadata
documentVersionSchema.pre('save', function(next) {
  // Calculate word count
  const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
  this.metadata.wordCount = words.length;
  
  // Calculate character count (excluding spaces)
  this.metadata.characterCount = this.content.replace(/\s/g, '').length;
  
  // Calculate reading time (average 200 words per minute)
  this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
  
  next();
});

// Define interface for static methods
interface IDocumentVersionModel extends Model<IDocumentVersion> {
  getLatestVersion(documentId: string): Promise<number>;
  getHistory(documentId: string, limit?: number): Promise<IDocumentVersion[]>;
  compareVersions(documentId: string, version1: number, version2: number): Promise<any>;
}

// Static method to get latest version number for a document
documentVersionSchema.statics.getLatestVersion = async function(documentId: string): Promise<number> {
  const latestVersion = await this.findOne({ document: documentId })
    .sort({ version: -1 })
    .select('version')
    .lean();
  
  return latestVersion ? latestVersion.version : 0;
};

// Static method to get version history for a document
documentVersionSchema.statics.getHistory = function(documentId: string, limit: number = 10) {
  return this.find({ document: documentId })
    .populate('author', 'firstName lastName email')
    .sort({ version: -1 })
    .limit(limit)
    .select('-content'); // Exclude content for performance
};

// Static method to compare two versions
documentVersionSchema.statics.compareVersions = async function(documentId: string, version1: number, version2: number) {
  const versions = await this.find({
    document: documentId,
    version: { $in: [version1, version2] }
  }).sort({ version: 1 }).lean();
  
  if (versions.length !== 2) {
    throw new Error('One or both versions not found');
  }
  
  return {
    older: versions[0],
    newer: versions[1],
    timeDiff: new Date(versions[1].createdAt).getTime() - new Date(versions[0].createdAt).getTime()
  };
};

// Virtual for version age
documentVersionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for change summary
documentVersionSchema.virtual('changeSummary').get(function() {
  const { addedWords, deletedWords, addedChars, deletedChars } = this.changes;
  if (addedWords === 0 && deletedWords === 0) return 'No changes';
  
  const parts = [];
  if (addedWords > 0) parts.push(`+${addedWords} words`);
  if (deletedWords > 0) parts.push(`-${deletedWords} words`);
  if (addedChars > 0) parts.push(`+${addedChars} chars`);
  if (deletedChars > 0) parts.push(`-${deletedChars} chars`);
  
  return parts.join(', ');
});

export const DocumentVersion = mongoose.model<IDocumentVersion, IDocumentVersionModel>('DocumentVersion', documentVersionSchema);