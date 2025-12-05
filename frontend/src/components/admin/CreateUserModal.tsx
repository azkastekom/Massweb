import { Button, Input, Card } from '@heroui/react'
import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateUserModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: { email: string; password: string; name: string; isSuperAdmin: boolean }) => Promise<void>
}

export function CreateUserModal({ isOpen, onClose, onSave }: CreateUserModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        isSuperAdmin: false,
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await onSave(formData)
            setFormData({ email: '', password: '', name: '', isSuperAdmin: false })
            onClose()
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Create New User</h3>
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
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        fullWidth
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password (min 8 characters)"
                        fullWidth
                        required
                    />
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <input
                            type="checkbox"
                            id="superadmin"
                            checked={formData.isSuperAdmin}
                            onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="superadmin" className="text-sm cursor-pointer">
                            Make this user a Super Admin
                        </label>
                    </div>
                </div>
                <div className="flex gap-2 mt-6 justify-end">
                    <Button onClick={onClose} variant="ghost">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 text-white" isLoading={isLoading}>
                        Create User
                    </Button>
                </div>
            </Card>
        </div>
    )
}
