import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useExchangeRates(params?: { baseCurrency?: string; date?: string }) {
  return useQuery({
    queryKey: ['exchange-rates', params],
    queryFn: () => api.get('/api/v1/exchange-rates', params),
  });
}

export function useLatestRates(baseCurrency?: string) {
  return useQuery({
    queryKey: ['exchange-rates', 'latest', baseCurrency],
    queryFn: () => api.get('/api/v1/exchange-rates/latest', baseCurrency ? { baseCurrency } : undefined),
  });
}

export function useUpsertRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { baseCurrency: string; targetCurrency: string; rate: number; date: string; source?: string }) =>
      api.post('/api/v1/exchange-rates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-rates'] }),
  });
}

export function useBulkUpsertRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rates: Array<{ baseCurrency: string; targetCurrency: string; rate: number; date: string }>) =>
      api.post('/api/v1/exchange-rates/bulk', { rates }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-rates'] }),
  });
}

export function useDeleteRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/exchange-rates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-rates'] }),
  });
}
