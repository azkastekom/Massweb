import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminOrganizationsApi } from '../../lib/admin-api'
import { Card, Button, Input } from '@heroui/react'
import { Search, Edit, Users as UsersIcon, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { EditOrganizationModal } from '../../components/admin/EditOrganizationModal'
import { ManageOrgMembersModal } from '../../components/admin/ManageOrgMembersModal'

export const Route = createFileRoute('/admin/organizations')({
  component: AdminOrganizationsPage,
})

function AdminOrganizationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-organizations', page, search],
    queryFn: async () => {
      const response = await adminOrganizationsApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
      })
      return response.data
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (org: any) => {
      return await adminOrganizationsApi.update(org.id, {
        isActive: !org.isActive,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      toast.success('Organization status updated')
    },
    onError: () => {
      toast.error('Failed to update organization')
    },
  })

  const updateOrgMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      return await adminOrganizationsApi.update(data.id, { name: data.name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      toast.success('Organization updated successfully')
    },
    onError: () => {
      toast.error('Failed to update organization')
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async (data: { orgId: string; email: string; role: string }) => {
      return await adminOrganizationsApi.addMember(data.orgId, { email: data.email, role: data.role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      toast.success('Member added successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add member')
    },
  })

  const organizations = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Organizations Management</h2>

          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No organizations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Slug</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Members</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Projects</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {organizations.map((org: any) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">{org.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{org.slug}</td>
                    <td className="px-4 py-3 text-sm">{org.memberCount}</td>
                    <td className="px-4 py-3 text-sm">{org.projectCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActiveMutation.mutate(org)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${org.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {org.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrg(org)
                            setShowEditModal(true)
                          }}
                          className="bg-blue-100 text-blue-600 hover:bg-blue-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrg(org)
                            setShowMembersModal(true)
                          }}
                          className="bg-purple-100 text-purple-600 hover:bg-purple-200"
                        >
                          <UsersIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Showing page {page} of {totalPages} ({total} total)
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                isDisabled={page === 1}
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                isDisabled={page === totalPages}
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {selectedOrg && (
        <EditOrganizationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOrg(null)
          }}
          organization={selectedOrg}
          onSave={async (data) => {
            await updateOrgMutation.mutateAsync({ id: selectedOrg.id, ...data })
          }}
        />
      )}

      {/* Manage Members Modal */}
      {selectedOrg && (
        <ManageOrgMembersModal
          isOpen={showMembersModal}
          onClose={() => {
            setShowMembersModal(false)
            setSelectedOrg(null)
          }}
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          onAdd={async (email, role) => {
            await addMemberMutation.mutateAsync({ orgId: selectedOrg.id, email, role })
          }}
        />
      )}
    </>
  )
}
