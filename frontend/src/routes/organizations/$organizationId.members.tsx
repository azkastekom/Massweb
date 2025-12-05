import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../lib/api';
import { Card, Button } from '@heroui/react';
import { ArrowLeft, UserPlus, Trash2, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/organizations/$organizationId/members')({
  component: OrganizationMembersPage,
  beforeLoad: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: 'ORG_ADMIN' | 'ORG_MEMBER';
  user: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

function OrganizationMembersPage() {
  const { organizationId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'ORG_ADMIN' | 'ORG_MEMBER'>('ORG_MEMBER');

  // Fetch organization details including members
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const response = await organizationsApi.getById(organizationId);
      return response.data;
    },
  });

  // Extract members from organization
  const members = organization?.members || [];

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const response = await organizationsApi.addMember(organizationId, {
        email: newMemberEmail,
        role: newMemberRole,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast.success('Member added successfully');
      setShowAddForm(false);
      setNewMemberEmail('');
      setNewMemberRole('ORG_MEMBER');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add member');
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await organizationsApi.updateMemberRole(organizationId, userId, role);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast.success('Member role updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update member role');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await organizationsApi.removeMember(organizationId, userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast.success('Member removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    addMemberMutation.mutate();
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName} from this organization?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/organizations/${organizationId}/settings`} className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 mt-1">{organization?.name}</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Add New Member</h3>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as 'ORG_ADMIN' | 'ORG_MEMBER')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ORG_MEMBER">Member</option>
                <option value="ORG_ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewMemberEmail('');
                  setNewMemberRole('ORG_MEMBER');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Members List */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Current Members</h3>

        {members && members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Role Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${member.role === 'ORG_ADMIN'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-200 text-gray-700'
                    }`}>
                    {member.role === 'ORG_ADMIN' && <Shield className="w-3 h-3" />}
                    <span>{member.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}</span>
                  </div>

                  {/* Role Toggle */}
                  {member.userId !== organization?.ownerId && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => updateRoleMutation.mutate({
                          userId: member.userId,
                          role: e.target.value
                        })}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="ORG_MEMBER">Member</option>
                        <option value="ORG_ADMIN">Admin</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.user.name)}
                        disabled={removeMemberMutation.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {member.userId === organization?.ownerId && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Owner
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No members found. Add members to get started.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
