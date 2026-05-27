'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, PlusCircle, AlertCircle, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

type ChequeType = 'received' | 'given';
type ChequeStatus = 'portfolio' | 'deposited' | 'bounced' | 'cancelled' | 'matured';
type InstrumentKind = 'cheque' | 'note';

interface Instrument {
  id: string;
  kind: InstrumentKind;
  type: ChequeType;
  serial: string;
  issuer: string;
  bank: string;
  branch: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: ChequeStatus;
  notes?: string;
}

const MOCK_INSTRUMENTS: Instrument[] = [
  { id: '1', kind: 'cheque', type: 'received', serial: 'ÇEK-2026-0451', issuer: 'ABC Ticaret A.Ş.', bank: 'Garanti BBVA', branch: 'Kadıköy', amount: 850000, currency: 'TRY', issueDate: '2026-04-10', dueDate: '2026-06-10', status: 'portfolio' },
  { id: '2', kind: 'cheque', type: 'received', serial: 'ÇEK-2026-0452', issuer: 'DEF Yapı Ltd.', bank: 'İş Bankası', branch: 'Bostancı', amount: 480000, currency: 'TRY', issueDate: '2026-04-15', dueDate: '2026-05-30', status: 'deposited' },
  { id: '3', kind: 'cheque', type: 'received', serial: 'ÇEK-2026-0453', issuer: 'GHI Otomotiv', bank: 'YKB', branch: 'Ataşehir', amount: 320000, currency: 'TRY', issueDate: '2026-03-20', dueDate: '2026-05-20', status: 'matured' },
  { id: '4', kind: 'cheque', type: 'given', serial: 'ÇEK-2026-0501', issuer: 'Kendi Çekimiz', bank: 'Akbank', branch: 'Merkez', amount: 250000, currency: 'TRY', issueDate: '2026-05-01', dueDate: '2026-06-15', status: 'portfolio' },
  { id: '5', kind: 'cheque', type: 'received', serial: 'ÇEK-2026-0454', issuer: 'JKL İnşaat', bank: 'Halkbank', branch: 'Üsküdar', amount: 1200000, currency: 'TRY', issueDate: '2026-04-25', dueDate: '2026-07-25', status: 'portfolio' },
  { id: '6', kind: 'cheque', type: 'received', serial: 'ÇEK-2026-0455', issuer: 'MNO Elektronik', bank: 'Vakıfbank', branch: 'Beşiktaş', amount: 95000, currency: 'TRY', issueDate: '2026-03-01', dueDate: '2026-04-30', status: 'bounced', notes: 'Karşılıksız çek - hukuki takip başlatıldı' },
  { id: '7', kind: 'note', type: 'received', serial: 'SEN-2026-0101', issuer: 'PQR Tekstil', bank: 'Garantili Senet', branch: '—', amount: 680000, currency: 'TRY', issueDate: '2026-04-01', dueDate: '2026-08-01', status: 'portfolio' },
  { id: '8', kind: 'note', type: 'given', serial: 'SEN-2026-0201', issuer: 'Kendi Senetimiz', bank: '—', branch: '—', amount: 420000, currency: 'TRY', issueDate: '2026-05-10', dueDate: '2026-09-10', status: 'portfolio' },
  { id: '9', kind: 'cheque', type: 'given', serial: 'ÇEK-2026-0502', issuer: 'Kendi Çekimiz', bank: 'Akbank', branch: 'Merkez', amount: 380000, currency: 'TRY', issueDate: '2026-05-15', dueDate: '2026-07-15', status: 'portfolio' },
  { id: '10', kind: 'note', type: 'received', serial: 'SEN-2026-0102', issuer: 'STU Gıda', bank: '—', branch: '—', amount: 175000, currency: 'TRY', issueDate: '2026-02-01', dueDate: '2026-05-01', status: 'matured' },
];

