import { ChevronDown, Building2, Settings, Ban } from 'lucide-react';
import { useOrganization } from '../contexts/organization-context';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@heroui/react';
import toast from 'react-hot-toast';

export function OrganizationSwitcher() {
    const { currentOrganization, organizations, switchOrganization, isLoading } = useOrganization();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="px-3 py-2 text-sm text-gray-500">
                Loading...
            </div>
        );
    }

    // If no organizations, show create button
    if (!organizations || organizations.length === 0) {
        return (
            <Link to="/organizations/create">
                <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Organization
                </Button>
            </Link>
        );
    }

    if (!currentOrganization) {
        return null;
    }

    const handleOrgSwitch = (org: any) => {
        if (!org.isActive) {
            toast.error('This organization has been deactivated');
            return;
        }
        switchOrganization(org.id);
        setIsOpen(false);
    };

    // If only one organization, show it with clickable dropdown
    if (organizations.length === 1) {
        const org = organizations[0];
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${!org.isActive
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    <span>{org.name}</span>
                    {!org.isActive && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                            Inactive
                        </span>
                    )}
                    <Settings className="w-4 h-4" />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="py-1">
                                <Link
                                    to="/organizations/create"
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span>Create Organization</span>
                                </Link>
                                <Link
                                    to={`/organizations/${currentOrganization.id}/settings`}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Organization Settings</span>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${!currentOrganization.isActive
                    ? 'text-gray-400 bg-gray-100'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <Building2 className="w-4 h-4" />
                <span>{currentOrganization.name}</span>
                {!currentOrganization.isActive && (
                    <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                        Inactive
                    </span>
                )}
                <ChevronDown className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-2">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                                Your Organizations
                            </div>

                            {organizations.map((org: any) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleOrgSwitch(org)}
                                    disabled={!org.isActive}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${!org.isActive
                                        ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                                        : org.id === currentOrganization.id
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        {!org.isActive && <Ban className="w-3 h-3" />}
                                        <span>{org.name}</span>
                                    </div>
                                    {!org.isActive && (
                                        <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                                            Inactive
                                        </span>
                                    )}
                                </button>
                            ))}

                            <div className="border-t border-gray-200 mt-2 pt-2">
                                <Link
                                    to="/organizations/create"
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span>Create Organization</span>
                                </Link>
                                <Link
                                    to={`/organizations/${currentOrganization.id}/settings`}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Organization Settings</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
