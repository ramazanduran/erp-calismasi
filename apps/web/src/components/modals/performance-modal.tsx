'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from './modal';
import { useCreatePerformanceReview } from '@/lib/api/hooks';
import { useEmployees } from '@/lib/api/hooks';

const MOCK_EMPLOYEES_LIST = [
  { id: 'e1', firstName: 'Ahmet', lastName: 'Yılmaz', employeeNumber: 'EMP-001' },
  { id: 'e2', firstName: 'Fatma', lastName: 'Demir', employeeNumber: 'EMP-002' },
  { id: 'e3', firstName: 'Mehmet', lastName: 'Kaya', employeeNumber: 'EMP-003' },
  { id: 'e4', firstName: 'Ayşe', lastName: 'Çelik', employeeNumber: 'EMP-004' },
];

const RATING_FIELDS = [
  { key: 'leadership', label: 'Liderlik' },
  { key: 'technical', label: 'Teknik Yetkinlik' },
  { key: 'communication', label: 'İletişim' },
  { key: 'teamwork', label: 'Takım Çalışması' },
  { key: 'initiative', label: 'İnisiyatif' },
];

const schema = z.object({
  employeeId: z.string().min(1, 'Çalışan seçiniz'),
  period: z.string().min(1, 'Dönem gereklidir'),
  score: z.coerce.number().min(0).max(100).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  leadership: z.coerce.number().min(1).max(5).default(3),
  technical: z.coerce.number().min(1).max(5).default(3),
  communication: z.coerce.number().min(1).max(5).default(3),
  teamwork: z.coerce.number().min(1).max(5).default(3),
  initiative: z.coerce.number().min(1).max(5).default(3),
});

type FormData = z.infer<typeof schema>;

interface PerformanceModalProps {
  open: boolean;
  onClose: () => void;
}

export function PerformanceModal({ open, onClose }: PerformanceModalProps) {
  const { data: employeesData } = useEmployees();
  const createReview = useCreatePerformanceReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      period: '',
      leadership: 3,
      technical: 3,
      communication: 3,
      teamwork: 3,
      initiative: 3,
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    const { leadership, technical, communication, teamwork, initiative, ...rest } = data;
    const payload = {
      ...rest,
      ratings: { leadership, technical, communication, teamwork, initiative },
    };
    try {
      await createReview.mutateAsync(payload);
      toast.success('Performans değerlendirmesi oluşturuldu');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Hata oluştu');
    }
  };

  const employees = Array.isArray(employeesData)
    ? employeesData
    : (employeesData as any)?.data
    ? (employeesData as any).data
    : MOCK_EMPLOYEES_LIST;

  return (
    <Modal open={open} onClose={onClose} title="Yeni Performans Değerlendirmesi">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Çalışan *</label>
            <select
              {...register('employeeId')}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Çalışan seçin...</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-destructive text-xs mt-1">{errors.employeeId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dönem *</label>
            <input
              type="text"
              {...register('period')}
              placeholder="Örn: 2024-Q1, 2024-H1, 2024"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.period && <p className="text-destructive text-xs mt-1">{errors.period.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Genel Puan (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            {...register('score')}
            placeholder="Opsiyonel"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Rating fields */}
        <div>
          <label className="block text-sm font-medium mb-2">Değerlendirme Kriterleri (1-5)</label>
          <div className="grid grid-cols-2 gap-3">
            {RATING_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                <select
                  {...register(field.key as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value={1}>1 - Yetersiz</option>
                  <option value={2}>2 - Geliştirilmeli</option>
                  <option value={3}>3 - Yeterli</option>
                  <option value={4}>4 - İyi</option>
                  <option value={5}>5 - Mükemmel</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Güçlü Yönler</label>
          <textarea
            {...register('strengths')}
            rows={2}
            placeholder="Çalışanın güçlü yönleri..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gelişim Alanları</label>
          <textarea
            {...register('improvements')}
            rows={2}
            placeholder="Geliştirilmesi gereken alanlar..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={createReview.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createReview.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
