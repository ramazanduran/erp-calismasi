import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function usePriceLists() {
  return useQuery({ queryKey: ['price-lists'], queryFn: () => api.get('/api/v1/pricing') });
}

export function usePriceList(id: string) {
  return useQuery({ queryKey: ['price-list', id], queryFn: () => api.get(`/api/v1/pricing/${id}`), enabled: !!id });
}

export function useCreatePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; currency?: string; isDefault?: boolean; validFrom?: string; validTo?: string }) =>
      api.post('/api/v1/pricing', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-lists'] }),
  });
}

export function useAddPriceListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ priceListId, ...data }: { priceListId: string; productId: string; price: number; discountRate?: number }) =>
      api.post(`/api/v1/pricing/${priceListId}/items`, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['price-list', vars.priceListId] }),
  });
}

export function useRemovePriceListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ priceListId, itemId }: { priceListId: string; itemId: string }) =>
      api.delete(`/api/v1/pricing/${priceListId}/items/${itemId}`),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['price-list', vars.priceListId] }),
  });
}
