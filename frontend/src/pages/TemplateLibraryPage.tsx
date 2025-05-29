import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, BookOpen, Target, Users, Clock, Copy, Eye, Trash2, Archive, Tag, Star } from "lucide-react";
import { useMyTemplates, useTemplateLibrary, useCloneTemplate, useArchiveTemplate, useDeleteTemplate } from "@/hooks/useAssignmentTemplates";
import { type AssignmentTemplate } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TemplateLibraryPage = () => {
    const [activeTab, setActiveTab] = useState<'my-templates' | 'library'>('my-templates');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Hooks
    const { data: myTemplates, isLoading: myTemplatesLoading } = useMyTemplates({
        search: searchTerm || undefined,
        status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined
    });

    const { data: libraryTemplates, isLoading: libraryLoading } = useTemplateLibrary({
        search: searchTerm || undefined,
        type: filterType && filterType !== 'all' ? filterType : undefined,
        category: filterCategory && filterCategory !== 'all' ? filterCategory : undefined
    });

    const cloneTemplateMutation = useCloneTemplate();
    const archiveTemplateMutation = useArchiveTemplate();
    const deleteTemplateMutation = useDeleteTemplate();

    const handleCloneTemplate = async (templateId: string) => {
        try {
            await cloneTemplateMutation.mutateAsync(templateId);
        } catch (error) {
            console.error('Error cloning template:', error);
        }
    };

    const handleArchiveTemplate = async (templateId: string) => {
        try {
            await archiveTemplateMutation.mutateAsync(templateId);
        } catch (error) {
            console.error('Error archiving template:', error);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            try {
                await deleteTemplateMutation.mutateAsync(templateId);
            } catch (error) {
                console.error('Error deleting template:', error);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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

    const renderTemplateCard = (template: AssignmentTemplate, isOwner: boolean = false) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                            {template.title}
                            <Badge className={getStatusColor(template.status || '')}>
                                {template.status}
                            </Badge>
                            {template.isPublic && (
                                <Badge variant="outline">
                                    <Users className="w-3 h-3 mr-1" />
                                    Public
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-sm text-ink-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                            <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {template.learningObjectives.length} objectives
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {template.writingStages.length} stages
                            </span>
                            <span className="flex items-center gap-1">
                                <Copy className="w-3 h-3" />
                                {template.usageCount} uses
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Learning Objective Categories */}
                    {Array.isArray(template.learningObjectives) && template.learningObjectives.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-ink-700 mb-1">Learning Objectives:</p>
                            <div className="flex flex-wrap gap-1">
                                {Array.isArray(template.learningObjectives) ? 
                                    [...new Set((template.learningObjectives as Array<{category: string}>).map(obj => obj.category))].map((category) => (
                                        <Badge key={category} className={getCategoryColor(category)} variant="secondary">
                                            {category}
                                        </Badge>
                                    )) : 
                                    <span className="text-xs text-ink-500">No objectives available</span>
                                }
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {template.tags.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-ink-700 mb-1">Tags:</p>
                            <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        <Tag className="w-2 h-2 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Author and Date */}
                    <div className="flex items-center justify-between text-xs text-ink-500 pt-2 border-t">
                        <span>
                            By {template.instructor?.firstName} {template.instructor?.lastName}
                        </span>
                        <span>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                                <Link to={`/templates/${template.id}`}>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                </Link>
                            </Button>
                            {!isOwner && (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCloneTemplate(template.id)}
                                    disabled={cloneTemplateMutation.isPending}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Clone
                                </Button>
                            )}
                            {isOwner && (
                                <>
                                    <Button asChild size="sm">
                                        <Link to={`/templates/${template.id}/deploy`}>
                                            Deploy
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link to={`/templates/${template.id}/edit`}>
                                            Edit
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                        
                        {isOwner && (
                            <div className="flex space-x-1">
                                {template.status !== 'archived' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleArchiveTemplate(template.id)}
                                        disabled={archiveTemplateMutation.isPending}
                                    >
                                        <Archive className="w-3 h-3" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    disabled={deleteTemplateMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-ink-900 mb-2">
                        Assignment Templates
                    </h1>
                    <p className="text-ink-600">
                        Create reusable assignment templates and deploy them to multiple courses
                    </p>
                </div>

                {/* Tabs and Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-1">
                        <Button
                            variant={activeTab === 'my-templates' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('my-templates')}
                        >
                            My Templates
                        </Button>
                        <Button
                            variant={activeTab === 'library' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('library')}
                        >
                            Template Library
                        </Button>
                    </div>
                    
                    <Button asChild>
                        <Link to="/templates/create">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                        </Link>
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" />
                                    <Input
                                        placeholder="Search templates..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Assignment Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="individual">Individual</SelectItem>
                                    <SelectItem value="collaborative">Collaborative</SelectItem>
                                    <SelectItem value="peer-review">Peer Review</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Learning Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="knowledge">Knowledge</SelectItem>
                                    <SelectItem value="comprehension">Comprehension</SelectItem>
                                    <SelectItem value="application">Application</SelectItem>
                                    <SelectItem value="analysis">Analysis</SelectItem>
                                    <SelectItem value="synthesis">Synthesis</SelectItem>
                                    <SelectItem value="evaluation">Evaluation</SelectItem>
                                </SelectContent>
                            </Select>

                            {activeTab === 'my-templates' && (
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeTab === 'my-templates' ? (
                        myTemplatesLoading ? (
                            <div className="col-span-full text-center py-8 text-ink-500">
                                Loading your templates...
                            </div>
                        ) : myTemplates && myTemplates.length > 0 ? (
                            myTemplates.map(template => renderTemplateCard(template, true))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <BookOpen className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-ink-900 mb-2">No templates yet</h3>
                                <p className="text-ink-600 mb-4">Create your first assignment template to get started</p>
                                <Button asChild>
                                    <Link to="/templates/create">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Template
                                    </Link>
                                </Button>
                            </div>
                        )
                    ) : (
                        libraryLoading ? (
                            <div className="col-span-full text-center py-8 text-ink-500">
                                Loading template library...
                            </div>
                        ) : libraryTemplates && libraryTemplates.length > 0 ? (
                            libraryTemplates.map(template => renderTemplateCard(template, false))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <Star className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-ink-900 mb-2">No public templates found</h3>
                                <p className="text-ink-600">Try adjusting your search filters or check back later</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};