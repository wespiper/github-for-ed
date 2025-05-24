import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import adminRoutes from './routes/admin';
import documentRoutes from './routes/documents';
import assignmentRoutes from './routes/assignments';
import assignmentTemplateRoutes from './routes/assignmentTemplates';
import courseAssignmentRoutes from './routes/courseAssignments';
import submissionRoutes from './routes/submissions';
import notificationRoutes from './routes/notifications';
import learningObjectivesRoutes from './routes/learningObjectives';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'GitHub for Writers API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/assignment-templates', assignmentTemplateRoutes);
app.use('/api/course-assignments', courseAssignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/learning-objectives', learningObjectivesRoutes);
app.use('/api/analytics', analyticsRoutes);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/github-for-writers';
    console.log('Connecting to MongoDB...');
    
    if (mongoURI.includes('<username>') || mongoURI.includes('<password>')) {
      console.error('❌ Please update MONGODB_URI in .env file with your actual MongoDB connection string');
      console.log('For local MongoDB: mongodb://localhost:27017/github-for-writers');
      console.log('For MongoDB Atlas: Get your connection string from Atlas dashboard');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', (error as Error).message);
    console.log('\n💡 Solutions:');
    console.log('1. Start local MongoDB: brew services start mongodb-community');
    console.log('2. Or use MongoDB Atlas cloud database');
    console.log('3. Update MONGODB_URI in backend/.env file');
    process.exit(1);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});