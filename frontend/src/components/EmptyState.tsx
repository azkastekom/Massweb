import { FileQuestion } from 'lucide-react'
import { Button } from '@heroui/react'

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                {icon || <FileQuestion className="w-8 h-8 text-gray-400" />}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {description}
            </p>
            {action && (
                <Button
                    onClick={action.onClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {action.label}
                </Button>
            )}
        </div>
    )
}
