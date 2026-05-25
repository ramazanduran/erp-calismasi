'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Building2, User, Mail, Phone, MapPin, CreditCard, TrendingUp } from 'lucide-react';
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

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: orders } = useOrders({ customerId: id });
  const { data: invoices } = useInvoices({ customerId: id });

  const ordersList = Array.isArray(orders) ? orders.slice(0, 5) : [];
  const invoicesList = Array.isArray(invoices) ? invoices.slice(0, 5) : [];

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

  return (
    <div className="space-y-6">
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
            value={Number(c.balance ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          />
          <InfoRow
            icon={CreditCard}
            label="Kredi Limiti"
            value={Number(c.creditLimit ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          />
          {c.notes && <InfoRow icon={Building2} label="Notlar" value={c.notes as string} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Son Siparişler</h2>
          </div>
          {ordersList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Sipariş bulunamadı</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {ordersList.map((order: Record<string, unknown>) => (
                  <tr key={order.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-primary">{order.orderNumber as string}</td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {Number(order.netAmount ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {ORDER_STATUS_LABELS[order.status as string] ?? order.status as string}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Son Faturalar</h2>
          </div>
          {invoicesList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Fatura bulunamadı</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {invoicesList.map((invoice: Record<string, unknown>) => (
                  <tr key={invoice.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-primary">{invoice.invoiceNumber as string}</td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {Number(invoice.totalAmount ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {INVOICE_STATUS_LABELS[invoice.status as string] ?? invoice.status as string}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
