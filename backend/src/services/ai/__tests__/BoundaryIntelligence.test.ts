import { BoundaryIntelligence } from '../BoundaryIntelligence';
import { AutoAdjustmentEngine } from '../AutoAdjustmentEngine';
import prisma from '../../../lib/prisma';
import { CacheService } from '../../CacheService';

// Mock prisma
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn()
    },
    writingSession: {
      findMany: jest.fn()
    },
    aIInteractionLog: {
      findMany: jest.fn()
    },
    assignmentSubmission: {
      findMany: jest.fn()
    },
    assignment: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    boundaryRecommendation: {
      create: jest.fn()
    },
    boundaryProposal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    boundaryAdjustmentLog: {
      create: jest.fn()
    },
    studentProfile: {
      findMany: jest.fn()
    }
  }
}));

// Mock NotificationService
jest.mock('../../NotificationService', () => ({
  NotificationService: {
    createNotification: jest.fn()
  }
}));

describe('BoundaryIntelligence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CacheService.clear();
  });

  afterAll(() => {
    CacheService.stopCleanup();
  });

  describe('analyzeBoundaryEffectiveness', () => {
    test('identifies over-dependent class patterns', async () => {
      const courseId = 'test-course';
      const assignmentId = 'test-assignment';
      
      // Mock data for over-dependent class - need high cognitive load and over-dependence for effectiveness < 70
      const mockStudents = [
        { 
          id: 'student1', 
          firstName: 'Test', 
          lastName: 'Student1',
          studentProfile: { 
            currentCognitiveLoad: 'high',
            independenceTrend: 'decreasing'
          },
          // For segmentStudents - needs nested interactions/sessions
          aiInteractionLogs: Array(6).fill(null).map((_, i) => ({ 
            studentId: 'student1', 
            assignmentId,
            reflectionAnalyses: [{ overallQualityScore: 45 }]
          })),
          writingSessions: [{ userId: 'student1', duration: 3600, document: { assignmentId }, activity: {} }]
        },
        { 
          id: 'student2', 
          firstName: 'Test', 
          lastName: 'Student2',
          studentProfile: { 
            currentCognitiveLoad: 'overload',
            independenceTrend: 'decreasing'
          },
          // For segmentStudents - needs nested interactions/sessions  
          aiInteractionLogs: Array(6).fill(null).map((_, i) => ({ 
            studentId: 'student2', 
            assignmentId,
            reflectionAnalyses: [{ overallQualityScore: 40 }]
          })),
          writingSessions: [{ userId: 'student2', duration: 3600, document: { assignmentId }, activity: {} }]
        },
        { 
          id: 'student3', 
          firstName: 'Test', 
          lastName: 'Student3',
          studentProfile: { 
            currentCognitiveLoad: 'high',
            independenceTrend: 'stable'
          },
          // For segmentStudents - no AI usage, under-utilizing
          aiInteractionLogs: [],
          writingSessions: [{ userId: 'student3', duration: 3600, document: { assignmentId }, activity: {} }]
        }
      ];

      const mockSessions = [
        { userId: 'student1', duration: 3600, document: { assignmentId }, activity: {} }, // 1 hour
        { userId: 'student2', duration: 3600, document: { assignmentId }, activity: {} }, // 1 hour
        { userId: 'student3', duration: 3600, document: { assignmentId }, activity: {} }  // 1 hour
      ];

      const mockInteractions = [
        // Student 1: 6 interactions in 1 hour = over-dependent (>5)
        ...Array(6).fill(null).map((_, i) => ({ 
          studentId: 'student1', 
          assignmentId,
          reflectionAnalyses: [{ overallQualityScore: 45 }] // Low quality for effectiveness reduction
        })),
        // Student 2: 6 interactions in 1 hour = over-dependent (>5) 
        ...Array(6).fill(null).map((_, i) => ({ 
          studentId: 'student2', 
          assignmentId,
          reflectionAnalyses: [{ overallQualityScore: 40 }] // Low quality for effectiveness reduction
        })),
        // Student 3: 0 interactions in 1 hour = under-utilizing given high cognitive load (aiUsageRate < 1)
      ];

      const mockSubmissions = [
        { assignmentId, authorId: 'student1', submittedAt: new Date() },
        { assignmentId, authorId: 'student2', submittedAt: null },
        { assignmentId, authorId: 'student3', submittedAt: new Date() }
      ];

      const mockAssignment = {
        id: assignmentId,
        aiBoundarySettings: { questionsPerHour: 5 },
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Started 3 days ago
      };

      // Set up mocks
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockStudents);
      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue(mockInteractions);
      (prisma.assignmentSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(mockAssignment);

      // Run analysis
      const recommendations = await BoundaryIntelligence.analyzeBoundaryEffectiveness(
        courseId,
        assignmentId
      );

      // Assertions
      expect(recommendations).toHaveLength(3); // class-wide, individual, temporal
      
      // Check class-wide recommendation
      const classWideRec = recommendations.find(r => r.recommendationType === 'class_wide');
      expect(classWideRec).toBeDefined();
      expect(classWideRec?.classAdjustments?.currentEffectiveness).toBeLessThan(70);
      expect(classWideRec?.classAdjustments?.recommendedChanges).toContainEqual(
        expect.objectContaining({
          parameter: 'questionsPerHour',
          rationale: expect.stringContaining('dependency')
        })
      );

      // Check individual recommendations
      const individualRec = recommendations.find(r => r.recommendationType === 'individual');
      expect(individualRec).toBeDefined();
      expect(individualRec?.individualAdjustments?.length).toBeGreaterThan(0);
      
      // Check temporal recommendation
      const temporalRec = recommendations.find(r => r.recommendationType === 'temporal');
      expect(temporalRec).toBeDefined();
      expect(temporalRec?.temporalStrategy?.phase).toBe('early');
    });

    test('generates individual recommendations for struggling students', async () => {
      const courseId = 'test-course';
      const assignmentId = 'test-assignment';
      
      // Mock data for struggling students
      const mockStudents = [
        { 
          id: 'student1', 
          firstName: 'Struggling', 
          lastName: 'Student',
          studentProfile: { 
            currentCognitiveLoad: 'overload',
            independenceTrend: 'stable'
          },
          // For segmentStudents - struggling student with some AI usage (>= 1)
          aiInteractionLogs: [{ 
            studentId: 'student1', 
            assignmentId,
            reflectionAnalyses: [{ overallQualityScore: 30 }]
          }],
          writingSessions: [{ userId: 'student1', duration: 3600, document: { assignmentId }, activity: {} }]
        }
      ];

      const mockSessions = [
        { userId: 'student1', duration: 3600, document: { assignmentId }, activity: {} }
      ];

      const mockInteractions = [
        { 
          studentId: 'student1', 
          assignmentId,
          reflectionAnalyses: [{ overallQualityScore: 30 }]
        }
      ];

      const mockSubmissions: any[] = [];

      const mockAssignment = {
        id: assignmentId,
        aiBoundarySettings: { questionsPerHour: 5 },
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };

      // Set up mocks
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockStudents);
      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue(mockInteractions);
      (prisma.assignmentSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(mockAssignment);

      // Run analysis
      const recommendations = await BoundaryIntelligence.analyzeBoundaryEffectiveness(
        courseId,
        assignmentId
      );

      // Check individual recommendation exists
      const individualRec = recommendations.find(r => r.recommendationType === 'individual');
      expect(individualRec).toBeDefined();
      expect(individualRec?.individualAdjustments).toContainEqual(
        expect.objectContaining({
          studentId: 'student1',
          currentIssue: expect.stringContaining('cognitive load'),
          recommendedBoundary: expect.stringContaining('scaffolded')
        })
      );
    });

    test('caches analytics for performance', async () => {
      const courseId = 'test-cache-course';
      const assignmentId = 'test-cache-assignment';
      
      // Clear cache before test
      CacheService.clear();
      
      // Mock minimal data
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.assignmentSubmission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        aiBoundarySettings: {},
        dueDate: new Date(),
        createdAt: new Date()
      });

      // First call - should hit database
      await BoundaryIntelligence.analyzeBoundaryEffectiveness(courseId, assignmentId);
      const firstCallCountUsers = (prisma.user.findMany as jest.Mock).mock.calls.length;
      const firstCallCountSessions = (prisma.writingSession.findMany as jest.Mock).mock.calls.length;
      const firstCallCountInteractions = (prisma.aIInteractionLog.findMany as jest.Mock).mock.calls.length;

      // Clear mocks to reset call counts
      jest.clearAllMocks();

      // Second call - should use cache and not make additional database calls
      await BoundaryIntelligence.analyzeBoundaryEffectiveness(courseId, assignmentId);
      const secondCallCountUsers = (prisma.user.findMany as jest.Mock).mock.calls.length;
      const secondCallCountSessions = (prisma.writingSession.findMany as jest.Mock).mock.calls.length;
      const secondCallCountInteractions = (prisma.aIInteractionLog.findMany as jest.Mock).mock.calls.length;

      // Should be reduced calls on second invocation due to partial caching
      // Note: segmentStudents still makes one user.findMany call, but gatherClassAnalytics is cached
      expect(secondCallCountUsers).toBe(1); // Only segmentStudents call
      expect(secondCallCountSessions).toBe(0); // Cached
      expect(secondCallCountInteractions).toBe(0); // Cached
    });
  });

  describe('proposeAutoAdjustments', () => {
    test('proposes reduction when over-dependence detected', async () => {
      const assignmentId = 'test-assignment';
      
      // Mock assignment with full structure for all calls  
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        courseId: 'test-course',
        aiBoundarySettings: { questionsPerHour: 5 },
        course: {
          enrollments: [
            { studentId: 'student1', student: { 
              id: 'student1',
              studentProfile: { currentCognitiveLoad: 'optimal' },
              aiInteractionLogs: Array(10).fill({}).map(() => ({ 
                studentId: 'student1', 
                assignmentId,
                reflectionAnalyses: [{ overallQualityScore: 50 }]
              })),
              writingSessions: [{ userId: 'student1', duration: 3600 }]
            }},
            { studentId: 'student2', student: { 
              id: 'student2',
              studentProfile: { currentCognitiveLoad: 'optimal' },
              aiInteractionLogs: Array(8).fill({}).map(() => ({ 
                studentId: 'student2', 
                assignmentId,
                reflectionAnalyses: [{ overallQualityScore: 45 }]
              })),
              writingSessions: [{ userId: 'student2', duration: 3600 }]
            }},
            { studentId: 'student3', student: { 
              id: 'student3',
              studentProfile: { currentCognitiveLoad: 'optimal' },
              aiInteractionLogs: Array(9).fill({}).map(() => ({ 
                studentId: 'student3', 
                assignmentId,
                reflectionAnalyses: [{ overallQualityScore: 48 }]
              })),
              writingSessions: [{ userId: 'student3', duration: 3600 }]
            }}
          ]
        }
      });

      // Mock performance data showing over-dependence
      const mockProfiles = [
        { studentId: 'student1', currentCognitiveLoad: 'optimal' },
        { studentId: 'student2', currentCognitiveLoad: 'optimal' },
        { studentId: 'student3', currentCognitiveLoad: 'optimal' }
      ];

      const mockInteractions = [
        ...Array(10).fill(null).map(() => ({ 
          studentId: 'student1', 
          assignmentId,
          reflectionAnalyses: [{ overallQualityScore: 50 }]
        })),
        ...Array(8).fill(null).map(() => ({ 
          studentId: 'student2', 
          assignmentId,
          reflectionAnalyses: [{ overallQualityScore: 45 }]
        })),
        ...Array(9).fill(null).map(() => ({ 
          studentId: 'student3', 
          assignmentId,
          reflectionAnalyses: [{ overallQualityScore: 48 }]
        }))
      ];

      const mockSessions = [
        { userId: 'student1', duration: 3600, document: { assignmentId } }, // 1 hour
        { userId: 'student2', duration: 3600, document: { assignmentId } }, // 1 hour
        { userId: 'student3', duration: 3600, document: { assignmentId } }  // 1 hour
      ];

      (prisma.studentProfile.findMany as jest.Mock).mockResolvedValue(mockProfiles);
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue(mockInteractions);
      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      (prisma.assignmentSubmission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.boundaryProposal.create as jest.Mock).mockResolvedValue({ id: 'proposal1' });
      (prisma.boundaryProposal.findMany as jest.Mock).mockResolvedValue([]); // No recent proposals

      // Run auto adjustment
      const proposals = await AutoAdjustmentEngine.monitorAndPropose(assignmentId);

      // Assertions
      expect(proposals).toContainEqual(
        expect.objectContaining({
          type: 'reduce_access',
          reason: expect.stringContaining('dependency'),
          specificChange: expect.stringContaining('Reduce')
        })
      );
      
      expect(prisma.boundaryProposal.create).toHaveBeenCalled();
    });

    test('proposes support increase when students struggling but not using AI', async () => {
      const assignmentId = 'test-assignment';
      
      // Mock assignment with struggling students not using AI
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
        id: assignmentId,
        courseId: 'test-course',
        aiBoundarySettings: { questionsPerHour: 5 },
        course: {
          enrollments: [
            { studentId: 'student1', student: { 
              id: 'student1',
              studentProfile: { currentCognitiveLoad: 'high' },
              aiInteractionLogs: [], // No AI usage
              writingSessions: [{ userId: 'student1', duration: 3600 }]
            }},
            { studentId: 'student2', student: { 
              id: 'student2',
              studentProfile: { currentCognitiveLoad: 'overload' },
              aiInteractionLogs: [], // No AI usage  
              writingSessions: [{ userId: 'student2', duration: 3600 }]
            }},
            { studentId: 'student3', student: { 
              id: 'student3',
              studentProfile: { currentCognitiveLoad: 'high' },
              aiInteractionLogs: [], // No AI usage
              writingSessions: [{ userId: 'student3', duration: 3600 }]
            }}
          ]
        }
      });

      const mockProfiles = [
        { studentId: 'student1', currentCognitiveLoad: 'high' },
        { studentId: 'student2', currentCognitiveLoad: 'overload' },
        { studentId: 'student3', currentCognitiveLoad: 'high' }
      ];

      const mockInteractions: any[] = []; // No AI usage
      const mockSessions = [
        { userId: 'student1', duration: 3600, document: { assignmentId } },
        { userId: 'student2', duration: 3600, document: { assignmentId } },
        { userId: 'student3', duration: 3600, document: { assignmentId } }
      ];

      (prisma.studentProfile.findMany as jest.Mock).mockResolvedValue(mockProfiles);
      (prisma.aIInteractionLog.findMany as jest.Mock).mockResolvedValue(mockInteractions);
      (prisma.writingSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      (prisma.assignmentSubmission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.boundaryProposal.create as jest.Mock).mockResolvedValue({ id: 'proposal2' });
      (prisma.boundaryProposal.findMany as jest.Mock).mockResolvedValue([]); // No recent proposals

      // Run auto adjustment
      const proposals = await AutoAdjustmentEngine.monitorAndPropose(assignmentId);

      // Assertions
      expect(proposals).toContainEqual(
        expect.objectContaining({
          type: 'increase_support',
          reason: expect.stringContaining('struggling but only'),
          specificChange: expect.stringContaining('proactive')
        })
      );
    });
  });

  describe('Auto-adjustment approval workflow', () => {
    test('approves proposal and implements changes', async () => {
      const proposalId = 'test-proposal';
      const educatorId = 'educator1';
      const educatorNotes = 'Approved for better student support';

      const mockProposal = {
        id: proposalId,
        assignmentId: 'test-assignment',
        type: 'reduce_access',
        reason: 'High dependency',
        specificChange: 'Reduce to 3/hour',
        affectedStudents: ['student1', 'student2'],
        status: 'pending',
        assignment: {
          id: 'test-assignment',
          aiBoundarySettings: { questionsPerHour: 5 }
        }
      };

      (prisma.boundaryProposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);
      (prisma.boundaryProposal.update as jest.Mock).mockResolvedValue({
        ...mockProposal,
        status: 'approved',
        approvedBy: educatorId,
        educatorNotes
      });
      (prisma.assignment.update as jest.Mock).mockResolvedValue({});
      (prisma.boundaryAdjustmentLog.create as jest.Mock).mockResolvedValue({});

      // Approve proposal
      await AutoAdjustmentEngine.approveProposal(proposalId, educatorId, educatorNotes);

      // Assertions
      expect(prisma.boundaryProposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: proposalId },
          data: expect.objectContaining({
            status: 'approved',
            approvedBy: educatorId,
            educatorNotes
          })
        })
      );

      expect(prisma.assignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-assignment' },
          data: expect.objectContaining({
            aiBoundarySettings: expect.objectContaining({
              questionsPerHour: 3
            })
          })
        })
      );

      expect(prisma.boundaryAdjustmentLog.create).toHaveBeenCalled();
    });
  });
});