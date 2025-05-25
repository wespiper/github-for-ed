import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCourseAssignment } from "@/hooks/useCourseAssignments";
import { useCreateSubmission } from "@/hooks/useCourseAssignments";
import { BookOpen, FileText, Clock, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AssignmentDetailPage = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const { user } = useAuth();
    const { data: assignment, isLoading } = useCourseAssignment(assignmentId!);
    const createSubmission = useCreateSubmission();

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-ink-500">Loading assignment...</div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-ink-900 mb-2">Assignment not found</h2>
                    <p className="text-ink-600 mb-4">The assignment you're looking for doesn't exist.</p>
                    <Button asChild>
                        <Link to="/writing/continue">Browse Assignments</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const handleStartAssignment = async () => {
        try {
            const submission = await createSubmission.mutateAsync({
                assignmentId: assignmentId!,
                data: {
                    title: `${user?.firstName}'s ${assignment.template?.title || assignment.title}`,
                    isCollaborative: false
                }
            });
            
            // Navigate to the assignment workspace
            window.location.href = `/writing/assignment/${assignmentId}/submission/${submission._id}`;
        } catch (error) {
            console.error('Failed to create submission:', error);
            alert('Failed to start assignment. Please try again.');
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/writing/continue">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Assignments
                        </Link>
                    </Button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-scribe-50 rounded-lg">
                                <FileText className="h-8 w-8 text-scribe-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-ink-900 mb-2">
                                    {assignment.template?.title || assignment.title}
                                </h1>
                                <p className="text-ink-600 mb-4">
                                    {assignment.course?.title}
                                </p>
                                <div className="flex items-center space-x-6 text-sm text-ink-500">
                                    {assignment.dueDate && (
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4" />
                                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>{assignment.type || 'Individual'} Assignment</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <Button 
                                onClick={handleStartAssignment}
                                disabled={createSubmission.isPending}
                                size="lg"
                            >
                                {createSubmission.isPending ? 'Starting...' : 'Start Assignment'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Details */}
            <div className="grid gap-8 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Instructions */}
                    <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                        <h2 className="text-xl font-semibold text-ink-900 mb-4">Instructions</h2>
                        <div className="prose max-w-none">
                            <div className="text-ink-700 whitespace-pre-wrap">
                                {assignment.customInstructions || assignment.template?.description || 'No instructions provided.'}
                            </div>
                        </div>
                    </div>

                    {/* Learning Objectives */}
                    {assignment.template?.learningObjectives && assignment.template.learningObjectives.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                            <h2 className="text-xl font-semibold text-ink-900 mb-4">Learning Objectives</h2>
                            <div className="space-y-3">
                                {assignment.template.learningObjectives.map((objective, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-forest-100 text-forest-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-ink-900">{objective.description}</p>
                                            <p className="text-sm text-ink-600 mt-1">
                                                Category: {objective.category} • Level: {objective.bloomsLevel}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Writing Stages */}
                    {assignment.template?.writingStages && assignment.template.writingStages.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                            <h2 className="text-xl font-semibold text-ink-900 mb-4">Writing Process</h2>
                            <div className="space-y-4">
                                {assignment.template.writingStages.map((stage, index) => (
                                    <div key={stage.id} className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-scribe-100 text-scribe-700 rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-ink-900">{stage.name}</h3>
                                            <p className="text-sm text-ink-600 mt-1">{stage.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-ink-500">
                                                <span>Duration: {stage.durationDays} days</span>
                                                {stage.allowAI && (
                                                    <span className="px-2 py-1 bg-highlight-100 text-highlight-700 rounded-full">
                                                        AI Assistance: {stage.aiAssistanceLevel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Requirements */}
                    <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-6">
                        <h3 className="font-semibold text-ink-900 mb-4">Requirements</h3>
                        <div className="space-y-3 text-sm">
                            {assignment.courseSpecificRequirements?.minWords && (
                                <div className="flex justify-between">
                                    <span className="text-ink-600">Min Words:</span>
                                    <span className="font-medium">{assignment.courseSpecificRequirements.minWords}</span>
                                </div>
                            )}
                            {assignment.courseSpecificRequirements?.maxWords && (
                                <div className="flex justify-between">
                                    <span className="text-ink-600">Max Words:</span>
                                    <span className="font-medium">{assignment.courseSpecificRequirements.maxWords}</span>
                                </div>
                            )}
                            {assignment.courseSpecificRequirements?.citationStyle && (
                                <div className="flex justify-between">
                                    <span className="text-ink-600">Citation Style:</span>
                                    <span className="font-medium">{assignment.courseSpecificRequirements.citationStyle}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-ink-600">Late Submissions:</span>
                                <span className="font-medium">{assignment.allowLateSubmissions ? 'Allowed' : 'Not Allowed'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-6">
                        <h3 className="font-semibold text-ink-900 mb-4">Course</h3>
                        <div className="flex items-center space-x-3">
                            <BookOpen className="h-5 w-5 text-forest-600" />
                            <div>
                                <p className="font-medium text-ink-900">{assignment.course?.title}</p>
                                <p className="text-sm text-ink-600">
                                    {assignment.instructor?.firstName} {assignment.instructor?.lastName}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                            <Link to={`/courses/${assignment.course?._id}`}>
                                View Course
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};