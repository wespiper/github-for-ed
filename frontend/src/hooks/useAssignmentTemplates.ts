import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type AssignmentTemplate, type CreateAssignmentTemplateInput } from '@shared/types';

// API functions
const assignmentTemplatesAPI = {
  // Get my templates
  getMyTemplates: async (filters?: { 
    status?: string; 
    tags?: string[]; 
    search?: string; 
  }): Promise<AssignmentTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/assignment-templates/my-templates?${params}`);
    return response.data.data;
  },

  // Get template library (public templates)
  getLibrary: async (filters?: {
    category?: string;
    bloomsLevel?: number;
    tags?: string[];
    search?: string;
    type?: string;
  }): Promise<AssignmentTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.bloomsLevel) params.append('bloomsLevel', filters.bloomsLevel.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/assignment-templates/library?${params}`);
    return response.data.data;
  },

  // Get template by ID
  getById: async (templateId: string): Promise<AssignmentTemplate> => {
    const response = await api.get(`/assignment-templates/${templateId}`);
    return response.data.data;
  },

  // Create template
  create: async (data: CreateAssignmentTemplateInput): Promise<AssignmentTemplate> => {
    const response = await api.post('/assignment-templates', data);
    return response.data.data;
  },

  // Update template
  update: async (templateId: string, data: Partial<CreateAssignmentTemplateInput>): Promise<AssignmentTemplate> => {
    const response = await api.put(`/assignment-templates/${templateId}`, data);
    return response.data.data;
  },

  // Publish template
  publish: async (templateId: string): Promise<AssignmentTemplate> => {
    const response = await api.patch(`/assignment-templates/${templateId}/publish`);
    return response.data.data;
  },

  // Archive template
  archive: async (templateId: string): Promise<AssignmentTemplate> => {
    const response = await api.patch(`/assignment-templates/${templateId}/archive`);
    return response.data.data;
  },

  // Clone template
  clone: async (templateId: string): Promise<AssignmentTemplate> => {
    const response = await api.post(`/assignment-templates/${templateId}/clone`);
    return response.data.data;
  },

  // Get template deployments
  getDeployments: async (templateId: string) => {
    const response = await api.get(`/assignment-templates/${templateId}/deployments`);
    return response.data.data;
  },

  // Delete template
  delete: async (templateId: string): Promise<void> => {
    await api.delete(`/assignment-templates/${templateId}`);
  }
};

// Custom hooks

// Get my templates
export const useMyTemplates = (filters?: { 
  status?: string; 
  tags?: string[]; 
  search?: string; 
}) => {
  return useQuery({
    queryKey: ['assignment-templates', 'my-templates', filters],
    queryFn: () => assignmentTemplatesAPI.getMyTemplates(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get template library
export const useTemplateLibrary = (filters?: {
  category?: string;
  bloomsLevel?: number;
  tags?: string[];
  search?: string;
  type?: string;
}) => {
  return useQuery({
    queryKey: ['assignment-templates', 'library', filters],
    queryFn: () => assignmentTemplatesAPI.getLibrary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get template by ID
export const useTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['assignment-templates', templateId],
    queryFn: () => assignmentTemplatesAPI.getById(templateId),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create template
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentTemplatesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] });
    }
  });
};

// Update template
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Partial<CreateAssignmentTemplateInput> }) =>
      assignmentTemplatesAPI.update(templateId, data),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] });
      queryClient.setQueryData(['assignment-templates', updatedTemplate._id], updatedTemplate);
    }
  });
};

// Publish template
export const usePublishTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentTemplatesAPI.publish,
    onSuccess: (publishedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] });
      queryClient.setQueryData(['assignment-templates', publishedTemplate._id], publishedTemplate);
    }
  });
};

// Archive template
export const useArchiveTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentTemplatesAPI.archive,
    onSuccess: (archivedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] });
      queryClient.setQueryData(['assignment-templates', archivedTemplate._id], archivedTemplate);
    }
  });
};

// Clone template
export const useCloneTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentTemplatesAPI.clone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] });
    }
  });
};

// Delete template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentTemplatesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] });
    }
  });
};