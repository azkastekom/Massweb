import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@heroui/react';
import { Book, Key, Code as CodeIcon, FileCode } from 'lucide-react';

export const Route = createFileRoute('/projects/$projectId_/api-docs')({
  component: ProjectApiDocsPage,
});

export function ProjectApiDocsPage() {
  const { projectId } = Route.useParams();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Book className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
            <p className="text-gray-600 mt-1">Programmatic access to your generated content</p>
          </div>
        </div>

        {/* Authentication */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Authentication</h2>
          </div>
          <div className="space-y-4">
            <p>All API requests require an API key. Include your API key in the <code className="px-2 py-1 bg-gray-100 rounded">X-API-Key</code> header:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              X-API-Key: your-api-key-here
            </pre>
            <p className="text-sm text-gray-600">
              You can create and manage API keys in your organization settings.
            </p>
          </div>
        </Card>

        {/* Endpoints */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCode className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Endpoints</h2>
          </div>
          <div className="space-y-6">
            {/* Get Project Contents */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">GET</span>
                <code className="text-sm">/public/projects/{"{"}"projectId"{"}"}/contents</code>
              </div>
              <p className="text-sm">Get all contents for a project with pagination and filtering.</p>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Query Parameters:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li><code className="px-1 bg-gray-100 rounded text-xs">status</code> - Filter by status (published, pending, failed)</li>
                  <li><code className="px-1 bg-gray-100 rounded text-xs">page</code> - Page number (default: 1)</li>
                  <li><code className="px-1 bg-gray-100 rounded text-xs">limit</code> - Items per page (default: 50, max: 100)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Response:</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {`{
  "data": [
    {
      "id": "...",
      "title": "...",
      "content": "...",
      "slug": "...",
      "publishStatus": "published",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2
}`}
                </pre>
              </div>
            </div>

            <hr />

            {/* Get Single Content */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">GET</span>
                <code className="text-sm">/public/contents/{"{"}"contentId"{"}"}</code>
              </div>
              <p className="text-sm">Get a single content item by ID.</p>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Response:</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {`{
  "id": "...",
  "title": "...",
  "content": "...",
  "slug": "...",
  "publishStatus": "published",
  "createdAt": "2024-01-01T00:00:00.000Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        </Card>

        {/* Code Examples */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CodeIcon className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Code Examples</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">JavaScript (Fetch API)</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`const fetchContents = async () => {
  const response = await fetch(
    '${apiUrl}/public/projects/${projectId}/contents?status=published&page=1&limit=10',
    {
      headers: {
        'X-API-Key': 'your-api-key-here'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
};

fetchContents();`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Python (Requests)</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`import requests

headers = {
    'X-API-Key': 'your-api-key-here'
}

params = {
    'status': 'published',
    'page': 1,
    'limit': 10
}

response = requests.get(
    '${apiUrl}/public/projects/${projectId}/contents',
    headers=headers,
    params=params
)

data = response.json()
print(data)`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">cURL</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`curl -H "X-API-Key: your-api-key-here" \\
  "${apiUrl}/public/projects/${projectId}/contents?status=published&page=1&limit=10"`}
              </pre>
            </div>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="p-6 bg-purple-50 border border-purple-200">
          <div className="space-y-3">
            <h3 className="font-semibold text-purple-900">💡 Best Practices</h3>
            <ul className="text-sm text-purple-800 space-y-2 list-disc list-inside">
              <li>Cache responses when possible to reduce API calls</li>
              <li>Use pagination with appropriate limit values</li>
              <li>Filter by status to get only the content you need</li>
              <li>Implement error handling for rate limits and network issues</li>
              <li>Keep your API keys secure - never commit them to version control</li>
              <li>Use environment variables to store API keys in your applications</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
