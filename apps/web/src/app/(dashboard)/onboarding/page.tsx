'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Building2, Users, Package, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

const STEPS = [
  { id: 'organization', title: 'Organizasyon', description: 'Şirket bilgilerini tamamlayın', icon: Building2 },
  { id: 'users', title: 'İlk Kullanıcı', description: 'Ekip üyesi davet edin', icon: Users },
  { id: 'products', title: 'Ürünler', description: 'İlk ürünlerinizi ekleyin', icon: Package },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const router = useRouter();
  const { user } = useAuthStore();

  const [orgData, setOrgData] = useState({ name: '', currency: 'TRY', locale: 'tr', timezone: 'Europe/Istanbul' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [productData, setProductData] = useState({ code: '', name: '', salePrice: '' });

  const markDone = () => {
    setCompleted(prev => new Set([...prev, currentStep]));
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
    else router.push('/');
  };

  const skip = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isDone = completed.has(i);
            const isCurrent = currentStep === i;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${isCurrent ? 'text-primary' : isDone ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isCurrent ? 'border-primary bg-primary/10' : isDone ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-border'}`}>
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                </div>
                {i < STEPS.length - 1 && <div className="mx-3 flex-1 h-px bg-border w-16 sm:w-24" />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-1">{STEPS[currentStep].title}</h2>
          <p className="text-muted-foreground text-sm mb-6">{STEPS[currentStep].description}</p>

          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Şirket Adı</label>
                <input value={orgData.name} onChange={(e) => setOrgData(p => ({ ...p, name: e.target.value }))} placeholder="Şirket A.Ş."
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Para Birimi</label>
                  <select value={orgData.currency} onChange={(e) => setOrgData(p => ({ ...p, currency: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="TRY">TRY - Türk Lirası</option>
                    <option value="USD">USD - Dolar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Dil</label>
                  <select value={orgData.locale} onChange={(e) => setOrgData(p => ({ ...p, locale: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Ekibinizi davet edin. İsteğe bağlıdır, daha sonra Ayarlar &gt; Kullanıcılar bölümünden de ekleyebilirsiniz.</p>
              <div>
                <label className="text-sm font-medium">E-posta Adresi</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ekip@sirket.com"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">İlk ürününüzü ekleyin. İsteğe bağlıdır.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Ürün Kodu</label>
                  <input value={productData.code} onChange={(e) => setProductData(p => ({ ...p, code: e.target.value }))} placeholder="PRD-001"
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium">Ürün Adı</label>
                  <input value={productData.name} onChange={(e) => setProductData(p => ({ ...p, name: e.target.value }))} placeholder="Ürün Adı"
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground">
              {currentStep === STEPS.length - 1 ? 'Atla ve Bitir' : 'Bu adımı atla'}
            </button>
            <button onClick={markDone} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {currentStep === STEPS.length - 1 ? 'Tamamla' : 'Devam Et'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {currentStep + 1}/{STEPS.length} adım
        </p>
      </div>
    </div>
  );
}
