import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/api/v1/webhooks'),
  });
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: ['webhooks', 'detail', id],
    queryFn: () => api.get(`/api/v1/webhooks/${id}`),
    enabled: !!id,
  });
}

export function useWebhookLogs(id: string) {
  return useQuery({
    queryKey: ['webhooks', 'logs', id],
    queryFn: () => api.get(`/api/v1/webhooks/${id}/logs`),
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/webhooks', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.put(`/api/v1/webhooks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/webhooks/${id}/test`, {}),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}
