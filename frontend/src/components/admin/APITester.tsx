import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

interface APIResponse {
  status: number;
  statusText: string;
  data: unknown;
  headers: Record<string, string>;
  duration: number;
}


const methodColors = {
  GET: 'bg-green-100 text-green-800 border-green-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-200'
};

const statusColors = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800'
};

interface APITesterProps {
  initialMethod?: string;
  initialPath?: string;
}

export const APITester = ({ initialMethod, initialPath }: APITesterProps) => {
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('/admin/users');
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle initial values from props
  useEffect(() => {
    if (initialMethod && initialPath) {
      setMethod(initialMethod);
      setUrl(initialPath);
      setRequestBody('');
      setResponse(null);
      setError(null);
    }
  }, [initialMethod, initialPath]);

  const makeRequest = async () => {
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      let requestData: unknown = undefined;
      
      // Parse request body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
        try {
          requestData = JSON.parse(requestBody);
        } catch {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      // Make the API request
      let apiResponse;
      const cleanUrl = url.startsWith('/') ? url.substring(1) : url;

      switch (method) {
        case 'GET':
          apiResponse = await api.get(cleanUrl);
          break;
        case 'POST':
          apiResponse = await api.post(cleanUrl, requestData);
          break;
        case 'PUT':
          apiResponse = await api.put(cleanUrl, requestData);
          break;
        case 'DELETE':
          apiResponse = await api.delete(cleanUrl);
          break;
        case 'PATCH':
          apiResponse = await api.patch(cleanUrl, requestData);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const duration = Date.now() - startTime;

      setResponse({
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        data: apiResponse.data,
        headers: Object.fromEntries(
          Object.entries(apiResponse.headers || {}).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : String(value || '')
          ])
        ),
        duration
      });

    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      
      const errorWithResponse = err as { response?: { status: number; statusText: string; data: unknown; headers: Record<string, unknown> } };
      const errorWithMessage = err as { message?: string };
      
      if (errorWithResponse.response) {
        // Server responded with error status
        setResponse({
          status: errorWithResponse.response.status,
          statusText: errorWithResponse.response.statusText,
          data: errorWithResponse.response.data,
          headers: Object.fromEntries(
            Object.entries(errorWithResponse.response.headers || {}).map(([key, value]) => [
              key,
              typeof value === 'string' ? value : String(value || '')
            ])
          ),
          duration
        });
      } else {
        // Network error or other issue
        setError(errorWithMessage.message || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return statusColors.success;
    if (status >= 400) return statusColors.error;
    return statusColors.warning;
  };

  const formatJSON = (obj: unknown): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const quickFillEndpoint = (endpoint: string, method: string = 'GET', body?: unknown) => {
    setUrl(endpoint);
    setMethod(method);
    if (body) {
      setRequestBody(JSON.stringify(body, null, 2));
    } else {
      setRequestBody('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick endpoint buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Test Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickFillEndpoint('/admin/users')}
            >
              GET Users
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickFillEndpoint('/admin/api-endpoints')}
            >
              GET API Endpoints
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickFillEndpoint('/auth/me')}
            >
              GET Profile
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickFillEndpoint('/courses')}
            >
              GET Courses
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickFillEndpoint('/assignments')}
            >
              GET Assignments
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => quickFillEndpoint('/analytics/course-overview/123')}
            >
              GET Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Request Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 border border-ink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <div className="flex-1 flex gap-2">
              <span className="flex items-center px-3 py-2 bg-ink-100 border border-ink-200 rounded-l-md text-ink-600 text-sm">
                /api
              </span>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="endpoint path (e.g., admin/users)"
                className="flex-1 rounded-l-none border-l-0"
              />
            </div>
          </div>

          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Request Body (JSON)
              </label>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          <Button 
            onClick={makeRequest} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending Request...' : `Send ${method} Request`}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response display */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              Response
              <Badge className={`${getStatusColor(response.status)}`}>
                {response.status} {response.statusText}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {response.duration}ms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Request summary */}
            <div className="p-3 bg-ink-50 rounded-md">
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <Badge className={`${methodColors[method as keyof typeof methodColors]} text-xs`}>
                  {method}
                </Badge>
                <span className="font-mono">/api{url}</span>
              </div>
            </div>

            {/* Response headers */}
            <div>
              <h4 className="font-medium text-ink-900 mb-2">Headers</h4>
              <div className="bg-ink-50 rounded-md p-3">
                <pre className="text-xs font-mono text-ink-600 overflow-x-auto">
                  {formatJSON(response.headers)}
                </pre>
              </div>
            </div>

            {/* Response body */}
            <div>
              <h4 className="font-medium text-ink-900 mb-2">Response Body</h4>
              <div className="bg-ink-50 rounded-md p-3 max-h-96 overflow-auto">
                <pre className="text-sm font-mono text-ink-700">
                  {formatJSON(response.data)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};