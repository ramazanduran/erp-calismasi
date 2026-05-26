import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useBudgets(params?: { status?: string; departmentId?: string; year?: number }) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => api.get('/api/v1/budget', params),
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', 'detail', id],
    queryFn: () => api.get(`/api/v1/budget/${id}`),
    enabled: !!id,
  });
}

export function useBudgetSummary(year?: number) {
  return useQuery({
    queryKey: ['budgets', 'summary', year],
    queryFn: () => api.get('/api/v1/budget/summary', year ? { year } : undefined),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/budget', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.put(`/api/v1/budget/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/budget/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
