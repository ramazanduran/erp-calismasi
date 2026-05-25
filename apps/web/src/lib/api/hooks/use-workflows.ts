import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const workflowKeys = {
  all: ['workflows'] as const,
  list: () => [...workflowKeys.all, 'list'] as const,
  detail: (id: string) => [...workflowKeys.all, 'detail', id] as const,
  instances: (id: string) => [...workflowKeys.all, 'instances', id] as const,
};

export function useWorkflows() {
  return useQuery({
    queryKey: workflowKeys.list(),
    queryFn: () => api.get('/api/v1/workflows'),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => api.get(`/api/v1/workflows/${id}`),
    enabled: !!id,
  });
}

export function useWorkflowInstances(id: string) {
  return useQuery({
    queryKey: workflowKeys.instances(id),
    queryFn: () => api.get(`/api/v1/workflows/${id}/instances`),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/workflows', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.all }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch(`/api/v1/workflows/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.all }),
  });
}

export function useToggleWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/workflows/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.all }),
  });
}
