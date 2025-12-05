import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, projectsApi } from '../../lib/api';
import { Card, Button } from '@heroui/react';
import { ArrowLeft, Trash2, Building2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganization } from '../../contexts/organization-context';
import { useAuth } from '../../contexts/auth-context';

export const Route = createFileRoute('/organizations/$organizationId/settings')({
  component: OrganizationSettingsPage,
  beforeLoad: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

function OrganizationSettingsPage() {
  const { organizationId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrganization, switchOrganization, organizations } = useOrganization();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [organizationName, setOrganizationName] = useState('');

  // Fetch organization details
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const response = await organizationsApi.getById(organizationId);
      setOrganizationName(response.data.name);
      return response.data;
    },
  });

  // Check if organization has projects
  const { data: projects } = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      const response = await projectsApi.getAll(organizationId);
      return response.data;
    },
  });

  const isOwner = user?.id === organization?.ownerId;
  const hasProjects = projects && projects.length > 0;

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return await organizationsApi.update(organizationId, { name: organizationName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update organization');
    },
  });

  // Delete organization mutation (owner only)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await organizationsApi.delete(organizationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted successfully');

      // Switch to another organization if available
      const otherOrgs = organizations.filter(o => o.id !== organizationId);
      if (otherOrgs.length > 0) {
        switchOrganization(otherOrgs[0].id);
      }

      navigate({ to: '/projects' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    },
  });

  // Leave organization mutation (non-owners)
  const leaveMutation = useMutation({
    mutationFn: async () => {
      return await organizationsApi.leaveOrganization(organizationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Left organization successfully');

      // Switch to another organization if available
      const otherOrgs = organizations.filter(o => o.id !== organizationId);
      if (otherOrgs.length > 0) {
        switchOrganization(otherOrgs[0].id);
      }

      navigate({ to: '/projects' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to leave organization');
    },
  });

  const handleDelete = () => {
    if (hasProjects) {
      toast.error('Cannot delete organization with existing projects. Delete all projects first or transfer ownership.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${organization?.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleLeave = () => {
    if (window.confirm(`Are you sure you want to leave "${organization?.name}"?`)) {
      leaveMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Organization not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
      </div>

      {/* Organization Details */}
      <Card className="p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Organization Details</h2>
        </div>

        <div className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            {isEditing ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Organization Name"
                />
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !organizationName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setOrganizationName(organization.name);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{organization.name}</span>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Organization Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Slug
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              {organization.slug}
            </div>
            <p className="text-xs text-gray-500 mt-1">This is a unique identifier for your organization</p>
          </div>

          {/* Created Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Created
            </label>
            <div className="text-gray-600">
              {new Date(organization.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 bg-red-50">
        <h3 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            {isOwner ? (
              <>
                <p className="text-sm font-medium text-red-900">Delete Organization</p>
                <p className="text-xs text-red-700 mt-1">
                  {hasProjects
                    ? 'Cannot delete organization with existing projects. Delete all projects first.'
                    : 'Once deleted, all data will be permanently removed. This action cannot be undone.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-red-900">Leave Organization</p>
                <p className="text-xs text-red-700 mt-1">
                  You will lose access to all projects and data in this organization.
                </p>
              </>
            )}
          </div>
          {isOwner ? (
            <Button
              onClick={handleDelete}
              isDisabled={deleteMutation.isPending || hasProjects}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</span>
            </Button>
          ) : (
            <Button
              onClick={handleLeave}
              isDisabled={leaveMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <LogOut className="w-4 h-4" />
              <span>{leaveMutation.isPending ? 'Leaving...' : 'Leave'}</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Members Link */}
      <div className="mt-6">
        <Link
          to={`/organizations/${organizationId}/members`}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Manage Members
        </Link>
      </div>
    </div>
  );
}
