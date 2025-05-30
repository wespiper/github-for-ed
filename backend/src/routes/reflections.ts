import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { ReflectionAnalysisService } from '../services/ai/ReflectionAnalysisService';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @route POST /api/reflections/submit
 * @desc Submit and analyze a reflection for an AI interaction
 * @access Private (Students only)
 */
router.post('/submit',
  authenticate,
  requireRole(['student']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.userId!;
      const { 
        aiInteractionId, 
        assignmentId, 
        reflection, 
        writingStage 
      } = req.body;

      // Validate input
      if (!aiInteractionId || !assignmentId || !reflection || !writingStage) {
        res.status(400).json({ 
          message: 'AI interaction ID, assignment ID, reflection text, and writing stage are required' 
        });
        return;
      }

      // Verify the AI interaction exists and belongs to this student
      const aiInteraction = await prisma.aIInteractionLog.findFirst({
        where: {
          id: aiInteractionId,
          studentId: studentId
        }
      });

      if (!aiInteraction) {
        res.status(404).json({ 
          message: 'AI interaction not found or access denied' 
        });
        return;
      }

      // Analyze the reflection
      const analysis = await ReflectionAnalysisService.analyzeReflection(
        reflection,
        {
          studentId,
          assignmentId,
          aiInteractionId,
          writingStage
        }
      );

      // Update the AI interaction to mark reflection as completed
      await prisma.aIInteractionLog.update({
        where: { id: aiInteractionId },
        data: {
          reflectionCompleted: true,
          metadata: {
            ...(aiInteraction.metadata as any || {}),
            reflection: reflection,
            reflectionAnalysis: analysis,
            reflectionSubmittedAt: new Date()
          }
        }
      });

      res.json({
        success: true,
        message: 'Reflection submitted and analyzed successfully',
        data: {
          analysis,
          progressiveAccessLevel: analysis.overall.progressiveAccessLevel,
          recommendations: analysis.overall.recommendations
        }
      });
    } catch (error: any) {
      console.error('Error submitting reflection:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to submit reflection',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/reflections/history/:studentId
 * @desc Get reflection history and analytics for a student
 * @access Private (Students for own data, Educators for their students)
 */
router.get('/history/:studentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { assignmentId } = req.query;
      const userId = req.userId!;
      const userRole = req.userRole!;

      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        res.status(403).json({ 
          message: 'Access denied: Can only view your own reflection history' 
        });
        return;
      }

      // If educator, verify they have access to this student
      if (userRole === 'educator') {
        const hasAccess = await prisma.assignment.findFirst({
          where: {
            instructorId: userId,
            submissions: {
              some: {
                authorId: studentId
              }
            }
          }
        });

        if (!hasAccess) {
          res.status(403).json({ 
            message: 'Access denied: No access to this student\'s data' 
          });
          return;
        }
      }

      const history = await ReflectionAnalysisService.getStudentReflectionHistory(
        studentId,
        assignmentId as string | undefined
      );

      res.json({
        success: true,
        message: 'Reflection history retrieved successfully',
        data: history
      });
    } catch (error: any) {
      console.error('Error getting reflection history:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get reflection history',
        error: error.message 
      });
    }
  }
);

/**
 * @route GET /api/reflections/quality-report/:assignmentId
 * @desc Get aggregate reflection quality report for an assignment
 * @access Private (Educators only)
 */
