'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, BookOpen, ChevronDown, ChevronRight, X, Trash2, AlertCircle, CheckCircle2, FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface JournalLine {
  id?: string;
  account: { code: string; name: string };
  type: 'debit' | 'credit';
  amount: number;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  lines: JournalLine[];
  createdAt: string;
}

interface JournalResponse {
  data: JournalEntry[];
  total: number;
}

interface NewLine {
  accountId: string;
  type: 'debit' | 'credit';
  amount: string;
}

const MOCK_JOURNAL_ACCOUNTS: Account[] = [
  { id: 'acc1', code: '100', name: 'Kasa', type: 'asset' },
  { id: 'acc2', code: '102', name: 'Bankalar', type: 'asset' },
  { id: 'acc3', code: '120', name: 'Alıcılar', type: 'asset' },
  { id: 'acc6', code: '320', name: 'Satıcılar', type: 'liability' },
  { id: 'acc11', code: '600', name: 'Yurt İçi Satışlar', type: 'revenue' },
  { id: 'acc13', code: '620', name: 'Satılan Mamuller Maliyeti', type: 'expense' },
  { id: 'acc14', code: '760', name: 'Pazarlama Giderleri', type: 'expense' },
  { id: 'acc15', code: '770', name: 'Genel Yönetim Giderleri', type: 'expense' },
];

const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je1', entryNumber: 'YK-2026-0001', date: '2026-05-02', description: 'Satış faturası tahsilatı',
    lines: [
      { account: { code: '102', name: 'Bankalar' }, type: 'debit', amount: 125000 },
      { account: { code: '120', name: 'Alıcılar' }, type: 'credit', amount: 125000 },
    ],
    createdAt: '2026-05-02T09:00:00Z',
  },
  {
    id: 'je2', entryNumber: 'YK-2026-0002', date: '2026-05-05', description: 'Tedarikçi ödemesi',
    lines: [
      { account: { code: '320', name: 'Satıcılar' }, type: 'debit', amount: 84000 },
      { account: { code: '102', name: 'Bankalar' }, type: 'credit', amount: 84000 },
    ],
    createdAt: '2026-05-05T10:30:00Z',
  },
  {
    id: 'je3', entryNumber: 'YK-2026-0003', date: '2026-05-10', description: 'Aylık pazarlama gideri',
    lines: [
      { account: { code: '760', name: 'Pazarlama Giderleri' }, type: 'debit', amount: 45000 },
      { account: { code: '100', name: 'Kasa' }, type: 'credit', amount: 45000 },
    ],
    createdAt: '2026-05-10T11:00:00Z',
  },
  {
    id: 'je4', entryNumber: 'YK-2026-0004', date: '2026-05-15', description: 'Satış hasılatı kaydı',
    lines: [
      { account: { code: '120', name: 'Alıcılar' }, type: 'debit', amount: 320000 },
      { account: { code: '600', name: 'Yurt İçi Satışlar' }, type: 'credit', amount: 320000 },
    ],
    createdAt: '2026-05-15T14:00:00Z',
  },
  {
    id: 'je5', entryNumber: 'YK-2026-0005', date: '2026-05-20', description: 'Genel yönetim giderleri',
    lines: [
      { account: { code: '770', name: 'Genel Yönetim Giderleri' }, type: 'debit', amount: 62000 },
      { account: { code: '102', name: 'Bankalar' }, type: 'credit', amount: 62000 },
    ],
    createdAt: '2026-05-20T09:45:00Z',
  },
];

