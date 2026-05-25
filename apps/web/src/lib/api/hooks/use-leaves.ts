import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const leaveKeys = {
  all: ['leaves'] as const,
  list: (params?: Record<string, unknown>) => [...leaveKeys.all, 'list', params] as const,
  detail: (id: string) => [...leaveKeys.all, 'detail', id] as const,
};

export function useLeaves(params?: { search?: string; status?: string; employeeId?: string; page?: number }) {
  return useQuery({
    queryKey: leaveKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/hr/leaves', params as Record<string, unknown>),
  });
}

export function useLeave(id: string) {
  return useQuery({
    queryKey: leaveKeys.detail(id),
    queryFn: () => api.get(`/api/v1/hr/leaves/${id}`),
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/hr/leaves', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.all }),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.patch(`/api/v1/hr/leaves/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.all }),
  });
}

export function useUpdateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/hr/leaves/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.all }),
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/hr/leaves/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.all }),
  });
}
