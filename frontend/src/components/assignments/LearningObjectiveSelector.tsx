import React from 'react';
import { Search, Filter, ChevronDown, X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { type LearningObjectivePreset, useLearningObjectivesManager } from '@/hooks/useLearningObjectives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface LearningObjectiveSelectorProps {
  onObjectivesChange: (objectives: LearningObjectivePreset[]) => void;
  initialObjectives?: LearningObjectivePreset[];
}

export function LearningObjectiveSelector({ 
  onObjectivesChange,
  initialObjectives = []
}: LearningObjectiveSelectorProps) {
  const {
    selectedObjectives,
    availablePresets,
    categories,
    subjects,
    bloomsLevels,
    filters,
    validationResult,
    isLoading,
    totalWeight,
    isValid,
    canAddMore,
    addObjective,
    removeObjective,
    updateObjectiveWeight,
    updateFilters,
    autoBalanceWeights,
    clearObjectives
  } = useLearningObjectivesManager(initialObjectives);

  const [showFilters, setShowFilters] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Notify parent when objectives change
  React.useEffect(() => {
    onObjectivesChange(selectedObjectives);
  }, [selectedObjectives, onObjectivesChange]);

  // Filter presets based on search only (API handles other filters)
  const filteredPresets = React.useMemo(() => {
    return availablePresets.filter(preset => {
      const matchesSearch = searchTerm === '' || 
        preset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.assessmentCriteria.some(criteria => 
          criteria.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesSearch;
    });
  }, [availablePresets, searchTerm]);

  const handleFilterChange = (type: keyof typeof filters, value: string | number) => {
    updateFilters({ ...filters, [type]: value });
  };

  const clearAllFilters = () => {
    updateFilters({});
    setSearchTerm('');
  };

  const getBloomsLevelName = (level: number): string => {
    const levels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
    return levels[level - 1] || `Level ${level}`;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'knowledge': 'bg-blue-100 text-blue-800',
      'comprehension': 'bg-green-100 text-green-800',
      'application': 'bg-purple-100 text-purple-800',
      'analysis': 'bg-orange-100 text-orange-800',
      'synthesis': 'bg-red-100 text-red-800',
      'evaluation': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="mt-2 space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Objectives</h3>
        <p className="text-sm text-gray-600">
          Select learning objectives that align with your assignment goals. 
          The total weight should equal 100%.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search objectives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <Button
                      key={cat.category}
                      variant={filters.category === cat.category ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('category', cat.category)}
                      className="capitalize"
                    >
                      {cat.category} ({cat.count})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(subj => (
                    <Button
                      key={subj.key}
                      variant={filters.subject === subj.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('subject', subj.key)}
                      className="capitalize"
                    >
                      {subj.name} ({subj.count})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bloom's Levels */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Bloom's Taxonomy Levels</h4>
                <div className="flex flex-wrap gap-2">
                  {bloomsLevels.map(level => (
                    <Button
                      key={level.level}
                      variant={filters.bloomsLevel === level.level ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('bloomsLevel', level.level)}
                    >
                      {level.name} ({level.count})
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-gray-600"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Objectives */}
      {selectedObjectives.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              Selected Objectives ({selectedObjectives.length})
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant={isValid ? "default" : "destructive"}>
                Weight: {totalWeight}%
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={autoBalanceWeights}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Auto Balance
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearObjectives}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {selectedObjectives.map((objective) => (
              <div key={objective.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(objective.category)}>
                        {objective.category}
                      </Badge>
                      <Badge variant="outline">
                        {getBloomsLevelName(objective.bloomsLevel)}
                      </Badge>
                      <Badge variant="outline">
                        {objective.subject}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{objective.description}</p>
                    <div className="text-xs text-gray-600">
                      <strong>Assessment:</strong> {objective.assessmentCriteria.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={objective.weight}
                      onChange={(e) => updateObjectiveWeight(objective.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjective(objective.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Messages */}
          {validationResult && !validationResult.isValid && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="text-sm text-red-600 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Available Presets */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            Available Objectives ({filteredPresets.length})
          </h4>
          {!canAddMore && (
            <Badge variant="secondary">Maximum objectives reached</Badge>
          )}
        </div>

        {filteredPresets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No objectives match your search criteria.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredPresets.map((preset) => (
              <div key={preset.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(preset.category)}>
                        {preset.category}
                      </Badge>
                      <Badge variant="outline">
                        {getBloomsLevelName(preset.bloomsLevel)}
                      </Badge>
                      <Badge variant="outline">
                        {preset.subject}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{preset.description}</p>
                    <div className="text-xs text-gray-600">
                      <strong>Assessment:</strong> {preset.assessmentCriteria.join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addObjective(preset)}
                    disabled={!canAddMore || selectedObjectives.some(obj => obj.id === preset.id)}
                    className="ml-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}