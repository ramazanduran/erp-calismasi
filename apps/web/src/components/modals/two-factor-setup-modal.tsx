'use client';
import { useState } from 'react';
import { Modal } from './modal';
import { useSetupTwoFactor, useEnableTwoFactor } from '@/lib/api/hooks';
import { toast } from 'sonner';

interface TwoFactorSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({ open, onClose, onSuccess }: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [code, setCode] = useState('');
  const setup = useSetupTwoFactor();
  const enable = useEnableTwoFactor();

  const handleSetup = async () => {
    try {
      const result = await setup.mutateAsync(undefined);
      setSetupData(result as any);
      setStep('verify');
    } catch {
      toast.error('2FA kurulumu başlatılamadı');
    }
  };

  const handleVerify = async () => {
    try {
      await enable.mutateAsync(code);
      setStep('backup');
    } catch {
      toast.error('Geçersiz kod');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="İki Faktörlü Doğrulama Kurulumu" size="md">
      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            İki faktörlü doğrulama hesabınıza ekstra güvenlik katmanı ekler.
            Google Authenticator, Authy veya benzeri bir uygulama gerektirir.
          </p>
          <button onClick={handleSetup} disabled={setup.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {setup.isPending ? 'Hazırlanıyor...' : 'Kurulumu Başlat'}
          </button>
        </div>
      )}

      {step === 'verify' && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Authenticator uygulamanızla QR kodu tarayın:</p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="h-48 w-48 rounded-lg border border-border" />
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground mb-1">Manuel giriş kodu:</p>
            <code className="text-xs font-mono">{setupData.secret}</code>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Doğrulama Kodu</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={handleVerify} disabled={code.length !== 6 || enable.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            Doğrula ve Etkinleştir
          </button>
        </div>
      )}

      {step === 'backup' && setupData && (
        <div className="space-y-4">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Yedek kodlarınızı kaydedin!</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Bu kodlar cihazınıza erişim sağlayamazsanız kullanılabilir.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {setupData.backupCodes.map((backupCode, i) => (
              <code key={i} className="rounded-lg bg-muted px-3 py-2 text-sm font-mono text-center">{backupCode}</code>
            ))}
          </div>
          <button onClick={() => { onSuccess(); onClose(); }}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Tamamlandı
          </button>
        </div>
      )}
    </Modal>
  );
}
