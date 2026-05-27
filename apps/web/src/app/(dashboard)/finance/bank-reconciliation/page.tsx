'use client';

import { useState } from 'react';
import { PlusCircle, CheckCircle2, XCircle, Minus, RefreshCw, CreditCard, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatCurrency, cn } from '@/lib/utils';

const LINE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  unmatched: { label: 'Eşleşmedi',    color: 'text-orange-600', bg: 'bg-orange-100' },
  matched:   { label: 'Eşleşti',      color: 'text-green-600',  bg: 'bg-green-100' },
  ignored:   { label: 'Görmezden',    color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const STMT_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Bekliyor',   color: 'text-orange-600' },
  in_progress: { label: 'Devam',    color: 'text-blue-600' },
  reconciled: { label: 'Mutabık',   color: 'text-green-600' },
};

interface Statement {
  id: string;
  referenceNumber?: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  currency: string;
  status: string;
  account: { name: string };
  _count?: { lines: number };
}

interface StatementLine {
  id: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;
  type: string;
  balance: number;
  status: string;
  transaction?: { description: string; amount: number } | null;
  notes?: string;
}

function NewStatementModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ accountId: '', startDate: '', endDate: '', openingBalance: '0', closingBalance: '0', currency: 'TRY' });
  const [lines, setLines] = useState<any[]>([{ date: '', description: '', amount: '', type: 'credit', balance: '' }]);

  const { data: accounts = [] } = useQuery({
    queryKey: ['fin-accounts'],
    queryFn: () => api.get('/api/v1/finance/accounts'),
  });

  const addLine = () => setLines([...lines, { date: '', description: '', amount: '', type: 'credit', balance: '' }]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Banka Özeti</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, openingBalance: +form.openingBalance, closingBalance: +form.closingBalance, lines: lines.map(l => ({ ...l, amount: +l.amount, balance: +l.balance })).filter(l => l.date && l.description) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Banka Hesabı *</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                <option value="">Hesap seçin...</option>
                {(accounts as any[]).filter((a: any) => a.type === 'bank').map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Para Birimi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>TRY</option><option>USD</option><option>EUR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Dönem Başlangıç</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Dönem Bitiş</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Açılış Bakiyesi</label>
              <input type="number" step="0.01" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Kapanış Bakiyesi</label>
              <input type="number" step="0.01" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.closingBalance} onChange={(e) => setForm({ ...form, closingBalance: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Hareket Satırları</label>
              <button type="button" onClick={addLine} className="text-xs text-primary hover:underline">+ Satır Ekle</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5">
                  <input type="date" className="col-span-2 rounded border border-border bg-background px-2 py-1 text-xs" value={line.date} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, date: e.target.value } : l))} />
                  <input className="col-span-4 rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Açıklama" value={line.description} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, description: e.target.value } : l))} />
                  <select className="col-span-2 rounded border border-border bg-background px-1 py-1 text-xs" value={line.type} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, type: e.target.value } : l))}>
                    <option value="credit">Alacak</option>
                    <option value="debit">Borç</option>
                  </select>
                  <input type="number" step="0.01" className="col-span-2 rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Tutar" value={line.amount} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, amount: e.target.value } : l))} />
                  <input type="number" step="0.01" className="col-span-2 rounded border border-border bg-background px-2 py-1 text-xs" placeholder="Bakiye" value={line.balance} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, balance: e.target.value } : l))} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatementView({ stmt, onClose }: { stmt: Statement; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: detailData, isLoading } = useQuery({
    queryKey: ['bank-recon', 'statement', stmt.id],
    queryFn: () => api.get(`/api/v1/bank-reconciliation/${stmt.id}`),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['bank-recon', 'summary', stmt.id],
    queryFn: () => api.get(`/api/v1/bank-reconciliation/${stmt.id}/summary`),
  });

  const autoMatch = useMutation({
    mutationFn: () => api.post(`/api/v1/bank-reconciliation/${stmt.id}/auto-match`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-recon', 'statement', stmt.id] }),
  });

  const ignoreLine = useMutation({
    mutationFn: (lineId: string) => api.put(`/api/v1/bank-reconciliation/${stmt.id}/lines/${lineId}/ignore`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-recon'] }),
  });

  const detail = detailData as any;
  const summary = summaryData as any;
  const lines = detail?.lines ?? [] as StatementLine[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{stmt.account.name}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(stmt.startDate).toLocaleDateString('tr-TR')} — {new Date(stmt.endDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => autoMatch.mutate()} disabled={autoMatch.isPending}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-50">
              <RefreshCw className={cn('h-4 w-4', autoMatch.isPending && 'animate-spin')} />
              Otomatik Eşleştir
            </button>
            <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Toplam', value: summary.total },
              { label: 'Eşleşti', value: summary.matched, color: 'text-green-600' },
              { label: 'Görmezden', value: summary.ignored, color: 'text-gray-500' },
              { label: 'Bekliyor', value: summary.unmatched, color: 'text-orange-600' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-muted/50 p-3 text-center">
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {summary && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Mutabakat İlerlemesi</span>
              <span>%{summary.progress}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${summary.progress}%` }} />
            </div>
          </div>
        )}

        {/* Lines Table */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Tarih', 'Açıklama', 'Tür', 'Tutar', 'Bakiye', 'Durum', ''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line: StatementLine) => {
                  const lsc = LINE_STATUS_CONFIG[line.status];
                  return (
                    <tr key={line.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-xs">{new Date(line.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2 text-xs">
                        <p className="font-medium">{line.description}</p>
                        {line.reference && <p className="text-muted-foreground">{line.reference}</p>}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className={line.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {line.type === 'credit' ? 'Alacak' : 'Borç'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-medium">
                        <span className={line.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {line.type === 'debit' ? '-' : '+'}{formatCurrency(Math.abs(Number(line.amount)))}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatCurrency(Number(line.balance))}</td>
                      <td className="px-3 py-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', lsc?.bg, lsc?.color)}>{lsc?.label}</span>
                      </td>
                      <td className="px-3 py-2">
                        {line.status === 'unmatched' && (
                          <button onClick={() => ignoreLine.mutate(line.id)} className="text-xs text-muted-foreground hover:text-foreground">
                            Yoksay
                          </button>
                        )}
                        {line.status === 'matched' && line.transaction && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />Eşleşti
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BankReconciliationPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewStmt, setViewStmt] = useState<Statement | null>(null);

  const { data: stmtsData = [], isLoading } = useQuery({
    queryKey: ['bank-recon', 'list'],
    queryFn: () => api.get('/api/v1/bank-reconciliation'),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/bank-reconciliation', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-recon'] }); setShowForm(false); },
  });

  const stmts = stmtsData as Statement[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banka Mutabakatı</h1>
          <p className="text-muted-foreground mt-1">Banka özetlerini muhasebe kayıtları ile eşleştirin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              stmts.map((s) => ({
                referenceNumber: s.referenceNumber ?? '',
                accountName: s.account.name,
                startDate: new Date(s.startDate).toLocaleDateString('tr-TR'),
                endDate: new Date(s.endDate).toLocaleDateString('tr-TR'),
                openingBalance: Number(s.openingBalance),
                closingBalance: Number(s.closingBalance),
                currency: s.currency,
                status: STMT_STATUS[s.status]?.label ?? s.status,
                lineCount: s._count?.lines ?? 0,
              })),
              [
                { key: 'referenceNumber', header: 'Referans No', width: 18 },
                { key: 'accountName', header: 'Hesap', width: 24 },
                { key: 'startDate', header: 'Başlangıç', width: 14 },
                { key: 'endDate', header: 'Bitiş', width: 14 },
                { key: 'openingBalance', header: 'Açılış Bakiyesi', width: 16 },
                { key: 'closingBalance', header: 'Kapanış Bakiyesi', width: 16 },
                { key: 'currency', header: 'Para Birimi', width: 12 },
                { key: 'status', header: 'Durum', width: 12 },
                { key: 'lineCount', header: 'Satır Sayısı', width: 12 },
              ],
              'banka-mutabakati',
              'Banka Mutabakatı'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <PlusCircle className="h-4 w-4" />Yeni Özet
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : stmts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Banka özeti bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">Banka ekstrenizdeki hareketleri sisteme aktarın</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stmts.map((stmt) => {
            const sc = STMT_STATUS[stmt.status];
            return (
              <div key={stmt.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewStmt(stmt)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{stmt.account.name}</span>
                      <span className={cn('text-xs', sc?.color)}>{sc?.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(stmt.startDate).toLocaleDateString('tr-TR')} — {new Date(stmt.endDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(stmt.closingBalance))} {stmt.currency}</p>
                    <p className="text-xs text-muted-foreground">{stmt._count?.lines ?? 0} hareket</p>
                    <p className="text-xs text-muted-foreground">Açılış: {formatCurrency(Number(stmt.openingBalance))}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewStatementModal onClose={() => setShowForm(false)} onSave={(d) => create.mutate(d)} />}
      {viewStmt && <StatementView stmt={viewStmt} onClose={() => setViewStmt(null)} />}
    </div>
  );
}