function formatAmount(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

interface NewJournalModalProps {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  onLocalCreate: (entry: JournalEntry) => void;
}

function NewJournalModal({ open, onClose, accounts, onLocalCreate }: NewJournalModalProps) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date('2026-05-27').toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<NewLine[]>([
    { accountId: '', type: 'debit', amount: '' },
    { accountId: '', type: 'credit', amount: '' },
  ]);

  const totalDebit = lines.reduce((s, l) => (l.type === 'debit' ? s + (parseFloat(l.amount) || 0) : s), 0);
  const totalCredit = lines.reduce((s, l) => (l.type === 'credit' ? s + (parseFloat(l.amount) || 0) : s), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.post('/api/v1/accounting/journal', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting', 'journal'] });
      toast.success('Yevmiye kaydı oluşturuldu');
      onClose();
      setDate(new Date('2026-05-27').toISOString().slice(0, 10));
      setDescription('');
      setLines([{ accountId: '', type: 'debit', amount: '' }, { accountId: '', type: 'credit', amount: '' }]);
    },
    onError: (_err, payload) => {
      const p = payload as { date: string; description: string; lines: { accountId: string; type: 'debit' | 'credit'; amount: number }[] };
      const newEntry: JournalEntry = {
        id: `local-${Date.now()}`,
        entryNumber: `YK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        date: p.date,
        description: p.description,
        lines: p.lines.map((l) => {
          const acc = accounts.find((a) => a.id === l.accountId);
          return { account: { code: acc?.code ?? l.accountId, name: acc?.name ?? l.accountId }, type: l.type, amount: l.amount };
        }),
        createdAt: new Date().toISOString(),
      };
      onLocalCreate(newEntry);
      toast.success('Yevmiye kaydı oluşturuldu (yerel)');
      onClose();
      setDate(new Date('2026-05-27').toISOString().slice(0, 10));
      setDescription('');
      setLines([{ accountId: '', type: 'debit', amount: '' }, { accountId: '', type: 'credit', amount: '' }]);
    },
  });

  const handleAddLine = () => {
    setLines((prev) => [...prev, { accountId: '', type: 'debit', amount: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof NewLine, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const handleSubmit = () => {
    if (!isBalanced) return;
    createMutation.mutate({
      date,
      description,
      lines: lines
        .filter((l) => l.accountId && parseFloat(l.amount) > 0)
        .map((l) => ({ accountId: l.accountId, type: l.type, amount: parseFloat(l.amount) })),
    });
  };

  if (!open) return null;

  const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold">Yeni Yevmiye Kaydı</h2>
            <p className="text-sm text-muted-foreground">Borç ve alacak kalemleri dengeli olmalıdır</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tarih *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Açıklama *</label>
              <input
                type="text"
                placeholder="Kayıt açıklaması..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Yevmiye Kalemleri</label>
              <button
                onClick={handleAddLine}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Kalem Ekle
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">— Hesap seçin —</option>
                      {sortedAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28 shrink-0">
                    <select
                      value={line.type}
                      onChange={(e) => handleLineChange(idx, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="debit">Borç</option>
                      <option value="credit">Alacak</option>
                    </select>
                  </div>
                  <div className="w-32 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={line.amount}
                      onChange={(e) => handleLineChange(idx, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length <= 2}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Running Totals */}
          <div className={`rounded-xl border p-4 ${isBalanced ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10' : 'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/10'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">Toplam Borç:</span>{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{formatAmount(totalDebit)}</span>
                </span>
                <span className="text-muted-foreground">|</span>
                <span>
                  <span className="text-muted-foreground">Toplam Alacak:</span>{' '}
                  <span className="font-semibold text-red-600 dark:text-red-400">{formatAmount(totalCredit)}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Dengeli</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-600 dark:text-orange-400">
                      Fark: {formatAmount(Math.abs(totalDebit - totalCredit))}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isBalanced || !description || !date || createMutation.isPending}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Kaydediliyor...' : 'Kayıt Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const params: Record<string, unknown> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const [localEntries, setLocalEntries] = useState<JournalEntry[]>(MOCK_JOURNAL_ENTRIES);

  const { data: rawEntries, isLoading: entriesLoading } = useQuery<JournalResponse | JournalEntry[]>({
    queryKey: ['accounting', 'journal', params],
    queryFn: () => api.get('/api/v1/accounting/journal', params),
  });

  const { data: rawAccounts } = useQuery<Account[]>({
    queryKey: ['accounting', 'accounts'],
    queryFn: () => api.get<Account[]>('/api/v1/accounting/accounts'),
  });

  const apiAccounts: Account[] | null = rawAccounts !== undefined ? (Array.isArray(rawAccounts) ? rawAccounts : []) : null;
  const accounts: Account[] = apiAccounts ?? MOCK_JOURNAL_ACCOUNTS;

  const apiEntries: JournalEntry[] | null = useMemo(() => {
    if (rawEntries === undefined) return null;
    if (Array.isArray(rawEntries)) return rawEntries;
    if ('data' in rawEntries && Array.isArray(rawEntries.data)) return rawEntries.data;
    return [];
  }, [rawEntries]);

  const isLoading = entriesLoading && apiEntries === null;

  const entries: JournalEntry[] = useMemo(() => {
    const source = apiEntries ?? localEntries;
    if (!startDate && !endDate) return source;
    return source.filter((e) => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [apiEntries, localEntries, startDate, endDate]);

  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.entryNumber?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Yevmiye Defteri</h1>
            <p className="text-muted-foreground text-sm">
              {entries.length > 0 ? `${entries.length} kayıt` : 'Muhasebe yevmiye kayıtları'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              entries.flatMap((e) =>
                e.lines.map((l) => ({
                  entryNumber: e.entryNumber,
                  date: new Date(e.date).toLocaleDateString('tr-TR'),
                  description: e.description,
                  accountCode: l.account.code,
                  accountName: l.account.name,
                  type: l.type === 'debit' ? 'Borç' : 'Alacak',
                  amount: Number(l.amount),
                }))
              ),
              [
                { key: 'entryNumber', header: 'Kayıt No', width: 12 },
                { key: 'date', header: 'Tarih', width: 12 },
                { key: 'description', header: 'Açıklama', width: 30 },
                { key: 'accountCode', header: 'Hesap Kodu', width: 12 },
                { key: 'accountName', header: 'Hesap Adı', width: 24 },
                { key: 'type', header: 'Tip', width: 10 },
                { key: 'amount', header: 'Tutar', width: 14 },
              ],
              'yevmiye',
              'Yevmiye Defteri'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Yeni Kayıt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Başlangıç:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Bitiş:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <input
          type="text"
          placeholder="Fiş no veya açıklama ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {(startDate || endDate || search) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-muted-foreground text-sm">Kayıtlar yükleniyor...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search || startDate || endDate ? 'Arama kriterlerine uygun kayıt bulunamadı' : 'Henüz yevmiye kaydı eklenmemiş'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Fiş No</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Açıklama</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Borç Toplamı</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alacak Toplamı</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Kalem Sayısı</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const totalDebit = lines
                  .filter((l) => l.type === 'debit')
                  .reduce((s, l) => s + Number(l.amount), 0);
                const totalCredit = lines
                  .filter((l) => l.type === 'credit')
                  .reduce((s, l) => s + Number(l.amount), 0);
                const isExpanded = expandedId === entry.id;
                const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

                return (
                  <>
                    <tr
                      key={entry.id}
                      onClick={() => toggleRow(entry.id)}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold font-mono text-foreground">{entry.entryNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-sm">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600 dark:text-blue-400">
                        {formatAmount(totalDebit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600 dark:text-red-400">
                        {formatAmount(totalCredit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isBalanced ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {lines.length} kalem
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <tr key={`${entry.id}-detail`} className="bg-muted/20 border-b border-border">
                        <td colSpan={7} className="px-8 py-4">
                          <div className="rounded-lg border border-border overflow-hidden bg-card">
                            <table className="w-full">
                              <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Kodu</th>
                                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hesap Adı</th>
                                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Borç</th>
                                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alacak</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {lines.map((line, idx) => (
                                  <tr key={idx} className="hover:bg-muted/20">
                                    <td className="px-4 py-2.5 text-sm font-mono font-medium text-muted-foreground">
                                      {line.account?.code ?? '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm">{line.account?.name ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-sm text-right">
                                      {line.type === 'debit' ? (
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                          {formatAmount(Number(line.amount))}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-right">
                                      {line.type === 'credit' ? (
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                          {formatAmount(Number(line.amount))}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t-2 border-border bg-muted/50">
                                <tr>
                                  <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    Toplam
                                  </td>
                                  <td className="px-4 py-2.5 text-sm font-bold text-right text-blue-600 dark:text-blue-400">
                                    {formatAmount(totalDebit)}
                                  </td>
                                  <td className="px-4 py-2.5 text-sm font-bold text-right text-red-600 dark:text-red-400">
                                    {formatAmount(totalCredit)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && filteredEntries.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{filteredEntries.length} kayıt gösteriliyor</span>
          <span>
            Toplam:{' '}
            <span className="font-medium text-foreground">
              {formatAmount(
                filteredEntries.reduce((s, e) => {
                  const lines = Array.isArray(e.lines) ? e.lines : [];
                  return s + lines.filter((l) => l.type === 'debit').reduce((ss, l) => ss + Number(l.amount), 0);
                }, 0)
              )}
            </span>
          </span>
        </div>
      )}

      <NewJournalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        accounts={accounts}
        onLocalCreate={(entry) => setLocalEntries((prev) => [entry, ...prev])}
      />
    </div>
  );
}
