import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationsApi, type Organization } from '../lib/api';
import { useAuth } from './auth-context';

interface OrganizationContextType {
    currentOrganization: Organization | null;
    organizations: Organization[];
    isLoading: boolean;
    setCurrentOrganization: (org: Organization | null) => void;
    switchOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

    // Fetch user's organizations
    const { data: organizations = [], isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const response = await organizationsApi.getAll();
            // Filter to only show active organizations (unless user is already in an inactive one)
            return response.data;
        },
        enabled: isAuthenticated,
        refetchOnWindowFocus: true, // Refetch when window regains focus
        staleTime: 30000, // Consider data stale after 30 seconds
    });

    // Auto-select organization on load or when organizations change
    useEffect(() => {
        if (!isAuthenticated || isLoading || organizations.length === 0) {
            setCurrentOrganization(null);
            return;
        }

        // Try to restore from localStorage
        const savedOrgId = localStorage.getItem('current_organization_id');
        if (savedOrgId) {
            const savedOrg = organizations.find(org => org.id === savedOrgId);
            if (savedOrg) {
                setCurrentOrganization(savedOrg);
                return;
            }
        }

        // If only one organization, auto-select it
        if (organizations.length === 1) {
            setCurrentOrganization(organizations[0]);
            localStorage.setItem('current_organization_id', organizations[0].id);
        } else if (organizations.length > 0 && !currentOrganization) {
            // Multiple organizations but none selected - select first one
            setCurrentOrganization(organizations[0]);
            localStorage.setItem('current_organization_id', organizations[0].id);
        }
    }, [organizations, isLoading, isAuthenticated]);

    const switchOrganization = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
            setCurrentOrganization(org);
            localStorage.setItem('current_organization_id', org.id);
        }
    };

    return (
        <OrganizationContext.Provider
            value={{
                currentOrganization,
                organizations,
                isLoading,
                setCurrentOrganization,
                switchOrganization,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}
