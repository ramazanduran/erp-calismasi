import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params?: Record<string, unknown>) => [...transactionKeys.all, 'list', params] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
};

export function useTransactions(params?: { search?: string; accountId?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: transactionKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/finance/transactions', params as Record<string, unknown>),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => api.get(`/api/v1/finance/transactions/${id}`),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/finance/transactions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/finance/transactions/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/finance/transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
