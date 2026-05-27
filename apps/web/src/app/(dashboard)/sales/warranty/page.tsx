'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Shield, AlertTriangle, CheckCircle2, Clock, Search, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'claimed' | 'void';
type ClaimStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

interface WarrantyRecord {
  id: string;
  productName: string;
  productCode: string;
  serialNumber: string;
  customerName: string;
  customerId: string;
  purchaseDate: string;
  warrantyMonths: number;
  expiryDate: string;
  status: WarrantyStatus;
  claimsCount: number;
}

interface WarrantyClaim {
  id: string;
  warrantyId: string;
  productName: string;
  customerName: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt?: string;
  technicianName?: string;
}

const MOCK_WARRANTIES: WarrantyRecord[] = [
  { id: 'w1', productName: 'Endüstriyel Kompresör X500', productCode: 'EK-X500', serialNumber: 'SN-2024-00451', customerName: 'ABC Ticaret A.Ş.', customerId: 'c1', purchaseDate: '2024-05-15', warrantyMonths: 24, expiryDate: '2026-05-15', status: 'expiring_soon', claimsCount: 0 },
  { id: 'w2', productName: 'CNC Tezgah M200', productCode: 'CNC-M200', serialNumber: 'SN-2025-00128', customerName: 'DEF Yapı Ltd.', customerId: 'c2', purchaseDate: '2025-01-10', warrantyMonths: 36, expiryDate: '2028-01-10', status: 'active', claimsCount: 1 },
  { id: 'w3', productName: 'Hidrolik Pres HP80', productCode: 'HP-80', serialNumber: 'SN-2023-00887', customerName: 'GHI Otomotiv', customerId: 'c3', purchaseDate: '2023-03-20', warrantyMonths: 24, expiryDate: '2025-03-20', status: 'expired', claimsCount: 2 },
  { id: 'w4', productName: 'Lazer Kesim Makinesi', productCode: 'LK-3000', serialNumber: 'SN-2025-00332', customerName: 'JKL İnşaat', customerId: 'c4', purchaseDate: '2025-08-05', warrantyMonths: 24, expiryDate: '2027-08-05', status: 'active', claimsCount: 0 },
  { id: 'w5', productName: 'Endüstriyel Kompresör X500', productCode: 'EK-X500', serialNumber: 'SN-2024-00672', customerName: 'MNO Elektronik', customerId: 'c5', purchaseDate: '2024-11-01', warrantyMonths: 24, expiryDate: '2026-11-01', status: 'active', claimsCount: 0 },
  { id: 'w6', productName: 'Torna Tezgahı T120', productCode: 'TT-120', serialNumber: 'SN-2024-00211', customerName: 'PQR Tekstil', customerId: 'c6', purchaseDate: '2024-02-14', warrantyMonths: 12, expiryDate: '2025-02-14', status: 'claimed', claimsCount: 3 },
  { id: 'w7', productName: 'CNC Tezgah M200', productCode: 'CNC-M200', serialNumber: 'SN-2026-00044', customerName: 'STU Gıda A.Ş.', customerId: 'c7', purchaseDate: '2026-03-01', warrantyMonths: 36, expiryDate: '2029-03-01', status: 'active', claimsCount: 0 },
];

const MOCK_CLAIMS: WarrantyClaim[] = [
  { id: 'cl1', warrantyId: 'w2', productName: 'CNC Tezgah M200', customerName: 'DEF Yapı Ltd.', description: 'Soğutma sistemi arızası, makine ısınıyor.', status: 'in_progress', createdAt: '2026-05-10', technicianName: 'Burak Yıldız' },
  { id: 'cl2', warrantyId: 'w6', productName: 'Torna Tezgahı T120', customerName: 'PQR Tekstil', description: 'Ana motor çalışmıyor, yazılım hatası veriyor.', status: 'resolved', createdAt: '2026-03-15', resolvedAt: '2026-03-22', technicianName: 'Emre Güler' },
  { id: 'cl3', warrantyId: 'w6', productName: 'Torna Tezgahı T120', customerName: 'PQR Tekstil', description: 'Titreşim sorunu devam ediyor.', status: 'resolved', createdAt: '2026-04-02', resolvedAt: '2026-04-08', technicianName: 'Emre Güler' },
  { id: 'cl4', warrantyId: 'w6', productName: 'Torna Tezgahı T120', customerName: 'PQR Tekstil', description: 'Parça değişimi gerekiyor (rulman).', status: 'open', createdAt: '2026-05-20' },
  { id: 'cl5', warrantyId: 'w3', productName: 'Hidrolik Pres HP80', customerName: 'GHI Otomotiv', description: 'Valf sızıntısı, yağ kaçağı.', status: 'rejected', createdAt: '2025-04-10', resolvedAt: '2025-04-15' },
];

