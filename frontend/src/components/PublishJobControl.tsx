import { useState, useEffect } from 'react'
import { Button, Card } from '@heroui/react'
import { Play, Clock, Zap, Pause, RotateCcw, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi } from '../lib/api'
import toast from 'react-hot-toast'

interface PublishJobControlProps {
    projectId: string
    totalContents: number
    pendingContents: number
}

export function PublishJobControl({ projectId, totalContents, pendingContents }: PublishJobControlProps) {
    const [delaySeconds, setDelaySeconds] = useState(5)
    const [jobId, setJobId] = useState<string | null>(null)
    const [jobStatus, setJobStatus] = useState<any>(null)
    const queryClient = useQueryClient()

    // Check for active job on mount
    useEffect(() => {
        const checkActiveJob = async () => {
            try {
                const response = await contentApi.getActivePublishJob(projectId)
                if (response.data) {
                    setJobId(response.data.id)
                    setJobStatus(response.data)
                }
            } catch (error) {
                console.error('Failed to check for active job:', error)
            }
        }
        checkActiveJob()
    }, [projectId])

    const startPublishMutation = useMutation({
        mutationFn: async () => {
            const response = await contentApi.publishAsync(projectId, delaySeconds)
            return response.data
        },
        onSuccess: (data) => {
            setJobId(data.jobId)
            toast.success('Publishing started in background!')
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to start publishing'
            toast.error(errorMessage)
        },
    })

    const pauseMutation = useMutation({
        mutationFn: async () => {
            if (!jobId) return
            await contentApi.pausePublishJob(jobId)
        },
        onSuccess: () => {
            toast.success('Publishing paused')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to pause')
        },
    })

    const resumeMutation = useMutation({
        mutationFn: async () => {
            if (!jobId) return
            await contentApi.resumePublishJob(jobId)
        },
        onSuccess: () => {
            toast.success('Publishing resumed')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to resume')
        },
    })

    const cancelMutation = useMutation({
        mutationFn: async () => {
            if (!jobId) return
            await contentApi.cancelPublishJob(jobId)
        },
        onSuccess: () => {
            toast.success('Publishing cancelled')
            setJobId(null)
            setJobStatus(null)
            queryClient.invalidateQueries({ queryKey: ['contents', projectId] })
            queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to cancel')
        },
    })

    // Poll for job status
    useEffect(() => {
        if (!jobId) return

        const interval = setInterval(async () => {
            try {
                const response = await contentApi.getPublishJobStatus(jobId)
                const status = response.data
                setJobStatus(status)

                if (status.status === 'completed') {
                    clearInterval(interval)
                    toast.success(`Successfully published ${status.totalContents} items!`)
                    queryClient.invalidateQueries({ queryKey: ['contents', projectId] })
                    queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] })
                    setJobId(null)
                    setJobStatus(null)
                } else if (status.status === 'failed' || status.status === 'cancelled') {
                    clearInterval(interval)
                    if (status.status === 'failed') {
                        toast.error(`Publishing failed: ${status.errorMessage || 'Unknown error'}`)
                    }
                    setJobId(null)
                    setJobStatus(null)
                }
            } catch (error) {
                console.error('Failed to fetch job status:', error)
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(interval)
    }, [jobId, projectId, queryClient])

    const handleStart = () => {
        if (pendingContents === 0) {
            toast.error('No pending content to publish')
            return
        }
        startPublishMutation.mutate()
    }

    // Show progress if job is running
    if (jobId && jobStatus) {
        const progress = jobStatus.totalContents > 0
            ? (jobStatus.processedCount / jobStatus.totalContents) * 100
            : 0

        const isPaused = jobStatus.status === 'paused'
        const isProcessing = jobStatus.status === 'processing' || jobStatus.status === 'pending'

        return (
            <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className={`w-6 h-6 text-yellow-500 ${!isPaused ? 'animate-pulse' : ''}`} />
                    {isPaused ? 'Publishing Paused' : 'Publishing Content...'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">
                                Progress: {jobStatus.processedCount} / {jobStatus.totalContents}
                            </span>
                            <span className="font-semibold text-blue-600">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ease-out ${isPaused ? 'bg-yellow-500' : 'bg-blue-600'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className={`p-3 rounded-lg ${isPaused ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <p className={`text-sm ${isPaused ? 'text-yellow-800 dark:text-yellow-200' : 'text-blue-800 dark:text-blue-200'}`}>
                            ⏱️ Publishing with {jobStatus.delaySeconds}s delay between items
                        </p>
                        <p className={`text-xs mt-1 ${isPaused ? 'text-yellow-600 dark:text-yellow-300' : 'text-blue-600 dark:text-blue-300'}`}>
                            Status: {jobStatus.status}
                        </p>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-2">
                        {isPaused ? (
                            <Button
                                size="lg"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => resumeMutation.mutate()}
                                isDisabled={resumeMutation.isPending}
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                {resumeMutation.isPending ? 'Resuming...' : 'Resume'}
                            </Button>
                        ) : isProcessing ? (
                            <Button
                                size="lg"
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                                onClick={() => pauseMutation.mutate()}
                                isDisabled={pauseMutation.isPending}
                            >
                                <Pause className="w-5 h-5 mr-2" />
                                {pauseMutation.isPending ? 'Pausing...' : 'Pause'}
                            </Button>
                        ) : null}

                        <Button
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => cancelMutation.mutate()}
                            isDisabled={cancelMutation.isPending}
                        >
                            <X className="w-5 h-5 mr-2" />
                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Publish Content
            </h3>

            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        Publish all pending content in the background. The process will continue even if you navigate away or refresh the page.
                    </p>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Delay between items (seconds)</label>
                            <input
                                type="number"
                                min="0"
                                max="3600"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={delaySeconds}
                                onChange={(e) => setDelaySeconds(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                0 = publish immediately, recommended: 3-10 seconds
                            </p>
                        </div>

                        <div className="text-center">
                            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">
                                Est. time:<br />
                                ~{Math.ceil((pendingContents * delaySeconds) / 60)} min
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            📊 <strong>{pendingContents}</strong> of <strong>{totalContents}</strong> items pending publication
                        </p>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleStart}
                    isDisabled={startPublishMutation.isPending || pendingContents === 0}
                >
                    <Play className="w-5 h-5 mr-2" />
                    {startPublishMutation.isPending ? 'Starting...' : 'Start Publishing'}
                </Button>
            </div>
        </Card>
    )
}
