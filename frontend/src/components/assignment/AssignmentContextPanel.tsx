import { Calendar, Target, Shield, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    wordCountMin?: number;
    wordCountMax?: number;
    courseTitle: string;
    instructor: {
        firstName: string;
        lastName: string;
    };
}

interface LearningObjective {
    id: string;
    description: string;
    completed: boolean;
}

interface AIBoundaries {
    allowedTools: string[];
    restrictions: string[];
    reflectionRequired: boolean;
    citationRequired: boolean;
}

interface WritingProgress {
    currentWordCount: number;
    versionsCreated: number;
    timeSpent: number; // minutes
    lastActivity: string;
}

interface AssignmentContextPanelProps {
    assignment: Assignment;
    learningObjectives: LearningObjective[];
    aiBoundaries: AIBoundaries;
    progress: WritingProgress;
}

export const AssignmentContextPanel = ({
    assignment,
    learningObjectives,
    aiBoundaries,
    progress,
}: AssignmentContextPanelProps) => {
    const completedObjectives = learningObjectives.filter(obj => obj.completed).length;
    const progressPercentage = (completedObjectives / learningObjectives.length) * 100;
    
    const isDueSoon = new Date(assignment.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;
    const isOverdue = new Date(assignment.dueDate).getTime() < Date.now();

    const getWordCountStatus = () => {
        const { currentWordCount } = progress;
        const { wordCountMin, wordCountMax } = assignment;
        
        if (!wordCountMin) return null;
        
        if (currentWordCount < wordCountMin) {
            return { status: 'under', color: 'text-ember-600', message: `${wordCountMin - currentWordCount} words to minimum` };
        } else if (wordCountMax && currentWordCount > wordCountMax) {
            return { status: 'over', color: 'text-highlight-600', message: `${currentWordCount - wordCountMax} words over maximum` };
        } else {
            return { status: 'good', color: 'text-branch-600', message: 'Word count on track' };
        }
    };

    const wordCountStatus = getWordCountStatus();

    return (
        <div className="flex-1 overflow-auto bg-white">
            {/* Assignment Header */}
            <div className="p-4 border-b border-ink-200">
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-scribe-100 rounded-lg">
                        <FileText className="w-5 h-5 text-scribe-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-semibold text-ink-900 truncate">
                            {assignment.title}
                        </h1>
                        <p className="text-sm text-ink-600 mt-1">
                            {assignment.courseTitle}
                        </p>
                        <p className="text-xs text-ink-500">
                            {assignment.instructor.firstName} {assignment.instructor.lastName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Due Date */}
            <div className="p-4 border-b border-ink-200">
                <div className="flex items-center space-x-3">
                    <Calendar className={`w-4 h-4 ${
                        isOverdue ? 'text-ember-600' : isDueSoon ? 'text-highlight-600' : 'text-ink-600'
                    }`} />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-ink-900">Due Date</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                isOverdue 
                                    ? 'bg-ember-100 text-ember-700' 
                                    : isDueSoon 
                                    ? 'bg-highlight-100 text-highlight-700'
                                    : 'bg-ink-100 text-ink-700'
                            }`}>
                                {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'On Track'}
                            </span>
                        </div>
                        <p className="text-sm text-ink-600">
                            {formatDistanceToNow(new Date(assignment.dueDate))} 
                            {isOverdue ? ' ago' : ' remaining'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Writing Progress */}
            <div className="p-4 border-b border-ink-200">
                <div className="flex items-center space-x-3 mb-3">
                    <FileText className="w-4 h-4 text-ink-600" />
                    <span className="text-sm font-medium text-ink-900">Writing Progress</span>
                </div>
                
                <div className="space-y-3">
                    {/* Word Count */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-600">Word Count</span>
                        <div className="text-right">
                            <div className="text-sm font-medium text-ink-900">
                                {progress.currentWordCount}
                                {assignment.wordCountMin && (
                                    <span className="text-ink-500">
                                        /{assignment.wordCountMin}
                                        {assignment.wordCountMax && `-${assignment.wordCountMax}`}
                                    </span>
                                )}
                            </div>
                            {wordCountStatus && (
                                <div className={`text-xs ${wordCountStatus.color}`}>
                                    {wordCountStatus.message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Time Spent */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-600">Time Spent</span>
                        <span className="text-sm font-medium text-ink-900">
                            {Math.round(progress.timeSpent)}m
                        </span>
                    </div>

                    {/* Versions */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-600">Versions</span>
                        <span className="text-sm font-medium text-ink-900">
                            {progress.versionsCreated}
                        </span>
                    </div>
                </div>
            </div>

            {/* Learning Objectives */}
            <div className="p-4 border-b border-ink-200">
                <div className="flex items-center space-x-3 mb-3">
                    <Target className="w-4 h-4 text-ink-600" />
                    <span className="text-sm font-medium text-ink-900">Learning Objectives</span>
                    <span className="text-xs bg-scribe-100 text-scribe-700 px-2 py-1 rounded-full">
                        {completedObjectives}/{learningObjectives.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="w-full bg-ink-200 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-scribe-500 to-branch-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Objectives List */}
                <div className="space-y-2">
                    {learningObjectives.map((objective) => (
                        <div key={objective.id} className="flex items-start space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                objective.completed
                                    ? 'bg-branch-500 border-branch-500'
                                    : 'border-ink-300'
                            }`}>
                                {objective.completed && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-sm flex-1 ${
                                objective.completed ? 'text-ink-600 line-through' : 'text-ink-900'
                            }`}>
                                {objective.description}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Boundaries */}
            <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-4 h-4 text-ink-600" />
                    <span className="text-sm font-medium text-ink-900">AI Guidelines</span>
                </div>

                <div className="space-y-3">
                    {/* Allowed Tools */}
                    <div>
                        <span className="text-xs font-medium text-branch-700 uppercase tracking-wide">Allowed</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {aiBoundaries.allowedTools.map((tool, index) => (
                                <span key={index} className="text-xs bg-branch-100 text-branch-700 px-2 py-1 rounded">
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Restrictions */}
                    {aiBoundaries.restrictions.length > 0 && (
                        <div>
                            <span className="text-xs font-medium text-ember-700 uppercase tracking-wide">Restrictions</span>
                            <div className="mt-1 space-y-1">
                                {aiBoundaries.restrictions.map((restriction, index) => (
                                    <div key={index} className="text-xs text-ember-700 flex items-center space-x-1">
                                        <span>•</span>
                                        <span>{restriction}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Requirements */}
                    <div className="space-y-1">
                        {aiBoundaries.reflectionRequired && (
                            <div className="text-xs text-highlight-700 flex items-center space-x-1">
                                <span>⚡</span>
                                <span>Reflection required for AI assistance</span>
                            </div>
                        )}
                        {aiBoundaries.citationRequired && (
                            <div className="text-xs text-highlight-700 flex items-center space-x-1">
                                <span>📝</span>
                                <span>Citations required for AI-generated content</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock data for testing
export const mockAssignmentData = {
    assignment: {
        id: "assignment-1",
        title: "Reflective Essay: The Role of Technology in Modern Education",
        description: "Write a reflective essay examining how technology has transformed educational practices and its impact on student learning outcomes.",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        wordCountMin: 1000,
        wordCountMax: 1500,
        courseTitle: "Educational Psychology",
        instructor: {
            firstName: "Dr. Sarah",
            lastName: "Johnson"
        }
    },
    learningObjectives: [
        {
            id: "obj-1",
            description: "Analyze the impact of technology on traditional teaching methods",
            completed: true
        },
        {
            id: "obj-2", 
            description: "Evaluate benefits and challenges of digital learning environments",
            completed: false
        },
        {
            id: "obj-3",
            description: "Reflect on personal experiences with educational technology",
            completed: false
        },
        {
            id: "obj-4",
            description: "Propose evidence-based recommendations for technology integration",
            completed: false
        }
    ],
    aiBoundaries: {
        allowedTools: ["Grammar Check", "Brainstorming", "Research Assistance"],
        restrictions: ["No direct writing", "No plagiarism", "No citation generation"],
        reflectionRequired: true,
        citationRequired: true
    },
    progress: {
        currentWordCount: 450,
        versionsCreated: 3,
        timeSpent: 45,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    }
};