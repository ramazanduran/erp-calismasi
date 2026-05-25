import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useLeads(params?: { search?: string; status?: string; source?: string }) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => api.get('/api/v1/crm/leads', params),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', 'detail', id],
    queryFn: () => api.get(`/api/v1/crm/leads/${id}`),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/crm/leads', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.patch(`/api/v1/crm/leads/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/crm/leads/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/crm/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
