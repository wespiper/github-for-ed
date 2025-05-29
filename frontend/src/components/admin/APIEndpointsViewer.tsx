import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface APIRoute {
  method: string;
  path: string;
  description: string;
  roles: string[];
}

interface APICategory {
  category: string;
  routes: APIRoute[];
}

const methodColors = {
  GET: 'bg-green-100 text-green-800 border-green-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-200'
};

const roleColors = {
  public: 'bg-gray-100 text-gray-800',
  student: 'bg-blue-100 text-blue-800',
  educator: 'bg-green-100 text-green-800',
  admin: 'bg-red-100 text-red-800'
};

interface APIEndpointsViewerProps {
  onTestEndpoint?: (method: string, path: string) => void;
}

export const APIEndpointsViewer = ({ onTestEndpoint }: APIEndpointsViewerProps) => {
  const [endpoints, setEndpoints] = useState<APICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/api-endpoints');
      setEndpoints(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API endpoints');
    } finally {
      setLoading(false);
    }
  };

  const filteredEndpoints = endpoints.filter(category => {
    if (selectedCategory !== 'all' && category.category !== selectedCategory) {
      return false;
    }
    
    if (!searchTerm) return true;
    
    return category.routes.some(route => 
      route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.method.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-600">Loading API endpoints...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={fetchEndpoints} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const categories = ['all', ...endpoints.map(e => e.category)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-ink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6">
        {filteredEndpoints.map((category) => {
          const filteredRoutes = category.routes.filter(route => {
            if (!searchTerm) return true;
            return (
              route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
              route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              route.method.toLowerCase().includes(searchTerm.toLowerCase())
            );
          });

          if (filteredRoutes.length === 0) return null;

          return (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-ink-900">
                  {category.category}
                  <Badge variant="outline" className="ml-2">
                    {filteredRoutes.length} endpoint{filteredRoutes.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredRoutes.map((route, index) => (
                    <div
                      key={index}
                      className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${methodColors[route.method as keyof typeof methodColors] || 'bg-gray-100 text-gray-800'} font-mono text-xs`}
                          >
                            {route.method}
                          </Badge>
                          <code className="text-sm font-mono text-ink-700 bg-ink-100 px-2 py-1 rounded">
                            {route.path}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex gap-1 flex-wrap">
                            {route.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className={`text-xs ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                          {onTestEndpoint && !route.roles.includes('public') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onTestEndpoint(route.method, route.path)}
                              className="text-xs h-6"
                            >
                              Test
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-ink-600 mt-2">{route.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEndpoints.length === 0 && (
        <div className="text-center py-8 text-ink-500">
          No endpoints found matching your search criteria.
        </div>
      )}
    </div>
  );
};