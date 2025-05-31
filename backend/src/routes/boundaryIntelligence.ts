import { Router, Request, Response } from 'express';
import { BoundaryIntelligence } from '../services/ai/BoundaryIntelligence';
import { AutoAdjustmentEngine } from '../services/ai/AutoAdjustmentEngine';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Get boundary recommendations for an assignment
router.get('/recommendations/:assignmentId', authenticate, authorize('educator'), async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify educator has access to this assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        course: {
          instructorId: (req as any).user.id
        }
      },
      include: {
        course: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found or access denied' 
      });
    }

    // Generate recommendations
    const recommendations = await BoundaryIntelligence.analyzeBoundaryEffectiveness(
      assignment.courseId,
      assignmentId
    );

    // Store recommendations for tracking
    for (const recommendation of recommendations) {
      await prisma.boundaryRecommendation.create({
        data: {
          assignmentId,
          recommendationType: recommendation.recommendationType,
          recommendation: recommendation,
          evidence: recommendation.classAdjustments?.evidence || 
                   recommendation.individualAdjustments || 
                   recommendation.temporalStrategy || {},
          status: 'pending'
        }
      });
    }

    res.json({
      success: true,
      data: {
        assignmentId,
        courseName: assignment.course.name,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error getting boundary recommendations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate recommendations' 
    });
  }
});

// Get pending proposals for educator review
router.get('/proposals', authenticate, authorize('educator'), async (req: Request, res: Response) => {
  try {
    const proposals = await prisma.boundaryProposal.findMany({
      where: {
        assignment: {
          course: {
            instructorId: (req as any).user.id
          }
        },
        status: 'pending'
      },
      include: {
        assignment: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: proposals.map(proposal => ({
        id: proposal.id,
        assignmentId: proposal.assignmentId,
        assignmentTitle: proposal.assignment.title,
        courseName: proposal.assignment.course.name,
        type: proposal.type,
        reason: proposal.reason,
        specificChange: proposal.specificChange,
        affectedStudentCount: proposal.affectedStudents.length,
        expectedOutcome: proposal.expectedOutcome,
        evidence: proposal.evidence,
        createdAt: proposal.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting proposals:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve proposals' 
    });
  }
});

// Get proposal details
router.get('/proposals/:proposalId', authenticate, authorize('educator'), async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    const proposal = await prisma.boundaryProposal.findFirst({
      where: {
        id: proposalId,
        assignment: {
          course: {
            instructorId: (req as any).user.id
          }
        }
      },
      include: {
        assignment: {
          include: {
            course: {
              include: {
                enrollments: {
                  include: {
                    user: true
                  },
                  where: {
                    userId: {
                      in: [] // Will be populated below
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!proposal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Proposal not found or access denied' 
      });
    }

    // Get affected student details
    const affectedStudents = await prisma.user.findMany({
      where: {
        id: {
          in: proposal.affectedStudents
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentProfile: {
          select: {
            currentCognitiveLoad: true,
            emotionalState: true,
            independenceMetrics: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...proposal,
        affectedStudentDetails: affectedStudents
      }
    });
  } catch (error) {
    console.error('Error getting proposal details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve proposal details' 
    });
  }
});

// Approve a proposal
router.post('/proposals/:proposalId/approve', authenticate, authorize('educator'), async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { educatorNotes } = req.body;

    // Verify educator has access
    const proposal = await prisma.boundaryProposal.findFirst({
      where: {
        id: proposalId,
        assignment: {
          course: {
            instructorId: (req as any).user.id
          }
        },
        status: 'pending'
      }
    });

    if (!proposal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Proposal not found or already processed' 
      });
    }

    // Approve and implement
    await AutoAdjustmentEngine.approveProposal(
      proposalId,
      (req as any).user.id,
      educatorNotes
    );

    res.json({
      success: true,
      message: 'Proposal approved and implemented successfully'
    });
  } catch (error) {
    console.error('Error approving proposal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve proposal' 
    });
  }
});

// Reject a proposal
router.post('/proposals/:proposalId/reject', authenticate, authorize('educator'), async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    // Verify educator has access
    const proposal = await prisma.boundaryProposal.findFirst({
      where: {
        id: proposalId,
        assignment: {
          course: {
            instructorId: (req as any).user.id
          }
        },
        status: 'pending'
      }
    });

    if (!proposal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Proposal not found or already processed' 
      });
    }

    // Reject proposal
    await AutoAdjustmentEngine.rejectProposal(
      proposalId,
      (req as any).user.id,
      reason
    );

    res.json({
      success: true,
      message: 'Proposal rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject proposal' 
    });
  }
});

// Get boundary effectiveness metrics
router.get('/effectiveness/:assignmentId', authenticate, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    // Check access based on role
    let hasAccess = false;
    if (userRole === 'educator' || userRole === 'admin') {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          course: {
            instructorId: userId
          }
        }
      });
      hasAccess = !!assignment;
    } else if (userRole === 'student') {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userId,
          course: {
            assignments: {
              some: { id: assignmentId }
            }
          }
        }
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get effectiveness metrics
    const adjustmentLogs = await prisma.boundaryAdjustmentLog.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const currentBoundaries = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { aiBoundarySettings: true }
    });

    // Calculate impact metrics if adjustments have been made
    let impactSummary = null;
    if (adjustmentLogs.length > 0) {
      const latestLog = adjustmentLogs[0];
      if (latestLog.impactMetrics) {
        impactSummary = latestLog.impactMetrics;
      }
    }

    res.json({
      success: true,
      data: {
        currentBoundaries: currentBoundaries?.aiBoundarySettings || {},
        adjustmentHistory: adjustmentLogs.map(log => ({
          id: log.id,
          previousValue: log.previousValue,
          newValue: log.newValue,
          reason: log.reason,
          implementedBy: log.implementedBy,
          implementedAt: log.createdAt,
          impact: log.impactMetrics
        })),
        impactSummary
      }
    });
  } catch (error) {
    console.error('Error getting effectiveness metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve effectiveness metrics' 
    });
  }
});

// Trigger auto-adjustment analysis (admin only)
router.post('/analyze/:assignmentId', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }

    // Run auto-adjustment analysis
    const proposals = await AutoAdjustmentEngine.monitorAndPropose(assignmentId);

    res.json({
      success: true,
      data: {
        assignmentId,
        proposalsGenerated: proposals.length,
        proposals: proposals.map(p => ({
          type: p.type,
          reason: p.reason,
          affectedStudentCount: p.affectedStudents.length
        }))
      }
    });
  } catch (error) {
    console.error('Error running analysis:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run analysis' 
    });
  }
});

export default router;