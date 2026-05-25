import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useStockCounts() {
  return useQuery({ queryKey: ['stock-counts'], queryFn: () => api.get('/api/v1/inventory/stock-counts') });
}

export function useStockCount(id: string) {
  return useQuery({ queryKey: ['stock-count', id], queryFn: () => api.get(`/api/v1/inventory/stock-counts/${id}`), enabled: !!id });
}

export function useCreateStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { notes?: string }) => api.post('/api/v1/inventory/stock-counts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-counts'] }),
  });
}

export function useUpdateStockCountLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stockCountId, lineId, countedQty }: { stockCountId: string; lineId: string; countedQty: number }) =>
      api.patch(`/api/v1/inventory/stock-counts/${stockCountId}/lines/${lineId}`, { countedQty }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['stock-count', vars.stockCountId] }),
  });
}

export function useCompleteStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/inventory/stock-counts/${id}/complete`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-count'] });
    },
  });
}
