import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper function to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Get all templates for an instructor
router.get('/my-templates', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, tags, search } = req.query;
    
    // Build where clause for Prisma
    const whereClause: any = {
      instructorId: userId
    };
    
    if (status && typeof status === 'string') {
      // Note: status field doesn't exist in current schema, but keeping for API compatibility
      whereClause.isPublic = status === 'published';
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags as string[] : [tags as string];
      whereClause.tags = {
        hasSome: tagArray
      };
    }
    
    // Handle search
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructions: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const templates = await prisma.assignmentTemplate.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching instructor templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get public template library
router.get('/library', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, bloomsLevel, tags, search } = req.query;
    
    // Build where clause for public templates
    const whereClause: any = {
      isPublic: true
    };
    
    // Handle learning objectives filtering (JSONB queries)
    if (category || bloomsLevel) {
      const learningObjectivesFilter: any = {};
      if (category) {
        learningObjectivesFilter.path = ['category'];
        learningObjectivesFilter.equals = category;
      }
      if (bloomsLevel) {
        learningObjectivesFilter.path = ['bloomsLevel'];
        learningObjectivesFilter.equals = parseInt(bloomsLevel as string);
      }
      whereClause.learningObjectives = learningObjectivesFilter;
    }
    
    // Handle tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags as string[] : [tags as string];
      whereClause.tags = {
        hasSome: tagArray
      };
    }
    
    // Handle search
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructions: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const templates = await prisma.assignmentTemplate.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching template library:', error);
    res.status(500).json({ error: 'Failed to fetch template library' });
  }
});

// Get template by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid template ID format' });
      return;
    }
    
    const template = await prisma.assignmentTemplate.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check access permissions
    const isOwner = template.instructorId === userId;
    const isPublic = template.isPublic;
    const isAdmin = userRole === 'admin';
    
    // Allow access to own templates regardless of status (for editing/deployment)
    const hasAccess = isOwner || isPublic || isAdmin;
    
    if (!hasAccess) {
      res.status(403).json({ 
        error: 'Access denied to this template',
        debug: {
          isOwner,
          isPublic,
          isAdmin,
          templateIsPublic: template.isPublic,
          note: 'You can only access templates you own, public templates, or if you are an admin'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      instructions,
      requirements,
      learningObjectives,
      writingStages,
      aiSettings,
      grading,
      tags,
      isPublic = false
    } = req.body;

    const userId = req.userId!;

    // Validate required fields
    if (!title || !instructions) {
      res.status(400).json({ error: 'Title and instructions are required' });
      return;
    }

    // Create template using Prisma
    const template = await prisma.assignmentTemplate.create({
      data: {
        title,
        description: description || null,
        instructions,
        instructorId: userId,
        requirements: requirements || {},
        writingStages: writingStages || [],
        learningObjectives: learningObjectives || [],
        aiSettings: {
          enabled: false,
          globalBoundary: 'moderate',
          allowedAssistanceTypes: [],
          requireReflection: true,
          reflectionPrompts: [],
          stageSpecificSettings: [],
          ...aiSettings
        },
        gradingCriteria: grading ? {
          enabled: false,
          allowPeerReview: false,
          ...grading
        } : null,
        tags: tags || [],
        isPublic: isPublic || false
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid template ID format' });
      return;
    }
    
    const template = await prisma.assignmentTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = template.instructorId === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can update template' });
      return;
    }
    
    // Update template
    const updatedTemplate = await prisma.assignmentTemplate.update({
      where: { id },
      data: {
        title: req.body.title || template.title,
        description: req.body.description !== undefined ? req.body.description : template.description,
        instructions: req.body.instructions || template.instructions,
        requirements: req.body.requirements || template.requirements,
        writingStages: req.body.writingStages || template.writingStages,
        learningObjectives: req.body.learningObjectives || template.learningObjectives,
        aiSettings: req.body.aiSettings || template.aiSettings,
        gradingCriteria: req.body.grading || template.gradingCriteria,
        tags: req.body.tags || template.tags,
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic : template.isPublic
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Publish template
router.patch('/:id/publish', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid template ID format' });
      return;
    }
    
    const template = await prisma.assignmentTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = template.instructorId === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can publish template' });
      return;
    }
    
    const updatedTemplate = await prisma.assignmentTemplate.update({
      where: { id },
      data: { isPublic: true },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error publishing template:', error);
    res.status(500).json({ error: 'Failed to publish template' });
  }
});

// Clone template
router.post('/:id/clone', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    
    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid template ID format' });
      return;
    }
    
    const originalTemplate = await prisma.assignmentTemplate.findUnique({
      where: { id }
    });
    
    if (!originalTemplate) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check if template is accessible (public or owned by user)
    const isOwner = originalTemplate.instructorId === userId;
    const isPublic = originalTemplate.isPublic;
    
    if (!isOwner && !isPublic) {
      res.status(403).json({ error: 'Cannot clone private template' });
      return;
    }
    
    // Create cloned template
    const clonedTemplate = await prisma.assignmentTemplate.create({
      data: {
        title: `${originalTemplate.title} (Copy)`,
        description: originalTemplate.description,
        instructions: originalTemplate.instructions,
        instructorId: userId,
        requirements: originalTemplate.requirements as any,
        writingStages: originalTemplate.writingStages as any,
        learningObjectives: originalTemplate.learningObjectives as any,
        aiSettings: originalTemplate.aiSettings as any,
        gradingCriteria: originalTemplate.gradingCriteria as any,
        tags: originalTemplate.tags,
        isPublic: false // Clones are private by default
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // Increment usage count of original template
    await prisma.assignmentTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: clonedTemplate
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ error: 'Failed to clone template' });
  }
});

// Delete template
router.delete('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid template ID format' });
      return;
    }
    
    const template = await prisma.assignmentTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = template.instructorId === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can delete template' });
      return;
    }
    
    await prisma.assignmentTemplate.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;