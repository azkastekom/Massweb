import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, Button } from '@heroui/react';
import { Plus, Trash2, Key, RefreshCw } from 'lucide-react';
import { CreateApiKeyModal } from '../../components/CreateApiKeyModal';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/organizations/$organizationId/api-keys')({
  component: ApiKeysPage,
});

interface ApiKey {
  id: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

export function ApiKeysPage() {
  const { organizationId } = Route.useParams();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshedKey, setRefreshedKey] = useState<string | null>(null);
  const [refreshedKeyName, setRefreshedKeyName] = useState<string>('');

  const loadApiKeys = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/api-keys/organization/${organizationId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || 'Failed to load API keys';

        if (response.status === 401) {
          toast.error('Unauthorized. Please log in again.');
        } else if (response.status === 403) {
          toast.error('You do not have permission to view API keys for this organization');
        } else if (response.status === 404) {
          toast.error('Organization not found');
        } else {
          toast.error(message);
        }
        return;
      }

      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      toast.error('Network error. Please check your connection.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [organizationId]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? It will no longer work.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/api-keys/${id}/revoke`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || 'Failed to revoke API key';

        if (response.status === 404) {
          toast.error('API key not found or already deleted');
        } else if (response.status === 403) {
          toast.error('You do not have permission to revoke this API key');
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success('API key revoked successfully');
      loadApiKeys();
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || 'Failed to delete API key';

        if (response.status === 404) {
          toast.error('API key not found or already deleted');
        } else if (response.status === 403) {
          toast.error('You do not have permission to delete this API key');
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success('API key deleted successfully');
      loadApiKeys();
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error(error);
    }
  };

  const handleRefresh = async (id: string, name: string) => {
    if (!confirm('Are you sure you want to refresh this API key? The old key will stop working immediately.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/api-keys/${id}/refresh`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || 'Failed to refresh API key';

        if (response.status === 404) {
          toast.error('API key not found or already deleted');
        } else if (response.status === 403) {
          toast.error('You do not have permission to refresh this API key');
        } else {
          toast.error(message);
        }
        return;
      }

      const data = await response.json();
      setRefreshedKey(data.plainKey);
      setRefreshedKeyName(name);
      toast.success('API key refreshed successfully');
      loadApiKeys();
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-gray-600 mt-2">Manage API keys for programmatic access to your content</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onPress={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Your API Keys</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No API keys yet. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NAME</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">STATUS</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">EXPIRATION</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LAST USED</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CREATED</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-gray-500">
                            Created by {key.createdBy?.name || 'Unknown'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${key.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {key.expiresAt ? (
                          new Date(key.expiresAt) < new Date() ? (
                            <span className="text-red-600 font-medium">Expired</span>
                          ) : (
                            <span className="text-gray-600">{new Date(key.expiresAt).toLocaleDateString()}</span>
                          )
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {key.isActive && (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700"
                                onPress={() => handleRefresh(key.id, key.name)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-orange-100 hover:bg-orange-200 text-orange-700"
                                onPress={() => handleRevoke(key.id)}
                              >
                                Revoke
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            className="bg-red-100 hover:bg-red-200 text-red-700"
                            onPress={() => handleDelete(key.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-blue-50 border border-blue-200">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">🔒 Security Best Practices</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Keep your API keys secure and never share them publicly</li>
              <li>Use different API keys for different environments (development, production)</li>
              <li>Refresh API keys immediately if they are compromised</li>
              <li>Set expiration dates for better security and compliance</li>
              <li>Regularly rotate your API keys using the refresh button</li>
              <li>Monitor API key usage through the "Last Used" column</li>
            </ul>
          </div>
        </Card>
      </div>

      <CreateApiKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadApiKeys}
        organizationId={organizationId}
      />

      {/* Refreshed Key Modal */}
      {refreshedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setRefreshedKey(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">API Key Refreshed</h2>
              <button onClick={() => setRefreshedKey(null)} className="p-1 hover:bg-gray-100 rounded">
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-semibold mb-2">
                    ⚠️ Important: Save this new key now!
                  </p>
                  <p className="text-sm text-orange-700">
                    The old key for "{refreshedKeyName}" has been invalidated. Save this new key before closing.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New API Key
                  </label>
                  <div className="relative">
                    <input
                      value={refreshedKey}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm pr-12 bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(refreshedKey);
                        toast.success('New API key copied to clipboard');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onPress={() => setRefreshedKey(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
