import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useTasks(params?: { assignedToId?: string; status?: string; priority?: string; entityType?: string; entityId?: string }) {
  return useQuery({ queryKey: ['tasks', params], queryFn: () => api.get('/api/v1/tasks', params) });
}

export function useTask(id: string) {
  return useQuery({ queryKey: ['tasks', 'detail', id], queryFn: () => api.get(`/api/v1/tasks/${id}`), enabled: !!id });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: unknown) => api.post('/api/v1/tasks', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: unknown }) => api.patch(`/api/v1/tasks/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.post(`/api/v1/tasks/${id}/complete`), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/api/v1/tasks/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}