router.get('/quality-report/:assignmentId',
  authenticate,
  requireRole(['educator']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { assignmentId } = req.params;
      const instructorId = req.userId!;

      // Verify educator owns this assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          instructorId: instructorId
        }
      });

      if (!assignment) {
        res.status(403).json({ 
          message: 'Access denied: Assignment not found or you do not have access' 
        });
        return;
      }

      // Get all reflections for this assignment
      const reflections = await prisma.aIInteractionLog.findMany({
        where: {
          assignmentId: assignmentId,
          reflectionCompleted: true
        },
        select: {
          studentId: true,
          metadata: true,
          createdAt: true
        }
      });

      // Aggregate quality metrics
      const studentMetrics = new Map<string, any>();
      
      reflections.forEach((reflection: any) => {
        const analysis = reflection.metadata?.reflectionAnalysis;
        if (!analysis) return;

        const studentId = reflection.studentId;
        if (!studentMetrics.has(studentId)) {
          studentMetrics.set(studentId, {
            totalReflections: 0,
            totalQualityScore: 0,
            depthScores: [],
            selfAwarenessScores: [],
            criticalThinkingScores: [],
            growthMindsetScores: [],
            authenticityScores: []
          });
        }

        const metrics = studentMetrics.get(studentId);
        metrics.totalReflections++;
        metrics.totalQualityScore += analysis.overall?.qualityScore || 0;
        metrics.depthScores.push(analysis.depth?.score || 0);
        metrics.selfAwarenessScores.push(analysis.selfAwareness?.score || 0);
        metrics.criticalThinkingScores.push(analysis.criticalEngagement?.score || 0);
        metrics.growthMindsetScores.push(analysis.growthMindset?.score || 0);
        metrics.authenticityScores.push(analysis.overall?.authenticityScore || 0);
      });

      // Calculate averages
      const report = {
        assignmentId,
        totalStudents: studentMetrics.size,
        totalReflections: reflections.length,
        classAverages: {
          overallQuality: 0,
          depth: 0,
          selfAwareness: 0,
          criticalThinking: 0,
          growthMindset: 0,
          authenticity: 0
        },
        studentBreakdown: [] as any[]
      };

      let classQualitySum = 0;
      let classDepthSum = 0;
      let classSelfAwarenessSum = 0;
      let classCriticalThinkingSum = 0;
      let classGrowthMindsetSum = 0;
      let classAuthenticitySum = 0;

      studentMetrics.forEach((metrics, studentId) => {
        const avgQuality = metrics.totalQualityScore / metrics.totalReflections;
        const avgDepth = metrics.depthScores.reduce((a: number, b: number) => a + b, 0) / metrics.depthScores.length;
        const avgSelfAwareness = metrics.selfAwarenessScores.reduce((a: number, b: number) => a + b, 0) / metrics.selfAwarenessScores.length;
        const avgCriticalThinking = metrics.criticalThinkingScores.reduce((a: number, b: number) => a + b, 0) / metrics.criticalThinkingScores.length;
        const avgGrowthMindset = metrics.growthMindsetScores.reduce((a: number, b: number) => a + b, 0) / metrics.growthMindsetScores.length;
        const avgAuthenticity = metrics.authenticityScores.reduce((a: number, b: number) => a + b, 0) / metrics.authenticityScores.length;

        classQualitySum += avgQuality;
        classDepthSum += avgDepth;
        classSelfAwarenessSum += avgSelfAwareness;
        classCriticalThinkingSum += avgCriticalThinking;
        classGrowthMindsetSum += avgGrowthMindset;
        classAuthenticitySum += avgAuthenticity;

        report.studentBreakdown.push({
          studentId,
          totalReflections: metrics.totalReflections,
          averageQuality: Math.round(avgQuality),
          dimensions: {
            depth: Math.round(avgDepth),
            selfAwareness: Math.round(avgSelfAwareness),
            criticalThinking: Math.round(avgCriticalThinking),
            growthMindset: Math.round(avgGrowthMindset),
            authenticity: Math.round(avgAuthenticity)
          }
        });
      });

      // Calculate class averages
      if (studentMetrics.size > 0) {
        report.classAverages = {
          overallQuality: Math.round(classQualitySum / studentMetrics.size),
          depth: Math.round(classDepthSum / studentMetrics.size),
          selfAwareness: Math.round(classSelfAwarenessSum / studentMetrics.size),
          criticalThinking: Math.round(classCriticalThinkingSum / studentMetrics.size),
          growthMindset: Math.round(classGrowthMindsetSum / studentMetrics.size),
          authenticity: Math.round(classAuthenticitySum / studentMetrics.size)
        };
      }

      res.json({
        success: true,
        message: 'Reflection quality report generated successfully',
        data: report
      });
    } catch (error: any) {
      console.error('Error generating quality report:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to generate quality report',
        error: error.message 
      });
    }
  }
);

export default router;