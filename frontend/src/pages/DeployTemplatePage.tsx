import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, CheckCircle, Target, BookOpen, Settings } from "lucide-react";
import { useTemplate } from "@/hooks/useAssignmentTemplates";
import { useCourses } from "@/hooks/useCourses";
import { useDeployTemplate, type DeployTemplateData } from "@/hooks/useCourseAssignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const DeployTemplatePage = () => {
    const navigate = useNavigate();
    const { templateId } = useParams<{ templateId: string }>();
    const { data: template, isLoading: templateLoading } = useTemplate(templateId!);
    const { data: courses } = useCourses();
    const deployMutation = useDeployTemplate();

    const [deployData, setDeployData] = useState<DeployTemplateData>({
        templateId: templateId!,
        courseId: '',
        allowLateSubmissions: true,
        stageDueDates: []
    });

    useEffect(() => {
        if (template?.writingStages) {
            setDeployData(prev => ({
                ...prev,
                stageDueDates: template.writingStages.map(stage => ({
                    stageId: stage.id,
                    dueDate: ''
                }))
            }));
        }
    }, [template]);

    const handleDeploy = async () => {
        try {
            // Filter out empty stage due dates
            const filteredStageDueDates = deployData.stageDueDates?.filter(stage => stage.dueDate) || [];
            
            await deployMutation.mutateAsync({
                ...deployData,
                stageDueDates: filteredStageDueDates.length > 0 ? filteredStageDueDates : undefined
            });
            
            navigate('/course-assignments');
        } catch (error) {
            console.error('Error deploying template:', error);
        }
    };

    const updateStageDueDate = (stageId: string, dueDate: string) => {
        setDeployData(prev => ({
            ...prev,
            stageDueDates: prev.stageDueDates?.map(stage =>
                stage.stageId === stageId ? { ...stage, dueDate } : stage
            ) || []
        }));
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            knowledge: 'bg-blue-100 text-blue-800',
            comprehension: 'bg-green-100 text-green-800',
            application: 'bg-yellow-100 text-yellow-800',
            analysis: 'bg-orange-100 text-orange-800',
            synthesis: 'bg-purple-100 text-purple-800',
            evaluation: 'bg-red-100 text-red-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    if (templateLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scribe-600 mx-auto mb-4"></div>
                    <p className="text-ink-600">Loading template...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-ink-900 mb-2">Template Not Found</h1>
                    <p className="text-ink-600 mb-4">The template you're looking for doesn't exist or you don't have access to it.</p>
                    <Button onClick={() => navigate('/templates')}>
                        Back to Templates
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-ink-900 mb-2">
                        Deploy Template to Course
                    </h1>
                    <p className="text-ink-600">
                        Configure course-specific settings for this assignment template
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Template Preview */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Template Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-ink-900 mb-1">{template.title}</h3>
                                    <p className="text-sm text-ink-600">{template.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline">{template.type}</Badge>
                                        <Badge variant="secondary">
                                            {template.usageCount} deployments
                                        </Badge>
                                    </div>
                                </div>

                                {template.requirements && (
                                    <div>
                                        <h4 className="text-sm font-medium text-ink-700 mb-2">Requirements</h4>
                                        <div className="text-sm text-ink-600 space-y-1">
                                            {template.requirements.minWords && (
                                                <p>Min words: {template.requirements.minWords}</p>
                                            )}
                                            {template.requirements.maxWords && (
                                                <p>Max words: {template.requirements.maxWords}</p>
                                            )}
                                            {template.requirements.citationStyle && (
                                                <p>Citation style: {template.requirements.citationStyle}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Learning Objectives ({template.learningObjectives.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {template.learningObjectives.map((objective) => (
                                        <div key={objective.id} className="border rounded-lg p-3">
                                            <div className="flex items-start gap-2 mb-2">
                                                <Badge className={getCategoryColor(objective.category)}>
                                                    {objective.category}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Level {objective.bloomsLevel}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {objective.weight}%
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-ink-900">{objective.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Writing Stages ({template.writingStages.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {template.writingStages.map((stage) => (
                                        <div key={stage.id} className="border rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium">Stage {stage.order}</span>
                                                <Badge variant="outline">{stage.name}</Badge>
                                                {stage.durationDays && (
                                                    <Badge variant="secondary">
                                                        {stage.durationDays} days
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-ink-600">{stage.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Deployment Configuration */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Selection</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-700 mb-2">
                                        Deploy to Course *
                                    </label>
                                    <Select
                                        value={deployData.courseId}
                                        onValueChange={(value) => setDeployData(prev => ({ ...prev, courseId: value }))}
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

                                <div>
                                    <label className="block text-sm font-medium text-ink-700 mb-2">
                                        Assignment Due Date
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={deployData.dueDate || ''}
                                        onChange={(e) => setDeployData(prev => ({ ...prev, dueDate: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-ink-700 mb-2">
                                        Custom Instructions (Optional)
                                    </label>
                                    <Textarea
                                        value={deployData.customInstructions || ''}
                                        onChange={(e) => setDeployData(prev => ({ ...prev, customInstructions: e.target.value }))}
                                        placeholder="Additional course-specific instructions..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-ink-700">
                                            Allow Late Submissions
                                        </label>
                                        <p className="text-xs text-ink-500">Students can submit after due date</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={deployData.allowLateSubmissions}
                                        onChange={(e) => setDeployData(prev => ({ ...prev, allowLateSubmissions: e.target.checked }))}
                                        className="rounded border-ink-300"
                                    />
                                </div>

                                {template.type === 'collaborative' && (
                                    <div>
                                        <label className="block text-sm font-medium text-ink-700 mb-2">
                                            Max Collaborators
                                        </label>
                                        <Input
                                            type="number"
                                            value={deployData.maxCollaborators || ''}
                                            onChange={(e) => setDeployData(prev => ({ ...prev, maxCollaborators: parseInt(e.target.value) || undefined }))}
                                            placeholder="5"
                                            min="2"
                                            max="10"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stage Due Dates */}
                        {template.writingStages.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Stage Due Dates (Optional)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-ink-600">
                                            Set specific due dates for each writing stage. Leave blank to use only the main assignment due date.
                                        </p>
                                        {template.writingStages.map((stage) => (
                                            <div key={stage.id}>
                                                <label className="block text-sm font-medium text-ink-700 mb-1">
                                                    Stage {stage.order}: {stage.name}
                                                </label>
                                                <Input
                                                    type="datetime-local"
                                                    value={deployData.stageDueDates?.find(s => s.stageId === stage.id)?.dueDate || ''}
                                                    onChange={(e) => updateStageDueDate(stage.id, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Course-Specific Requirements Override */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Course-Specific Requirements (Optional)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-ink-600">
                                    Override template requirements for this specific course deployment.
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-ink-700 mb-1">
                                            Min Words Override
                                        </label>
                                        <Input
                                            type="number"
                                            value={deployData.courseSpecificRequirements?.minWords || ''}
                                            onChange={(e) => setDeployData(prev => ({
                                                ...prev,
                                                courseSpecificRequirements: {
                                                    ...prev.courseSpecificRequirements,
                                                    minWords: parseInt(e.target.value) || undefined
                                                }
                                            }))}
                                            placeholder={template.requirements?.minWords?.toString() || 'Not set'}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-ink-700 mb-1">
                                            Max Words Override
                                        </label>
                                        <Input
                                            type="number"
                                            value={deployData.courseSpecificRequirements?.maxWords || ''}
                                            onChange={(e) => setDeployData(prev => ({
                                                ...prev,
                                                courseSpecificRequirements: {
                                                    ...prev.courseSpecificRequirements,
                                                    maxWords: parseInt(e.target.value) || undefined
                                                }
                                            }))}
                                            placeholder={template.requirements?.maxWords?.toString() || 'Not set'}
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-ink-700 mb-1">
                                        Citation Style Override
                                    </label>
                                    <Select
                                        value={deployData.courseSpecificRequirements?.citationStyle || ''}
                                        onValueChange={(value: 'APA' | 'MLA' | 'Chicago' | 'IEEE') => setDeployData(prev => ({
                                            ...prev,
                                            courseSpecificRequirements: {
                                                ...prev.courseSpecificRequirements,
                                                citationStyle: value
                                            }
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Default: ${template.requirements?.citationStyle || 'None'}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APA">APA</SelectItem>
                                            <SelectItem value="MLA">MLA</SelectItem>
                                            <SelectItem value="Chicago">Chicago</SelectItem>
                                            <SelectItem value="IEEE">IEEE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deploy Actions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/templates')}
                                    >
                                        Cancel
                                    </Button>
                                    
                                    <Button
                                        onClick={handleDeploy}
                                        disabled={!deployData.courseId || deployMutation.isPending}
                                        className="flex items-center gap-2"
                                    >
                                        {deployMutation.isPending ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Deploying...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Deploy to Course
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};