'use client';

import { useState } from 'react';
import { PlusCircle, Webhook, Play, Trash2, Edit2, CheckCircle2, XCircle, Clock, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const MOCK_WEBHOOKS: WebhookItem[] = [
  { id: 'wh1', name: 'Sipariş Bildirimi', url: 'https://api.example.com/erp-orders', events: ['order.created', 'order.updated', 'order.cancelled'], isActive: true, _count: { logs: 48 }, logs: [{ id: 'l1', event: 'order.created', statusCode: 200, createdAt: '2026-05-27T14:00:00Z' }] },
  { id: 'wh2', name: 'Fatura Webhook', url: 'https://erp.client.com/webhooks/invoice', events: ['invoice.created', 'invoice.paid'], isActive: true, _count: { logs: 22 }, logs: [{ id: 'l2', event: 'invoice.paid', statusCode: 200, createdAt: '2026-05-26T10:00:00Z' }] },
  { id: 'wh3', name: 'Müşteri Sync', url: 'https://crm.partner.com/hook', events: ['customer.created', 'customer.updated'], isActive: false, _count: { logs: 5 }, logs: [{ id: 'l3', event: 'customer.created', statusCode: 500, createdAt: '2026-04-10T09:00:00Z' }] },
];

const AVAILABLE_EVENTS = [
  'order.created', 'order.updated', 'order.cancelled',
  'invoice.created', 'invoice.paid',
  'customer.created', 'customer.updated',
  'product.created', 'product.updated',
  'employee.created', 'employee.updated',
  'lead.created', 'lead.updated',
  'deal.created', 'deal.won', 'deal.lost',
];

interface WebhookLog {
  id: string;
  event: string;
  statusCode?: number;
  createdAt: string;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  logs?: WebhookLog[];
  _count?: { logs: number };
}

function WebhookFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: WebhookItem | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    url: initial?.url ?? '',
    secret: '',
    isActive: initial?.isActive ?? true,
    events: initial?.events ?? [] as string[],
  });

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Webhook Düzenle' : 'Yeni Webhook'}</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Ad</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">URL</label>
            <input
              type="url"
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com/webhook"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">İmza Anahtarı (İsteğe bağlı)</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              placeholder="HMAC-SHA256 imzalama için"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Olaylar</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
              {AVAILABLE_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted rounded p-1">
                  <input
                    type="checkbox"
                    checked={form.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded"
                  />
                  <span className="font-mono">{event}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span>Aktif</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  const { data: rawWebhooks, isLoading } = useWebhooks();
  const webhooks = Array.isArray(rawWebhooks) ? rawWebhooks : (!isLoading ? MOCK_WEBHOOKS : []);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WebhookItem | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { statusCode?: number; error?: string }>>({});

  const handleSave = async (data: Record<string, unknown>) => {
    if (editing) {
      await updateWebhook.mutateAsync({ id: editing.id, data });
    } else {
      await createWebhook.mutateAsync(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleTest = async (id: string) => {
    const result = await testWebhook.mutateAsync(id);
    setTestResult((prev) => ({ ...prev, [id]: result as { statusCode?: number; error?: string } }));
    setTimeout(() => setTestResult((prev) => { const next = { ...prev }; delete next[id]; return next; }), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhook Entegrasyonları</h1>
          <p className="text-muted-foreground mt-1">Dış sistemlere olay bildirimleri gönderin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              (webhooks as WebhookItem[]).map((w) => ({
                name: w.name,
                url: w.url,
                isActive: w.isActive ? 'Aktif' : 'Pasif',
                events: w.events.join(', '),
                logCount: w._count?.logs ?? 0,
              })),
              [
                { key: 'name', header: 'Webhook Adı', width: 22 },
                { key: 'url', header: 'URL', width: 40 },
                { key: 'isActive', header: 'Durum', width: 10 },
                { key: 'events', header: 'Olaylar', width: 40 },
                { key: 'logCount', header: 'Log Sayısı', width: 12 },
              ],
              'webhooklar',
              'Webhooklar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            Yeni Webhook
          </button>
        </div>
      </div>

      {/* Webhook Cards */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : (webhooks as WebhookItem[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Webhook className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Henüz webhook yok</p>
          <p className="text-sm text-muted-foreground mt-1">Dış sistemlerinize bağlanmak için webhook oluşturun</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(webhooks as WebhookItem[]).map((wh) => {
            const lastLog = wh.logs?.[0];
            const tr = testResult[wh.id];
            return (
              <div key={wh.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full mt-1', wh.isActive ? 'bg-green-500' : 'bg-gray-400')} />
                    <div>
                      <h3 className="font-semibold">{wh.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate max-w-xs">{wh.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tr && (
                      <span className={cn('text-xs font-medium flex items-center gap-1', tr.error || (tr.statusCode && tr.statusCode >= 400) ? 'text-destructive' : 'text-green-600')}>
                        {tr.error || (tr.statusCode && tr.statusCode >= 400)
                          ? <XCircle className="h-3.5 w-3.5" />
                          : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {tr.statusCode ?? 'Hata'}
                      </span>
                    )}
                    <button
                      onClick={() => handleTest(wh.id)}
                      disabled={testWebhook.isPending}
                      className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                    >
                      <Play className="h-3 w-3" />
                      Test
                    </button>
                    <button onClick={() => { setEditing(wh); setShowForm(true); }} className="text-muted-foreground hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteWebhook.mutate(wh.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {wh.events.map((ev) => (
                    <span key={ev} className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{ev}</span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{wh._count?.logs ?? 0} teslimat</span>
                  {lastLog && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Son: {new Date(lastLog.createdAt).toLocaleString('tr-TR')}
                      {lastLog.statusCode && (
                        <span className={cn('ml-1 font-medium', lastLog.statusCode < 400 ? 'text-green-600' : 'text-destructive')}>
                          {lastLog.statusCode}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <WebhookFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
