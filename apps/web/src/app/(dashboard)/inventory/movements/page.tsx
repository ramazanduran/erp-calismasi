'use client';

import { useState } from 'react';
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

interface StockMovement {
  id: string;
  product: { code: string; name: string; unit: string };
  type: MovementType;
  quantity: number;
  unitCost: number | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: '1',
    product: { code: 'URN-001', name: 'Laptop Dell Inspiron 15', unit: 'adet' },
    type: 'in',
    quantity: 10,
    unitCost: 20000,
    reference: 'SAL-2024-001',
    notes: 'Satın alma girişi',
    createdAt: '2024-03-25T10:30:00',
  },
  {
    id: '2',
    product: { code: 'URN-001', name: 'Laptop Dell Inspiron 15', unit: 'adet' },
    type: 'out',
    quantity: 2,
    unitCost: null,
    reference: 'SIP-2024-001',
    notes: 'Sipariş sevkiyatı',
    createdAt: '2024-03-26T14:15:00',
  },
  {
    id: '3',
    product: { code: 'URN-002', name: 'Mekanik Klavye Logitech', unit: 'adet' },
    type: 'adjustment',
    quantity: -5,
    unitCost: null,
    reference: 'SAY-2024-001',
    notes: 'Sayım farkı düzeltmesi',
    createdAt: '2024-03-27T09:00:00',
  },
  {
    id: '4',
    product: { code: 'URN-004', name: 'Yazıcı Mürekkebi HP 680', unit: 'adet' },
    type: 'in',
    quantity: 50,
    unitCost: 280,
    reference: 'SAL-2024-002',
    notes: null,
    createdAt: '2024-03-28T11:45:00',
  },
];

const TYPE_LABELS: Record<MovementType, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  adjustment: 'Düzeltme',
  transfer: 'Transfer',
};

const TYPE_CLASSES: Record<MovementType, string> = {
  in: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  transfer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const TypeIcon = ({ type }: { type: MovementType }) => {
  if (type === 'in') return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
  if (type === 'out') return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
  return <RefreshCw className="h-4 w-4 text-blue-600" />;
};

export default function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = MOCK_MOVEMENTS.filter((m) => {
    const matchSearch =
      !search ||
      m.product.name.toLowerCase().includes(search.toLowerCase()) ||
      m.product.code.toLowerCase().includes(search.toLowerCase()) ||
      (m.reference ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stok Hareketleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stok giriş, çıkış ve düzeltme işlemlerini takip edin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Hareket
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Hareket', value: MOCK_MOVEMENTS.length, icon: RefreshCw, color: 'text-foreground' },
          { label: 'Stok Giriş', value: MOCK_MOVEMENTS.filter(m => m.type === 'in').length, icon: ArrowUpCircle, color: 'text-green-600' },
          { label: 'Stok Çıkış', value: MOCK_MOVEMENTS.filter(m => m.type === 'out').length, icon: ArrowDownCircle, color: 'text-red-600' },
          { label: 'Düzeltme', value: MOCK_MOVEMENTS.filter(m => m.type === 'adjustment').length, icon: RefreshCw, color: 'text-blue-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ara (ürün, referans)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm İşlem Tipleri</option>
          <option value="in">Giriş</option>
          <option value="out">Çıkış</option>
          <option value="adjustment">Düzeltme</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ürün</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Miktar</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Birim Maliyet</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referans</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notlar</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Stok hareketi bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon type={movement.type} />
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_CLASSES[movement.type]}`}
                        >
                          {TYPE_LABELS[movement.type]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{movement.product.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{movement.product.code}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={movement.quantity < 0 ? 'text-red-600' : 'text-foreground'}>
                        {movement.quantity > 0 ? '+' : ''}{Number(movement.quantity).toLocaleString('tr-TR')} {movement.product.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {movement.unitCost != null
                        ? movement.unitCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {movement.reference ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {movement.notes ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(movement.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} hareket gösteriliyor</span>
          <span>Toplam: {MOCK_MOVEMENTS.length}</span>
        </div>
      </div>
    </div>
  );
}
