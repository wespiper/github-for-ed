import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Plus, Trash2, Target, BookOpen, Brain, Settings } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useCreateAssignment } from "@/hooks/useAssignments";
import { LearningObjectiveSelector } from "@/components/assignments/LearningObjectiveSelector";
import { type LearningObjectivePreset } from "@/hooks/useLearningObjectives";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simple Switch component for now
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-scribe-600' : 'bg-ink-300'
        }`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

interface WritingStage {
    id: string;
    name: string;
    description: string;
    order: number;
    required: boolean;
    minWords?: number;
    maxWords?: number;
    durationDays?: number;
    allowAI: boolean;
    aiAssistanceLevel: 'none' | 'minimal' | 'moderate' | 'comprehensive';
}

interface AssignmentFormData {
    title: string;
    description: string;
    instructions: string;
    courseId: string;
    type: 'individual' | 'collaborative' | 'peer-review';
    dueDate?: string;
    requirements: {
        minWords?: number;
        maxWords?: number;
        citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    };
    learningObjectives: LearningObjectivePreset[];
    writingStages: WritingStage[];
    aiSettings: {
        enabled: boolean;
        globalBoundary: 'strict' | 'moderate' | 'permissive';
        allowedAssistanceTypes: ('grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')[];
        requireReflection: boolean;
        reflectionPrompts: string[];
    };
}

const STEPS = [
    { id: 'basic', title: 'Basic Information', icon: BookOpen },
    { id: 'objectives', title: 'Learning Objectives', icon: Target },
    { id: 'stages', title: 'Writing Stages', icon: Settings },
    { id: 'ai', title: 'AI Boundaries', icon: Brain },
];

const AI_ASSISTANCE_TYPES = [
    'grammar', 'style', 'structure', 'research', 'citations', 'brainstorming', 'outlining'
];

export const CreateAssignmentPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<AssignmentFormData>({
        title: '',
        description: '',
        instructions: '',
        courseId: '',
        type: 'individual',
        requirements: {},
        learningObjectives: [],
        writingStages: [],
        aiSettings: {
            enabled: false,
            globalBoundary: 'moderate',
            allowedAssistanceTypes: [],
            requireReflection: true,
            reflectionPrompts: []
        }
    });

    const { data: courses } = useCourses();
    const createAssignmentMutation = useCreateAssignment();

    const addWritingStage = () => {
        const newStage: WritingStage = {
            id: Date.now().toString(),
            name: '',
            description: '',
            order: formData.writingStages.length + 1,
            required: true,
            allowAI: false,
            aiAssistanceLevel: 'none'
        };
        setFormData(prev => ({
            ...prev,
            writingStages: [...prev.writingStages, newStage]
        }));
    };

    const updateWritingStage = (id: string, updates: Partial<WritingStage>) => {
        setFormData(prev => ({
            ...prev,
            writingStages: prev.writingStages.map(stage =>
                stage.id === id ? { ...stage, ...updates } : stage
            )
        }));
    };

    const removeWritingStage = (id: string) => {
        setFormData(prev => ({
            ...prev,
            writingStages: prev.writingStages.filter(stage => stage.id !== id)
                .map((stage, index) => ({ ...stage, order: index + 1 }))
        }));
    };

    const validateStep = (stepIndex: number): boolean => {
        switch (stepIndex) {
            case 0: // Basic Information
                return !!(formData.title.trim() && formData.courseId && formData.description.trim());
            case 1: // Learning Objectives
                return formData.learningObjectives.length > 0 && 
                       formData.learningObjectives.every(obj => obj.description.trim() && obj.weight > 0) &&
                       formData.learningObjectives.reduce((sum, obj) => sum + obj.weight, 0) === 100;
            case 2: // Writing Stages
                return formData.writingStages.length > 0 &&
                       formData.writingStages.every(stage => stage.name.trim() && stage.description.trim());
            case 3: // AI Boundaries
                return true; // Optional step
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            await createAssignmentMutation.mutateAsync(formData);
            navigate('/dashboard'); // Navigate back to dashboard on success
        } catch (error) {
            console.error('Error creating assignment:', error);
        }
    };

    const handleCancel = () => {
        navigate('/dashboard'); // Navigate back to dashboard on cancel
    };

    const renderBasicInformation = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Assignment Title *
                    </label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Persuasive Essay on Climate Change"
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Course *
                    </label>
                    <Select
                        value={formData.courseId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        <SelectContent>
                            {courses?.map((course) => (
                                <SelectItem key={course._id} value={course._id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Assignment Type
                    </label>
                    <Select
                        value={formData.type}
                        onValueChange={(value: 'individual' | 'collaborative' | 'peer-review') => setFormData(prev => ({ ...prev, type: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="collaborative">Collaborative</SelectItem>
                            <SelectItem value="peer-review">Peer Review</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Due Date
                    </label>
                    <Input
                        type="date"
                        value={formData.dueDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Description *
                </label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief overview of the assignment goals and context..."
                    rows={3}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Instructions
                </label>
                <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Detailed step-by-step instructions for students..."
                    rows={4}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Minimum Words
                    </label>
                    <Input
                        type="number"
                        value={formData.requirements.minWords || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            requirements: { ...prev.requirements, minWords: parseInt(e.target.value) || undefined }
                        }))}
                        placeholder="500"
                        min="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Maximum Words
                    </label>
                    <Input
                        type="number"
                        value={formData.requirements.maxWords || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            requirements: { ...prev.requirements, maxWords: parseInt(e.target.value) || undefined }
                        }))}
                        placeholder="2000"
                        min="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Citation Style
                    </label>
                    <Select
                        value={formData.requirements.citationStyle || ''}
                        onValueChange={(value: 'APA' | 'MLA' | 'Chicago' | 'IEEE') => setFormData(prev => ({
                            ...prev,
                            requirements: { ...prev.requirements, citationStyle: value }
                        }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select style..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="APA">APA</SelectItem>
                            <SelectItem value="MLA">MLA</SelectItem>
                            <SelectItem value="Chicago">Chicago</SelectItem>
                            <SelectItem value="IEEE">IEEE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );

    const renderLearningObjectives = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-ink-900 mb-2">Learning Objectives</h3>
                <p className="text-sm text-ink-600">Select from preset objectives or create custom ones that define what students will learn and how it will be assessed</p>
            </div>
            <LearningObjectiveSelector 
                onObjectivesChange={(objectives) => setFormData(prev => ({ ...prev, learningObjectives: objectives }))}
                initialObjectives={formData.learningObjectives}
            />
        </div>
    );

    const renderWritingStages = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-ink-900">Writing Stages</h3>
                    <p className="text-sm text-ink-600">Break down the writing process into manageable stages</p>
                </div>
                <Button onClick={addWritingStage} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Stage
                </Button>
            </div>

            {formData.writingStages.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-ink-500">No writing stages defined. Add stages to scaffold the writing process.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {formData.writingStages
                        .sort((a, b) => a.order - b.order)
                        .map((stage) => (
                            <Card key={stage.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm">Stage {stage.order}</CardTitle>
                                        <Button
                                            onClick={() => removeWritingStage(stage.id)}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                                Stage Name *
                                            </label>
                                            <Input
                                                value={stage.name}
                                                onChange={(e) => updateWritingStage(stage.id, { name: e.target.value })}
                                                placeholder="e.g. Research & Planning"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                                Duration (Days)
                                            </label>
                                            <Input
                                                type="number"
                                                value={stage.durationDays || ''}
                                                onChange={(e) => updateWritingStage(stage.id, { durationDays: parseInt(e.target.value) || undefined })}
                                                placeholder="7"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-ink-700 mb-1">
                                            Description *
                                        </label>
                                        <Textarea
                                            value={stage.description}
                                            onChange={(e) => updateWritingStage(stage.id, { description: e.target.value })}
                                            placeholder="What students should accomplish in this stage..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                                Min Words
                                            </label>
                                            <Input
                                                type="number"
                                                value={stage.minWords || ''}
                                                onChange={(e) => updateWritingStage(stage.id, { minWords: parseInt(e.target.value) || undefined })}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                                Max Words
                                            </label>
                                            <Input
                                                type="number"
                                                value={stage.maxWords || ''}
                                                onChange={(e) => updateWritingStage(stage.id, { maxWords: parseInt(e.target.value) || undefined })}
                                                min="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-ink-700">Required</label>
                                                <Switch
                                                    checked={stage.required}
                                                    onCheckedChange={(checked) => updateWritingStage(stage.id, { required: checked })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-ink-700">Allow AI</label>
                                                <Switch
                                                    checked={stage.allowAI}
                                                    onCheckedChange={(checked) => updateWritingStage(stage.id, { 
                                                        allowAI: checked,
                                                        aiAssistanceLevel: checked ? 'minimal' : 'none'
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {stage.allowAI && (
                                        <div>
                                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                                AI Assistance Level
                                            </label>
                                            <Select
                                                value={stage.aiAssistanceLevel}
                                                onValueChange={(value: 'none' | 'minimal' | 'moderate' | 'comprehensive') => updateWritingStage(stage.id, { aiAssistanceLevel: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="minimal">Minimal (Grammar & Spelling)</SelectItem>
                                                    <SelectItem value="moderate">Moderate (+ Style Suggestions)</SelectItem>
                                                    <SelectItem value="comprehensive">Comprehensive (+ Structure & Content)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                </div>
            )}
        </div>
    );

    const renderAIBoundaries = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-ink-900">AI Assistance Boundaries</h3>
                <p className="text-sm text-ink-600">Set clear guidelines for how AI can assist students</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Enable AI Assistance</CardTitle>
                        <Switch
                            checked={formData.aiSettings.enabled}
                            onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                aiSettings: { ...prev.aiSettings, enabled: checked }
                            }))}
                        />
                    </div>
                </CardHeader>
                {formData.aiSettings.enabled && (
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-2">
                                Global Boundary Level
                            </label>
                            <Select
                                value={formData.aiSettings.globalBoundary}
                                onValueChange={(value: 'strict' | 'moderate' | 'permissive') => setFormData(prev => ({
                                    ...prev,
                                    aiSettings: { ...prev.aiSettings, globalBoundary: value }
                                }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="strict">Strict - Minimal AI assistance</SelectItem>
                                    <SelectItem value="moderate">Moderate - Balanced assistance</SelectItem>
                                    <SelectItem value="permissive">Permissive - Comprehensive assistance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-2">
                                Allowed Assistance Types
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {AI_ASSISTANCE_TYPES.map((type) => (
                                    <label key={type} className="flex items-center space-x-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.aiSettings.allowedAssistanceTypes.includes(type as 'grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')}
                                            onChange={(e) => {
                                                const assistanceType = type as 'grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining';
                                                const types = e.target.checked
                                                    ? [...formData.aiSettings.allowedAssistanceTypes, assistanceType]
                                                    : formData.aiSettings.allowedAssistanceTypes.filter(t => t !== type);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    aiSettings: { ...prev.aiSettings, allowedAssistanceTypes: types }
                                                }));
                                            }}
                                            className="rounded border-ink-300"
                                        />
                                        <span className="capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-ink-700">
                                Require Reflection on AI Use
                            </label>
                            <Switch
                                checked={formData.aiSettings.requireReflection}
                                onCheckedChange={(checked) => setFormData(prev => ({
                                    ...prev,
                                    aiSettings: { ...prev.aiSettings, requireReflection: checked }
                                }))}
                            />
                        </div>

                        {formData.aiSettings.requireReflection && (
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-2">
                                    Reflection Prompts
                                </label>
                                <Textarea
                                    value={formData.aiSettings.reflectionPrompts.join('\n')}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        aiSettings: { 
                                            ...prev.aiSettings, 
                                            reflectionPrompts: e.target.value.split('\n').filter(p => p.trim())
                                        }
                                    }))}
                                    placeholder="How did AI assistance help your writing process?&#10;What did you learn that you might not have discovered on your own?&#10;How will you apply these insights to future writing?"
                                    rows={4}
                                />
                                <p className="text-xs text-ink-500 mt-1">Enter each prompt on a new line</p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-semibold text-ink-900 mb-4">Create Assignment</h1>
                    <div className="flex items-center space-x-4">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep || validateStep(index);
                            
                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                        isActive 
                                            ? 'border-scribe-500 bg-scribe-50 text-scribe-600'
                                            : isCompleted 
                                            ? 'border-green-500 bg-green-50 text-green-600'
                                            : 'border-ink-300 bg-ink-50 text-ink-400'
                                    }`}>
                                        {isCompleted && index < currentStep ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Icon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${
                                        isActive 
                                            ? 'text-scribe-600'
                                            : isCompleted 
                                            ? 'text-green-600'
                                            : 'text-ink-400'
                                    }`}>
                                        {step.title}
                                    </span>
                                    {index < STEPS.length - 1 && (
                                        <ChevronRight className="w-4 h-4 text-ink-300 ml-2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    {currentStep === 0 && renderBasicInformation()}
                    {currentStep === 1 && renderLearningObjectives()}
                    {currentStep === 2 && renderWritingStages()}
                    {currentStep === 3 && renderAIBoundaries()}
                </div>

                {/* Footer */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    
                    <div className="flex items-center space-x-3">
                        {currentStep > 0 && (
                            <Button
                                onClick={handlePrevious}
                                variant="outline"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                        )}
                        
                        {currentStep < STEPS.length - 1 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!validateStep(currentStep)}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={createAssignmentMutation.isPending || !STEPS.every((_, index) => validateStep(index))}
                            >
                                {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};