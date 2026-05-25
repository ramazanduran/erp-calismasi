import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const movementKeys = {
  all: ['movements'] as const,
  list: (params?: Record<string, unknown>) => [...movementKeys.all, 'list', params] as const,
  detail: (id: string) => [...movementKeys.all, 'detail', id] as const,
};

export function useMovements(params?: { search?: string; type?: string; productId?: string; page?: number }) {
  return useQuery({
    queryKey: movementKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/inventory/movements', params as Record<string, unknown>),
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/inventory/movements', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: movementKeys.all }),
  });
}
