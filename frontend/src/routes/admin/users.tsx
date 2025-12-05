import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminUsersApi } from '../../lib/admin-api'
import { Card, Button, Input } from '@heroui/react'
import { Search, Edit, UserPlus, CheckCircle, XCircle, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { CreateUserModal } from '../../components/admin/CreateUserModal'
import { EditUserModal } from '../../components/admin/EditUserModal'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'superadmin'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, filter],
    queryFn: async () => {
      const params: any = { page, limit: 20 }
      if (search) params.search = search
      if (filter === 'active') params.isActive = true
      if (filter === 'inactive') params.isActive = false
      if (filter === 'superadmin') params.isSuperAdmin = true

      const response = await adminUsersApi.getAll(params)
      return response.data
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (user: any) => {
      return await adminUsersApi.update(user.id, {
        isActive: !user.isActive,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User status updated')
    },
    onError: () => {
      toast.error('Failed to update user')
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; isSuperAdmin: boolean }) => {
      return await adminUsersApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User created successfully')
    },
    onError: () => {
      toast.error('Failed to create user')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; email?: string }) => {
      return await adminUsersApi.update(data.id, { name: data.name, email: data.email })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated successfully')
    },
    onError: () => {
      toast.error('Failed to update user')
    },
  })

  const users = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Users Management</h2>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="superadmin">Super Admins</option>
            </select>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Organizations</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.organizationCount}</td>
                    <td className="px-4 py-3">
                      {user.isSuperAdmin && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                          <Shield className="w-3 h-3" />
                          Super Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActiveMutation.mutate(user)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {user.isActive ? (
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
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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

      {/* Create Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={async (data) => {
          await createUserMutation.mutateAsync(data)
        }}
      />

      {/* Edit Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onSave={async (data) => {
            await updateUserMutation.mutateAsync({ id: selectedUser.id, ...data })
          }}
        />
      )}
    </>
  )
}
