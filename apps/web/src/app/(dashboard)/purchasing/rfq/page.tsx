'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, ClipboardList, ChevronDown, ChevronRight, FileDown, Search, X, CheckCircle2, Columns2 } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  received: 'Teklif Alındı',
  compared: 'Karşılaştırıldı',
  closed: 'Kapatıldı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-yellow-100 text-yellow-700',
  compared: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const TAB_FILTERS = [
  { v: '', l: 'Tümü' },
  { v: 'draft', l: 'Taslak' },
  { v: 'sent', l: 'Gönderildi' },
  { v: 'received', l: 'Teklif Alındı' },
  { v: 'compared', l: 'Karşılaştırıldı' },
  { v: 'closed', l: 'Kapatıldı' },
];

interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  notes?: string;
  selected: boolean;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  sentDate?: string;
  deadline?: string;
  status: string;
  supplierCount: number;
  lowestQuote?: number;
  quotes?: SupplierQuote[];
}

const MOCK_RFQS: RFQ[] = [
  { id: 'rfq1', rfqNumber: 'RFQ-2026-001', itemDescription: 'Çelik Sac 3mm (S235) — 500 adet', quantity: 500, unit: 'adet', sentDate: '2026-05-01', deadline: '2026-05-15', status: 'received', supplierCount: 3, lowestQuote: 18500, quotes: [{ supplierId: 's1', supplierName: 'Demir Çelik San.', unitPrice: 37, totalPrice: 18500, deliveryDays: 7, selected: true }, { supplierId: 's2', supplierName: 'Mavi Metal Ltd.', unitPrice: 41, totalPrice: 20500, deliveryDays: 5, selected: false }] },
  { id: 'rfq2', rfqNumber: 'RFQ-2026-002', itemDescription: 'Ambalaj Karton Kutu 40x30x25 — 2000 adet', quantity: 2000, unit: 'adet', sentDate: '2026-05-10', deadline: '2026-05-25', status: 'sent', supplierCount: 2 },
  { id: 'rfq3', rfqNumber: 'RFQ-2026-003', itemDescription: 'Sanayi Boya Ürünleri — 100 litre', quantity: 100, unit: 'litre', sentDate: '2026-04-20', deadline: '2026-05-05', status: 'closed', supplierCount: 4, lowestQuote: 15200 },
  { id: 'rfq4', rfqNumber: 'RFQ-2026-004', itemDescription: 'Yedek Parça Set — Makine M-205', quantity: 1, unit: 'set', deadline: '2026-06-15', status: 'draft', supplierCount: 0 },
  { id: 'rfq5', rfqNumber: 'RFQ-2026-005', itemDescription: 'Kauçuk O-Ring Seti (200 adet)', quantity: 200, unit: 'adet', sentDate: '2026-05-15', deadline: '2026-05-30', status: 'compared', supplierCount: 3, lowestQuote: 4800 },
];

const MOCK_SUPPLIERS = [
  { id: 's1', name: 'Tedarikçi A' },
  { id: 's2', name: 'Tedarikçi B' },
  { id: 's3', name: 'Tedarikçi C' },
  { id: 's4', name: 'Tedarikçi D' },
  { id: 's5', name: 'Tedarikçi E' },
];

function NewRFQModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ itemDescription: '', quantity: '', unit: 'adet', description: '', deadline: '' });
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  const toggleSupplier = (id: string) =>
    setSelectedSuppliers((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yeni Teklif İsteme (RFQ)</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, quantity: +form.quantity, supplierIds: selectedSuppliers }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Ürün / Hizmet Tanımı *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} placeholder="Talep edilen ürün veya hizmet" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Miktar *</label>
              <input type="number" min="0" step="any" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Birim</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {['adet', 'kg', 'litre', 'metre', 'kutu', 'paket'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Son Teklif Tarihi</label>
            <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama / Şartlar</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tedarikçiler <span className="text-muted-foreground font-normal">({selectedSuppliers.length} seçili)</span>
            </label>
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {MOCK_SUPPLIERS.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="checkbox" checked={selectedSuppliers.includes(s.id)} onChange={() => toggleSupplier(s.id)} className="rounded" />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuoteComparisonModal({ rfq, onClose }: { rfq: RFQ; onClose: () => void }) {
  const quotes = rfq.quotes ?? [];
  const minPrice = quotes.length ? Math.min(...quotes.map((q) => q.unitPrice)) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Teklif Karşılaştırması — {rfq.rfqNumber}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{rfq.itemDescription} · {rfq.quantity} {rfq.unit}</p>
        {quotes.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Henüz teklif alınmamış</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Tedarikçi</th>
                <th className="pb-3 font-medium text-right">Birim Fiyat</th>
                <th className="pb-3 font-medium text-right">Toplam</th>
                <th className="pb-3 font-medium text-center">Teslimat (Gün)</th>
                <th className="pb-3 font-medium">Notlar</th>
                <th className="pb-3 font-medium text-center">Seçim</th>
              </tr></thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.supplierId} className={cn('border-b border-border last:border-0', q.unitPrice === minPrice ? 'bg-green-50/50 dark:bg-green-950/20' : '')}>
                    <td className="py-3 font-medium">{q.supplierName} {q.unitPrice === minPrice && <span className="ml-1 text-xs text-green-600 font-semibold">En Düşük</span>}</td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(q.unitPrice)}</td>
                    <td className="py-3 text-right">{formatCurrency(q.totalPrice)}</td>
                    <td className="py-3 text-center text-muted-foreground">{q.deliveryDays} gün</td>
                    <td className="py-3 text-muted-foreground text-xs">{q.notes ?? '—'}</td>
                    <td className="py-3 text-center">{q.selected && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RFQPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [comparisonRFQ, setComparisonRFQ] = useState<RFQ | null>(null);

  const { data: rawRfqs, isLoading: rfqsLoading } = useQuery<RFQ[]>({ queryKey: ['rfqs'], queryFn: () => api.get('/api/v1/purchasing/rfq') });
  const rfqsData: RFQ[] = rawRfqs !== undefined ? (Array.isArray(rawRfqs) ? rawRfqs : []) : MOCK_RFQS;
  const isLoading = rfqsLoading && rawRfqs === undefined;

  const createRFQ = useMutation({ mutationFn: (d: any) => api.post('/api/v1/purchasing/rfq', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['rfqs'] }); setShowForm(false); } });

  const filtered = useMemo(() => {
    let list = rfqsData;
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.rfqNumber?.toLowerCase().includes(q) || r.itemDescription?.toLowerCase().includes(q));
    }
    return list;
  }, [rfqsData, statusFilter, search]);

  const stats = useMemo(() => ({
    open: rfqsData.filter((r) => r.status === 'sent').length,
    pending: rfqsData.filter((r) => r.status === 'draft').length,
    received: rfqsData.filter((r) => r.status === 'received').length,
    closed: rfqsData.filter((r) => r.status === 'closed').length,
  }), [rfqsData]);

  return (
    <div className="space-y-6">
      {showForm && <NewRFQModal onClose={() => setShowForm(false)} onSave={(d) => createRFQ.mutate(d)} />}
      {comparisonRFQ && <QuoteComparisonModal rfq={comparisonRFQ} onClose={() => setComparisonRFQ(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teklif İsteme (RFQ)</h1>
          <p className="text-muted-foreground mt-1">Tedarikçilerden fiyat teklifi talepleri ve karşılaştırması</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((r) => ({
                rfqNumber: r.rfqNumber,
                itemDescription: r.itemDescription,
                quantity: r.quantity,
                unit: r.unit,
                supplierCount: r.supplierCount,
                deadline: r.deadline ? formatDate(r.deadline) : '',
                lowestQuote: r.lowestQuote ?? '',
                status: STATUS_LABELS[r.status] ?? r.status,
              })),
              [
                { key: 'rfqNumber', header: 'RFQ No', width: 14 },
                { key: 'itemDescription', header: 'Ürün/Hizmet', width: 28 },
                { key: 'quantity', header: 'Miktar', width: 10 },
                { key: 'unit', header: 'Birim', width: 10 },
                { key: 'supplierCount', header: 'Tedarikçi Sayısı', width: 16 },
                { key: 'deadline', header: 'Son Tarih', width: 14 },
                { key: 'lowestQuote', header: 'En Düşük Teklif', width: 16 },
                { key: 'status', header: 'Durum', width: 14 },
              ],
              'rfq-listesi',
              'Teklif İsteme (RFQ)'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" /> Yeni RFQ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Açık RFQ', value: stats.open },
          { label: 'Teklif Bekleyen', value: stats.pending },
          { label: 'Karşılaştırma Hazır', value: stats.received },
          { label: 'Bu Ay Kapatılan', value: stats.closed },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="RFQ no veya ürün ara..." className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" />
        </div>
        {TAB_FILTERS.map((f) => (
          <button key={f.v} onClick={() => setStatusFilter(f.v)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">RFQ bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">Yeni bir teklif talebi oluşturmak için "Yeni RFQ" butonunu kullanın.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 font-medium">RFQ No</th>
                <th className="px-4 py-3 font-medium">Ürün / Hizmet</th>
                <th className="px-4 py-3 font-medium">Miktar</th>
                <th className="px-4 py-3 font-medium">Tedarikçi</th>
                <th className="px-4 py-3 font-medium">Son Tarih</th>
                <th className="px-4 py-3 font-medium">En Düşük Teklif</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rfq) => (
                <>
                  <tr key={rfq.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedRow(expandedRow === rfq.id ? null : rfq.id)} className="text-muted-foreground hover:text-foreground">
                        {expandedRow === rfq.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">{rfq.rfqNumber}</td>
                    <td className="px-4 py-3">{rfq.itemDescription}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rfq.quantity} {rfq.unit}</td>
                    <td className="px-4 py-3 text-center">{rfq.supplierCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rfq.deadline ? formatDate(rfq.deadline) : '—'}</td>
                    <td className="px-4 py-3 font-semibold">{rfq.lowestQuote ? formatCurrency(rfq.lowestQuote) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[rfq.status] ?? 'bg-gray-100 text-gray-600')}>
                        {STATUS_LABELS[rfq.status] ?? rfq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(rfq.quotes?.length ?? 0) > 0 && (
                        <button onClick={() => setComparisonRFQ(rfq)} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-2.5 py-1 hover:bg-muted transition-colors font-medium">
                          <Columns2 className="h-3.5 w-3.5" />Teklif Karşılaştır
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRow === rfq.id && (
                    <tr key={`${rfq.id}-expanded`} className="border-b border-border bg-muted/20">
                      <td colSpan={9} className="px-8 py-4">
                        {!rfq.quotes?.length ? (
                          <p className="text-sm text-muted-foreground">Henüz tedarikçi teklifi alınmamış</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead><tr className="text-muted-foreground text-left">
                              <th className="pb-2 font-medium">Tedarikçi</th>
                              <th className="pb-2 font-medium text-right">Birim Fiyat</th>
                              <th className="pb-2 font-medium text-right">Toplam</th>
                              <th className="pb-2 font-medium text-center">Teslimat</th>
                              <th className="pb-2 font-medium">Notlar</th>
                            </tr></thead>
                            <tbody>
                              {rfq.quotes.map((q) => (
                                <tr key={q.supplierId} className={cn(q.selected ? 'text-green-700 font-medium' : '')}>
                                  <td className="py-1.5">{q.supplierName} {q.selected && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1 text-green-500" />}</td>
                                  <td className="py-1.5 text-right">{formatCurrency(q.unitPrice)}</td>
                                  <td className="py-1.5 text-right">{formatCurrency(q.totalPrice)}</td>
                                  <td className="py-1.5 text-center text-muted-foreground">{q.deliveryDays} gün</td>
                                  <td className="py-1.5 text-muted-foreground text-xs">{q.notes ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
