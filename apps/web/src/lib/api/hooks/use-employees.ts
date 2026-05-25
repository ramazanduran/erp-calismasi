import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params?: Record<string, unknown>) => [...employeeKeys.all, 'list', params] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
};

export function useEmployees(params?: { search?: string; status?: string; departmentId?: string; page?: number }) {
  return useQuery({
    queryKey: employeeKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/hr/employees', params as Record<string, unknown>),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => api.get(`/api/v1/hr/employees/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/hr/employees', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/hr/employees/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/hr/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
