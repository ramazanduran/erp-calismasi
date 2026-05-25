import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function usePerformanceReviews(params?: { employeeId?: string }) {
  return useQuery({ queryKey: ['performance', params], queryFn: () => api.get('/api/v1/hr/performance', params as Record<string, unknown>) });
}
export function useCreatePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: unknown) => api.post('/api/v1/hr/performance', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['performance'] }) });
}
