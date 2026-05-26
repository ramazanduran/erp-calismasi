'use client';

import { useState } from 'react';
import {
  Plus, Copy, Trash2, AlertTriangle, Key, Check, Shield,
  Clock, Terminal, Eye, EyeOff, X,
} from 'lucide-react';
import { useApiTokens, useCreateApiToken, useRevokeApiToken, useDeleteApiToken } from '@/lib/api/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SCOPES = [
  { key: 'read', label: 'Okuma', desc: 'Veri okuma erişimi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { key: 'write', label: 'Yazma', desc: 'Veri oluşturma ve güncelleme', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { key: 'delete', label: 'Silme', desc: 'Veri silme erişimi', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { key: 'admin', label: 'Yönetici', desc: 'Tam yönetici erişimi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
];

function NewTokenModal({ onClose, onCreated }: { onClose: () => void; onCreated: (token: string) => void }) {
  const [form, setForm] = useState({ name: '', scopes: ['read'] as string[], expiresInDays: '' });
  const create = useCreateApiToken();

  const toggleScope = (scope: string) => {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter((s) => s !== scope) : [...f.scopes, scope],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Token adı zorunludur'); return; }
    if (form.scopes.length === 0) { toast.error('En az bir izin seçiniz'); return; }
    try {
      const result = await create.mutateAsync({
        name: form.name.trim(),
        scopes: form.scopes,
        expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
      });
      const token = (result as any)?.token ?? (result as any)?.data?.token ?? '';
      onCreated(token);
      onClose();
    } catch {
      toast.error('Token oluşturulamadı');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Yeni API Token</h2>
            <p className="text-sm text-muted-foreground">Harici entegrasyon için token oluşturun</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5">Token Adı *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ör: Muhasebe Entegrasyonu, CI/CD Pipeline"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">İzinler *</label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPES.map((scope) => {
                const selected = form.scopes.includes(scope.key);
                return (
                  <button
                    key={scope.key}
                    type="button"
                    onClick={() => toggleScope(scope.key)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <div className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0 mt-0.5', selected ? 'bg-primary border-primary' : 'border-input')}>
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{scope.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{scope.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">
              Geçerlilik Süresi (gün) <span className="font-normal text-muted-foreground">— opsiyonel, boş bırakılırsa süresiz</span>
            </label>
            <input type="number" min="1" max="3650" value={form.expiresInDays}
              onChange={(e) => setForm((f) => ({ ...f, expiresInDays: e.target.value }))}
              placeholder="Ör: 90, 365"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Token oluşturulduktan sonra sadece bir kez gösterilecektir. Güvenli bir yerde saklayın.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={create.isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {create.isPending ? 'Oluşturuluyor...' : 'Token Oluştur'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">İptal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TokenRevealBanner({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('Token kopyalandı');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-800 dark:text-amber-200">Token&apos;ı şimdi kopyalayın!</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">Bu token bir daha gösterilmeyecektir. Güvenli bir yerde saklayın.</p>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg bg-white dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700 px-3 py-2 min-w-0">
              <Terminal className="h-4 w-4 text-amber-600 shrink-0" />
              <code className="text-xs font-mono text-amber-900 dark:text-amber-100 truncate flex-1">
                {visible ? token : token.replace(/./g, '•')}
              </code>
              <button onClick={() => setVisible((v) => !v)} className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-600 shrink-0">
                {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button onClick={handleCopy}
              className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0', copied ? 'bg-green-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700')}>
              {copied ? <><Check className="h-4 w-4" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> Kopyala</>}
            </button>
          </div>

          <button onClick={onDismiss} className="mt-3 text-xs text-amber-700 dark:text-amber-400 hover:underline">
            Anladım, kopyaladım ve güvenli yere kaydettim
          </button>
        </div>
      </div>
    </div>
  );
}

function RevokeConfirmModal({ tokenName, onConfirm, onClose }: { tokenName: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-sm border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold">Token&apos;ı İptal Et</h3>
            <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz</p>
          </div>
        </div>
        <p className="text-sm text-foreground">
          <span className="font-medium">&quot;{tokenName}&quot;</span> token&apos;ı iptal edilecek. Bu token ile yapılan tüm API çağrıları başarısız olacaktır.
        </p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">İptal Et</button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Vazgeç</button>
        </div>
      </div>
    </div>
  );
}

export default function ApiTokensPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: tokensData, isLoading } = useApiTokens();
  const revoke = useRevokeApiToken();
  const del = useDeleteApiToken();

  const tokens = (tokensData as any[]) ?? [];
  const activeCount = tokens.filter((t) => t.isActive).length;
  const revokedCount = tokens.filter((t) => !t.isActive).length;

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revoke.mutateAsync(revokeTarget.id);
      toast.success(`"${revokeTarget.name}" iptal edildi`);
      setRevokeTarget(null);
    } catch {
      toast.error('İptal işlemi başarısız');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await del.mutateAsync(id);
      toast.success(`"${name}" silindi`);
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Token Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">Harici entegrasyonlar için API token&apos;ları oluşturun ve yönetin</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Yeni Token
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Key className="h-4 w-4" />
            <span className="text-xs font-medium">Toplam Token</span>
          </div>
          <p className="text-2xl font-bold">{isLoading ? '—' : tokens.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Check className="h-4 w-4" />
            <span className="text-xs font-medium">Aktif</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{isLoading ? '—' : activeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <X className="h-4 w-4" />
            <span className="text-xs font-medium">İptal Edildi</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{isLoading ? '—' : revokedCount}</p>
        </div>
      </div>

      {/* New token banner */}
      {newToken && <TokenRevealBanner token={newToken} onDismiss={() => setNewToken(null)} />}

      {/* Info card */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex gap-3">
        <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">API Token Güvenliği</p>
          <p>Token&apos;larınızı gizli tutun. Kaynak kodunuza dahil etmeyin; ortam değişkeni veya secret manager kullanın. Şüpheli durumlarda hemen iptal edin.</p>
        </div>
      </div>

      {/* Token list */}
      <div className="space-y-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded-xl" />
          ))
        ) : tokens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Key className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Henüz API token oluşturulmamış</p>
            <p className="text-sm text-muted-foreground mt-1">Harici sistem entegrasyonları için token oluşturun</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> İlk Token&apos;ı Oluştur
            </button>
          </div>
        ) : (
          tokens.map((token: any) => {
            const scopes: string[] = token.scopes ?? [];
            const isExpired = token.expiresAt && new Date(token.expiresAt) < new Date();
            const expiresIn = token.expiresAt
              ? Math.ceil((new Date(token.expiresAt).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div key={token.id}
                className={cn(
                  'rounded-xl border bg-card px-5 py-4 transition-colors',
                  !token.isActive || isExpired
                    ? 'border-border opacity-60'
                    : 'border-border hover:border-primary/30',
                )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                    token.isActive && !isExpired ? 'bg-primary/10' : 'bg-muted',
                  )}>
                    <Key className={cn('h-5 w-5', token.isActive && !isExpired ? 'text-primary' : 'text-muted-foreground')} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{token.name}</span>
                      {!token.isActive && (
                        <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-medium">İptal Edildi</span>
                      )}
                      {isExpired && token.isActive && (
                        <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 text-xs font-medium">Süresi Doldu</span>
                      )}
                      {expiresIn !== null && expiresIn > 0 && expiresIn <= 7 && (
                        <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 text-xs font-medium">
                          {expiresIn} gün kaldı
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {scopes.map((scope) => {
                        const cfg = SCOPES.find((s) => s.key === scope);
                        return (
                          <span key={scope} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cfg?.color ?? 'bg-muted text-muted-foreground')}>
                            {cfg?.label ?? scope}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                      {token.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Son kullanım: {new Date(token.lastUsedAt).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      <span>Oluşturuldu: {new Date(token.createdAt).toLocaleDateString('tr-TR')}</span>
                      {token.expiresAt && (
                        <span>
                          {isExpired ? 'Süresi doldu' : 'Geçerlilik bitiş'}: {new Date(token.expiresAt).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {token.isActive && !isExpired && (
                      <button onClick={() => setRevokeTarget({ id: token.id, name: token.name })}
                        className="rounded-md px-2.5 py-1.5 text-xs text-orange-600 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                        İptal Et
                      </button>
                    )}
                    <button onClick={() => handleDelete(token.id, token.name)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreate && <NewTokenModal onClose={() => setShowCreate(false)} onCreated={setNewToken} />}
      {revokeTarget && <RevokeConfirmModal tokenName={revokeTarget.name} onConfirm={handleRevoke} onClose={() => setRevokeTarget(null)} />}
    </div>
  );
}
