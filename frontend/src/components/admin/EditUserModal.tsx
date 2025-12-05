import { Button, Input, Card } from '@heroui/react'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface EditUserModalProps {
    isOpen: boolean
    onClose: () => void
    user: any
    onSave: (data: { name?: string; email?: string }) => Promise<void>
}

export function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
            })
        }
    }, [user])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await onSave(formData)
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
                    <h3 className="text-xl font-bold">Edit User</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        fullWidth
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
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
