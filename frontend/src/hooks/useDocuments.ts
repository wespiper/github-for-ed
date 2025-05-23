import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/documents';

// Types
export interface Document {
  _id: string;
  title: string;
  content: string;
  course: {
    _id: string;
    title: string;
  };
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  collaborators: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  chapter?: string;
  lesson?: string;
  type: 'draft' | 'assignment' | 'submission' | 'collaborative';
  status: 'active' | 'archived' | 'deleted';
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    allowCollaboration: boolean;
    versionLimit?: number;
  };
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    lastEditedAt: string;
    lastEditedBy: {
      firstName: string;
      lastName: string;
    };
  };
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  _id: string;
  document: string;
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
  author: {
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
  };
  changeSummary: string;
  createdAt: string;
}

export interface CreateDocumentData {
  title: string;
  courseId: string;
  chapter?: string;
  lesson?: string;
  type?: 'draft' | 'assignment' | 'submission' | 'collaborative';
  settings?: {
    autoSave?: boolean;
    autoSaveInterval?: number;
    allowCollaboration?: boolean;
    versionLimit?: number;
  };
}

export interface UpdateDocumentData {
  content: string;
  title?: string;
  sessionId?: string;
  saveType?: 'auto' | 'manual';
}

// API functions
const documentsAPI = {
  create: async (data: CreateDocumentData): Promise<Document> => {
    const response = await axios.post(API_BASE, data);
    return response.data.data;
  },

  getByUser: async (): Promise<Document[]> => {
    const response = await axios.get(`${API_BASE}/my-documents`);
    return response.data.data;
  },

  getByCourse: async (courseId: string, filters?: {
    chapter?: string;
    lesson?: string;
    type?: string;
    author?: string;
  }): Promise<Document[]> => {
    const params = new URLSearchParams();
    if (filters?.chapter) params.append('chapter', filters.chapter);
    if (filters?.lesson) params.append('lesson', filters.lesson);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.author) params.append('author', filters.author);
    
    const response = await axios.get(`${API_BASE}/course/${courseId}?${params}`);
    return response.data.data;
  },

  getById: async (documentId: string): Promise<Document> => {
    const response = await axios.get(`${API_BASE}/${documentId}`);
    return response.data.data;
  },

  updateContent: async (documentId: string, data: UpdateDocumentData): Promise<{ document: Document; versionCreated: boolean }> => {
    const response = await axios.put(`${API_BASE}/${documentId}/content`, data);
    return response.data.data;
  },

  getVersions: async (documentId: string, limit?: number): Promise<DocumentVersion[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await axios.get(`${API_BASE}/${documentId}/versions${params}`);
    return response.data.data;
  },

  compareVersions: async (documentId: string, version1: number, version2: number) => {
    const response = await axios.get(`${API_BASE}/${documentId}/compare/${version1}/${version2}`);
    return response.data.data;
  },

  addCollaborator: async (documentId: string, userId: string): Promise<Document> => {
    const response = await axios.post(`${API_BASE}/${documentId}/collaborators`, { userId });
    return response.data.data;
  },

  delete: async (documentId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/${documentId}`);
  }
};

// Custom hooks
export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: documentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['userDocuments'] });
    }
  });
};

export const useUserDocuments = () => {
  return useQuery({
    queryKey: ['userDocuments'],
    queryFn: documentsAPI.getByUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCourseDocuments = (courseId: string, filters?: {
  chapter?: string;
  lesson?: string;
  type?: string;
  author?: string;
}) => {
  return useQuery({
    queryKey: ['courseDocuments', courseId, filters],
    queryFn: () => documentsAPI.getByCourse(courseId, filters),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentsAPI.getById(documentId),
    enabled: !!documentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: UpdateDocumentData }) =>
      documentsAPI.updateContent(documentId, data),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['userDocuments'] });
    }
  });
};

export const useDocumentVersions = (documentId: string, limit?: number) => {
  return useQuery({
    queryKey: ['documentVersions', documentId, limit],
    queryFn: () => documentsAPI.getVersions(documentId, limit),
    enabled: !!documentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCompareVersions = () => {
  return useMutation({
    mutationFn: ({ documentId, version1, version2 }: { 
      documentId: string; 
      version1: number; 
      version2: number 
    }) => documentsAPI.compareVersions(documentId, version1, version2)
  });
};

export const useAddCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ documentId, userId }: { documentId: string; userId: string }) =>
      documentsAPI.addCollaborator(documentId, userId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: documentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['userDocuments'] });
    }
  });
};