import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminJobsApi } from '../../lib/admin-api'
import { Card, Button } from '@heroui/react'
import { Pause, Play, XCircle, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/admin/jobs')({
  component: AdminJobsPage,
})

function AdminJobsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', page, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 }
      if (statusFilter !== 'all') params.status = statusFilter

      const response = await adminJobsApi.getAll(params)
      return response.data
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (jobId: string) => adminJobsApi.pause(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job paused')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (jobId: string) => adminJobsApi.resume(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job resumed')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => adminJobsApi.cancel(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job cancelled')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => adminJobsApi.delete(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job deleted')
    },
  })

  const jobs = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
      processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Play },
      paused: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: Pause },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertCircle },
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: XCircle },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Jobs Management</h2>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Jobs</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Job ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Project</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Organization</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Progress</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {jobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-mono">{job.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{job.project?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{job.organization?.name || 'N/A'}</td>
                  <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    {job.totalContents > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(job.processedCount / job.totalContents) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs">
                          {job.processedCount}/{job.totalContents}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {(job.status === 'pending' || job.status === 'processing') && (
                        <Button
                          size="sm"
                          onClick={() => pauseMutation.mutate(job.id)}
                          className="bg-orange-100 text-orange-600"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => resumeMutation.mutate(job.id)}
                          className="bg-green-100 text-green-600"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (confirm('Cancel this job?')) {
                              cancelMutation.mutate(job.id)
                            }
                          }}
                          className="bg-red-100 text-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this job permanently?')) {
                            deleteMutation.mutate(job.id)
                          }
                        }}
                        className="bg-gray-100 text-gray-600"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing page {page} of {totalPages} ({total} total)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
