import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    BookOpen,
    Target,
    Users,
    Bot,
    Calendar,
} from "lucide-react";
import { useCreateCourse } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CourseFormData {
    // Step 1: Course Basics
    title: string;
    description: string;
    subject: string;

    // Step 2: Writing Focus
    writingGenres: string[];
    targetSkills: string[];
    learningObjectives: string[];

    // Step 3: Student Management
    enrollmentMethod: "manual" | "code" | "email";
    allowCollaboration: boolean;
    maxStudents?: number;

    // Step 4: AI Integration
    aiAssistanceEnabled: boolean;
    defaultBoundaries: {
        brainstorming: boolean;
        drafting: boolean;
        revising: boolean;
        editing: boolean;
    };
    reflectionRequired: boolean;

    // Step 5: Course Structure
    startDate?: string;
    endDate?: string;
    assessmentApproach: "process-focused" | "product-focused" | "balanced";
}

const initialFormData: CourseFormData = {
    title: "",
    description: "",
    subject: "",
    writingGenres: [],
    targetSkills: [],
    learningObjectives: [""],
    enrollmentMethod: "manual",
    allowCollaboration: true,
    aiAssistanceEnabled: true,
    defaultBoundaries: {
        brainstorming: true,
        drafting: false,
        revising: true,
        editing: false,
    },
    reflectionRequired: true,
    assessmentApproach: "balanced",
};

const WRITING_GENRES = [
    "Argumentative Essays",
    "Research Papers",
    "Creative Writing",
    "Narrative Writing",
    "Analytical Essays",
    "Technical Writing",
    "Journalistic Writing",
    "Academic Writing",
    "Business Writing",
    "Reflective Writing",
];

const WRITING_SKILLS = [
    "Thesis Development",
    "Evidence Integration",
    "Organization Structure",
    "Revision Strategies",
    "Voice & Style",
    "Research Methods",
    "Citation & Documentation",
    "Critical Analysis",
    "Peer Collaboration",
    "Self-Reflection",
];

