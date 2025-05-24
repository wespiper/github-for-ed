import { Router, Response } from 'express';
import { AssignmentTemplate } from '../models/AssignmentTemplate';
import { CourseAssignment } from '../models/CourseAssignment';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper function to extract instructor ID from populated or non-populated field
const getInstructorId = (instructor: any): string => {
  return typeof instructor === 'object' && instructor._id 
    ? instructor._id.toString() 
    : instructor.toString();
};

// Get all templates for an instructor
router.get('/my-templates', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status, tags, search } = req.query;
    
    let filters: any = {};
    if (status) filters.status = status;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = { $in: tagArray };
    }
    
    let templates;
    if (search && typeof search === 'string') {
      templates = await (AssignmentTemplate as any).searchTemplates(search, userId);
    } else {
      templates = await (AssignmentTemplate as any).findByInstructor(userId, filters);
    }
    
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
    const { category, bloomsLevel, tags, search, type } = req.query;
    
    let filters: any = {};
    if (category) filters['learningObjectives.category'] = category;
    if (bloomsLevel) filters['learningObjectives.bloomsLevel'] = parseInt(bloomsLevel as string);
    if (type) filters.type = type;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = { $in: tagArray };
    }
    
    let templates;
    if (search && typeof search === 'string') {
      templates = await (AssignmentTemplate as any).searchTemplates(search);
    } else {
      templates = await (AssignmentTemplate as any).findPublicTemplates(filters);
    }
    
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
    
    const template = await AssignmentTemplate.findById(id)
      .populate('instructor', 'firstName lastName email')
      .populate('deploymentCount');
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check access permissions
    const isOwner = getInstructorId(template.instructor) === userId;
    const isPublic = template.isPublic && template.status === 'published';
    const isAdmin = userRole === 'admin';
    
    // Allow access to own templates regardless of status (for editing/deployment)
    const hasAccess = isOwner || isPublic || isAdmin;
    
    // Debug logging
    console.log('Template access check:', {
      templateId: id,
      instructorId: getInstructorId(template.instructor),
      currentUserId: userId,
      isOwner,
      templateIsPublic: template.isPublic,
      templateStatus: template.status,
      isPublic,
      isAdmin,
      userRole,
      hasAccess
    });
    
    if (!hasAccess) {
      res.status(403).json({ 
        error: 'Access denied to this template',
        debug: {
          isOwner,
          isPublic,
          isAdmin,
          templateStatus: template.status,
          templateIsPublic: template.isPublic,
          note: 'You can only access templates you own, public published templates, or if you are an admin'
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
      type = 'individual',
      requirements,
      collaboration,
      versionControl,
      learningObjectives,
      writingStages,
      aiSettings,
      grading,
      tags,
      isPublic = false
    } = req.body;

    const userId = req.userId!;

    // Create template
    const template = new AssignmentTemplate({
      title,
      description,
      instructions,
      instructor: userId,
      type,
      requirements: requirements || {},
      collaboration: {
        enabled: type === 'collaborative',
        allowRealTimeEditing: type === 'collaborative',
        allowComments: true,
        allowSuggestions: true,
        requireApprovalForChanges: false,
        ...collaboration
      },
      versionControl: {
        autoSaveInterval: 30,
        createVersionOnSubmit: true,
        allowVersionRevert: false,
        trackAllChanges: true,
        ...versionControl
      },
      learningObjectives: learningObjectives || [],
      writingStages: writingStages || [],
      aiSettings: {
        enabled: false,
        globalBoundary: 'moderate',
        allowedAssistanceTypes: [],
        requireReflection: true,
        reflectionPrompts: [],
        stageSpecificSettings: [],
        ...aiSettings
      },
      grading: {
        enabled: false,
        allowPeerReview: false,
        ...grading
      },
      tags: tags || [],
      isPublic,
      status: 'draft'
    });

    await template.save();
    
    // Populate for response
    await template.populate('instructor', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    if (error instanceof Error && error.message.includes('weights must sum to 100%')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
});

// Update template
router.put('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const template = await AssignmentTemplate.findById(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = getInstructorId(template.instructor) === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can update template' });
      return;
    }
    
    // Update template
    Object.assign(template, req.body);
    await template.save();
    
    // Populate for response
    await template.populate('instructor', 'firstName lastName email');
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    if (error instanceof Error && error.message.includes('weights must sum to 100%')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update template' });
    }
  }
});

// Publish template
router.patch('/:id/publish', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const template = await AssignmentTemplate.findById(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = getInstructorId(template.instructor) === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can publish template' });
      return;
    }
    
    template.status = 'published';
    await template.save();
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error publishing template:', error);
    res.status(500).json({ error: 'Failed to publish template' });
  }
});

// Archive template
router.patch('/:id/archive', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const template = await AssignmentTemplate.findById(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = getInstructorId(template.instructor) === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can archive template' });
      return;
    }
    
    template.status = 'archived';
    await template.save();
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error archiving template:', error);
    res.status(500).json({ error: 'Failed to archive template' });
  }
});

// Clone template (create copy)
router.post('/:id/clone', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const originalTemplate = await AssignmentTemplate.findById(id);
    if (!originalTemplate) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check access permissions
    const isOwner = originalTemplate.instructor.toString() === userId;
    const isPublic = originalTemplate.isPublic && originalTemplate.status === 'published';
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isPublic && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this template' });
      return;
    }
    
    // Create clone
    const cloneData = originalTemplate.toObject();
    const { _id, createdAt, updatedAt, __v, ...templateData } = cloneData;
    
    const clonedTemplate = new AssignmentTemplate({
      ...templateData,
      title: `${originalTemplate.title} (Copy)`,
      instructor: userId,
      status: 'draft',
      isPublic: false,
      usageCount: 0
    });
    
    await clonedTemplate.save();
    await clonedTemplate.populate('instructor', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: clonedTemplate
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ error: 'Failed to clone template' });
  }
});

// Get template deployments
router.get('/:id/deployments', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const template = await AssignmentTemplate.findById(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = getInstructorId(template.instructor) === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can view deployments' });
      return;
    }
    
    const deployments = await (CourseAssignment as any).findByTemplate(id);
    
    res.json({
      success: true,
      data: deployments
    });
  } catch (error) {
    console.error('Error fetching template deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Delete template
router.delete('/:id', authenticate, requireRole(['educator', 'admin']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.user!.role;
    
    const template = await AssignmentTemplate.findById(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    // Check ownership
    const isOwner = getInstructorId(template.instructor) === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only template owner can delete template' });
      return;
    }
    
    // Check if template has deployments
    const deploymentCount = await CourseAssignment.countDocuments({ 
      template: id, 
      status: { $ne: 'archived' } 
    });
    
    if (deploymentCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete template with active deployments. Archive it instead.' 
      });
      return;
    }
    
    await AssignmentTemplate.findByIdAndDelete(id);
    
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