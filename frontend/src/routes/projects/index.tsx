import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { projectsApi, contentApi, type Project } from '../../lib/api'
import { Button, Card } from '@heroui/react'
import { Plus, Calendar, FileText, CheckCircle, Clock, AlertCircle, Activity, TrendingUp, Zap, BarChart3, Building2, Trash2 } from 'lucide-react'
import { ProjectCardSkeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useOrganization } from '../../contexts/organization-context'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/projects/')({
    component: ProjectsPage,
    beforeLoad: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            throw redirect({ to: '/login' })
        }
    },
})

function ProjectsPage() {
    const navigate = useNavigate()
    const { currentOrganization } = useOrganization()

    const { data: projects, isLoading, error } = useQuery({
        queryKey: ['projects', currentOrganization?.id],
        queryFn: async () => {
            const response = await projectsApi.getAll(currentOrganization?.id)
            return response.data
        },
        enabled: !!currentOrganization,
    })

    const { data: stats } = useQuery({
        queryKey: ['overall-stats', currentOrganization?.id],
        queryFn: async () => {
            const response = await contentApi.getOverallStats(currentOrganization?.id)
            return response.data
        },
        enabled: !!currentOrganization,
    })

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage your mass content marketing projects
                        </p>
                    </div>
                    <div className="h-11 w-40 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md p-6">
                    <p className="text-red-600">Error loading projects: {(error as Error).message}</p>
                </Card>
            </div>
        )
    }

    if (!currentOrganization) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Organization Selected</h2>
                    <p className="text-gray-600">Please select an organization to view projects.</p>
                </div>
            </div>
        )
    }

    const publishRate = stats && stats.totalContent > 0
        ? ((stats.publishedContent / stats.totalContent) * 100).toFixed(1)
        : 0

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Overview of your content marketing operations
                    </p>
                </div>
                <Link to="/projects/create">
                    <Button
                        size="lg"
                        className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Project
                    </Button>
                </Link>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Projects */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-blue-600 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProjects}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Total active projects</p>
                    </Card>

                    {/* Total Content */}
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-purple-600 rounded-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalContent}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Content Items</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Total generated content</p>
                    </Card>

                    {/* Published Content */}
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-green-600 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.publishedContent}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${publishRate}%` }}
                                />
                            </div>
                            <p className="text-xs font-semibold text-green-600">{publishRate}%</p>
                        </div>
                    </Card>

                    {/* Active Jobs */}
                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-orange-600 rounded-lg">
                                <Activity className="w-6 h-6 text-white animate-pulse" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.activeJobs}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {stats.completedJobsToday} completed today
                        </p>
                    </Card>
                </div>
            )}

            {/* Additional Stats Row */}
            {stats && stats.totalContent > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pendingContent}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Publication</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.failedContent}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Failed Items</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalContent > 0 ? Math.round(stats.totalContent / (stats.totalProjects || 1)) : 0}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Content/Project</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Projects Section */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">Your Projects</h2>
                <p className="text-gray-600 dark:text-gray-400">Click on a project to view and manage its content</p>
            </div>

            {!projects || projects.length === 0 ? (
                <EmptyState
                    icon={<Zap className="w-12 h-12 text-blue-500" />}
                    title="No projects yet"
                    description="Create your first project to start generating SEO-optimized content at scale"
                    action={{
                        label: 'Create Project',
                        onClick: () => navigate({ to: '/projects/create' })
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: Project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ProjectCard({ project }: { project: Project }) {
    const queryClient = useQueryClient()

    // Helper function to format stats with 999+ for large numbers
    const formatStat = (value: number | undefined): string => {
        if (!value && value !== 0) return '0'
        return value > 999 ? '999+' : String(value)
    }

    const { data: stats } = useQuery({
        queryKey: ['project-stats', project.id],
        queryFn: async () => {
            const response = await projectsApi.getStats(project.id)
            return {
                total: response.data.totalContents,
                published: response.data.publishedContents,
                pending: response.data.pendingContents,
            }
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return await projectsApi.delete(project.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['overall-stats'] })
            toast.success('Project deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete project')
        },
    })

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (window.confirm(`Are you sure you want to delete "${project.name}"? This will delete all generated content. This action cannot be undone.`)) {
            deleteMutation.mutate()
        }
    }

    return (
        <div className="relative">
            <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                <Card className="h-full p-6 hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-blue-400">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold line-clamp-1 flex-1">{project.name}</h3>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete project"
                            >
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    </div>

                    {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                            {project.description}
                        </p>
                    )}

                    {stats && stats.total > 0 && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-semibold text-blue-600">
                                    {((stats.published / stats.total) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(stats.published / stats.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatStat(stats?.total)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-lg font-bold text-green-600">{formatStat(stats?.published)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Live</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-lg font-bold text-yellow-600">{formatStat(stats?.pending)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Queue</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                            {new Date(project.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </Card>
            </Link>
        </div>
    )
}
