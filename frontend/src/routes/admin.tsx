import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/auth-context'
import { Card } from '@heroui/react'
import { Building2, Users, Briefcase } from 'lucide-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.isSuperAdmin) {
      navigate({ to: '/projects' })
    }
  }, [user, navigate])

  if (!user?.isSuperAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage organizations, users, and system operations
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6">
          <div className="flex gap-1 p-2">
            <Link
              to="/admin/organizations"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              activeProps={{
                className: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold'
              }}
            >
              <Building2 className="w-5 h-5" />
              <span>Organizations</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              activeProps={{
                className: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold'
              }}
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </Link>
            <Link
              to="/admin/jobs"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              activeProps={{
                className: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold'
              }}
            >
              <Briefcase className="w-5 h-5" />
              <span>Jobs</span>
            </Link>
          </div>
        </Card>

        {/* Tab Content */}
        <Outlet />
      </div>
    </div>
  )
}
