'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Search, Package, Hash, CalendarDays, MapPin, ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

type TrackingType = 'lot' | 'serial';
type LotStatus = 'available' | 'quarantine' | 'consumed' | 'expired' | 'rejected';

interface LotMovement {
  id: string;
  date: string;
  type: 'receipt' | 'issue' | 'transfer' | 'adjust';
  quantity: number;
  warehouse: string;
  reference: string;
  note?: string;
}

interface LotRecord {
  id: string;
  lotNumber: string;
  serialNumber?: string;
  trackingType: TrackingType;
  status: LotStatus;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  warehouse: string;
  location: string;
  manufacturingDate?: string;
  expiryDate?: string;
  supplierName?: string;
  supplierLot?: string;
  receiptDate: string;
  movements: LotMovement[];
}

const STATUS_CONFIG: Record<LotStatus, { label: string; color: string; bg: string }> = {
  available:  { label: 'Mevcut',       color: 'text-green-700',  bg: 'bg-green-100' },
  quarantine: { label: 'Karantina',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
  consumed:   { label: 'Tüketildi',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  expired:    { label: 'Süresi Doldu', color: 'text-red-700',    bg: 'bg-red-100' },
  rejected:   { label: 'Reddedildi',   color: 'text-red-700',    bg: 'bg-red-100' },
};

const MOCK_LOTS: LotRecord[] = [
  {
    id: 'l1', lotNumber: 'LOT-2026-0441', trackingType: 'lot', status: 'available',
    productName: 'Alüminyum Profil 40x40', productCode: 'ALU-4040',
    quantity: 850, unit: 'adet', warehouse: 'Depo A', location: 'A-03-02',
    manufacturingDate: '2026-04-15', expiryDate: undefined,
    supplierName: 'Alümetal A.Ş.', supplierLot: 'ALP-2604-18',
    receiptDate: '2026-04-20',
    movements: [
      { id: 'm1', date: '2026-04-20', type: 'receipt', quantity: 1000, warehouse: 'Depo A', reference: 'PO-2026-0312', note: 'Tedarikçiden giriş' },
      { id: 'm2', date: '2026-05-05', type: 'issue', quantity: -150, warehouse: 'Depo A', reference: 'ÜRE-2026-0048' },
    ],
  },
  {
    id: 'l2', lotNumber: 'LOT-2026-0442', trackingType: 'lot', status: 'quarantine',
    productName: 'O-Ring 25mm', productCode: 'ORG-025',
    quantity: 5000, unit: 'adet', warehouse: 'Depo B', location: 'B-01-04',
    manufacturingDate: '2026-03-01', expiryDate: '2027-03-01',
    supplierName: 'Conta San. Ltd.', supplierLot: 'CS-2603-44',
    receiptDate: '2026-05-10',
    movements: [
      { id: 'm3', date: '2026-05-10', type: 'receipt', quantity: 5000, warehouse: 'Depo B', reference: 'PO-2026-0389', note: 'Kalite kontrol bekliyor' },
    ],
  },
  {
    id: 'l3', lotNumber: 'SN-2026-00301', serialNumber: 'SN-2026-00301', trackingType: 'serial', status: 'available',
    productName: 'Elektronik Kontrol Kartı', productCode: 'ELK-KK-001',
    quantity: 1, unit: 'adet', warehouse: 'Depo A', location: 'A-05-01',
    manufacturingDate: '2026-05-15',
    receiptDate: '2026-05-16',
    movements: [
      { id: 'm4', date: '2026-05-16', type: 'receipt', quantity: 1, warehouse: 'Depo A', reference: 'ÜRE-2026-0055' },
    ],
  },
  {
    id: 'l4', lotNumber: 'SN-2026-00302', serialNumber: 'SN-2026-00302', trackingType: 'serial', status: 'consumed',
    productName: 'Elektronik Kontrol Kartı', productCode: 'ELK-KK-001',
    quantity: 0, unit: 'adet', warehouse: '-', location: '-',
    manufacturingDate: '2026-05-15',
    receiptDate: '2026-05-16',
    movements: [
      { id: 'm5', date: '2026-05-16', type: 'receipt', quantity: 1, warehouse: 'Depo A', reference: 'ÜRE-2026-0055' },
      { id: 'm6', date: '2026-05-20', type: 'issue', quantity: -1, warehouse: 'Depo A', reference: 'SIP-2026-0412', note: 'Müşteriye sevk' },
    ],
  },
  {
    id: 'l5', lotNumber: 'LOT-2026-0380', trackingType: 'lot', status: 'expired',
    productName: 'Yağlayıcı Sprey 500ml', productCode: 'YAG-SPR-500',
    quantity: 24, unit: 'adet', warehouse: 'Kimyasal Depo', location: 'K-02-01',
    manufacturingDate: '2025-11-01', expiryDate: '2026-05-01',
    supplierName: 'Kimya Sanayi A.Ş.',
    receiptDate: '2025-12-01',
    movements: [
      { id: 'm7', date: '2025-12-01', type: 'receipt', quantity: 48, warehouse: 'Kimyasal Depo', reference: 'PO-2025-0812' },
      { id: 'm8', date: '2026-01-15', type: 'issue', quantity: -24, warehouse: 'Kimyasal Depo', reference: 'ÜRE-2026-0010' },
    ],
  },
  {
    id: 'l6', lotNumber: 'LOT-2026-0438', trackingType: 'lot', status: 'available',
    productName: 'Çelik Blok 80x80x120', productCode: 'CEL-BLK-001',
    quantity: 120, unit: 'adet', warehouse: 'Depo A', location: 'A-01-05',
    manufacturingDate: '2026-04-01',
    supplierName: 'Çelik Metal A.Ş.', supplierLot: 'CM-2604-07',
    receiptDate: '2026-04-10',
    movements: [
      { id: 'm9', date: '2026-04-10', type: 'receipt', quantity: 200, warehouse: 'Depo A', reference: 'PO-2026-0298' },
      { id: 'm10', date: '2026-05-05', type: 'issue', quantity: -80, warehouse: 'Depo A', reference: 'ÜRE-2026-0056' },
    ],
  },
  {
    id: 'l7', lotNumber: 'LOT-2026-0445', trackingType: 'lot', status: 'available',
    productName: 'Plastik Granül PP', productCode: 'PLT-GRN-PP',
    quantity: 3200, unit: 'kg', warehouse: 'Hammadde Deposu', location: 'H-04-02',
    manufacturingDate: '2026-05-01', expiryDate: '2028-05-01',
    supplierName: 'Polimer San. Ltd.', supplierLot: 'PSL-0526-9',
    receiptDate: '2026-05-20',
    movements: [
      { id: 'm11', date: '2026-05-20', type: 'receipt', quantity: 3200, warehouse: 'Hammadde Deposu', reference: 'PO-2026-0405' },
    ],
  },
];

const MOVEMENT_TYPE: Record<string, { label: string; color: string }> = {
  receipt:  { label: 'Giriş',    color: 'text-green-600' },
  issue:    { label: 'Çıkış',    color: 'text-red-600' },
  transfer: { label: 'Transfer', color: 'text-blue-600' },
  adjust:   { label: 'Düzeltme', color: 'text-yellow-600' },
};

function daysUntilExpiry(expiryDate: string): number {
  const today = new Date('2026-05-27');
  const expiry = new Date(expiryDate);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function LotDetailModal({ lot, onClose }: { lot: LotRecord; onClose: () => void }) {
  const daysLeft = lot.expiryDate ? daysUntilExpiry(lot.expiryDate) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold font-mono">{lot.lotNumber}</h2>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CONFIG[lot.status].bg, STATUS_CONFIG[lot.status].color)}>
                {STATUS_CONFIG[lot.status].label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{lot.productName} · {lot.productCode}</p>
          </div>
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Mevcut Stok</p>
            <p className="font-bold text-lg">{lot.quantity} {lot.unit}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Konum</p>
            <p className="font-medium">{lot.warehouse}</p>
            <p className="text-xs text-muted-foreground">{lot.location}</p>
          </div>
          {lot.expiryDate && (
            <div className={cn('rounded-lg p-3', daysLeft !== null && daysLeft < 0 ? 'bg-red-50' : daysLeft !== null && daysLeft < 30 ? 'bg-yellow-50' : 'bg-muted/30')}>
              <p className="text-xs text-muted-foreground mb-0.5">Son Kullanma Tarihi</p>
              <p className="font-medium">{lot.expiryDate}</p>
              {daysLeft !== null && <p className={cn('text-xs', daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-yellow-600' : 'text-muted-foreground')}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}
              </p>}
            </div>
          )}
          {lot.supplierName && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Tedarikçi</p>
              <p className="font-medium text-sm">{lot.supplierName}</p>
              {lot.supplierLot && <p className="text-xs text-muted-foreground">Lot: {lot.supplierLot}</p>}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Hareket Geçmişi</p>
          <div className="space-y-2">
            {lot.movements.map((mv) => {
              const mc = MOVEMENT_TYPE[mv.type];
              return (
                <div key={mv.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border text-sm">
                  <span className="text-xs text-muted-foreground w-20">{mv.date}</span>
                  <span className={cn('text-xs font-medium w-16', mc.color)}>{mc.label}</span>
                  <span className={cn('font-medium w-20', mv.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                    {mv.quantity > 0 ? '+' : ''}{mv.quantity} {lot.unit}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{mv.reference}</span>
                  {mv.note && <span className="text-xs text-muted-foreground">{mv.note}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LotTrackingPage() {
  const [lots] = useState<LotRecord[]>(MOCK_LOTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TrackingType | 'all'>('all');
  const [selectedLot, setSelectedLot] = useState<LotRecord | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => lots.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (typeFilter !== 'all' && l.trackingType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.lotNumber.toLowerCase().includes(q) &&
          !l.productName.toLowerCase().includes(q) &&
          !l.productCode.toLowerCase().includes(q) &&
          !(l.serialNumber?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [lots, statusFilter, typeFilter, search]);

  const stats = useMemo(() => ({
    total: lots.length,
    available: lots.filter((l) => l.status === 'available').length,
    quarantine: lots.filter((l) => l.status === 'quarantine').length,
    expiringSoon: lots.filter((l) => l.expiryDate && daysUntilExpiry(l.expiryDate) >= 0 && daysUntilExpiry(l.expiryDate) <= 30).length,
  }), [lots]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lot / Seri Takibi</h1>
          <p className="text-muted-foreground">Lot numaraları ve seri numaralarıyla stok izlenebilirliği</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((l) => ({
                lot: l.lotNumber, seri: l.serialNumber ?? '', tip: l.trackingType === 'lot' ? 'Lot' : 'Seri',
                urun: l.productName, kod: l.productCode, durum: STATUS_CONFIG[l.status].label,
                miktar: l.quantity, birim: l.unit, depo: l.warehouse, konum: l.location,
                tedarikci: l.supplierName ?? '', skt: l.expiryDate ?? '', giris: l.receiptDate,
              })),
              [
                { key: 'lot', header: 'Lot/Seri No', width: 16 },
                { key: 'tip', header: 'Tip', width: 8 },
                { key: 'urun', header: 'Ürün', width: 28 },
                { key: 'kod', header: 'Kod', width: 14 },
                { key: 'durum', header: 'Durum', width: 14 },
                { key: 'miktar', header: 'Miktar', width: 10 },
                { key: 'birim', header: 'Birim', width: 8 },
                { key: 'depo', header: 'Depo', width: 16 },
                { key: 'konum', header: 'Konum', width: 12 },
                { key: 'tedarikci', header: 'Tedarikçi', width: 20 },
                { key: 'skt', header: 'Son Kullanma', width: 14 },
                { key: 'giris', header: 'Giriş Tarihi', width: 12 },
              ],
              'lot-takibi', 'Lot Takibi'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            <PlusCircle className="h-4 w-4" /> Lot Girişi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Kayıt', value: stats.total, color: 'text-foreground' },
          { label: 'Mevcut', value: stats.available, color: 'text-green-600' },
          { label: 'Karantina', value: stats.quarantine, color: 'text-yellow-600' },
          { label: 'Yakında Dolacak', value: stats.expiringSoon, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Lot no, ürün adı veya kodu..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {([['all', 'Tümü'], ['lot', 'Lot'], ['serial', 'Seri No']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTypeFilter(v)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                typeFilter === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setStatusFilter('all')}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            Tüm Durumlar
          </button>
          {(Object.entries(STATUS_CONFIG) as [LotStatus, typeof STATUS_CONFIG[LotStatus]][]).map(([v, c]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                statusFilter === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-8 px-2 py-2.5"></th>
              {['Lot / Seri No', 'Ürün', 'Tip', 'Durum', 'Miktar', 'Depo / Konum', 'Tedarikçi', 'SKT', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Lot kaydı bulunamadı</td></tr>
            ) : filtered.map((lot) => {
              const sc = STATUS_CONFIG[lot.status];
              const expanded = expandedIds.has(lot.id);
              const daysLeft = lot.expiryDate ? daysUntilExpiry(lot.expiryDate) : null;
              return (
                <>
                  <tr key={lot.id} className={cn('border-b border-border/50 hover:bg-muted/20', expanded && 'bg-muted/10')}>
                    <td className="px-2 py-3 text-center">
                      <button onClick={() => toggleExpand(lot.id)} className="text-muted-foreground hover:text-foreground">
                        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {lot.trackingType === 'lot' ? <Hash className="h-3.5 w-3.5 text-muted-foreground" /> : <Package className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="font-mono text-xs font-medium">{lot.lotNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{lot.productName}</p>
                      <p className="text-xs text-muted-foreground">{lot.productCode}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lot.trackingType === 'lot' ? 'Lot' : 'Seri No'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc.bg, sc.color)}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{lot.quantity} <span className="text-xs text-muted-foreground">{lot.unit}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{lot.warehouse}</span>
                        <span className="text-muted-foreground">· {lot.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lot.supplierName ?? '-'}</td>
                    <td className="px-4 py-3 text-xs">
                      {lot.expiryDate ? (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span className={cn(daysLeft !== null && daysLeft < 0 ? 'text-red-600 font-medium' : daysLeft !== null && daysLeft < 30 ? 'text-yellow-600' : 'text-muted-foreground')}>
                            {lot.expiryDate}
                          </span>
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedLot(lot)} className="text-xs text-primary hover:underline">Detay</button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr key={`${lot.id}-expand`} className="border-b border-border/50 bg-muted/10">
                      <td colSpan={9} className="px-8 py-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Hareket Geçmişi</p>
                        <div className="space-y-1">
                          {lot.movements.map((mv) => {
                            const mc = MOVEMENT_TYPE[mv.type];
                            return (
                              <div key={mv.id} className="flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground w-20">{mv.date}</span>
                                <span className={cn('font-medium w-14', mc.color)}>{mc.label}</span>
                                <span className={cn('w-20', mv.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                                  {mv.quantity > 0 ? '+' : ''}{mv.quantity} {lot.unit}
                                </span>
                                <span className="font-mono text-muted-foreground">{mv.reference}</span>
                                {mv.note && <span className="text-muted-foreground">{mv.note}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedLot && <LotDetailModal lot={selectedLot} onClose={() => setSelectedLot(null)} />}
    </div>
  );
}
