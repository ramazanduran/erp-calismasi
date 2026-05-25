import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params?: Record<string, unknown>) => [...orderKeys.all, 'list', params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrders(params?: { search?: string; status?: string; customerId?: string; page?: number }) {
  return useQuery({
    queryKey: orderKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/sales/orders', params as Record<string, unknown>),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api.get(`/api/v1/sales/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/sales/orders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/sales/orders/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/sales/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
