'use client';

import { useState } from 'react';
import { RefreshCw, PlusCircle, Trash2, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useExchangeRates, useUpsertRate, useDeleteRate, useBulkUpsertRates } from '@/lib/api/hooks';

const MOCK_RATES = [
  { id: 'er1', baseCurrency: 'USD', targetCurrency: 'TRY', rate: 32.5000, date: new Date().toISOString(), source: 'manual' },
  { id: 'er2', baseCurrency: 'EUR', targetCurrency: 'TRY', rate: 35.2000, date: new Date().toISOString(), source: 'manual' },
  { id: 'er3', baseCurrency: 'GBP', targetCurrency: 'TRY', rate: 41.1000, date: new Date().toISOString(), source: 'manual' },
  { id: 'er4', baseCurrency: 'USD', targetCurrency: 'EUR', rate: 0.9200, date: new Date().toISOString(), source: 'manual' },
  { id: 'er5', baseCurrency: 'EUR', targetCurrency: 'USD', rate: 1.0870, date: new Date().toISOString(), source: 'manual' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'TRY'];
const COMMON_PAIRS = [
  { base: 'USD', target: 'TRY' },
  { base: 'EUR', target: 'TRY' },
  { base: 'GBP', target: 'TRY' },
  { base: 'USD', target: 'EUR' },
  { base: 'EUR', target: 'USD' },
];

interface ExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number | string;
  date: string;
  source: string;
}

function AddRateModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { baseCurrency: string; targetCurrency: string; rate: number; date: string; source?: string }) => void }) {
  const today = new Date().toISOString().substring(0, 10);
  const [form, setForm] = useState({
    baseCurrency: 'USD',
    targetCurrency: 'TRY',
    rate: '',
    date: today,
    source: 'manual',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Kur Ekle</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave({ ...form, rate: Number(form.rate) }); }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Baz Para Birimi</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.baseCurrency}
                onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Hedef Para Birimi</label>
              <select
                className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
                value={form.targetCurrency}
                onChange={(e) => setForm({ ...form, targetCurrency: e.target.value })}
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Kur</label>
            <input
              type="number"
              step="0.000001"
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder="örn. 32.5000"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tarih</label>
            <input
              type="date"
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
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

export default function ExchangeRatesPage() {
  const today = new Date().toISOString().substring(0, 10);
  const [date, setDate] = useState(today);
  const { data: rawRates, isLoading } = useExchangeRates({ date });
  const rates = Array.isArray(rawRates) ? rawRates : (!isLoading ? MOCK_RATES : []);
  const upsertRate = useUpsertRate();
  const bulkUpsert = useBulkUpsertRates();
  const deleteRate = useDeleteRate();
  const [showForm, setShowForm] = useState(false);
  const [quickRates, setQuickRates] = useState<Record<string, string>>({});

  const handleSave = async (data: { baseCurrency: string; targetCurrency: string; rate: number; date: string; source?: string }) => {
    await upsertRate.mutateAsync(data);
    setShowForm(false);
  };

  const handleQuickUpdate = async () => {
    const entries = Object.entries(quickRates)
      .filter(([, v]) => v && !isNaN(Number(v)))
      .map(([key, v]) => {
        const [base, target] = key.split('-');
        return { baseCurrency: base, targetCurrency: target, rate: Number(v), date };
      });
    if (entries.length > 0) {
      await bulkUpsert.mutateAsync(entries);
      setQuickRates({});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Döviz Kurları</h1>
          <p className="text-muted-foreground mt-1">Para birimi kurlarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="rounded border border-border bg-background px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={() => exportToExcel(
              (rates as ExchangeRate[]).map((r) => ({
                baseCurrency: r.baseCurrency,
                targetCurrency: r.targetCurrency,
                rate: Number(r.rate),
                date: new Date(r.date).toLocaleDateString('tr-TR'),
                source: r.source,
              })),
              [
                { key: 'baseCurrency', header: 'Baz Para', width: 12 },
                { key: 'targetCurrency', header: 'Hedef Para', width: 12 },
                { key: 'rate', header: 'Kur', width: 14 },
                { key: 'date', header: 'Tarih', width: 12 },
                { key: 'source', header: 'Kaynak', width: 14 },
              ],
              'doviz-kurlari',
              'Döviz Kurları'
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
            Kur Ekle
          </button>
        </div>
      </div>

      {/* Quick Entry Panel */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Hızlı Kur Girişi</h2>
          <span className="text-xs text-muted-foreground ml-auto">{date} için</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {COMMON_PAIRS.map((pair) => {
            const key = `${pair.base}-${pair.target}`;
            const existing = (rates as ExchangeRate[]).find(
              (r) => r.baseCurrency === pair.base && r.targetCurrency === pair.target
            );
            return (
              <div key={key} className="rounded-lg border border-border p-3">
                <p className="text-xs font-mono text-muted-foreground mb-1">{pair.base}/{pair.target}</p>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm font-mono"
                  placeholder={existing ? String(Number(existing.rate).toFixed(4)) : '0.0000'}
                  value={quickRates[key] ?? ''}
                  onChange={(e) => setQuickRates((prev) => ({ ...prev, [key]: e.target.value }))}
                />
                {existing && (
                  <p className="text-xs text-muted-foreground mt-1">Mevcut: {Number(existing.rate).toFixed(4)}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleQuickUpdate}
            disabled={bulkUpsert.isPending || Object.keys(quickRates).length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Kaydet
          </button>
        </div>
      </div>

      {/* Rate Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">{date} Kur Tablosu</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : (rates as ExchangeRate[]).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Bu tarih için kur kaydı yok</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Baz', 'Hedef', 'Kur', 'Kaynak', 'Tarih', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(rates as ExchangeRate[]).map((rate) => (
                <tr key={rate.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-semibold">{rate.baseCurrency}</td>
                  <td className="px-4 py-3 font-mono">{rate.targetCurrency}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{Number(rate.rate).toFixed(6)}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{rate.source}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(rate.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRate.mutate(rate.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <AddRateModal onClose={() => setShowForm(false)} onSave={handleSave} />}
    </div>
  );
}
