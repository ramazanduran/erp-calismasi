'use client';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useSuppliers, useDeleteSupplier } from '@/lib/api/hooks';
import { SupplierModal } from '@/components/modals/supplier-modal';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { data: suppliers, isLoading } = useSuppliers({ search });
  const deleteMutation = useDeleteSupplier();

  const handleDelete = async (id: string) => {
    if (!confirm('Bu tedarikçiyi silmek istiyor musunuz?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Tedarikçi silindi');
    } catch { toast.error('Silinemedi'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Tedarikçiler</h1><p className="text-muted-foreground text-sm mt-1">Tedarikçi firma listesi</p></div>
        <button onClick={() => { setEditId(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Yeni Tedarikçi
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tedarikçi ara..." className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {['Kod', 'Ad', 'E-posta', 'Telefon', 'Ödeme Vadesi', 'Bakiye', 'Durum', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
            )) : !suppliers?.length ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Henüz tedarikçi eklenmemiş</td></tr>
            ) : (suppliers as any[]).map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.phone || '-'}</td>
                <td className="px-4 py-3">{s.paymentTerms} gün</td>
                <td className="px-4 py-3">₺{Number(s.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditId(s.id); setModalOpen(true); }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && suppliers && <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border">{(suppliers as any[]).length} tedarikçi</div>}
      </div>

      <SupplierModal open={modalOpen} onClose={() => setModalOpen(false)} editId={editId} />
    </div>
  );
}
