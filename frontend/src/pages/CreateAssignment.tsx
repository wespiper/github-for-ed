// NOTE: This file has been replaced by AssignmentCreationWizard.tsx
// Keeping for reference but should be removed in production
export default function CreateAssignment() {
    return <div>This page has been replaced by the new Assignment Creation Wizard</div>;
}

/* 
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    FileText,
    Cog,
    GraduationCap,
    Bot,
    BookOpen,
} from "lucide-react";
import { useCreateAssignment } from "@/hooks/useAssignments";
import { useCourses } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AssignmentFormData {
    // Section 1: Assignment Foundation
    title: string;
    description: string;
    courseId: string;
    writingGenre: string;
    estimatedLength: { min: number; max: number };
    learningObjectives: string[];

    // Section 2: Writing Process Design
    requiredStages: string[];
    scaffolding: Record<string, string>;
    milestones: Array<{ stage: string; deadline: string; description: string }>;

    // Section 3: Assessment Configuration
    rubricType: "process-focused" | "product-focused" | "balanced";
    processWeight: number;
    peerReviewEnabled: boolean;
    selfReflectionRequired: boolean;
    draftsRequired: number;

    // Section 4: AI Assistance Boundaries
    aiSettings: {
        brainstorming: boolean;
        drafting: boolean;
        revising: boolean;
        editing: boolean;
    };
    aiInteractionLimit: number;
    reflectionOnAIRequired: boolean;

    // Section 5: Support Materials
    resources: Array<{ title: string; url: string; description: string }>;
    examples: string[];
    instructions: string;
    dueDate: string;
}

const initialFormData: AssignmentFormData = {
    title: "",
    description: "",
    courseId: "",
    writingGenre: "",
    estimatedLength: { min: 500, max: 1500 },
    learningObjectives: [""],
    requiredStages: ["brainstorming", "drafting", "revising"],
    scaffolding: {},
    milestones: [],
    rubricType: "balanced",
    processWeight: 50,
    peerReviewEnabled: false,
    selfReflectionRequired: true,
    draftsRequired: 2,
    aiSettings: {
        brainstorming: true,
        drafting: false,
        revising: true,
        editing: false,
    },
    aiInteractionLimit: 10,
    reflectionOnAIRequired: true,
    resources: [],
    examples: [""],
    instructions: "",
    dueDate: "",
};

const WRITING_GENRES = [
    "Argumentative Essay",
    "Research Paper",
    "Narrative Writing",
    "Analytical Essay",
    "Creative Writing",
    "Technical Report",
    "Reflective Essay",
    "Comparative Analysis",
    "Opinion Editorial",
    "Case Study Analysis",
];

const WRITING_STAGES = [
    {
        id: "brainstorming",
        label: "Brainstorming & Planning",
        description: "Generate and organize initial ideas",
    },
    {
        id: "research",
        label: "Research & Investigation",
        description: "Gather and evaluate sources and evidence",
    },
    {
        id: "outlining",
        label: "Outlining & Structure",
        description: "Create organizational framework",
    },
    {
        id: "drafting",
        label: "First Draft",
        description: "Write initial complete version",
    },
    {
        id: "revising",
        label: "Content Revision",
        description: "Improve ideas, organization, and development",
    },
    {
        id: "peer-review",
        label: "Peer Review",
        description: "Receive and provide feedback from classmates",
    },
    {
        id: "editing",
        label: "Editing & Proofreading",
        description: "Fix grammar, mechanics, and style",
    },
    {
        id: "final-draft",
        label: "Final Draft",
        description: "Complete polished version",
    },
];

export const CreateAssignment = () => {
    const [currentSection, setCurrentSection] = useState(1);
    const [formData, setFormData] =
        useState<AssignmentFormData>(initialFormData);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const createAssignmentMutation = useCreateAssignment();
    const { data: courses } = useCourses();

    const totalSections = 5;
    const preselectedCourseId = searchParams.get("courseId");

    // Set preselected course if available
    useState(() => {
        if (preselectedCourseId && formData.courseId === "") {
            setFormData((prev) => ({ ...prev, courseId: preselectedCourseId }));
        }
    });

    const handleNext = () => {
        if (currentSection < totalSections) {
            setCurrentSection(currentSection + 1);
        }
    };

    const handlePrevious = () => {
        if (currentSection > 1) {
            setCurrentSection(currentSection - 1);
        }
    };

    const handleInputChange = (
        field: keyof AssignmentFormData,
        value:
            | string
            | boolean
            | number
            | string[]
            | Record<string, boolean>
            | Date
            | undefined
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleStageToggle = (stageId: string) => {
        setFormData((prev) => ({
            ...prev,
            requiredStages: prev.requiredStages.includes(stageId)
                ? prev.requiredStages.filter((id) => id !== stageId)
                : [...prev.requiredStages, stageId],
        }));
    };

    const handleLearningObjectiveChange = (index: number, value: string) => {
        const newObjectives = [...formData.learningObjectives];
        newObjectives[index] = value;
        setFormData((prev) => ({ ...prev, learningObjectives: newObjectives }));
    };

    const addLearningObjective = () => {
        setFormData((prev) => ({
            ...prev,
            learningObjectives: [...prev.learningObjectives, ""],
        }));
    };

    const addResource = () => {
        setFormData((prev) => ({
            ...prev,
            resources: [
                ...prev.resources,
                { title: "", url: "", description: "" },
            ],
        }));
    };

    const addExample = () => {
        setFormData((prev) => ({
            ...prev,
            examples: [...prev.examples, ""],
        }));
    };

    const handleSubmit = async () => {
        try {
            const assignmentData = {
                title: formData.title,
                description: formData.description,
                instructions: formData.instructions,
                courseId: formData.courseId,
                type: "individual" as const,
                writingGenre: formData.writingGenre,
                requirements: {
                    minWords: formData.estimatedLength.min,
                    maxWords: formData.estimatedLength.max,
                },
                learningObjectives: formData.learningObjectives.filter((obj) =>
                    obj.trim()
                ),
                writingProcess: {
                    requiredStages: formData.requiredStages,
                    scaffolding: formData.scaffolding,
                    milestones: formData.milestones,
                },
                assessment: {
                    rubricType: formData.rubricType,
                    processWeight: formData.processWeight,
                    peerReviewEnabled: formData.peerReviewEnabled,
                    selfReflectionRequired: formData.selfReflectionRequired,
                    draftsRequired: formData.draftsRequired,
                },
                aiSettings: {
                    enabled: Object.values(formData.aiSettings).some(Boolean),
                    boundaries: formData.aiSettings,
                    interactionLimit: formData.aiInteractionLimit,
                    reflectionRequired: formData.reflectionOnAIRequired,
                },
                resources: formData.resources.filter((r) => r.title && r.url),
                examples: formData.examples.filter((e) => e.trim()),
                dueDate: formData.dueDate || undefined,
            };

            await createAssignmentMutation.mutateAsync(assignmentData);
            navigate("/dashboard", {
                state: { message: "Assignment created successfully!" },
            });
        } catch (error) {
            console.error("Failed to create assignment:", error);
        }
    };

    const isSectionValid = () => {
        switch (currentSection) {
            case 1:
                return (
                    formData.title.trim() &&
                    formData.courseId &&
                    formData.writingGenre
                );
            case 2:
                return formData.requiredStages.length > 0;
            case 3:
                return true; // All assessment fields have defaults
            case 4:
                return true; // AI settings have defaults
            case 5:
                return formData.instructions.trim().length > 0;
            default:
                return false;
        }
    };

    const renderProgressBar = () => (
        <div className="flex items-center justify-between mb-8">
            {Array.from({ length: totalSections }, (_, i) => {
                const sectionNumber = i + 1;
                const isActive = sectionNumber === currentSection;
                const isComplete = sectionNumber < currentSection;

                return (
                    <div key={sectionNumber} className="flex items-center">
                        <div
                            className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
              ${
                  isComplete
                      ? "bg-branch-500 border-branch-500 text-white"
                      : isActive
                      ? "bg-scribe-500 border-scribe-500 text-white"
                      : "border-ink-300 text-ink-400"
              }
            `}
                        >
                            {isComplete ? <Check size={16} /> : sectionNumber}
                        </div>
                        {sectionNumber < totalSections && (
                            <div
                                className={`w-16 h-0.5 mx-2 ${
                                    sectionNumber < currentSection
                                        ? "bg-branch-500"
                                        : "bg-ink-300"
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderSection1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <FileText className="mx-auto h-12 w-12 text-forest-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Assignment Basics
                </h2>
                <p className="text-ink-600 mt-2">
                    Define the core elements of your writing assignment
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Assignment Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                            handleInputChange("title", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                        placeholder="e.g., Persuasive Essay on Climate Change"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Course *
                    </label>
                    <Select
                        value={formData.courseId}
                        onValueChange={(value) =>
                            handleInputChange("courseId", value)
                        }
                    >
                        <SelectTrigger className="h-11">
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

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Writing Genre *
                </label>
                <Select
                    value={formData.writingGenre}
                    onValueChange={(value) =>
                        handleInputChange("writingGenre", value)
                    }
                >
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select writing genre..." />
                    </SelectTrigger>
                    <SelectContent>
                        {WRITING_GENRES.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                                {genre}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Assignment Description
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) =>
                        handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                    placeholder="Brief overview of what students will write..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Minimum Word Count
                    </label>
                    <input
                        type="number"
                        value={formData.estimatedLength.min}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                estimatedLength: {
                                    ...prev.estimatedLength,
                                    min: parseInt(e.target.value) || 0,
                                },
                            }))
                        }
                        className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                        min="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Maximum Word Count
                    </label>
                    <input
                        type="number"
                        value={formData.estimatedLength.max}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                estimatedLength: {
                                    ...prev.estimatedLength,
                                    max: parseInt(e.target.value) || 0,
                                },
                            }))
                        }
                        className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                        min="0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Learning Objectives
                </label>
                <div className="space-y-3">
                    {formData.learningObjectives.map((objective, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-3"
                        >
                            <input
                                type="text"
                                value={objective}
                                onChange={(e) =>
                                    handleLearningObjectiveChange(
                                        index,
                                        e.target.value
                                    )
                                }
                                className="flex-1 px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="e.g., Students will craft compelling arguments..."
                            />
                            {formData.learningObjectives.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newObjectives =
                                            formData.learningObjectives.filter(
                                                (_, i) => i !== index
                                            );
                                        setFormData((prev) => ({
                                            ...prev,
                                            learningObjectives: newObjectives,
                                        }));
                                    }}
                                    className="px-3 py-2 text-ember-600 hover:bg-ember-50 rounded-lg"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addLearningObjective}
                        className="text-scribe-600 hover:text-scribe-700 text-sm font-medium"
                    >
                        + Add Learning Objective
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSection2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Cog className="mx-auto h-12 w-12 text-branch-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Writing Process
                </h2>
                <p className="text-ink-600 mt-2">
                    Configure the stages students will go through
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Required Writing Stages *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {WRITING_STAGES.map((stage) => (
                        <label
                            key={stage.id}
                            className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-ink-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={formData.requiredStages.includes(
                                    stage.id
                                )}
                                onChange={() => handleStageToggle(stage.id)}
                                className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 mt-1"
                            />
                            <div>
                                <div className="text-sm font-medium text-ink-900">
                                    {stage.label}
                                </div>
                                <div className="text-sm text-ink-500">
                                    {stage.description}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Due Date
                </label>
                <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Number of Required Drafts
                </label>
                <Select
                    value={formData.draftsRequired.toString()}
                    onValueChange={(value) =>
                        handleInputChange("draftsRequired", parseInt(value))
                    }
                >
                    <SelectTrigger className="h-11">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 Draft (Final only)</SelectItem>
                        <SelectItem value="2">
                            2 Drafts (First + Final)
                        </SelectItem>
                        <SelectItem value="3">
                            3 Drafts (First + Revision + Final)
                        </SelectItem>
                        <SelectItem value="4">
                            4+ Drafts (Multiple revisions)
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderSection3 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <GraduationCap className="mx-auto h-12 w-12 text-scribe-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Assessment Approach
                </h2>
                <p className="text-ink-600 mt-2">
                    Define how student work will be evaluated
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Assessment Focus
                </label>
                <div className="space-y-3">
                    {[
                        {
                            value: "process-focused",
                            label: "Process-Focused",
                            desc: "Emphasize writing development, revision, and learning journey",
                        },
                        {
                            value: "product-focused",
                            label: "Product-Focused",
                            desc: "Emphasize final writing quality and outcomes",
                        },
                        {
                            value: "balanced",
                            label: "Balanced Approach",
                            desc: "Equal weight to writing process and final products",
                        },
                    ].map((approach) => (
                        <label
                            key={approach.value}
                            className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-ink-50 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="rubricType"
                                value={approach.value}
                                checked={formData.rubricType === approach.value}
                                onChange={(e) =>
                                    handleInputChange(
                                        "rubricType",
                                        e.target.value
                                    )
                                }
                                className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 mt-1"
                            />
                            <div>
                                <div className="text-sm font-medium text-ink-900">
                                    {approach.label}
                                </div>
                                <div className="text-sm text-ink-500">
                                    {approach.desc}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {formData.rubricType === "balanced" && (
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Process Weight: {formData.processWeight}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.processWeight}
                        onChange={(e) =>
                            handleInputChange(
                                "processWeight",
                                parseInt(e.target.value)
                            )
                        }
                        className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-ink-500 mt-1">
                        <span>Product: {100 - formData.processWeight}%</span>
                        <span>Process: {formData.processWeight}%</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="peerReviewEnabled"
                        checked={formData.peerReviewEnabled}
                        onChange={(e) =>
                            handleInputChange(
                                "peerReviewEnabled",
                                e.target.checked
                            )
                        }
                        className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 rounded"
                    />
                    <label
                        htmlFor="peerReviewEnabled"
                        className="text-sm font-medium text-ink-700"
                    >
                        Enable peer review component
                    </label>
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="selfReflectionRequired"
                        checked={formData.selfReflectionRequired}
                        onChange={(e) =>
                            handleInputChange(
                                "selfReflectionRequired",
                                e.target.checked
                            )
                        }
                        className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 rounded"
                    />
                    <label
                        htmlFor="selfReflectionRequired"
                        className="text-sm font-medium text-ink-700"
                    >
                        Require self-reflection essays
                    </label>
                </div>
            </div>
        </div>
    );

    const renderSection4 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Bot className="mx-auto h-12 w-12 text-highlight-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    AI Integration
                </h2>
                <p className="text-ink-600 mt-2">
                    Configure AI writing assistance for this assignment
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    AI Assistance Permissions
                </label>
                <div className="space-y-3">
                    {[
                        {
                            key: "brainstorming",
                            label: "Brainstorming & Idea Generation",
                            desc: "Help with topic exploration and initial ideas",
                        },
                        {
                            key: "drafting",
                            label: "First Draft Writing",
                            desc: "Assistance with initial content creation",
                        },
                        {
                            key: "revising",
                            label: "Revision & Content Development",
                            desc: "Help with improving content and structure",
                        },
                        {
                            key: "editing",
                            label: "Grammar & Style Editing",
                            desc: "Assistance with language mechanics and style",
                        },
                    ].map((stage) => (
                        <label
                            key={stage.key}
                            className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-ink-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={
                                    formData.aiSettings[
                                        stage.key as keyof typeof formData.aiSettings
                                    ]
                                }
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        aiSettings: {
                                            ...prev.aiSettings,
                                            [stage.key]: e.target.checked,
                                        },
                                    }))
                                }
                                className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 mt-1"
                            />
                            <div>
                                <div className="text-sm font-medium text-ink-900">
                                    {stage.label}
                                </div>
                                <div className="text-sm text-ink-500">
                                    {stage.desc}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    AI Interaction Limit
                </label>
                <Select
                    value={formData.aiInteractionLimit.toString()}
                    onValueChange={(value) =>
                        handleInputChange("aiInteractionLimit", parseInt(value))
                    }
                >
                    <SelectTrigger className="h-11">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">
                            5 interactions per assignment
                        </SelectItem>
                        <SelectItem value="10">
                            10 interactions per assignment
                        </SelectItem>
                        <SelectItem value="15">
                            15 interactions per assignment
                        </SelectItem>
                        <SelectItem value="20">
                            20 interactions per assignment
                        </SelectItem>
                        <SelectItem value="0">
                            Unlimited interactions
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="reflectionOnAIRequired"
                    checked={formData.reflectionOnAIRequired}
                    onChange={(e) =>
                        handleInputChange(
                            "reflectionOnAIRequired",
                            e.target.checked
                        )
                    }
                    className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 rounded"
                />
                <label
                    htmlFor="reflectionOnAIRequired"
                    className="text-sm font-medium text-ink-700"
                >
                    Require reflection on AI usage
                </label>
            </div>
        </div>
    );

    const renderSection5 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <BookOpen className="mx-auto h-12 w-12 text-branch-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Resources & Instructions
                </h2>
                <p className="text-ink-600 mt-2">
                    Provide resources and detailed instructions
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                    Detailed Instructions *
                </label>
                <textarea
                    value={formData.instructions}
                    onChange={(e) =>
                        handleInputChange("instructions", e.target.value)
                    }
                    rows={6}
                    className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                    placeholder="Provide comprehensive instructions for students including expectations, requirements, and guidance..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Supporting Resources
                </label>
                <div className="space-y-3">
                    {formData.resources.map((resource, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg"
                        >
                            <input
                                type="text"
                                value={resource.title}
                                onChange={(e) => {
                                    const newResources = [
                                        ...formData.resources,
                                    ];
                                    newResources[index].title = e.target.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        resources: newResources,
                                    }));
                                }}
                                className="px-3 py-2 border border-ink-300 rounded-md focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="Resource title"
                            />
                            <input
                                type="url"
                                value={resource.url}
                                onChange={(e) => {
                                    const newResources = [
                                        ...formData.resources,
                                    ];
                                    newResources[index].url = e.target.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        resources: newResources,
                                    }));
                                }}
                                className="px-3 py-2 border border-ink-300 rounded-md focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="https://..."
                            />
                            <input
                                type="text"
                                value={resource.description}
                                onChange={(e) => {
                                    const newResources = [
                                        ...formData.resources,
                                    ];
                                    newResources[index].description =
                                        e.target.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        resources: newResources,
                                    }));
                                }}
                                className="px-3 py-2 border border-ink-300 rounded-md focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="Brief description"
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addResource}
                        className="text-scribe-600 hover:text-scribe-700 text-sm font-medium"
                    >
                        + Add Resource
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Example Texts or Models
                </label>
                <div className="space-y-3">
                    {formData.examples.map((example, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-3"
                        >
                            <textarea
                                value={example}
                                onChange={(e) => {
                                    const newExamples = [...formData.examples];
                                    newExamples[index] = e.target.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        examples: newExamples,
                                    }));
                                }}
                                rows={3}
                                className="flex-1 px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="Provide example text or description of model writing..."
                            />
                            {formData.examples.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newExamples =
                                            formData.examples.filter(
                                                (_, i) => i !== index
                                            );
                                        setFormData((prev) => ({
                                            ...prev,
                                            examples: newExamples,
                                        }));
                                    }}
                                    className="px-3 py-2 text-ember-600 hover:bg-ember-50 rounded-lg"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addExample}
                        className="text-scribe-600 hover:text-scribe-700 text-sm font-medium"
                    >
                        + Add Example
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-forest-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/dashboard")}
                            className="mb-4 -ml-2"
                        >
                            <ChevronLeft size={20} className="mr-1" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-ink-900">
                            Create New Assignment
                        </h1>
                        <p className="text-ink-600 mt-2">
                            Create a meaningful opportunity for writers to
                            discover and grow their voice
                        </p>
                    </div>

                    {renderProgressBar()}

                    <div className="mb-8">
                        {currentSection === 1 && renderSection1()}
                        {currentSection === 2 && renderSection2()}
                        {currentSection === 3 && renderSection3()}
                        {currentSection === 4 && renderSection4()}
                        {currentSection === 5 && renderSection5()}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-ink-200">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentSection === 1}
                            className="px-6 py-3"
                        >
                            <ChevronLeft size={20} className="mr-2" />
                            Previous
                        </Button>

                        {currentSection < totalSections ? (
                            <Button
                                onClick={handleNext}
                                disabled={!isSectionValid()}
                                className="px-6 py-3"
                                size="lg"
                            >
                                Next
                                <ChevronRight size={20} className="ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    !isSectionValid() ||
                                    createAssignmentMutation.isPending
                                }
                                className="px-6 py-3 bg-branch-600 hover:bg-branch-700"
                                size="lg"
                            >
                                {createAssignmentMutation.isPending
                                    ? "Creating..."
                                    : "Create Assignment"}
                                <Check size={20} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
*/
