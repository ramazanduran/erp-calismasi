'use client';

import { useState } from 'react';
import { Search, Plus, Building2, User } from 'lucide-react';

type CustomerType = 'corporate' | 'individual';
type CustomerStatus = 'active' | 'passive' | 'blocked';

interface Customer {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  type: CustomerType;
  status: CustomerStatus;
  creditLimit: number;
  balance: number;
  createdAt: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    code: 'MUS-001',
    name: 'ABC Teknoloji A.Ş.',
    email: 'info@abc.com',
    phone: '0212 555 0101',
    taxNumber: '1234567890',
    type: 'corporate',
    status: 'active',
    creditLimit: 50000,
    balance: 12500,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    code: 'MUS-002',
    name: 'Mehmet Yılmaz',
    email: 'mehmet@example.com',
    phone: '0532 111 2233',
    taxNumber: null,
    type: 'individual',
    status: 'active',
    creditLimit: 5000,
    balance: 0,
    createdAt: '2024-02-10',
  },
  {
    id: '3',
    code: 'MUS-003',
    name: 'XYZ Ticaret Ltd. Şti.',
    email: 'contact@xyz.com',
    phone: '0216 444 5566',
    taxNumber: '9876543210',
    type: 'corporate',
    status: 'passive',
    creditLimit: 25000,
    balance: -3200,
    createdAt: '2024-03-05',
  },
];

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Aktif',
  passive: 'Pasif',
  blocked: 'Bloke',
};

const STATUS_CLASSES: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  passive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_LABELS: Record<CustomerType, string> = {
  corporate: 'Kurumsal',
  individual: 'Bireysel',
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_CUSTOMERS.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Müşteriler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm müşterileri yönetin ve takip edin
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Yeni Müşteri
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Müşteri ara (ad, kod, e-posta)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="blocked">Bloke</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kod</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-posta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefon</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bakiye</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Müşteri bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {customer.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {customer.type === 'corporate' ? (
                            <Building2 className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{customer.name}</div>
                          {customer.taxNumber && (
                            <div className="text-xs text-muted-foreground">VKN: {customer.taxNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {TYPE_LABELS[customer.type]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.email ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.phone ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={customer.balance < 0 ? 'text-red-600' : 'text-foreground'}>
                        {customer.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[customer.status]}`}
                      >
                        {STATUS_LABELS[customer.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} müşteri gösteriliyor</span>
          <span>Toplam: {MOCK_CUSTOMERS.length}</span>
        </div>
      </div>
    </div>
  );
}
