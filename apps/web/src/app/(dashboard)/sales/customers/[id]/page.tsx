'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Pencil, Building2, User, Mail, Phone, MapPin,
  CreditCard, TrendingUp, ShoppingCart, FileText, TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { useCustomer, useOrders, useInvoices } from '@/lib/api/hooks';
import { CustomerModal } from '@/components/modals/customer-modal';

type CustomerType = 'corporate' | 'individual';
type CustomerStatus = 'active' | 'passive' | 'blocked';

const STATUS_CLASSES: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  passive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Aktif',
  passive: 'Pasif',
  blocked: 'Bloke',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak', confirmed: 'Onaylandı', processing: 'Hazırlanıyor',
  shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak', sent: 'Gönderildi', paid: 'Ödendi', overdue: 'Vadesi Geçti', cancelled: 'İptal',
};

function InfoRow({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value ?? '-'}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold mt-0.5 ${valueClassName ?? 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: orders } = useOrders({ customerId: id });
  const { data: invoices } = useInvoices({ customerId: id });

  const allOrders = Array.isArray(orders) ? orders as Record<string, unknown>[] : [];
  const allInvoices = Array.isArray(invoices) ? invoices as Record<string, unknown>[] : [];
  const ordersList = allOrders.slice(0, 5);
  const invoicesList = allInvoices.slice(0, 5);

  const stats = useMemo(() => {
    const totalSpend = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0);
    return { totalSpend };
  }, [allInvoices]);

  if (customerLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Müşteri bulunamadı</p>
        <Link href="/sales/customers" className="text-primary hover:underline text-sm mt-2 inline-block">
          Müşteri Listesi
        </Link>
      </div>
    );
  }

  const c = customer as Record<string, unknown>;

  const balance = Number(c.balance ?? 0);
  const creditLimit = Number(c.creditLimit ?? 0);
  const usedCredit = Math.max(0, -balance);
  const creditUsedPct = creditLimit > 0 ? Math.min(100, (usedCredit / creditLimit) * 100) : 0;

  const fmtTRY = (n: number) =>
    n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/customers"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {c.type === 'corporate' ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{c.name as string}</h1>
              <p className="text-sm text-muted-foreground">{c.code as string}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[(c.status as CustomerStatus)] ?? ''}`}>
            {STATUS_LABELS[(c.status as CustomerStatus)] ?? c.status as string}
          </span>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Düzenle
        </button>
      </div>

      {/* Financial Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Toplam Sipariş"
          value={String(allOrders.length)}
        />
        <StatCard
          icon={FileText}
          label="Toplam Fatura"
          value={String(allInvoices.length)}
        />
        <StatCard
          icon={TrendingUp}
          label="Toplam Harcama"
          value={fmtTRY(stats.totalSpend)}
        />
        <StatCard
          icon={TrendingDown}
          label="Açık Bakiye"
          value={fmtTRY(balance)}
          valueClassName={balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">İletişim Bilgileri</h2>
          <InfoRow icon={Mail} label="E-posta" value={c.email as string} />
          <InfoRow icon={Phone} label="Telefon" value={c.phone as string} />
          <InfoRow icon={MapPin} label="Adres" value={c.address as string} />
          {c.taxNumber && <InfoRow icon={Building2} label="Vergi No" value={`${c.taxNumber} - ${c.taxOffice ?? ''}`} />}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Finansal Bilgiler</h2>
          <InfoRow
            icon={TrendingUp}
            label="Bakiye"
            value={fmtTRY(balance)}
          />
          <InfoRow
            icon={CreditCard}
            label="Kredi Limiti"
            value={fmtTRY(creditLimit)}
          />
          {/* Credit Limit Progress Bar */}
          {creditLimit > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Kullanılan Kredi</span>
                <span>
                  {fmtTRY(usedCredit)} / {fmtTRY(creditLimit)} ({creditUsedPct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    creditUsedPct >= 90
                      ? 'bg-red-500'
                      : creditUsedPct >= 60
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${creditUsedPct}%` }}
                />
              </div>
            </div>
          )}
          {c.notes && <InfoRow icon={Building2} label="Notlar" value={c.notes as string} />}
        </div>
      </div>

      {/* Recent Orders & Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Son Siparişler</h2>
          </div>
          {ordersList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Sipariş bulunamadı</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Sipariş No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tarih</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Durum</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((order: Record<string, unknown>) => (
                    <tr key={order.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">
                        <Link
                          href={`/sales/orders/${order.id as string}`}
                          className="text-primary hover:underline"
                        >
                          {order.orderNumber as string}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt as string).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {ORDER_STATUS_LABELS[order.status as string] ?? order.status as string}
                      </td>
                      <td className="px-4 py-2 text-right text-foreground text-xs">
                        {fmtTRY(Number(order.netAmount ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border">
                <Link
                  href={`/sales/orders?customerId=${id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Tümünü Gör →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Son Faturalar</h2>
          </div>
          {invoicesList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Fatura bulunamadı</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Fatura No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tarih</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Durum</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesList.map((invoice: Record<string, unknown>) => (
                    <tr key={invoice.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">
                        <Link
                          href={`/sales/invoices/${invoice.id as string}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.invoiceNumber as string}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {invoice.issueDate
                          ? new Date(invoice.issueDate as string).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {INVOICE_STATUS_LABELS[invoice.status as string] ?? invoice.status as string}
                      </td>
                      <td className="px-4 py-2 text-right text-foreground text-xs">
                        {fmtTRY(Number(invoice.totalAmount ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border">
                <Link
                  href={`/sales/invoices?customerId=${id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Tümünü Gör →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <CustomerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editData={c as Parameters<typeof CustomerModal>[0]['editData']}
      />
    </div>
  );
}
