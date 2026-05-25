import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/api/v1/analytics/dashboard'),
    staleTime: 60_000,
  });
}

export function useSalesAnalytics(period = '6months') {
  return useQuery({
    queryKey: ['analytics', 'sales', period],
    queryFn: () => api.get('/api/v1/analytics/sales', { period } as Record<string, unknown>),
    staleTime: 60_000,
  });
}

export function useInventoryAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'inventory'],
    queryFn: () => api.get('/api/v1/analytics/inventory'),
    staleTime: 60_000,
  });
}

export function useFinanceAnalytics(period = '6months') {
  return useQuery({
    queryKey: ['analytics', 'finance', period],
    queryFn: () => api.get('/api/v1/analytics/finance', { period } as Record<string, unknown>),
    staleTime: 60_000,
  });
}

export function useHRAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'hr'],
    queryFn: () => api.get('/api/v1/analytics/hr'),
    staleTime: 60_000,
  });
}
