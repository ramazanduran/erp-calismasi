import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params?: Record<string, unknown>) => [...invoiceKeys.all, 'list', params] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
};

export function useInvoices(params?: { search?: string; status?: string; customerId?: string; page?: number }) {
  return useQuery({
    queryKey: invoiceKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/sales/invoices', params as Record<string, unknown>),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => api.get(`/api/v1/sales/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/sales/invoices', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/sales/invoices/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/sales/invoices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}
