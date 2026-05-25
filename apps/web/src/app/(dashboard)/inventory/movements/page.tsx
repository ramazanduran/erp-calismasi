'use client';

import { useState } from 'react';
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { useMovements } from '@/lib/api/hooks';
import { MovementModal } from '@/components/modals/movement-modal';

type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

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

function TypeIcon({ type }: { type: MovementType }) {
  if (type === 'in') return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
  if (type === 'out') return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
  return <RefreshCw className="h-4 w-4 text-blue-600" />;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: movements, isLoading } = useMovements({ search, type: typeFilter || undefined });

  const movementsList = Array.isArray(movements) ? movements : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stok Hareketleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stok giriş, çıkış ve düzeltme işlemlerini takip edin
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Hareket
        </button>
      </div>

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
              {isLoading ? (
                <SkeletonRows />
              ) : movementsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-2">
                      <p>Henüz kayıt yok</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-primary hover:underline text-sm"
                      >
                        Yeni Hareket Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                movementsList.map((movement: Record<string, unknown>) => {
                  const product = movement.product as Record<string, unknown> | undefined;
                  const qty = Number(movement.quantity ?? 0);
                  return (
                    <tr
                      key={movement.id as string}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TypeIcon type={movement.type as MovementType} />
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_CLASSES[(movement.type as MovementType)] ?? ''}`}>
                            {TYPE_LABELS[(movement.type as MovementType)] ?? movement.type as string}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{product?.name as string ?? '-'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{product?.code as string ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={qty < 0 ? 'text-red-600' : 'text-foreground'}>
                          {qty > 0 ? '+' : ''}{qty.toLocaleString('tr-TR')} {product?.unit as string ?? ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {movement.unitCost != null
                          ? Number(movement.unitCost).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {(movement.reference as string) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(movement.notes as string) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(movement.createdAt as string).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{movementsList.length} hareket gösteriliyor</span>
          </div>
        )}
      </div>

      <MovementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
