import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const customerKeys = {
  all: ['customers'] as const,
  list: (params?: Record<string, unknown>) => [...customerKeys.all, 'list', params] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

export function useCustomers(params?: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: customerKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/sales/customers', params as Record<string, unknown>),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => api.get(`/api/v1/sales/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/sales/customers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/sales/customers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/sales/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
