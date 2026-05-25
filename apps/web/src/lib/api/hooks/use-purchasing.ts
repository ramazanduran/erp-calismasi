import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export function useSuppliers(params?: { search?: string; status?: string }) {
  return useQuery({ queryKey: ['suppliers', params], queryFn: () => api.get('/api/v1/purchasing/suppliers', params) });
}
export function useSupplier(id: string) {
  return useQuery({ queryKey: ['suppliers', 'detail', id], queryFn: () => api.get(`/api/v1/purchasing/suppliers/${id}`), enabled: !!id });
}
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: unknown) => api.post('/api/v1/purchasing/suppliers', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
}
export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: unknown }) => api.patch(`/api/v1/purchasing/suppliers/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
}
export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/api/v1/purchasing/suppliers/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
}

export function usePurchaseOrders(params?: { supplierId?: string; status?: string }) {
  return useQuery({ queryKey: ['purchase-orders', params], queryFn: () => api.get('/api/v1/purchasing/orders', params) });
}
export function usePurchaseOrder(id: string) {
  return useQuery({ queryKey: ['purchase-orders', 'detail', id], queryFn: () => api.get(`/api/v1/purchasing/orders/${id}`), enabled: !!id });
}
export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: unknown) => api.post('/api/v1/purchasing/orders', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }) });
}
export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/v1/purchasing/orders/${id}/status`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }) });
}
