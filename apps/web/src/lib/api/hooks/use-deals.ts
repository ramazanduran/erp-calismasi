import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useDeals(params?: { stage?: string; assignedUserId?: string; customerId?: string }) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => api.get('/api/v1/deals', params),
  });
}

export function useDealPipeline() {
  return useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: () => api.get('/api/v1/deals/pipeline'),
  });
}

export function useDealStats() {
  return useQuery({
    queryKey: ['deals', 'stats'],
    queryFn: () => api.get('/api/v1/deals/stats'),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', 'detail', id],
    queryFn: () => api.get(`/api/v1/deals/${id}`),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/deals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.put(`/api/v1/deals/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/deals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useAddDealActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: unknown }) =>
      api.post(`/api/v1/deals/${dealId}/activities`, data),
    onSuccess: (_data, { dealId }) => qc.invalidateQueries({ queryKey: ['deals', 'detail', dealId] }),
  });
}
