import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (params?: Record<string, unknown>) => [...categoryKeys.all, 'list', params] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

export function useCategories(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: categoryKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get('/api/v1/inventory/categories', params as Record<string, unknown>),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => api.get(`/api/v1/inventory/categories/${id}`),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/inventory/categories', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/inventory/categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/inventory/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
