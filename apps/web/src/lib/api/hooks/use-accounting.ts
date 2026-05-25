import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useChartOfAccounts() {
  return useQuery({ queryKey: ['accounting', 'accounts'], queryFn: () => api.get('/api/v1/accounting/accounts') });
}
export function useJournalEntries(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['accounting', 'journal', params], queryFn: () => api.get('/api/v1/accounting/journal', params) });
}
export function useTrialBalance() {
  return useQuery({ queryKey: ['accounting', 'trial-balance'], queryFn: () => api.get('/api/v1/accounting/trial-balance') });
}
export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: unknown) => api.post('/api/v1/accounting/journal', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }) });
}
export function usePostJournalEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.post(`/api/v1/accounting/journal/${id}/post`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }) });
}
