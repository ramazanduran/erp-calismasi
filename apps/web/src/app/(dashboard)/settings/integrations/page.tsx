'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2, CheckCircle2, XCircle, AlertCircle, Settings, RefreshCw,
  FileText, Building2, Truck, MessageSquare, CreditCard, Zap,
  ExternalLink, ToggleLeft, ToggleRight, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
type IntegrationCategory = 'efatura' | 'bank' | 'cargo' | 'messaging' | 'payment' | 'other';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  lastSync?: string;
  configUrl?: string;
  logoText: string;
  logoColor: string;
  enabled: boolean;
}

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  efatura: 'e-Fatura & e-Arşiv',
  bank: 'Banka Entegrasyonları',
  cargo: 'Kargo Entegrasyonları',
  messaging: 'Mesajlaşma & Bildirim',
  payment: 'Ödeme Sistemleri',
  other: 'Diğer',
};

const CATEGORY_ICONS: Record<IntegrationCategory, React.ComponentType<{ className?: string }>> = {
  efatura: FileText,
  bank: Building2,
  cargo: Truck,
  messaging: MessageSquare,
  payment: CreditCard,
  other: Zap,
};

const STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: 'Bağlı',
  disconnected: 'Bağlı Değil',
  error: 'Hata',
  pending: 'Bekliyor',
};

const STATUS_COLORS: Record<IntegrationStatus, string> = {
  connected: 'bg-green-100 text-green-700',
  disconnected: 'bg-gray-100 text-gray-600',
  error: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: '1', name: 'GIB e-Fatura', description: 'Gelir İdaresi Başkanlığı e-Fatura entegrasyonu. Fatura oluşturma, gönderme ve alma işlemleri.',
    category: 'efatura', status: 'connected', lastSync: '2026-05-27T08:00:00', logoText: 'GİB', logoColor: 'bg-blue-600', enabled: true,
  },
  {
    id: '2', name: 'GIB e-Arşiv', description: 'e-Arşiv fatura sistemi entegrasyonu. Müşterilere PDF fatura iletimi.',
    category: 'efatura', status: 'connected', lastSync: '2026-05-27T08:00:00', logoText: 'ARŞ', logoColor: 'bg-blue-500', enabled: true,
  },
  {
    id: '3', name: 'e-İrsaliye', description: 'Elektronik irsaliye düzenleme ve gönderme entegrasyonu.',
    category: 'efatura', status: 'disconnected', logoText: 'İRS', logoColor: 'bg-indigo-500', enabled: false,
  },
  {
    id: '4', name: 'İş Bankası', description: 'İş Bankası kurumsal bankacılık API entegrasyonu. Hesap bilgileri ve transfer.',
    category: 'bank', status: 'connected', lastSync: '2026-05-27T06:00:00', logoText: 'İŞ', logoColor: 'bg-blue-700', enabled: true,
  },
  {
    id: '5', name: 'Garanti BBVA', description: 'Garanti BBVA ticari bankacılık API entegrasyonu.',
    category: 'bank', status: 'error', lastSync: '2026-05-26T20:00:00', logoText: 'GAR', logoColor: 'bg-green-600', enabled: true,
  },
  {
    id: '6', name: 'Yapı Kredi', description: 'Yapı Kredi kurumsal API entegrasyonu.',
    category: 'bank', status: 'disconnected', logoText: 'YKB', logoColor: 'bg-blue-800', enabled: false,
  },
  {
    id: '7', name: 'Akbank', description: 'Akbank kurumsal API entegrasyonu. Hesap hareketleri otomatik senkronizasyon.',
    category: 'bank', status: 'disconnected', logoText: 'AKB', logoColor: 'bg-red-600', enabled: false,
  },
  {
    id: '8', name: 'Yurtiçi Kargo', description: 'Yurtiçi Kargo API entegrasyonu. Gönderi takibi ve fiyat hesaplama.',
    category: 'cargo', status: 'connected', lastSync: '2026-05-27T07:30:00', logoText: 'YKG', logoColor: 'bg-orange-500', enabled: true,
  },
  {
    id: '9', name: 'Aras Kargo', description: 'Aras Kargo entegrasyonu. Otomatik kargo etiketi oluşturma.',
    category: 'cargo', status: 'connected', lastSync: '2026-05-27T07:30:00', logoText: 'ARS', logoColor: 'bg-red-500', enabled: true,
  },
  {
    id: '10', name: 'MNG Kargo', description: 'MNG Kargo API entegrasyonu.',
    category: 'cargo', status: 'disconnected', logoText: 'MNG', logoColor: 'bg-yellow-600', enabled: false,
  },
  {
    id: '11', name: 'WhatsApp Business', description: 'WhatsApp Business API. Müşteri bildirimleri ve otomatik mesajlaşma.',
    category: 'messaging', status: 'connected', lastSync: '2026-05-27T09:00:00', logoText: 'WA', logoColor: 'bg-green-500', enabled: true,
  },
  {
    id: '12', name: 'SMS Gönderici', description: 'NetGSM / Turkcell SMS servisi entegrasyonu. Toplu SMS ve bildirim.',
    category: 'messaging', status: 'connected', lastSync: '2026-05-27T09:00:00', logoText: 'SMS', logoColor: 'bg-purple-500', enabled: true,
  },
  {
    id: '13', name: 'E-posta (SMTP)', description: 'Özel SMTP sunucu yapılandırması. Transaksiyonel e-posta gönderimi.',
    category: 'messaging', status: 'connected', logoText: 'ML', logoColor: 'bg-gray-600', enabled: true,
  },
  {
    id: '14', name: 'iyzico', description: 'iyzico ödeme altyapısı. Kredi kartı ve banka kartı tahsilat.',
    category: 'payment', status: 'disconnected', logoText: 'IYZ', logoColor: 'bg-indigo-600', enabled: false,
  },
  {
    id: '15', name: 'PayTR', description: 'PayTR sanal POS entegrasyonu. Taksitli ödeme desteği.',
    category: 'payment', status: 'disconnected', logoText: 'PTR', logoColor: 'bg-blue-500', enabled: false,
  },
];