export const CreateCourse = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<CourseFormData>(initialFormData);
    const navigate = useNavigate();
    const createCourseMutation = useCreateCourse();

    const totalSteps = 5;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleInputChange = (
        field: keyof CourseFormData,
        value: string | boolean | number | string[] | Date | undefined
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleArrayToggle = (
        field: "writingGenres" | "targetSkills",
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item) => item !== value)
                : [...prev[field], value],
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

    const removeLearningObjective = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            learningObjectives: prev.learningObjectives.filter(
                (_, i) => i !== index
            ),
        }));
    };

    const handleSubmit = async () => {
        try {
            const courseData = {
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
            };

            await createCourseMutation.mutateAsync(courseData);
            navigate("/dashboard", {
                state: { message: "Course created successfully!" },
            });
        } catch (error) {
            console.error("Failed to create course:", error);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.title.trim().length > 0;
            case 2:
                return (
                    formData.writingGenres.length > 0 &&
                    formData.targetSkills.length > 0
                );
            case 3:
                return true; // All fields optional or have defaults
            case 4:
                return true; // All fields optional or have defaults
            case 5:
                return formData.learningObjectives.some(
                    (obj) => obj.trim().length > 0
                );
            default:
                return false;
        }
    };

    const renderProgressBar = () => (
        <div className="flex items-center justify-between mb-8">
            {Array.from({ length: totalSteps }, (_, i) => {
                const stepNumber = i + 1;
                const isActive = stepNumber === currentStep;
                const isComplete = stepNumber < currentStep;

                return (
                    <div key={stepNumber} className="flex items-center">
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
                            {isComplete ? <Check size={16} /> : stepNumber}
                        </div>
                        {stepNumber < totalSteps && (
                            <div
                                className={`w-16 h-0.5 mx-2 ${
                                    stepNumber < currentStep
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

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <BookOpen className="mx-auto h-12 w-12 text-forest-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Course Setup
                </h2>
                <p className="text-ink-600 mt-2">
                    Plant the seeds that will help your learning community
                    flourish
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                    Course Title *
                </Label>
                <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Advanced Academic Writing, Creative Writing Workshop"
                    className="h-11"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                    Subject Area
                </Label>
                <Input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                    }
                    placeholder="e.g., English, Journalism, Business Communication"
                    className="h-11"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                    Course Description
                </Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    placeholder="Share your vision for how writers will grow and flourish in this learning grove..."
                    className="resize-none"
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Target className="mx-auto h-12 w-12 text-branch-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Writing Focus
                </h2>
                <p className="text-ink-600 mt-2">
                    Choose the writing paths your learners will explore and
                    master
                </p>
            </div>

            <div className="space-y-4">
                <Label className="text-sm font-medium">Writing Genres *</Label>
                <div className="grid grid-cols-2 gap-3">
                    {WRITING_GENRES.map((genre) => (
                        <div
                            key={genre}
                            className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                            <Checkbox
                                id={`genre-${genre}`}
                                checked={formData.writingGenres.includes(genre)}
                                onCheckedChange={() =>
                                    handleArrayToggle("writingGenres", genre)
                                }
                            />
                            <Label
                                htmlFor={`genre-${genre}`}
                                className="text-sm cursor-pointer flex-1"
                            >
                                {genre}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-sm font-medium">
                    Target Writing Skills *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                    {WRITING_SKILLS.map((skill) => (
                        <div
                            key={skill}
                            className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                            <Checkbox
                                id={`skill-${skill}`}
                                checked={formData.targetSkills.includes(skill)}
                                onCheckedChange={() =>
                                    handleArrayToggle("targetSkills", skill)
                                }
                            />
                            <Label
                                htmlFor={`skill-${skill}`}
                                className="text-sm cursor-pointer flex-1"
                            >
                                {skill}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Users className="mx-auto h-12 w-12 text-scribe-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Student Management
                </h2>
                <p className="text-ink-600 mt-2">
                    Configure how students will join and interact in your course
                </p>
            </div>

            <div className="space-y-4">
                <Label className="text-sm font-medium">Enrollment Method</Label>
                <RadioGroup
                    value={formData.enrollmentMethod}
                    onValueChange={(value) =>
                        handleInputChange("enrollmentMethod", value)
                    }
                    className="space-y-3"
                >
                    {[
                        {
                            value: "manual",
                            label: "Manual Enrollment",
                            desc: "You manually add students to the course",
                        },
                        {
                            value: "code",
                            label: "Course Code",
                            desc: "Students join using a course code you provide",
                        },
                        {
                            value: "email",
                            label: "Email Invitation",
                            desc: "Send email invitations to specific students",
                        },
                    ].map((option) => (
                        <div
                            key={option.value}
                            className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                            <RadioGroupItem
                                value={option.value}
                                id={option.value}
                                className="mt-1"
                            />
                            <div className="space-y-1">
                                <Label
                                    htmlFor={option.value}
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    {option.label}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {option.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label
                        htmlFor="maxStudents"
                        className="text-sm font-medium"
                    >
                        Maximum Students (Optional)
                    </Label>
                    <Input
                        id="maxStudents"
                        type="number"
                        value={formData.maxStudents || ""}
                        onChange={(e) =>
                            handleInputChange(
                                "maxStudents",
                                e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                            )
                        }
                        placeholder="e.g., 25"
                        min="1"
                        className="h-11"
                    />
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                        id="allowCollaboration"
                        checked={formData.allowCollaboration}
                        onCheckedChange={(checked) =>
                            handleInputChange("allowCollaboration", checked)
                        }
                    />
                    <Label
                        htmlFor="allowCollaboration"
                        className="text-sm cursor-pointer"
                    >
                        Allow student collaboration on assignments
                    </Label>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Bot className="mx-auto h-12 w-12 text-highlight-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    AI Integration
                </h2>
                <p className="text-ink-600 mt-2">
                    Configure AI assistance boundaries for student writing
                </p>
            </div>

            <div className="bg-scribe-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                    <input
                        type="checkbox"
                        id="aiAssistanceEnabled"
                        checked={formData.aiAssistanceEnabled}
                        onChange={(e) =>
                            handleInputChange(
                                "aiAssistanceEnabled",
                                e.target.checked
                            )
                        }
                        className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 rounded"
                    />
                    <label
                        htmlFor="aiAssistanceEnabled"
                        className="text-sm font-medium text-ink-900"
                    >
                        Enable AI Writing Assistant
                    </label>
                </div>
                <p className="text-sm text-ink-600 ml-7">
                    Allow students to use AI assistance during writing processes
                    with configurable boundaries
                </p>
            </div>

            {formData.aiAssistanceEnabled && (
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-3">
                        Default AI Assistance Boundaries
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
                                        formData.defaultBoundaries[
                                            stage.key as keyof typeof formData.defaultBoundaries
                                        ]
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            defaultBoundaries: {
                                                ...prev.defaultBoundaries,
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

                    <div className="mt-4 flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="reflectionRequired"
                            checked={formData.reflectionRequired}
                            onChange={(e) =>
                                handleInputChange(
                                    "reflectionRequired",
                                    e.target.checked
                                )
                            }
                            className="h-4 w-4 text-scribe-600 focus:ring-scribe-500 border-ink-300 rounded"
                        />
                        <label
                            htmlFor="reflectionRequired"
                            className="text-sm text-ink-700"
                        >
                            Require students to reflect on AI usage in their
                            writing process
                        </label>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Calendar className="mx-auto h-12 w-12 text-branch-600 mb-4" />
                <h2 className="text-2xl font-bold text-ink-900">
                    Course Structure
                </h2>
                <p className="text-ink-600 mt-2">
                    Define learning objectives and assessment approach
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Learning Objectives *
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
                                placeholder="e.g., Students will develop strong thesis statements..."
                            />
                            {formData.learningObjectives.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeLearningObjective(index)
                                    }
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

            <div>
                <label className="block text-sm font-medium text-ink-700 mb-3">
                    Assessment Approach
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
                                name="assessmentApproach"
                                value={approach.value}
                                checked={
                                    formData.assessmentApproach ===
                                    approach.value
                                }
                                onChange={(e) =>
                                    handleInputChange(
                                        "assessmentApproach",
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Course Start Date (Optional)
                    </label>
                    <input
                        type="date"
                        value={formData.startDate || ""}
                        onChange={(e) =>
                            handleInputChange("startDate", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                        Course End Date (Optional)
                    </label>
                    <input
                        type="date"
                        value={formData.endDate || ""}
                        onChange={(e) =>
                            handleInputChange("endDate", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                    />
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
                            Create New Course
                        </h1>
                        <p className="text-ink-600 mt-2">
                            Cultivate a space where writers can grow and
                            discover their authentic voice
                        </p>
                    </div>

                    {renderProgressBar()}

                    <div className="mb-8">
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                        {currentStep === 5 && renderStep5()}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-ink-200">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className="px-6 py-3"
                        >
                            <ChevronLeft size={20} className="mr-2" />
                            Previous
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button
                                onClick={handleNext}
                                disabled={!isStepValid()}
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
                                    !isStepValid() ||
                                    createCourseMutation.isPending
                                }
                                className="px-6 py-3 bg-branch-600 hover:bg-branch-700"
                                size="lg"
                            >
                                {createCourseMutation.isPending
                                    ? "Creating..."
                                    : "Create Course"}
                                <Check size={20} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
