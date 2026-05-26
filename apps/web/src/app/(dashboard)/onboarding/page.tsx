'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Check, Building2, Users, Package, ChevronRight, Loader2, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 'organization',
    title: 'Organizasyon',
    description: 'Şirket bilgilerinizi tamamlayın',
    icon: Building2,
  },
  {
    id: 'invite',
    title: 'Ekip Daveti',
    description: 'Ekip üyesi davet edin (isteğe bağlı)',
    icon: Users,
  },
  {
    id: 'product',
    title: 'İlk Ürün',
    description: 'İlk ürününüzü ekleyin (isteğe bağlı)',
    icon: Package,
  },
];

const TIMEZONES = [
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Dubai',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const [orgData, setOrgData] = useState({
    name: '',
    currency: 'TRY',
    locale: 'tr',
    timezone: 'Europe/Istanbul',
    website: '',
    phone: '',
    address: '',
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');

  const [productData, setProductData] = useState({
    code: '',
    name: '',
    unit: 'Adet',
    salePrice: '',
    description: '',
  });

  const updateOrg = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch('/api/v1/organizations/current', data),
  });

  const inviteUser = useMutation({
    mutationFn: (data: { email: string; roleId?: string }) =>
      api.post('/api/v1/users/invite', data),
  });

  const createProduct = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/v1/products', data),
  });

  const handleStep0 = async () => {
    if (!orgData.name.trim()) {
      toast.error('Şirket adı zorunludur');
      return;
    }
    try {
      await updateOrg.mutateAsync({
        name: orgData.name.trim(),
        currency: orgData.currency,
        locale: orgData.locale,
        timezone: orgData.timezone,
        website: orgData.website || undefined,
        phone: orgData.phone || undefined,
        address: orgData.address || undefined,
      });
      toast.success('Organizasyon bilgileri kaydedildi');
      setCompleted((prev) => new Set([...prev, 0]));
      setCurrentStep(1);
    } catch {
      toast.error('Organizasyon güncellenemedi');
    }
  };

  const handleStep1 = async (skip = false) => {
    if (!skip && inviteEmail.trim()) {
      try {
        await inviteUser.mutateAsync({ email: inviteEmail.trim() });
        toast.success(`${inviteEmail} adresine davet gönderildi`);
      } catch {
        toast.error('Davet gönderilemedi');
        return;
      }
    }
    setCompleted((prev) => new Set([...prev, 1]));
    setCurrentStep(2);
  };

  const handleStep2 = async (skip = false) => {
    if (!skip && productData.name.trim()) {
      try {
        await createProduct.mutateAsync({
          code: productData.code.trim() || undefined,
          name: productData.name.trim(),
          unit: productData.unit,
          salePrice: productData.salePrice ? Number(productData.salePrice) : 0,
          description: productData.description || undefined,
        });
        toast.success(`"${productData.name}" ürünü oluşturuldu`);
      } catch {
        toast.error('Ürün oluşturulamadı');
        return;
      }
    }
    setCompleted((prev) => new Set([...prev, 2]));
    toast.success('Kurulum tamamlandı! Hoş geldiniz.');
    router.push('/');
  };

  const isPending = updateOrg.isPending || inviteUser.isPending || createProduct.isPending;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">ERP Sisteminizi Kurun</h1>
          <p className="text-muted-foreground mt-2">
            Birkaç adımda sisteminizi hazır hale getirin
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isDone = completed.has(i);
            const isCurrent = currentStep === i;
            const isUpcoming = i > currentStep;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isDone && setCurrentStep(i)}
                  className={cn(
                    'flex items-center gap-2.5 min-w-0',
                    isDone && 'cursor-pointer',
                    isCurrent ? 'text-primary' : isDone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
                  )}
                >
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all',
                      isCurrent && 'border-primary bg-primary/10',
                      isDone && 'border-green-500 bg-green-50 dark:bg-green-950',
                      isUpcoming && 'border-border bg-background',
                    )}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-sm font-medium truncate">{step.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-3 transition-colors',
                      completed.has(i) ? 'bg-green-400' : 'bg-border',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Step 0: Organization */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Şirket Bilgileri</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ERP sisteminizdeki organizasyon bilgilerini girin
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Şirket Adı <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={orgData.name}
                    onChange={(e) => setOrgData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Şirket A.Ş."
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Para Birimi</label>
                    <select
                      value={orgData.currency}
                      onChange={(e) => setOrgData((p) => ({ ...p, currency: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="TRY">TRY — Türk Lirası</option>
                      <option value="USD">USD — Dolar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — Sterlin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dil</label>
                    <select
                      value={orgData.locale}
                      onChange={(e) => setOrgData((p) => ({ ...p, locale: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Saat Dilimi</label>
                    <select
                      value={orgData.timezone}
                      onChange={(e) => setOrgData((p) => ({ ...p, timezone: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      Web Sitesi
                    </label>
                    <input
                      value={orgData.website}
                      onChange={(e) => setOrgData((p) => ({ ...p, website: e.target.value }))}
                      placeholder="https://sirket.com"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefon</label>
                    <input
                      value={orgData.phone}
                      onChange={(e) => setOrgData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+90 212 000 00 00"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Adres</label>
                  <textarea
                    value={orgData.address}
                    onChange={(e) => setOrgData((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Şirket adresi..."
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleStep0}
                  disabled={isPending || !orgData.name.trim()}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {updateOrg.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Kaydet ve Devam Et
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Invite */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Ekip Daveti</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ekibinizi sisteme davet edin. Daha sonra Ayarlar &gt; Kullanıcılar bölümünden de ekleyebilirsiniz.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ekip@sirket.com"
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="admin">Yönetici</option>
                    <option value="manager">Müdür</option>
                    <option value="staff">Personel</option>
                    <option value="viewer">Görüntüleyici</option>
                  </select>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Davet edilen kullanıcı, e-posta ile bir bağlantı alacak ve kendi şifresini oluşturarak sisteme girebilecek.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleStep1(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Bu adımı atla
                </button>
                <button
                  onClick={() => handleStep1(false)}
                  disabled={inviteUser.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {inviteUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {inviteEmail.trim() ? 'Davet Gönder' : 'Devam Et'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Product */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">İlk Ürününüz</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Stok takibi için ilk ürününüzü ekleyin. Daha sonra Stok &gt; Ürünler bölümünden de ekleyebilirsiniz.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Ürün Kodu</label>
                    <input
                      value={productData.code}
                      onChange={(e) => setProductData((p) => ({ ...p, code: e.target.value }))}
                      placeholder="PRD-001"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ürün Adı</label>
                    <input
                      value={productData.name}
                      onChange={(e) => setProductData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ürün adı"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Birim</label>
                    <select
                      value={productData.unit}
                      onChange={(e) => setProductData((p) => ({ ...p, unit: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Adet">Adet</option>
                      <option value="Kg">Kg</option>
                      <option value="Lt">Lt</option>
                      <option value="m²">m²</option>
                      <option value="m">m</option>
                      <option value="Kutu">Kutu</option>
                      <option value="Paket">Paket</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Satış Fiyatı (₺)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productData.salePrice}
                      onChange={(e) => setProductData((p) => ({ ...p, salePrice: e.target.value }))}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Açıklama</label>
                  <textarea
                    value={productData.description}
                    onChange={(e) => setProductData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Ürün açıklaması..."
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleStep2(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Atla ve Bitir
                </button>
                <button
                  onClick={() => handleStep2(false)}
                  disabled={createProduct.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createProduct.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {productData.name.trim() ? 'Ürün Ekle ve Tamamla' : 'Kurulumu Tamamla'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Adım {currentStep + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
