'use client';
import { useState } from 'react';
import { Play, CheckCircle } from 'lucide-react';
import { usePayrolls, useGeneratePayroll, useApprovePayroll, useMarkPayrollPaid, useBulkApprovePayroll } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = { draft: 'Taslak', approved: 'Onaylı', paid: 'Ödendi' };
const STATUS_COLORS: Record<string, string> = { draft: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' };

export default function PayrollPage() {
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const { data: payrolls, isLoading } = usePayrolls({ period });
  const generate = useGeneratePayroll();
  const approve = useApprovePayroll();
  const markPaid = useMarkPayrollPaid();
  const bulkApprove = useBulkApprovePayroll();

  const list = (payrolls as any[]) || [];
  const totalGross = list.reduce((s, p) => s + Number(p.grossSalary), 0);
  const totalNet = list.reduce((s, p) => s + Number(p.netSalary), 0);
  const totalSgk = list.reduce((s, p) => s + Number(p.sgkEmployer), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bordro Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">Aylık maaş bordrosu hesaplama ve onay</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={async () => { try { const r = await generate.mutateAsync(period); toast.success(`${(r as any).data?.created || 0} bordro oluşturuldu`); } catch { toast.error('Oluşturulamadı'); } }}
            disabled={generate.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Play className="h-4 w-4" /> Bordro Oluştur
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Brüt', value: `₺${totalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: 'text-foreground' },
          { label: 'Toplam Net', value: `₺${totalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: 'text-green-600' },
          { label: 'İşveren SGK', value: `₺${totalSgk.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: 'text-orange-600' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk approve */}
      {list.some((p: any) => p.status === 'draft') && (
        <div className="flex justify-end">
          <button onClick={async () => { try { await bulkApprove.mutateAsync(period); toast.success('Tüm bordrolar onaylandı'); } catch { toast.error('Hata'); } }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
            <CheckCircle className="h-4 w-4 text-green-500" /> Tümünü Onayla
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {['Çalışan', 'Brüt', 'SGK (İşçi)', 'Gelir Vergisi', 'Damga V.', 'Net', 'Durum', 'İşlemler'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
            )) : !list.length ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Bu dönem için bordro bulunamadı. &quot;Bordro Oluştur&quot; butonuna tıklayın.</td></tr>
            ) : list.map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{p.employee?.firstName} {p.employee?.lastName}</td>
                <td className="px-4 py-3">₺{Number(p.grossSalary).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-muted-foreground">₺{Number(p.sgkEmployee).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-muted-foreground">₺{Number(p.incomeTax).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-muted-foreground">₺{Number(p.stampTax).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 font-semibold text-green-600">₺{Number(p.netSalary).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] || 'bg-muted text-muted-foreground')}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {p.status === 'draft' && (
                      <button onClick={() => approve.mutate(p.id)} className="text-xs text-blue-600 hover:underline">Onayla</button>
                    )}
                    {p.status === 'approved' && (
                      <button onClick={() => markPaid.mutate(p.id)} className="text-xs text-green-600 hover:underline">Ödendi</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
