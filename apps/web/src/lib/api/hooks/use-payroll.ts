import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function usePayrolls(params?: { period?: string; status?: string }) {
  return useQuery({ queryKey: ['payroll', params], queryFn: () => api.get('/api/v1/hr/payroll', params as Record<string, unknown>) });
}
export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (period: string) => api.post('/api/v1/hr/payroll/generate', { period }), onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });
}
export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.patch(`/api/v1/hr/payroll/${id}/approve`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });
}
export function useMarkPayrollPaid() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.patch(`/api/v1/hr/payroll/${id}/paid`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });
}
export function useBulkApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (period: string) => api.post('/api/v1/hr/payroll/bulk-approve', { period }), onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });
}
