import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type LearningObjective, type BloomsLevel, type SubjectArea } from '@shared/types';

// Type alias for backwards compatibility
export type LearningObjectivePreset = LearningObjective;

export interface AssessmentTemplate {
  subject: string;
  subjectName: string;
  criteria: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalObjectives: number;
    totalWeight: number;
    bloomsLevels: number[];
    categories: string[];
  };
}

export interface PresetsFilters {
  category?: string;
  bloomsLevel?: number;
  subject?: string;
}

// Hook for fetching learning objective presets
export function useLearningObjectivePresets(filters?: PresetsFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.bloomsLevel) queryParams.append('bloomsLevel', filters.bloomsLevel.toString());
  if (filters?.subject) queryParams.append('subject', filters.subject);

  return useQuery({
    queryKey: ['learning-objectives', 'presets', filters],
    queryFn: async (): Promise<{
      presets: LearningObjectivePreset[];
      totalCount: number;
      filters: PresetsFilters;
    }> => {
      const url = `/learning-objectives/presets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching categories
export function useLearningObjectiveCategories() {
  return useQuery({
    queryKey: ['learning-objectives', 'categories'],
    queryFn: async (): Promise<{
      categories: Array<{
        category: string;
        count: number;
        bloomsLevels: number[];
      }>;
      totalPresets: number;
    }> => {
      const response = await api.get('/learning-objectives/categories');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching subject areas
export function useLearningObjectiveSubjects() {
  return useQuery({
    queryKey: ['learning-objectives', 'subjects'],
    queryFn: async (): Promise<{
      subjects: SubjectArea[];
      allSubjects: SubjectArea[];
    }> => {
      const response = await api.get('/learning-objectives/subjects');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching Bloom's taxonomy levels
export function useBloomsLevels() {
  return useQuery({
    queryKey: ['learning-objectives', 'blooms-levels'],
    queryFn: async (): Promise<{
      bloomsLevels: BloomsLevel[];
      totalLevels: number;
    }> => {
      const response = await api.get('/learning-objectives/blooms-levels');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching assessment templates
export function useAssessmentTemplates(subject?: string) {
  return useQuery({
    queryKey: ['learning-objectives', 'assessment-templates', subject],
    queryFn: async (): Promise<AssessmentTemplate | { templates: AssessmentTemplate[]; totalTemplates: number }> => {
      const url = subject 
        ? `/learning-objectives/assessment-templates?subject=${subject}`
        : '/learning-objectives/assessment-templates';
      const response = await api.get(url);
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for validating learning objectives sets
export function useValidateLearningObjectives() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (objectives: Partial<LearningObjectivePreset>[]): Promise<ValidationResult> => {
      const response = await api.post('/learning-objectives/validate-set', { objectives });
      return response.data.data;
    },
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['learning-objectives'] });
    },
  });
}

// Custom hook for managing learning objectives in assignment creation
export function useLearningObjectivesManager(initialObjectives: LearningObjectivePreset[] = []) {
  const [selectedObjectives, setSelectedObjectives] = useState<LearningObjectivePreset[]>(initialObjectives);
  const [filters, setFilters] = useState<PresetsFilters>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Update selected objectives when initialObjectives changes
  useEffect(() => {
    if (initialObjectives.length > 0 && selectedObjectives.length === 0) {
      setSelectedObjectives(initialObjectives);
    }
  }, [initialObjectives, selectedObjectives.length]);

  const { data: presets, isLoading: presetsLoading } = useLearningObjectivePresets(filters);
  const { data: categories } = useLearningObjectiveCategories();
  const { data: subjects } = useLearningObjectiveSubjects();
  const { data: bloomsLevels } = useBloomsLevels();
  const validateMutation = useValidateLearningObjectives();

  // Add a preset to selected objectives
  const addObjective = (preset: LearningObjectivePreset) => {
    if (!selectedObjectives.find(obj => obj.id === preset.id)) {
      const newObjectives = [...selectedObjectives, preset];
      setSelectedObjectives(newObjectives);
      // Don't validate immediately to prevent excessive calls
    }
  };

  // Remove an objective from selected
  const removeObjective = (presetId: string) => {
    const newObjectives = selectedObjectives.filter(obj => obj.id !== presetId);
    setSelectedObjectives(newObjectives);
    // Don't validate immediately to prevent excessive calls
  };

  // Update an objective's weight
  const updateObjectiveWeight = (presetId: string, weight: number) => {
    const newObjectives = selectedObjectives.map(obj =>
      obj.id === presetId ? { ...obj, weight } : obj
    );
    setSelectedObjectives(newObjectives);
    // Don't validate immediately to prevent excessive calls
  };

  // Validate current selection
  const validateObjectives = async (objectives: LearningObjectivePreset[]) => {
    if (objectives.length === 0) {
      setValidationResult(null);
      return;
    }

    try {
      const result = await validateMutation.mutateAsync(objectives);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  // Auto-balance weights
  const autoBalanceWeights = () => {
    if (selectedObjectives.length === 0) return;

    const equalWeight = Math.floor(100 / selectedObjectives.length);
    const remainder = 100 % selectedObjectives.length;

    const newObjectives = selectedObjectives.map((obj, index) => ({
      ...obj,
      weight: equalWeight + (index < remainder ? 1 : 0)
    }));

    setSelectedObjectives(newObjectives);
    // Validate immediately for auto-balance as it's a deliberate action
    validateObjectives(newObjectives);
  };

  // Clear all selections
  const clearObjectives = () => {
    setSelectedObjectives([]);
    setValidationResult(null);
  };

  // Update filters
  const updateFilters = (newFilters: Partial<PresetsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    // State
    selectedObjectives,
    filters,
    validationResult,

    // Data
    availablePresets: presets?.presets || [],
    categories: categories?.categories || [],
    subjects: subjects?.subjects || [],
    bloomsLevels: bloomsLevels?.bloomsLevels || [],

    // Loading states
    isLoading: presetsLoading,
    isValidating: validateMutation.isPending,

    // Actions
    addObjective,
    removeObjective,
    updateObjectiveWeight,
    autoBalanceWeights,
    clearObjectives,
    updateFilters,
    validateObjectives: () => validateObjectives(selectedObjectives),

    // Computed values
    totalWeight: selectedObjectives.reduce((sum, obj) => sum + obj.weight, 0),
    isValid: validationResult?.isValid ?? false,
    canAddMore: selectedObjectives.length < 8,
  };
}