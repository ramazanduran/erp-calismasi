'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Car,
  Wrench,
  Plus,
  Search,
  Edit,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Calendar,
  X,
  FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn, formatNumber, formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  status: string;
  fuelType: string;
  currentMileage?: number;
  nextServiceAt?: number;
  insuranceExpiry?: string;
  inspectionExpiry?: string;
  driverName?: string;
  notes?: string;
}

interface VehicleStats {
  total: number;
  byStatus: { status: string; _count: number }[];
  byType: { type: string; _count: number }[];
}

interface VehicleFormData {
  plateNumber: string;
  brand: string;
  model: string;
  year: string;
  type: string;
  status: string;
  fuelType: string;
  currentMileage: string;
  nextServiceAt: string;
  insuranceExpiry: string;
  inspectionExpiry: string;
  driverName: string;
  notes: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  active: {
    label: 'Aktif',
    color: 'text-green-700',
    bg: 'bg-green-100',
    icon: CheckCircle,
  },
  maintenance: {
    label: 'Bakımda',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    icon: Wrench,
  },
  inactive: {
    label: 'Pasif',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: XCircle,
  },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  truck: { label: 'Kamyon', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-100' },
  van: { label: 'Minibüs', icon: Truck, color: 'text-purple-700', bg: 'bg-purple-100' },
  car: { label: 'Otomobil', icon: Car, color: 'text-indigo-700', bg: 'bg-indigo-100' },
  motorcycle: { label: 'Motosiklet', icon: Car, color: 'text-orange-700', bg: 'bg-orange-100' },
};

const FUEL_LABELS: Record<string, string> = {
  diesel: 'Dizel',
  gasoline: 'Benzin',
  lpg: 'LPG',
  electric: 'Elektrik',
  hybrid: 'Hibrit',
};

const DEFAULT_FORM: VehicleFormData = {
  plateNumber: '',
  brand: '',
  model: '',
  year: String(new Date().getFullYear()),
  type: 'car',
  status: 'active',
  fuelType: 'gasoline',
  currentMileage: '',
  nextServiceAt: '',
  insuranceExpiry: '',
  inspectionExpiry: '',
  driverName: '',
  notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isMaintenanceDue(vehicle: Vehicle): boolean {
  if (vehicle.nextServiceAt == null || vehicle.currentMileage == null) return false;
  return vehicle.currentMileage >= vehicle.nextServiceAt - 2000;
}

function isNearServiceWarning(vehicle: Vehicle): boolean {
  if (vehicle.nextServiceAt == null || vehicle.currentMileage == null) return false;
  const remaining = vehicle.nextServiceAt - vehicle.currentMileage;
  return remaining > 0 && remaining <= 5000;
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';

// ─── Vehicle Modal ─────────────────────────────────────────────────────────────

interface VehicleModalProps {
  open: boolean;
  onClose: () => void;
  editVehicle?: Vehicle | null;
  onLocalCreate?: (vehicle: Vehicle) => void;
  onLocalUpdate?: (vehicle: Vehicle) => void;
}

function VehicleModal({ open, onClose, editVehicle, onLocalCreate, onLocalUpdate }: VehicleModalProps) {
  const isEdit = !!editVehicle;
  const qc = useQueryClient();
  const [form, setForm] = useState<VehicleFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});

  useEffect(() => {
    if (open) {
      if (isEdit && editVehicle) {
        setForm({
          plateNumber: editVehicle.plateNumber ?? '',
          brand: editVehicle.brand ?? '',
          model: editVehicle.model ?? '',
          year: String(editVehicle.year ?? new Date().getFullYear()),
          type: editVehicle.type ?? 'car',
          status: editVehicle.status ?? 'active',
          fuelType: editVehicle.fuelType ?? 'gasoline',
          currentMileage:
            editVehicle.currentMileage != null ? String(editVehicle.currentMileage) : '',
          nextServiceAt:
            editVehicle.nextServiceAt != null ? String(editVehicle.nextServiceAt) : '',
          insuranceExpiry: editVehicle.insuranceExpiry
            ? editVehicle.insuranceExpiry.slice(0, 10)
            : '',
          inspectionExpiry: editVehicle.inspectionExpiry
            ? editVehicle.inspectionExpiry.slice(0, 10)
            : '',
          driverName: editVehicle.driverName ?? '',
          notes: editVehicle.notes ?? '',
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setErrors({});
    }
  }, [open, isEdit, editVehicle]);

  const set = (key: keyof VehicleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof VehicleFormData, string>> = {};
    if (!form.plateNumber.trim()) e.plateNumber = 'Plaka gereklidir';
    if (!form.brand.trim()) e.brand = 'Marka gereklidir';
    if (!form.model.trim()) e.model = 'Model gereklidir';
    if (!form.year || isNaN(Number(form.year))) e.year = 'Geçerli bir yıl girin';
    if (!form.type) e.type = 'Araç tipi gereklidir';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Vehicle>('/api/v1/vehicles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (_err, data) => {
      const newVehicle: Vehicle = { id: `local-${Date.now()}`, plateNumber: String(data.plateNumber ?? ''), brand: String(data.brand ?? ''), model: String(data.model ?? ''), year: Number(data.year ?? 0), type: String(data.type ?? 'van'), status: String(data.status ?? 'active'), fuelType: String(data.fuelType ?? 'diesel'), currentMileage: data.currentMileage ? Number(data.currentMileage) : undefined, nextServiceAt: data.nextServiceAt ? Number(data.nextServiceAt) : undefined, insuranceExpiry: data.insuranceExpiry ? String(data.insuranceExpiry) : undefined, inspectionExpiry: data.inspectionExpiry ? String(data.inspectionExpiry) : undefined, driverName: data.driverName ? String(data.driverName) : undefined };
      onLocalCreate?.(newVehicle);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put<Vehicle>(`/api/v1/vehicles/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (_err, { id, data }) => {
      const updated: Vehicle = { id, plateNumber: String(data.plateNumber ?? ''), brand: String(data.brand ?? ''), model: String(data.model ?? ''), year: Number(data.year ?? 0), type: String(data.type ?? 'van'), status: String(data.status ?? 'active'), fuelType: String(data.fuelType ?? 'diesel'), currentMileage: data.currentMileage ? Number(data.currentMileage) : undefined, nextServiceAt: data.nextServiceAt ? Number(data.nextServiceAt) : undefined, insuranceExpiry: data.insuranceExpiry ? String(data.insuranceExpiry) : undefined, inspectionExpiry: data.inspectionExpiry ? String(data.inspectionExpiry) : undefined, driverName: data.driverName ? String(data.driverName) : undefined };
      onLocalUpdate?.(updated);
      onClose();
    },
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      plateNumber: form.plateNumber.trim().toUpperCase(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      type: form.type,
      status: form.status,
      fuelType: form.fuelType,
      driverName: form.driverName.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (form.currentMileage) payload.currentMileage = Number(form.currentMileage);
    if (form.nextServiceAt) payload.nextServiceAt = Number(form.nextServiceAt);
    if (form.insuranceExpiry) payload.insuranceExpiry = form.insuranceExpiry;
    if (form.inspectionExpiry) payload.inspectionExpiry = form.inspectionExpiry;

    if (isEdit && editVehicle) {
      updateMutation.mutate({ id: editVehicle.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full mx-4 max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Kimlik Bilgileri */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Kimlik Bilgileri
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Plaka" required error={errors.plateNumber}>
                <input
                  className={inputClass}
                  value={form.plateNumber}
                  onChange={(e) => set('plateNumber', e.target.value.toUpperCase())}
                  placeholder="34 ABC 123"
                />
              </Field>
              <Field label="Araç Tipi" required error={errors.type}>
                <select
                  className={inputClass}
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                >
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marka" required error={errors.brand}>
                <input
                  className={inputClass}
                  value={form.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="Ford, Mercedes, Toyota..."
                />
              </Field>
              <Field label="Model" required error={errors.model}>
                <input
                  className={inputClass}
                  value={form.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="Transit, Sprinter, Hilux..."
                />
              </Field>
              <Field label="Yıl" required error={errors.year}>
                <input
                  type="number"
                  className={inputClass}
                  value={form.year}
                  onChange={(e) => set('year', e.target.value)}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                />
              </Field>
              <Field label="Yakıt Tipi">
                <select
                  className={inputClass}
                  value={form.fuelType}
                  onChange={(e) => set('fuelType', e.target.value)}
                >
                  {Object.entries(FUEL_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Durum & Sürücü */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Durum &amp; Sürücü
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Durum">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sürücü Adı">
                <input
                  className={inputClass}
                  value={form.driverName}
                  onChange={(e) => set('driverName', e.target.value)}
                  placeholder="Ad Soyad"
                />
              </Field>
            </div>
          </section>

          {/* Kilometre & Bakım */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Kilometre &amp; Bakım
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Güncel Kilometre">
                <input
                  type="number"
                  className={inputClass}
                  value={form.currentMileage}
                  onChange={(e) => set('currentMileage', e.target.value)}
                  placeholder="45000"
                  min={0}
                />
              </Field>
              <Field label="Sonraki Bakım (km)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.nextServiceAt}
                  onChange={(e) => set('nextServiceAt', e.target.value)}
                  placeholder="50000"
                  min={0}
                />
              </Field>
            </div>
          </section>

          {/* Süreli Belgeler */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Süreli Belgeler
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Sigorta Bitiş Tarihi">
                <input
                  type="date"
                  className={inputClass}
                  value={form.insuranceExpiry}
                  onChange={(e) => set('insuranceExpiry', e.target.value)}
                />
              </Field>
              <Field label="Muayene Bitiş Tarihi">
                <input
                  type="date"
                  className={inputClass}
                  value={form.inspectionExpiry}
                  onChange={(e) => set('inspectionExpiry', e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Notlar */}
          <Field label="Notlar">
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Araç hakkında ek bilgiler..."
            />
          </Field>

          {/* Mutation error */}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isBusy ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Araç Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: (v: Vehicle) => void }) {
  const statusCfg = STATUS_CONFIG[vehicle.status] ?? STATUS_CONFIG.inactive;
  const typeCfg = TYPE_CONFIG[vehicle.type] ?? TYPE_CONFIG.car;
  const StatusIcon = statusCfg.icon;
  const TypeIcon = typeCfg.icon;

  const maintenanceDue = isMaintenanceDue(vehicle);
  const nearService = isNearServiceWarning(vehicle);
  const insuranceDays = daysUntil(vehicle.insuranceExpiry);
  const inspectionDays = daysUntil(vehicle.inspectionExpiry);
  const insuranceWarning = insuranceDays !== null && insuranceDays <= 30;
  const inspectionWarning = inspectionDays !== null && inspectionDays <= 30;

  const remainingKm =
    vehicle.nextServiceAt != null && vehicle.currentMileage != null
      ? vehicle.nextServiceAt - vehicle.currentMileage
      : null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Top row: plate + maintenance indicator + edit */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-mono text-xl font-bold tracking-widest text-foreground">
            {vehicle.plateNumber}
          </span>
          {maintenanceDue && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
              <Wrench className="h-3 w-3" />
              Bakım Yaklaşıyor
            </span>
          )}
        </div>
        <button
          onClick={() => onEdit(vehicle)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          title="Düzenle"
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>

      {/* Brand / Model / Year */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="text-xs text-muted-foreground">{vehicle.year}</p>
      </div>

      {/* Driver */}
      {vehicle.driverName && (
        <p className="text-xs text-muted-foreground">
          Sürücü:{' '}
          <span className="font-medium text-foreground">{vehicle.driverName}</span>
        </p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            statusCfg.bg,
            statusCfg.color
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            typeCfg.bg,
            typeCfg.color
          )}
        >
          <TypeIcon className="h-3 w-3" />
          {typeCfg.label}
        </span>
        {vehicle.fuelType && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType}
          </span>
        )}
      </div>

      {/* Mileage */}
      {vehicle.currentMileage != null && (
        <div className="text-sm">
          <span className="font-medium text-foreground">Km:</span>{' '}
          <span className="text-muted-foreground">{formatNumber(vehicle.currentMileage)}</span>
          {vehicle.nextServiceAt != null && remainingKm != null && remainingKm > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              / Bakım: {formatNumber(vehicle.nextServiceAt)} km
            </span>
          )}
        </div>
      )}

      {/* Near service warning (orange) — within 5000 km of service */}
      {nearService && !maintenanceDue && remainingKm != null && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg px-2.5 py-1.5 border border-orange-200">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Bakıma {formatNumber(remainingKm)} km kaldı
        </div>
      )}

      {/* Maintenance due (orange/strong) */}
      {maintenanceDue && remainingKm != null && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-lg px-2.5 py-1.5 border border-orange-300">
          <Wrench className="h-3.5 w-3.5 flex-shrink-0" />
          {remainingKm <= 0
            ? 'Bakım zamanı geçti!'
            : `Bakıma ${formatNumber(remainingKm)} km kaldı`}
        </div>
      )}

      {/* Document expiry warnings */}
      {(insuranceWarning || inspectionWarning) && (
        <div className="space-y-1.5">
          {insuranceWarning && insuranceDays !== null && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-200">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Sigorta:{' '}
                {insuranceDays <= 0
                  ? 'Süresi doldu!'
                  : `${insuranceDays} gün içinde bitiyor`}
              </span>
              {vehicle.insuranceExpiry && (
                <span className="ml-auto text-red-400 whitespace-nowrap">
                  {formatDate(vehicle.insuranceExpiry)}
                </span>
              )}
            </div>
          )}
          {inspectionWarning && inspectionDays !== null && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-200">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Muayene:{' '}
                {inspectionDays <= 0
                  ? 'Süresi doldu!'
                  : `${inspectionDays} gün içinde bitiyor`}
              </span>
              {vehicle.inspectionExpiry && (
                <span className="ml-auto text-red-400 whitespace-nowrap">
                  {formatDate(vehicle.inspectionExpiry)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
      <div className={cn('rounded-lg p-2.5', iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', plateNumber: '34 ABC 001', brand: 'Mercedes-Benz', model: 'Actros', year: 2022, type: 'truck', status: 'active', fuelType: 'diesel', currentMileage: 145200, nextServiceAt: 150000, insuranceExpiry: '2026-12-31', inspectionExpiry: '2027-03-15', driverName: 'Hüseyin Koç' },
  { id: 'v2', plateNumber: '06 DEF 234', brand: 'Ford', model: 'Transit', year: 2021, type: 'van', status: 'active', fuelType: 'diesel', currentMileage: 88400, nextServiceAt: 90000, insuranceExpiry: '2026-09-30', inspectionExpiry: '2026-11-20', driverName: 'Sercan Yıldız' },
  { id: 'v3', plateNumber: '35 GHI 567', brand: 'Toyota', model: 'HiLux', year: 2023, type: 'car', status: 'maintenance', fuelType: 'gasoline', currentMileage: 32100, nextServiceAt: 40000, insuranceExpiry: '2027-06-15', inspectionExpiry: '2027-08-10' },
  { id: 'v4', plateNumber: '16 JKL 890', brand: 'Renault', model: 'Master', year: 2020, type: 'van', status: 'active', fuelType: 'diesel', currentMileage: 201500, nextServiceAt: 210000, insuranceExpiry: '2026-07-31', inspectionExpiry: '2026-09-05', driverName: 'Murat Can' },
  { id: 'v5', plateNumber: '41 MNO 111', brand: 'Iveco', model: 'Daily', year: 2019, type: 'van', status: 'inactive', fuelType: 'diesel', currentMileage: 312000, insuranceExpiry: '2026-05-31', inspectionExpiry: '2026-06-20' },
];

const MOCK_VEHICLE_STATS: VehicleStats = {
  total: 5,
  byStatus: [{ status: 'active', _count: 3 }, { status: 'maintenance', _count: 1 }, { status: 'inactive', _count: 1 }],
  byType: [{ type: 'truck', _count: 1 }, { type: 'van', _count: 3 }, { type: 'car', _count: 1 }],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  // 300 ms debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);

  const { data: rawVehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', statusFilter, typeFilter, debouncedSearch],
    queryFn: () =>
      api.get<Vehicle[]>('/api/v1/vehicles', {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
  });

  const { data: statsData } = useQuery<VehicleStats>({
    queryKey: ['vehicles', 'stats'],
    queryFn: () => api.get<VehicleStats>('/api/v1/vehicles/stats'),
  });

  const apiVehicles: Vehicle[] | null = rawVehicles !== undefined ? (Array.isArray(rawVehicles) ? rawVehicles : []) : null;
  const isLoading = vehiclesLoading && apiVehicles === null;
  const vehicles = apiVehicles ?? localVehicles.filter((v) => {
    if (statusFilter && v.status !== statusFilter) return false;
    if (typeFilter && v.type !== typeFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!v.plateNumber.toLowerCase().includes(q) && !v.brand.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const stats = (statsData as VehicleStats | undefined) ?? MOCK_VEHICLE_STATS;

  const openNew = () => {
    setEditVehicle(null);
    setModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditVehicle(null);
  };

  const getStatusCount = (status: string) =>
    stats?.byStatus.find((s) => s.status === status)?._count ?? 0;

  const hasFilters = !!(debouncedSearch || statusFilter || typeFilter);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Araç Filosu
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Araçları yönetin, bakım ve belge durumlarını takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              vehicles.map((v) => ({
                plateNumber: v.plateNumber,
                brand: v.brand,
                model: v.model,
                year: v.year,
                type: TYPE_CONFIG[v.type]?.label ?? v.type,
                status: STATUS_CONFIG[v.status]?.label ?? v.status,
                fuelType: v.fuelType,
                currentMileage: v.currentMileage ?? '',
                driverName: v.driverName ?? '',
                insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('tr-TR') : '',
                inspectionExpiry: v.inspectionExpiry ? new Date(v.inspectionExpiry).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'plateNumber', header: 'Plaka', width: 12 },
                { key: 'brand', header: 'Marka', width: 12 },
                { key: 'model', header: 'Model', width: 12 },
                { key: 'year', header: 'Yıl', width: 8 },
                { key: 'type', header: 'Tip', width: 12 },
                { key: 'status', header: 'Durum', width: 12 },
                { key: 'fuelType', header: 'Yakıt', width: 10 },
                { key: 'currentMileage', header: 'KM', width: 10 },
                { key: 'driverName', header: 'Sürücü', width: 18 },
                { key: 'insuranceExpiry', header: 'Sigorta Bitiş', width: 14 },
                { key: 'inspectionExpiry', header: 'Muayene Bitiş', width: 14 },
              ],
              'araclar',
              'Araç Filosu'
            )}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={openNew}
            className="flex-shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Araç Ekle
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Araç"
          value={stats?.total ?? 0}
          icon={Truck}
          iconClass="bg-primary/10 text-primary"
        />
        <StatCard
          label="Aktif"
          value={getStatusCount('active')}
          icon={CheckCircle}
          iconClass="bg-green-100 text-green-700"
        />
        <StatCard
          label="Bakımda"
          value={getStatusCount('maintenance')}
          icon={Wrench}
          iconClass="bg-yellow-100 text-yellow-700"
        />
        <StatCard
          label="Pasif"
          value={getStatusCount('inactive')}
          icon={XCircle}
          iconClass="bg-gray-100 text-gray-600"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            placeholder="Plaka, marka, model ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tüm Tipler</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Vehicle Grid ── */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">
          <Truck className="h-8 w-8 mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-sm">Araçlar yükleniyor...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="font-semibold text-lg mb-1">Araç bulunamadı</p>
          <p className="text-sm text-muted-foreground mb-5">
            {hasFilters
              ? 'Seçilen filtre kriterlerine uyan araç bulunmuyor.'
              : 'Filoya henüz araç eklenmemiş.'}
          </p>
          {!hasFilters && (
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              İlk Aracı Ekle
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mb-2">
            {vehicles.length} araç listeleniyor
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={openEdit} />
            ))}
          </div>
        </>
      )}

      {/* ── Modal ── */}
      <VehicleModal
        open={modalOpen}
        onClose={closeModal}
        editVehicle={editVehicle}
        onLocalCreate={(v) => setLocalVehicles((prev) => [...prev, v])}
        onLocalUpdate={(v) => setLocalVehicles((prev) => prev.map((x) => x.id === v.id ? v : x))}
      />
    </div>
  );
}
