import { useEffect, useState } from 'react'
import { Card, Spinner } from '@heroui/react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface JobProgressProps {
    jobId: string | null
    onComplete?: () => void
    type?: 'generation' | 'publishing'
}

interface JobStatus {
    jobId: string
    type: string
    state: 'waiting' | 'active' | 'completed' | 'failed'
    progress: number
    data: any
}

export function JobProgressTracker({ jobId, onComplete }: JobProgressProps) {
    const [status, setStatus] = useState<JobStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!jobId) return

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/content-generator/jobs/${jobId}/status`)
                if (!response.ok) throw new Error('Failed to fetch job status')

                const data = await response.json()
                setStatus(data)

                // Stop polling if job is complete or failed
                if (data.state === 'completed' || data.state === 'failed') {
                    clearInterval(pollInterval)
                    if (data.state === 'completed' && onComplete) {
                        onComplete()
                    }
                }
            } catch (err) {
                setError((err as Error).message)
                clearInterval(pollInterval)
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(pollInterval)
    }, [jobId, onComplete])

    if (!jobId) return null

    if (error) {
        return (
            <Card className="p-4 bg-red-50 border border-red-200">
                <div className="flex items-center gap-3 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <span>Error: {error}</span>
                </div>
            </Card>
        )
    }

    if (!status) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span>Loading job status...</span>
                </div>
            </Card>
        )
    }

    const getStatusColor = () => {
        switch (status.state) {
            case 'completed': return 'bg-green-500'
            case 'failed': return 'bg-red-500'
            case 'active': return 'bg-blue-500'
            default: return 'bg-gray-400'
        }
    }

    const getStatusIcon = () => {
        switch (status.state) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
            case 'failed': return <XCircle className="w-5 h-5 text-red-600" />
            case 'active': return <Spinner size="sm" />
            default: return <Clock className="w-5 h-5 text-gray-600" />
        }
    }

    const getStatusText = () => {
        const typeText = status.type === 'generation' ? 'Generating' : 'Publishing'
        switch (status.state) {
            case 'completed': return `${typeText} completed!`
            case 'failed': return `${typeText} failed`
            case 'active': return `${typeText} content...`
            case 'waiting': return `${typeText} queued...`
            default: return 'Processing...'
        }
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getStatusIcon()}
                        <div>
                            <h3 className="font-semibold">{getStatusText()}</h3>
                            <p className="text-sm text-gray-600">
                                {status.state === 'active' && `${Math.round(status.progress)}% complete`}
                                {status.state === 'completed' && 'All done!'}
                                {status.state === 'waiting' && 'Waiting to start...'}
                            </p>
                        </div>
                    </div>
                    <span className="text-sm text-gray-500 capitalize">{status.state}</span>
                </div>

                {/* Progress bar */}
                {(status.state === 'active' || status.state === 'waiting') && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${getStatusColor()}`}
                            style={{ width: `${Math.min(100, status.progress)}%` }}
                        />
                    </div>
                )}

                {/* Additional info */}
                {status.data && (
                    <div className="text-sm text-gray-600">
                        {status.data.totalRows && (
                            <p>Total items: {status.data.totalRows}</p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}
