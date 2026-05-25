'use client';
import { useState } from 'react';
import { Plus, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { useApiTokens, useCreateApiToken, useRevokeApiToken, useDeleteApiToken } from '@/lib/api/hooks';
import { toast } from 'sonner';

export default function ApiTokensPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', scopes: ['read'] });
  const { data: tokens, isLoading } = useApiTokens();
  const create = useCreateApiToken();
  const revoke = useRevokeApiToken();
  const del = useDeleteApiToken();

  const handleCreate = async () => {
    try {
      const result = await create.mutateAsync(formData);
      setNewToken((result as any)?.token || (result as any)?.data?.token);
      setShowCreate(false);
      setFormData({ name: '', scopes: ['read'] });
    } catch {
      toast.error('Token oluşturulamadı');
    }
  };

  const SCOPES = ['read', 'write', 'delete', 'admin'];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Token Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">Harici entegrasyonlar için API token'ları oluşturun</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Yeni Token
        </button>
      </div>

      {/* New token alert */}
      {newToken && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Token&apos;ı şimdi kopyalayın!</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Bu token bir daha gösterilmeyecektir.</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 rounded-lg bg-yellow-100 dark:bg-yellow-900 px-3 py-1.5 text-xs font-mono break-all">{newToken}</code>
                <button onClick={() => { navigator.clipboard.writeText(newToken); toast.success('Kopyalandı'); }}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => setNewToken(null)} className="mt-2 text-xs text-yellow-700 hover:underline">Anladım, kopyaladım</button>
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Yeni Token Oluştur</h3>
          <div>
            <label className="text-sm font-medium">Token Adı</label>
            <input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ör: Entegrasyon Servisi"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium">İzinler</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SCOPES.map(scope => (
                <label key={scope} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={formData.scopes.includes(scope)}
                    onChange={(e) => setFormData(p => ({ ...p, scopes: e.target.checked ? [...p.scopes, scope] : p.scopes.filter(s => s !== scope) }))}
                    className="rounded" />
                  <span className="text-sm">{scope}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={!formData.name || create.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              Oluştur
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">İptal</button>
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="space-y-3">
        {isLoading ? <div className="animate-pulse h-16 bg-muted rounded-xl" /> : !(tokens as any[])?.length ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">Henüz API token oluşturulmamış</div>
        ) : (tokens as any[]).map(token => (
          <div key={token.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{token.name}</span>
                {!token.isActive && <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">İptal Edildi</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>İzinler: {token.scopes.join(', ')}</span>
                {token.lastUsedAt && <span>Son kullanım: {new Date(token.lastUsedAt).toLocaleDateString('tr-TR')}</span>}
                <span>Oluşturuldu: {new Date(token.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {token.isActive && (
                <button onClick={() => revoke.mutate(token.id)} className="text-xs text-muted-foreground hover:text-orange-500">İptal Et</button>
              )}
              <button onClick={() => { if (confirm('Token silinecek?')) del.mutate(token.id); }}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
