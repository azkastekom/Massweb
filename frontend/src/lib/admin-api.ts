import { api } from './api';

// Admin Organizations API
export const adminOrganizationsApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
        api.get('/admin/organizations', { params }),
    update: (id: string, data: { name?: string; isActive?: boolean }) =>
        api.patch(`/admin/organizations/${id}`, data),
    getMembers: (id: string) =>
        api.get(`/admin/organizations/${id}/members`),
    addMember: (id: string, data: { email: string; role: string }) =>
        api.post(`/admin/organizations/${id}/members`, data),
    removeMember: (id: string, userId: string) =>
        api.delete(`/admin/organizations/${id}/members/${userId}`),
};

// Admin Users API
export const adminUsersApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean; isSuperAdmin?: boolean }) =>
        api.get('/admin/users', { params }),
    create: (data: { email: string; password: string; name: string; isSuperAdmin?: boolean }) =>
        api.post('/admin/users', data),
    update: (id: string, data: { name?: string; email?: string; isActive?: boolean }) =>
        api.patch(`/admin/users/${id}`, data),
    getOrganizations: (id: string) =>
        api.get(`/admin/users/${id}/organizations`),
    addToOrganization: (userId: string, orgId: string, role: string) =>
        api.post(`/admin/users/${userId}/organizations/${orgId}`, { role }),
    removeFromOrganization: (userId: string, orgId: string) =>
        api.delete(`/admin/users/${userId}/organizations/${orgId}`),
};

// Admin Jobs API
export const adminJobsApi = {
    getAll: (params?: { page?: number; limit?: number; status?: string; projectId?: string }) =>
        api.get('/admin/jobs', { params }),
    getDetails: (id: string) =>
        api.get(`/admin/jobs/${id}`),
    pause: (id: string) =>
        api.post(`/admin/jobs/${id}/pause`),
    resume: (id: string) =>
        api.post(`/admin/jobs/${id}/resume`),
    cancel: (id: string) =>
        api.post(`/admin/jobs/${id}/cancel`),
    delete: (id: string) =>
        api.delete(`/admin/jobs/${id}`),
};
