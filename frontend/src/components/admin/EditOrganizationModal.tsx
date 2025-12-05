import { Button, Input, Card } from '@heroui/react'
import { useState } from 'react'
import { X } from 'lucide-react'

interface EditOrganizationModalProps {
    isOpen: boolean
    onClose: () => void
    organization: any
    onSave: (data: { name: string }) => Promise<void>
}

export function EditOrganizationModal({ isOpen, onClose, organization, onSave }: EditOrganizationModalProps) {
    const [name, setName] = useState(organization?.name || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await onSave({ name })
            onClose()
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit Organization</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <Input
                        label="Organization Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter organization name"
                        fullWidth
                    />
                </div>
                <div className="flex gap-2 mt-6 justify-end">
                    <Button onClick={onClose} variant="ghost">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 text-white" isLoading={isLoading}>
                        Save Changes
                    </Button>
                </div>
            </Card>
        </div>
    )
}
