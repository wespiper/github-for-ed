import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, FileText, Target, Settings, Save, AlertCircle } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCreateAssignment } from '@/hooks/useAssignments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  type: 'individual' | 'collaborative' | 'peer-review';
  dueDate: string;
  requirements: {
    minWords?: number;
    maxWords?: number;
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
  };
  allowLateSubmissions: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export function AssignmentForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    instructions: '',
    courseId: '',
    type: 'individual',
    dueDate: '',
    requirements: {},
    allowLateSubmissions: true
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isDraft, setIsDraft] = useState(false);

  const { data: courses, isLoading: coursesLoading } = useCourses();
  const createAssignmentMutation = useCreateAssignment();

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Assignment title, description, and course',
      icon: FileText,
      fields: ['title', 'description', 'courseId']
    },
    {
      id: 'details',
      title: 'Assignment Details',
      description: 'Type, requirements, and deadline',
      icon: Settings,
      fields: ['type', 'dueDate', 'requirements']
    },
    {
      id: 'instructions',
      title: 'Instructions',
      description: 'Detailed instructions for students',
      icon: Target,
      fields: ['instructions']
    }
  ];

  // Validation functions
  const validateStep = (stepIndex: number): ValidationErrors => {
    const errors: ValidationErrors = {};
    const step = steps[stepIndex];

    step.fields.forEach(field => {
      switch (field) {
        case 'title':
          if (!formData.title.trim()) {
            errors.title = 'Assignment title is required';
          } else if (formData.title.length > 200) {
            errors.title = 'Title cannot exceed 200 characters';
          }
          break;
        case 'description':
          if (!formData.description.trim()) {
            errors.description = 'Assignment description is required';
          } else if (formData.description.length > 2000) {
            errors.description = 'Description cannot exceed 2000 characters';
          }
          break;
        case 'courseId':
          if (!formData.courseId) {
            errors.courseId = 'Please select a course';
          }
          break;
        case 'instructions':
          if (!formData.instructions.trim()) {
            errors.instructions = 'Instructions are required';
          } else if (formData.instructions.length > 10000) {
            errors.instructions = 'Instructions cannot exceed 10000 characters';
          }
          break;
      }
    });

    return errors;
  };

  const isStepValid = (stepIndex: number): boolean => {
    const errors = validateStep(stepIndex);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    const errors = validateStep(currentStep);
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0 && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationErrors({});
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      setValidationErrors({});
    }
  };

  // Form submission
  const handleSubmit = async (saveAsDraft = false) => {
    try {
      setIsDraft(saveAsDraft);
      
      // Validate all steps for final submission
      if (!saveAsDraft) {
        let allErrors: ValidationErrors = {};
        steps.forEach((_, index) => {
          const stepErrors = validateStep(index);
          allErrors = { ...allErrors, ...stepErrors };
        });

        if (Object.keys(allErrors).length > 0) {
          setValidationErrors(allErrors);
          return;
        }
      }

      const assignmentData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        courseId: formData.courseId,
        type: formData.type,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        requirements: formData.requirements,
        allowLateSubmissions: formData.allowLateSubmissions,
        status: saveAsDraft ? 'draft' : 'draft' // Assignments start as drafts by default
      };

      await createAssignmentMutation.mutateAsync(assignmentData);
      
      navigate('/dashboard', {
        state: { 
          message: `Assignment ${saveAsDraft ? 'saved as draft' : 'created'} successfully!`,
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Failed to create assignment:', error);
      setValidationErrors({ submit: 'Failed to create assignment. Please try again.' });
    }
  };

  // Update form data
  const updateFormData = <K extends keyof AssignmentFormData>(
    field: K,
    value: AssignmentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const updateRequirements = <K extends keyof AssignmentFormData['requirements']>(
    field: K,
    value: AssignmentFormData['requirements'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [field]: value }
    }));
  };

  // Render progress bar
  const renderProgressBar = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        const isClickable = index <= currentStep;

        return (
          <React.Fragment key={step.id}>
            <div 
              className={`flex flex-col items-center cursor-pointer ${isClickable ? 'hover:opacity-80' : 'cursor-not-allowed'}`}
              onClick={() => isClickable && handleStepClick(index)}
            >
              <div
                className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium mb-2
                  ${isComplete 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 text-gray-400 bg-white'
                  }
                `}
              >
                {isComplete ? <Check size={16} /> : index + 1}
              </div>
              <div className="text-center">
                <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-400 mt-1 max-w-24">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-4 mt-5 ${
                  isComplete ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Render error message
  const renderError = (field: string) => {
    if (validationErrors[field]) {
      return (
        <div className="flex items-center mt-1 text-red-600 text-sm">
          <AlertCircle size={14} className="mr-1" />
          {validationErrors[field]}
        </div>
      );
    }
    return null;
  };

  // Step content renderers
  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
        <p className="text-gray-600 mt-2">
          Start by providing the essential details about your assignment
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Title *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="e.g., Persuasive Essay on Climate Change"
            className={validationErrors.title ? 'border-red-300' : ''}
          />
          {renderError('title')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course *
          </label>
          <Select
            value={formData.courseId}
            onValueChange={(value) => updateFormData('courseId', value)}
          >
            <SelectTrigger className={validationErrors.courseId ? 'border-red-300' : ''}>
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {coursesLoading ? (
                <SelectItem value="" disabled>Loading courses...</SelectItem>
              ) : courses?.length ? (
                courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No courses available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {renderError('courseId')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Brief overview of what students will accomplish in this assignment..."
            rows={4}
            className={validationErrors.description ? 'border-red-300' : ''}
          />
          <div className="text-sm text-gray-500 mt-1">
            {formData.description.length}/2000 characters
          </div>
          {renderError('description')}
        </div>
      </div>
    </div>
  );

  const renderAssignmentDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Settings className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Assignment Details</h2>
        <p className="text-gray-600 mt-2">
          Configure the type, requirements, and deadline for your assignment
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Type
          </label>
          <Select
            value={formData.type}
            onValueChange={(value: 'individual' | 'collaborative' | 'peer-review') => 
              updateFormData('type', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual Assignment</SelectItem>
              <SelectItem value="collaborative">Collaborative Assignment</SelectItem>
              <SelectItem value="peer-review">Peer Review Assignment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <Input
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => updateFormData('dueDate', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Word Count
            </label>
            <Input
              type="number"
              min="0"
              value={formData.requirements.minWords || ''}
              onChange={(e) => updateRequirements('minWords', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Word Count
            </label>
            <Input
              type="number"
              min="0"
              value={formData.requirements.maxWords || ''}
              onChange={(e) => updateRequirements('maxWords', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Citation Style
          </label>
          <Select
            value={formData.requirements.citationStyle || ''}
            onValueChange={(value: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | '') => 
              updateRequirements('citationStyle', value || undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select citation style (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific requirement</SelectItem>
              <SelectItem value="APA">APA Style</SelectItem>
              <SelectItem value="MLA">MLA Style</SelectItem>
              <SelectItem value="Chicago">Chicago Style</SelectItem>
              <SelectItem value="IEEE">IEEE Style</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allowLateSubmissions"
            checked={formData.allowLateSubmissions}
            onChange={(e) => updateFormData('allowLateSubmissions', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="allowLateSubmissions" className="text-sm font-medium text-gray-700">
            Allow late submissions
          </label>
        </div>
      </div>
    </div>
  );

  const renderInstructions = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Instructions</h2>
        <p className="text-gray-600 mt-2">
          Provide clear, detailed instructions for your students
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Instructions *
        </label>
        <Textarea
          value={formData.instructions}
          onChange={(e) => updateFormData('instructions', e.target.value)}
          placeholder="Provide comprehensive instructions including expectations, requirements, evaluation criteria, and any specific guidelines students should follow..."
          rows={12}
          className={validationErrors.instructions ? 'border-red-300' : ''}
        />
        <div className="text-sm text-gray-500 mt-1">
          {formData.instructions.length}/10000 characters
        </div>
        {renderError('instructions')}
      </div>

      {/* Preview card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Title:</span> {formData.title || 'Untitled Assignment'}
            </div>
            <div>
              <span className="font-medium">Type:</span> <Badge variant="outline">{formData.type}</Badge>
            </div>
            {formData.dueDate && (
              <div>
                <span className="font-medium">Due:</span> {new Date(formData.dueDate).toLocaleString()}
              </div>
            )}
            {(formData.requirements.minWords || formData.requirements.maxWords) && (
              <div>
                <span className="font-medium">Word Count:</span>{' '}
                {formData.requirements.minWords && formData.requirements.maxWords
                  ? `${formData.requirements.minWords} - ${formData.requirements.maxWords} words`
                  : formData.requirements.minWords
                  ? `Minimum ${formData.requirements.minWords} words`
                  : `Maximum ${formData.requirements.maxWords} words`
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ChevronLeft size={20} className="mr-1" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
          <p className="text-gray-600 mt-2">
            Design a meaningful writing experience for your students
          </p>
        </div>

        {/* Main Content */}
        <Card className="p-8">
          {renderProgressBar()}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 0 && renderBasicInformation()}
            {currentStep === 1 && renderAssignmentDetails()}
            {currentStep === 2 && renderInstructions()}
          </div>

          {/* Error message */}
          {validationErrors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800">
                <AlertCircle size={16} className="mr-2" />
                {validationErrors.submit}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={20} className="mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-3">
              {/* Save as Draft button (always visible) */}
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={createAssignmentMutation.isPending}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Save size={16} className="mr-2" />
                {createAssignmentMutation.isPending && isDraft ? 'Saving...' : 'Save as Draft'}
              </Button>

              {/* Next/Create button */}
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                  <ChevronRight size={20} className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={createAssignmentMutation.isPending || !steps.every((_, index) => isStepValid(index))}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createAssignmentMutation.isPending && !isDraft ? 'Creating...' : 'Create Assignment'}
                  <Check size={20} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}