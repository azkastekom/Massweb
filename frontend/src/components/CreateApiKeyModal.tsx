import { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { Copy, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    organizationId: string;
}

export function CreateApiKeyModal({ isOpen, onClose, onCreated, organizationId }: CreateApiKeyModalProps) {
    const [name, setName] = useState('');
    const [expiryDays, setExpiryDays] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Please enter a name for the API key');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    organizationId,
                    expiryDays: expiryDays || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.message || 'Failed to create API key';

                if (response.status === 400) {
                    toast.error(`Validation error: ${message}`);
                } else if (response.status === 401) {
                    toast.error('Unauthorized. Please log in again.');
                } else if (response.status === 403) {
                    toast.error('You do not have permission to create API keys for this organization');
                } else if (response.status === 404) {
                    toast.error('Organization not found');
                } else {
                    toast.error(message);
                }
                return;
            }

            const data = await response.json();
            setGeneratedKey(data.plainKey);
            toast.success('API key created successfully!');
            onCreated();
        } catch (error) {
            toast.error('Network error. Please check your connection and try again.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            toast.success('API key copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setName('');
        setExpiryDays(null);
        setGeneratedKey(null);
        setCopied(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold">
                        {generatedKey ? 'API Key Created' : 'Create New API Key'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    {!generatedKey ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key Name
                                </label>
                                <Input
                                    placeholder="e.g., Production API Key"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    A descriptive name to identify this API key
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiration
                                </label>
                                <select
                                    value={expiryDays || ''}
                                    onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Never</option>
                                    <option value="30">30 days</option>
                                    <option value="60">60 days</option>
                                    <option value="90">90 days</option>
                                    <option value="365">1 year</option>
                                </select>
                                <p className="text-sm text-gray-500 mt-1">
                                    When this API key will automatically expire
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800 font-semibold mb-2">
                                    ⚠️ Important: Save this API key now!
                                </p>
                                <p className="text-sm text-orange-700">
                                    You won't be able to see this key again. Make sure to copy it to a safe place.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your API Key
                                </label>
                                <div className="relative">
                                    <Input
                                        value={generatedKey}
                                        readOnly
                                        className="w-full font-mono text-sm pr-12"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                    {!generatedKey ? (
                        <>
                            <Button
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                                onPress={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onPress={handleCreate}
                                isDisabled={isLoading}
                            >
                                {isLoading ? 'Generating...' : 'Generate API Key'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onPress={handleClose}
                        >
                            Done
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
