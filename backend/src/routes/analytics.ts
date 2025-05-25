import express, { Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { LearningAnalyticsService } from '../services/LearningAnalyticsService';
import { AIBoundaryService } from '../services/AIBoundaryService';
import { AssessmentService } from '../services/AssessmentService';
import { WritingProcessService } from '../services/WritingProcessService';

const router = express.Router();

// Learning Analytics Endpoints

/**
 * @route GET /api/analytics/writing-progress/:studentId/:assignmentId
 * @desc Get comprehensive writing progress metrics for a specific assignment
 * @access Private (Instructors and the student themselves)
 */
router.get('/writing-progress/:studentId/:assignmentId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, assignmentId } = req.params;
    const userId = req.userId!;
    const userRole = req.userRole!;
    
    // Check permissions: student can view their own, instructors can view their course students
    if (userRole === 'student' && studentId !== userId) {
      res.status(403).json({ message: 'Access denied: Can only view your own progress' });
      return;
    }
    
    const metrics = await LearningAnalyticsService.getWritingProgressMetrics(studentId, assignmentId);
    
    res.json({
      message: 'Writing progress metrics retrieved successfully',
      data: metrics
    });
  } catch (error: any) {
    console.error('Error getting writing progress metrics:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve writing progress metrics',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/learning-objectives/:studentId/:courseId
 * @desc Track learning objective progress across assignments
 * @access Private (Instructors and the student themselves)
 */
router.get('/learning-objectives/:studentId/:courseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, courseId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.userId!;
    const userRole = req.userRole!;
    
    // Check permissions
    if (userRole === 'student' && studentId !== userId) {
      res.status(403).json({ message: 'Access denied: Can only view your own progress' });
      return;
    }
    
    const timeframe = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;
    
    const progress = await LearningAnalyticsService.getLearningObjectiveProgress(
      studentId, 
      courseId, 
      timeframe
    );
    
    res.json({
      message: 'Learning objective progress retrieved successfully',
      data: progress
    });
  } catch (error: any) {
    console.error('Error getting learning objective progress:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve learning objective progress',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/student-analytics/:studentId/:courseId
 * @desc Generate comprehensive student writing analytics
 * @access Private (Instructors only)
 */
router.get('/student-analytics/:studentId/:courseId', 
  authenticate, 
  requireRole(['educator', 'admin']), 
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, courseId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ message: 'Start date and end date are required' });
        return;
      }
      
      const timeframe = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
      
      const analytics = await LearningAnalyticsService.getStudentWritingAnalytics(
        studentId,
        courseId,
        timeframe
      );
      
      res.json({
        message: 'Student writing analytics retrieved successfully',
        data: analytics
      });
    } catch (error: any) {
      console.error('Error getting student analytics:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve student analytics',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/educator-insights/:courseId
 * @desc Generate educator insights for course management
 * @access Private (Instructors only)
 */
router.get('/educator-insights/:courseId',
  authenticate,
  requireRole(['educator', 'admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { startDate, endDate } = req.query;
      const instructorId = req.userId!;
      
      if (!startDate || !endDate) {
        res.status(400).json({ message: 'Start date and end date are required' });
        return;
      }
      
      const timeframe = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
      
      const insights = await LearningAnalyticsService.getEducatorInsights(
        instructorId,
        courseId,
        timeframe
      );
      
      res.json({
        message: 'Educator insights retrieved successfully',
        data: insights
      });
    } catch (error: any) {
      console.error('Error getting educator insights:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve educator insights',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/at-risk-students/:courseId
 * @desc Identify students who may need intervention
 * @access Private (Instructors only)
 */
router.get('/at-risk-students/:courseId',
  authenticate,
  requireRole(['educator', 'admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { 
        minimumEngagement, 
        maxDaysSinceActivity, 
        minimumCompletionRate 
      } = req.query;
      
      const criteria = {
        minimumEngagement: minimumEngagement ? parseFloat(minimumEngagement as string) : undefined,
        maxDaysSinceActivity: maxDaysSinceActivity ? parseInt(maxDaysSinceActivity as string) : undefined,
        minimumCompletionRate: minimumCompletionRate ? parseFloat(minimumCompletionRate as string) : undefined
      };
      
      const atRiskStudents = await LearningAnalyticsService.identifyAtRiskStudents(courseId, criteria);
      
      res.json({
        message: 'At-risk students identified successfully',
        data: atRiskStudents
      });
    } catch (error: any) {
      console.error('Error identifying at-risk students:', error);
      res.status(500).json({ 
        message: 'Failed to identify at-risk students',
        error: error.message 
      });
    }
  }
);

// AI Boundary Service Endpoints

/**
 * @route POST /api/analytics/ai-assistance-request
 * @desc Evaluate whether AI assistance should be provided
 * @access Private (Students only)
 */
router.post('/ai-assistance-request',
  authenticate,
  requireRole(['student']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.userId!;
      const { assignmentId, action, context } = req.body;
      
      if (!assignmentId || !action || !context) {
        res.status(400).json({ message: 'Assignment ID, action, and context are required' });
        return;
      }
      
      const request = {
        studentId,
        assignmentId,
        assistanceType: action, // Map action to assistanceType for the service
        context,
        timestamp: new Date()
      };
      
      const response = await AIBoundaryService.evaluateAssistanceRequest(request);
      
      res.json({
        message: 'AI assistance request evaluated',
        data: response
      });
    } catch (error: any) {
      console.error('Error evaluating AI assistance request:', error);
      res.status(500).json({ 
        message: 'Failed to evaluate AI assistance request',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/ai-usage/:studentId/:assignmentId
 * @desc Get AI usage analytics for a student or assignment
 * @access Private (Students for own data, Instructors for their students)
 */
router.get('/ai-usage/:studentId/:assignmentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.userId!;
      const userRole = req.userRole!;
      
      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own AI usage' });
        return;
      }
      
      const timeframe = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const analytics = await AIBoundaryService.getAIUsageAnalytics(
        studentId,
        assignmentId,
        timeframe
      );
      
      res.json({
        message: 'AI usage analytics retrieved successfully',
        data: analytics
      });
    } catch (error: any) {
      console.error('Error getting AI usage analytics:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve AI usage analytics',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/ai-dependency/:studentId/:courseId
 * @desc Check if a student is becoming overly dependent on AI
 * @access Private (Instructors only)
 */
router.get('/ai-dependency/:studentId/:courseId',
  authenticate,
  requireRole(['educator', 'admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, courseId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ message: 'Start date and end date are required' });
        return;
      }
      
      const timeframe = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
      
      const assessment = await AIBoundaryService.assessAIDependency(
        studentId,
        courseId,
        timeframe
      );
      
      res.json({
        message: 'AI dependency assessment completed',
        data: assessment
      });
    } catch (error: any) {
      console.error('Error assessing AI dependency:', error);
      res.status(500).json({ 
        message: 'Failed to assess AI dependency',
        error: error.message 
      });
    }
  }
);

// Writing Process Service Endpoints

/**
 * @route GET /api/analytics/writing-patterns/:studentId/:assignmentId
 * @desc Analyze writing patterns for educational insights
 * @access Private (Students for own data, Instructors for their students)
 */
router.get('/writing-patterns/:studentId/:assignmentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.userId!;
      const userRole = req.userRole!;
      
      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own writing patterns' });
        return;
      }
      
      const timeframe = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const patterns = await WritingProcessService.analyzeWritingPatterns(
        studentId,
        assignmentId,
        timeframe
      );
      
      res.json({
        message: 'Writing patterns analyzed successfully',
        data: patterns
      });
    } catch (error: any) {
      console.error('Error analyzing writing patterns:', error);
      res.status(500).json({ 
        message: 'Failed to analyze writing patterns',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/development-timeline/:studentId/:assignmentId
 * @desc Generate comprehensive writing development timeline
 * @access Private (Students for own data, Instructors for their students)
 */
router.get('/development-timeline/:studentId/:assignmentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;
      
      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own development timeline' });
        return;
      }
      
      const timeline = await WritingProcessService.generateDevelopmentTimeline(
        studentId,
        assignmentId
      );
      
      res.json({
        message: 'Development timeline generated successfully',
        data: timeline
      });
    } catch (error: any) {
      console.error('Error generating development timeline:', error);
      res.status(500).json({ 
        message: 'Failed to generate development timeline',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/breakthrough-moments/:studentId/:assignmentId
 * @desc Identify writing breakthrough moments
 * @access Private (Students for own data, Instructors for their students)
 */
router.get('/breakthrough-moments/:studentId/:assignmentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      const userId = req.userId!;
      const userRole = req.userRole!;
      
      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ message: 'Access denied: Can only view your own breakthrough moments' });
        return;
      }
      
      const breakthroughs = await WritingProcessService.identifyBreakthroughMoments(
        studentId,
        assignmentId
      );
      
      res.json({
        message: 'Breakthrough moments identified successfully',
        data: breakthroughs
      });
    } catch (error: any) {
      console.error('Error identifying breakthrough moments:', error);
      res.status(500).json({ 
        message: 'Failed to identify breakthrough moments',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/analytics/intervention-recommendations/:studentId/:assignmentId
 * @desc Generate intervention recommendations based on writing process analysis
 * @access Private (Instructors only)
 */
router.get('/intervention-recommendations/:studentId/:assignmentId',
  authenticate,
  requireRole(['educator', 'admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId, assignmentId } = req.params;
      
      const recommendations = await WritingProcessService.generateInterventionRecommendations(
        studentId,
        assignmentId
      );
      
      res.json({
        message: 'Intervention recommendations generated successfully',
        data: recommendations
      });
    } catch (error: any) {
      console.error('Error generating intervention recommendations:', error);
      res.status(500).json({ 
        message: 'Failed to generate intervention recommendations',
        error: error.message 
      });
    }
  }
);

export default router;