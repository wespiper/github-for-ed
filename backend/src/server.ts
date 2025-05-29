import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
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

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      message: 'Scribe Tree API is running!',
      database: 'PostgreSQL connected'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Scribe Tree API is running!',
      database: 'Database connection error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
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

// Initialize Prisma connection
const initializeDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', (error as Error).message);
    console.log('\n💡 Solutions:');
    console.log('1. Ensure PostgreSQL is running: brew services start postgresql@15');
    console.log('2. Check DATABASE_URL in backend/.env file');
    console.log('3. Run migrations: npx prisma migrate dev');
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
  });
};

startServer();