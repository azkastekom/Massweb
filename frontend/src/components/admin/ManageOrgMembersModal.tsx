import { Button, Input, Card } from '@heroui/react'
import { useState } from 'react'
import { X, Search, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminUsersApi } from '../../lib/admin-api'

interface ManageOrgMembersModalProps {
    isOpen: boolean
    onClose: () => void
    organizationId: string
    organizationName: string
    onAdd: (email: string, role: string) => Promise<void>
}

export function ManageOrgMembersModal({ isOpen, onClose, organizationId, organizationName, onAdd }: ManageOrgMembersModalProps) {
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [role, setRole] = useState<'org_admin' | 'org_member'>('org_member')
    const [isLoading, setIsLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    // Search users
    const { data: usersData } = useQuery({
        queryKey: ['search-users', search],
        queryFn: async () => {
            if (!search || search.length < 2) return { data: [] }
            const response = await adminUsersApi.getAll({ search, limit: 10 })
            return response.data
        },
        enabled: !!search && search.length >= 2,
    })

    const users = usersData?.data || []

    const handleAdd = async () => {
        if (!selectedUser) return

        setIsLoading(true)
        try {
            await onAdd(selectedUser.email, role)
            setSelectedUser(null)
            setSearch('')
            setRole('org_member')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectUser = (user: any) => {
        setSelectedUser(user)
        setSearch(user.email)
        setShowDropdown(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Add Member to {organizationName}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium mb-2">Search User</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setShowDropdown(true)
                                    setSelectedUser(null)
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Search by email or name..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            />
                        </div>

                        {/* Dropdown Results */}
                        {showDropdown && search.length >= 2 && users.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {users.map((user: any) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{user.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showDropdown && search.length >= 2 && users.length === 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                                No users found
                            </div>
                        )}
                    </div>

                    {selectedUser && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <div>
                                    <div className="font-medium text-sm">{selectedUser.name}</div>
                                    <div className="text-xs text-gray-600">{selectedUser.email}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                        >
                            <option value="org_member">Member</option>
                            <option value="org_admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 mt-6 justify-end">
                    <Button onClick={onClose} variant="ghost">
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} className="bg-blue-600 text-white" isLoading={isLoading} isDisabled={!selectedUser}>
                        Add Member
                    </Button>
                </div>
            </Card>

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-5"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    )
}