const STATUS_CONFIG: Record<WarrantyStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Aktif', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  expiring_soon: { label: 'Yakında Bitiyor', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  expired: { label: 'Süresi Doldu', color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-3.5 w-3.5" /> },
  claimed: { label: 'Talep Var', color: 'bg-blue-100 text-blue-800', icon: <Wrench className="h-3.5 w-3.5" /> },
  void: { label: 'İptal', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

const CLAIM_STATUS: Record<ClaimStatus, { label: string; color: string }> = {
  open: { label: 'Açık', color: 'bg-orange-100 text-orange-800' },
  in_progress: { label: 'İşlemde', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Çözüldü', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-800' },
};

function daysUntilExpiry(expiry: string): number {
  const today = new Date('2026-05-27');
  const exp = new Date(expiry);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function WarrantyPage() {
  const [activeTab, setActiveTab] = useState<'warranties' | 'claims'>('warranties');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: warranties = MOCK_WARRANTIES } = useQuery<WarrantyRecord[]>({
    queryKey: ['warranties'],
    queryFn: async () => {
      const res = await fetch('/api/v1/sales/warranties');
      if (!res.ok) return MOCK_WARRANTIES;
      return res.json();
    },
    initialData: MOCK_WARRANTIES,
  });

  const { data: claims = MOCK_CLAIMS } = useQuery<WarrantyClaim[]>({
    queryKey: ['warranty-claims'],
    queryFn: async () => {
      const res = await fetch('/api/v1/sales/warranty-claims');
      if (!res.ok) return MOCK_CLAIMS;
      return res.json();
    },
    initialData: MOCK_CLAIMS,
  });

  const filteredWarranties = useMemo(() => warranties.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (search && !w.productName.toLowerCase().includes(search.toLowerCase()) && !w.customerName.toLowerCase().includes(search.toLowerCase()) && !w.serialNumber.includes(search)) return false;
    return true;
  }), [warranties, statusFilter, search]);

  const stats = {
    active: warranties.filter((w) => w.status === 'active').length,
    expiringSoon: warranties.filter((w) => w.status === 'expiring_soon').length,
    openClaims: claims.filter((c) => c.status === 'open' || c.status === 'in_progress').length,
    totalClaims: claims.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Garanti Takibi</h1>
          <p className="text-muted-foreground">Ürün garantileri, servis talepleri ve takip</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          <PlusCircle className="h-4 w-4" /> Garanti Kaydı
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-green-600" /><p className="text-sm text-muted-foreground">Aktif Garanti</p></div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-yellow-600" /><p className="text-sm text-muted-foreground">90 Gün İçinde Bitiyor</p></div>
          <p className={cn('text-2xl font-bold', stats.expiringSoon > 0 ? 'text-yellow-600' : 'text-muted-foreground')}>{stats.expiringSoon}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Wrench className="h-4 w-4 text-blue-600" /><p className="text-sm text-muted-foreground">Açık Talep</p></div>
          <p className={cn('text-2xl font-bold', stats.openClaims > 0 ? 'text-orange-600' : 'text-green-600')}>{stats.openClaims}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Talep</p>
          <p className="text-2xl font-bold">{stats.totalClaims}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([
          { id: 'warranties', label: 'Garanti Kayıtları' },
          { id: 'claims', label: `Servis Talepleri (${stats.openClaims})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'warranties' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'expiring_soon', 'expired', 'claimed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ürün, müşteri veya seri no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Ürün</th>
                    <th className="px-4 py-2 text-left font-medium">Seri No</th>
                    <th className="px-4 py-2 text-left font-medium">Müşteri</th>
                    <th className="px-4 py-2 text-center font-medium">Satış Tarihi</th>
                    <th className="px-4 py-2 text-center font-medium">Bitiş Tarihi</th>
                    <th className="px-4 py-2 text-center font-medium">Kalan</th>
                    <th className="px-4 py-2 text-center font-medium">Talepler</th>
                    <th className="px-4 py-2 text-center font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.map((w) => {
                    const days = daysUntilExpiry(w.expiryDate);
                    const st = STATUS_CONFIG[w.status];
                    return (
                      <tr key={w.id} className={cn('border-b border-border/50 hover:bg-muted/30', w.status === 'expiring_soon' && 'bg-yellow-50/30')}>
                        <td className="px-4 py-2">
                          <p className="font-medium">{w.productName}</p>
                          <p className="text-xs text-muted-foreground">{w.productCode}</p>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">{w.serialNumber}</td>
                        <td className="px-4 py-2">{w.customerName}</td>
                        <td className="px-4 py-2 text-center text-muted-foreground">{w.purchaseDate}</td>
                        <td className="px-4 py-2 text-center">{w.expiryDate}</td>
                        <td className="px-4 py-2 text-center">
                          {w.status === 'active' || w.status === 'expiring_soon' ? (
                            <span className={cn('text-xs font-medium', days <= 30 ? 'text-red-600' : days <= 90 ? 'text-yellow-600' : 'text-green-600')}>
                              {days > 0 ? `${days} gün` : 'Doldu'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={cn('text-sm font-medium', w.claimsCount > 0 ? 'text-orange-600' : 'text-muted-foreground')}>
                            {w.claimsCount}
                          </span>
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
          </div>
        </>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-3">
          {claims.map((claim) => {
            const st = CLAIM_STATUS[claim.status];
            return (
              <div key={claim.id} className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', claim.status === 'open' && 'border-orange-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{claim.productName}</p>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', st.color)}>{st.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{claim.customerName}</p>
                    <p className="text-sm">{claim.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Açılış: {claim.createdAt}</span>
                      {claim.resolvedAt && <span>Kapanış: {claim.resolvedAt}</span>}
                      {claim.technicianName && <span>Teknisyen: {claim.technicianName}</span>}
                    </div>
                  </div>
                  {(claim.status === 'open' || claim.status === 'in_progress') && (
                    <div className="flex gap-2 shrink-0">
                      <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Ata</button>
                      <button className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90">Çözdü</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