interface ConfigModalProps {
  integration: Integration;
  onClose: () => void;
}

function ConfigModal({ integration, onClose }: ConfigModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [endpoint, setEndpoint] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold', integration.logoColor)}>
            {integration.logoText}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{integration.name} Yapılandırması</h2>
            <p className="text-sm text-muted-foreground">{integration.description}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Anahtarı</label>
            <input
              type="password"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Gizli Anahtarı</label>
            <input
              type="password"
              placeholder="API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {(integration.category === 'efatura' || integration.category === 'bank') && (
            <div>
              <label className="block text-sm font-medium mb-1">Endpoint URL</label>
              <input
                type="text"
                placeholder="https://api.example.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            İptal
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Kaydet & Bağlan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'all'>('all');
  const [configuring, setConfiguring] = useState<Integration | null>(null);

  const { data: integrations = MOCK_INTEGRATIONS } = useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/settings/integrations');
      if (!res.ok) return MOCK_INTEGRATIONS;
      return res.json();
    },
    initialData: MOCK_INTEGRATIONS,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/v1/settings/integrations/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/settings/integrations/${id}/sync`, { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });

  const filtered = useMemo(() => {
    let list = integrations;
    if (activeCategory !== 'all') list = list.filter((i) => i.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  }, [integrations, activeCategory, search]);

  const stats = useMemo(() => ({
    connected: integrations.filter((i) => i.status === 'connected').length,
    error: integrations.filter((i) => i.status === 'error').length,
    disconnected: integrations.filter((i) => i.status === 'disconnected').length,
    total: integrations.length,
  }), [integrations]);

  const grouped = useMemo(() => {
    const map: Partial<Record<IntegrationCategory, Integration[]>> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category]!.push(item);
    }
    return map;
  }, [filtered]);

  const StatusIcon = ({ status }: { status: IntegrationStatus }) => {
    if (status === 'connected') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-600" />;
    if (status === 'pending') return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const categories: Array<IntegrationCategory | 'all'> = ['all', 'efatura', 'bank', 'cargo', 'messaging', 'payment', 'other'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Entegrasyonlar</h1>
        <p className="text-muted-foreground">e-Fatura, banka, kargo ve üçüncü parti servis bağlantıları</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Entegrasyon</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Bağlı</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.connected}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Hatalı</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.error}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Bağlı Değil</p>
          <p className="mt-1 text-2xl font-bold text-gray-500">{stats.disconnected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Entegrasyon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat === 'all' ? 'Tümü' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Groups */}
      <div className="space-y-6">
        {(Object.keys(grouped) as IntegrationCategory[]).map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const items = grouped[cat] ?? [];
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{CATEGORY_LABELS[cat]}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((integration) => (
                  <div key={integration.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0', integration.logoColor)}>
                          {integration.logoText}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{integration.name}</p>
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium mt-0.5', STATUS_COLORS[integration.status])}>
                            <StatusIcon status={integration.status} />
                            {STATUS_LABELS[integration.status]}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMutation.mutate({ id: integration.id, enabled: !integration.enabled })}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={integration.enabled ? 'Devre dışı bırak' : 'Etkinleştir'}
                      >
                        {integration.enabled
                          ? <ToggleRight className="h-6 w-6 text-primary" />
                          : <ToggleLeft className="h-6 w-6" />
                        }
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{integration.description}</p>
                    {integration.lastSync && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Son senkronizasyon: {new Date(integration.lastSync).toLocaleString('tr-TR')}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfiguring(integration)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Yapılandır
                      </button>
                      {integration.status === 'connected' && (
                        <button
                          onClick={() => syncMutation.mutate(integration.id)}
                          disabled={syncMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          <RefreshCw className={cn('h-3.5 w-3.5', syncMutation.isPending && 'animate-spin')} />
                          Senkronize Et
                        </button>
                      )}
                      {integration.configUrl && (
                        <a
                          href={integration.configUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Belge
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {configuring && (
        <ConfigModal integration={configuring} onClose={() => setConfiguring(null)} />
      )}
    </div>
  );
}
