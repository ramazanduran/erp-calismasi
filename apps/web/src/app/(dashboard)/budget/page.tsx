'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, TrendingUp, DollarSign, BarChart3, Trash2, Edit2, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useBudgets, useBudgetSummary, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/lib/api/hooks';
import { formatCurrency, cn } from '@/lib/utils';

const BUDGET_TYPE_LABELS: Record<string, string> = {
  annual: 'Yıllık',
  quarterly: 'Çeyrek',
  monthly: 'Aylık',
  project: 'Proje',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  active: 'Aktif',
  closed: 'Kapalı',
};

interface BudgetLine {
  category: string;
  description: string;
  plannedAmount: number | string;
  actualAmount?: number | string;
}

interface Budget {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number | string;
  currency: string;
  department?: { name: string } | null;
  lines: BudgetLine[];
}

function BudgetFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Budget | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'annual',
    status: initial?.status ?? 'draft',
    startDate: initial?.startDate ? initial.startDate.substring(0, 10) : '',
    endDate: initial?.endDate ? initial.endDate.substring(0, 10) : '',
    currency: initial?.currency ?? 'TRY',
    notes: '',
  });
  const [lines, setLines] = useState<BudgetLine[]>(
    initial?.lines ?? [{ category: 'personnel', description: 'Personel Giderleri', plannedAmount: 0 }]
  );

  const addLine = () =>
    setLines((prev) => [...prev, { category: 'operations', description: '', plannedAmount: 0 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof BudgetLine, value: string | number) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, lines });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Bütçe Düzenle' : 'Yeni Bütçe'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Bütçe Adı</label>
              <input
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tür</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(BUDGET_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Durum</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Başlangıç</label>
              <input
                type="date"
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bitiş</label>
              <input
                type="date"
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Bütçe Kalemleri</label>
              <button type="button" onClick={addLine} className="text-xs text-primary hover:underline">
                + Kalem Ekle
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-xs"
                    value={line.category}
                    onChange={(e) => updateLine(i, 'category', e.target.value)}
                  >
                    <option value="personnel">Personel</option>
                    <option value="marketing">Pazarlama</option>
                    <option value="operations">Operasyon</option>
                    <option value="capex">Yatırım</option>
                    <option value="other">Diğer</option>
                  </select>
                  <input
                    className="col-span-5 rounded border border-border bg-background px-2 py-1.5 text-xs"
                    placeholder="Açıklama"
                    value={line.description}
                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-xs"
                    placeholder="Tutar"
                    value={line.plannedAmount}
                    onChange={(e) => updateLine(i, 'plannedAmount', Number(e.target.value))}
                    min={0}
                    required
                  />
                  <button type="button" onClick={() => removeLine(i)} className="col-span-1 text-destructive hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const { data: budgets = [], isLoading } = useBudgets();
  const { data: summary } = useBudgetSummary();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredBudgets = useMemo(() => {
    return (budgets as Budget[]).filter((b) => {
      if (typeFilter && b.type !== typeFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !(b.department?.name?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [budgets, typeFilter, statusFilter, search]);

  const handleSave = async (data: Record<string, unknown>) => {
    if (editing) {
      await updateBudget.mutateAsync({ id: editing.id, data });
    } else {
      await createBudget.mutateAsync(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const summaryData = summary as {
    totalPlanned?: number;
    totalActual?: number;
    variance?: number;
    utilizationRate?: number;
    budgetCount?: number;
  } | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bütçe Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Bütçe planlarını oluşturun ve takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filteredBudgets.map((b) => ({
                name: b.name,
                type: BUDGET_TYPE_LABELS[b.type] ?? b.type,
                status: b.status,
                department: b.department?.name ?? '',
                totalAmount: Number(b.totalAmount),
                currency: b.currency,
                lineCount: b.lines.length,
                startDate: new Date(b.startDate).toLocaleDateString('tr-TR'),
                endDate: new Date(b.endDate).toLocaleDateString('tr-TR'),
              })),
              [
                { key: 'name', header: 'Bütçe Adı', width: 26 },
                { key: 'type', header: 'Tip', width: 12 },
                { key: 'status', header: 'Durum', width: 12 },
                { key: 'department', header: 'Departman', width: 18 },
                { key: 'totalAmount', header: 'Toplam', width: 14 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'lineCount', header: 'Kalem', width: 8 },
                { key: 'startDate', header: 'Başlangıç', width: 12 },
                { key: 'endDate', header: 'Bitiş', width: 12 },
              ],
              'butce',
              'Bütçe Planları'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            Yeni Bütçe
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Planlanan', value: formatCurrency(summaryData?.totalPlanned ?? 0), icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Gerçekleşen', value: formatCurrency(summaryData?.totalActual ?? 0), icon: BarChart3, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Sapma', value: formatCurrency(summaryData?.variance ?? 0), icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Kullanım Oranı', value: `%${(summaryData?.utilizationRate ?? 0).toFixed(1)}`, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">Bütçe Listesi</h2>
          <div className="flex-1 flex flex-wrap gap-2 justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Bütçe adı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
              <option value="">Tüm Tipler</option>
              {Object.entries(BUDGET_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : filteredBudgets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Bütçe bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Bütçe Adı', 'Tür', 'Dönem', 'Planlanan', 'Durum', 'İşlemler'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBudgets.map((b) => {
                const actual = b.lines.reduce((s, l) => s + Number(l.actualAmount ?? 0), 0);
                const planned = Number(b.totalAmount);
                const pct = planned > 0 ? (actual / planned) * 100 : 0;
                return (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3">{BUDGET_TYPE_LABELS[b.type] ?? b.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(b.startDate).toLocaleDateString('tr-TR')} - {new Date(b.endDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold">{formatCurrency(planned)}</span>
                        <div className="w-24 bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% kullanıldı</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[b.status] ?? '')}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditing(b); setShowForm(true); }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteBudget.mutate(b.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <BudgetFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
