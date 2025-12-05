import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../lib/api';
import { Card, Button } from '@heroui/react';
import { Building2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/organizations/create')({
  component: CreateOrganizationPage,
  beforeLoad: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

function CreateOrganizationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      return await organizationsApi.create({ name });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created successfully');
      navigate({ to: `/organizations/${response.data.id}/settings` });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Organization name is required');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate({ to: '/projects' })}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-gray-600 mt-2">
          Organizations help you manage projects and team members.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Organization Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Company"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a name that represents your team or company
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Organization'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate({ to: '/projects' })}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