const STATUS_CONFIG: Record<ChequeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  portfolio: { label: 'Portföyde', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3.5 w-3.5" /> },
  deposited: { label: 'Tahsile Verildi', color: 'bg-teal-100 text-teal-800', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  matured: { label: 'Tahsil Edildi', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  bounced: { label: 'Karşılıksız', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  cancelled: { label: 'İptal', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-3.5 w-3.5" /> },
};

function fmt(n: number): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string): number {
  const today = new Date('2026-05-27');
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ChequesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'cheque' | 'note'>('all');
  const [typeFilter, setTypeFilter] = useState<ChequeType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: instruments = MOCK_INSTRUMENTS } = useQuery<Instrument[]>({
    queryKey: ['instruments'],
    queryFn: async () => {
      const res = await fetch('/api/v1/finance/cheques');
      if (!res.ok) return MOCK_INSTRUMENTS;
      return res.json();
    },
    initialData: MOCK_INSTRUMENTS,
  });

  const filtered = useMemo(() => instruments.filter((i) => {
    if (activeTab !== 'all' && i.kind !== activeTab) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    if (search && !i.serial.toLowerCase().includes(search.toLowerCase()) && !i.issuer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [instruments, activeTab, typeFilter, search]);

  const stats = useMemo(() => {
    const portfolio = instruments.filter((i) => i.status === 'portfolio' && i.type === 'received').reduce((s, i) => s + i.amount, 0);
    const given = instruments.filter((i) => i.status === 'portfolio' && i.type === 'given').reduce((s, i) => s + i.amount, 0);
    const bounced = instruments.filter((i) => i.status === 'bounced').length;
    const dueThisMonth = instruments.filter((i) => {
      const days = daysUntil(i.dueDate);
      return days >= 0 && days <= 30 && i.status === 'portfolio';
    }).length;
    return { portfolio, given, bounced, dueThisMonth };
  }, [instruments]);

  const handleExport = () => {
    const rows = filtered.map((i) => ({
      Tür: i.kind === 'cheque' ? 'Çek' : 'Senet',
      'Yön': i.type === 'received' ? 'Alınan' : 'Verilen',
      'Seri/No': i.serial,
      Keşideci: i.issuer,
      Banka: i.bank,
      Tutar: i.amount,
      'Düzenleme Tarihi': i.issueDate,
      'Vade Tarihi': i.dueDate,
      Durum: STATUS_CONFIG[i.status].label,
    }));
    exportToExcel(rows, 'cek-senet-takibi', 'Çek/Senet');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Çek / Senet Takibi</h1>
          <p className="text-muted-foreground">Portföy yönetimi, vade takibi ve tahsilat</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <PlusCircle className="h-4 w-4" /> Yeni Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Portföy (Alınan)</p>
          <p className="mt-1 text-2xl font-bold text-green-700">₺{fmt(stats.portfolio)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Portföy (Verilen)</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">₺{fmt(stats.given)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">30 Günde Vadesi Gelenler</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.dueThisMonth} adet</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Karşılıksız</p>
          <p className={cn('mt-1 text-2xl font-bold', stats.bounced > 0 ? 'text-red-600' : 'text-green-600')}>{stats.bounced} adet</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'cheque', 'note'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'all' ? 'Tümü' : t === 'cheque' ? 'Çekler' : 'Senetler'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ChequeType | 'all')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tümü (Alınan + Verilen)</option>
            <option value="received">Alınan</option>
            <option value="given">Verilen</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Seri no veya keşideci ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tür</th>
                <th className="px-4 py-2 text-left font-medium">Seri / No</th>
                <th className="px-4 py-2 text-left font-medium">Keşideci / Lehdar</th>
                <th className="px-4 py-2 text-left font-medium">Banka</th>
                <th className="px-4 py-2 text-right font-medium">Tutar</th>
                <th className="px-4 py-2 text-center font-medium">Vade Tarihi</th>
                <th className="px-4 py-2 text-center font-medium">Kalan Gün</th>
                <th className="px-4 py-2 text-center font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const days = daysUntil(item.dueDate);
                const st = STATUS_CONFIG[item.status];
                return (
                  <tr key={item.id} className={cn('border-b border-border/50 hover:bg-muted/30', item.status === 'bounced' && 'bg-red-50/40')}>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {item.kind === 'cheque' ? 'Çek' : 'Senet'} · {item.type === 'received' ? 'Alınan' : 'Verilen'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{item.serial}</td>
                    <td className="px-4 py-2 font-medium">{item.issuer}</td>
                    <td className="px-4 py-2 text-muted-foreground">{item.bank}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">₺{fmt(item.amount)}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{item.dueDate}</td>
                    <td className="px-4 py-2 text-center">
                      {item.status === 'portfolio' ? (
                        <span className={cn('text-xs font-medium', days < 0 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : days <= 30 ? 'text-yellow-600' : 'text-muted-foreground')}>
                          {days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', st.color)}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">Aramanızla eşleşen kayıt bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
