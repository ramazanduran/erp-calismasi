'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, CheckSquare, XCircle, AlertTriangle, ClipboardList, Eye, FileDown, Search, CheckCircle2 } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Beklemede',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  in_progress: { label: 'Devam Ediyor', color: 'text-blue-600',   bg: 'bg-blue-100' },
  passed:      { label: 'Geçti',        color: 'text-green-600',  bg: 'bg-green-100' },
  failed:      { label: 'Başarısız',    color: 'text-red-600',    bg: 'bg-red-100' },
  conditional: { label: 'Koşullu',      color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

const TYPE_LABELS: Record<string, string> = {
  incoming:   'Gelen Malzeme',
  in_process: 'Proses İçi',
  final:      'Final',
  supplier:   'Tedarikçi',
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'Kritik',   color: 'text-red-600' },
  major:    { label: 'Major',    color: 'text-orange-600' },
  minor:    { label: 'Minor',    color: 'text-yellow-600' },
  cosmetic: { label: 'Kozmetik', color: 'text-gray-500' },
};

interface CheckItem {
  id: string;
  criterion: string;
  checkType: string;
  expectedValue?: string;
  actualValue?: string;
  result?: 'pass' | 'fail' | 'na';
}

interface Defect {
  id: string;
  title: string;
  severity: string;
  quantity: number;
  status: 'open' | 'resolved';
  category?: string;
}

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: string;
  status: string;
  passCount: number;
  failCount: number;
  scheduledAt: string;
  completedAt?: string;
  productName: string;
  productCode: string;
  inspectorName: string;
  sampleSize: number;
  checkItems: CheckItem[];
  defects: Defect[];
}

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: 'i1', inspectionNumber: 'KM-2026-0041', type: 'incoming', status: 'passed',
    passCount: 12, failCount: 0, scheduledAt: '2026-05-27', productName: 'Alüminyum Profil 40x40',
    productCode: 'ALU-4040', inspectorName: 'Dilek Yılmaz', sampleSize: 12,
    checkItems: [
      { id: 'c1', criterion: 'Boyut Kontrolü', checkType: 'measurement', expectedValue: '40±0.1mm', actualValue: '40.05mm', result: 'pass' },
      { id: 'c2', criterion: 'Yüzey Kalitesi', checkType: 'visual', result: 'pass' },
      { id: 'c3', criterion: 'Sertlik Testi', checkType: 'measurement', expectedValue: '60-65 HRB', actualValue: '62 HRB', result: 'pass' },
    ],
    defects: [],
  },
  {
    id: 'i2', inspectionNumber: 'KM-2026-0042', type: 'final', status: 'failed',
    passCount: 8, failCount: 4, scheduledAt: '2026-05-27', productName: 'Elektronik Kontrol Kartı',
    productCode: 'ELK-KK-001', inspectorName: 'Murat Şahin', sampleSize: 20,
    checkItems: [
      { id: 'c4', criterion: 'Fonksiyonel Test', checkType: 'functional', result: 'fail' },
      { id: 'c5', criterion: 'Görsel Muayene', checkType: 'visual', result: 'pass' },
      { id: 'c6', criterion: 'Voltaj Testi', checkType: 'measurement', expectedValue: '24V ±5%', actualValue: '26.5V', result: 'fail' },
    ],
    defects: [
      { id: 'd1', title: 'Voltaj Tolerans Aşımı', severity: 'major', quantity: 4, status: 'open', category: 'Elektrik' },
      { id: 'd2', title: 'Lehim Kusuru', severity: 'minor', quantity: 2, status: 'resolved', category: 'Üretim' },
    ],
  },
  {
    id: 'i3', inspectionNumber: 'KM-2026-0043', type: 'in_process', status: 'in_progress',
    passCount: 5, failCount: 1, scheduledAt: '2026-05-27', productName: 'CNC Freze Parçası',
    productCode: 'CNC-FRZ-044', inspectorName: 'Dilek Yılmaz', sampleSize: 10,
    checkItems: [
      { id: 'c7', criterion: 'Tolerans Kontrolü', checkType: 'measurement', expectedValue: 'H7', result: 'pass' },
      { id: 'c8', criterion: 'Yüzey Pürüzlülüğü', checkType: 'measurement', expectedValue: 'Ra 1.6', actualValue: 'Ra 2.1', result: 'fail' },
    ],
    defects: [
      { id: 'd3', title: 'Yüzey Pürüzlülüğü Aşıldı', severity: 'minor', quantity: 1, status: 'open' },
    ],
  },
  {
    id: 'i4', inspectionNumber: 'KM-2026-0044', type: 'supplier', status: 'conditional',
    passCount: 9, failCount: 3, scheduledAt: '2026-05-26', productName: 'Plastik Enjeksiyon Parça',
    productCode: 'PLT-ENJ-112', inspectorName: 'Kemal Acar', sampleSize: 30,
    checkItems: [
      { id: 'c9', criterion: 'Renk Uyumu', checkType: 'visual', result: 'pass' },
      { id: 'c10', criterion: 'Boyut Kontrolü', checkType: 'measurement', expectedValue: '85±0.5mm', result: 'conditional' as any },
    ],
    defects: [
      { id: 'd4', title: 'Renk Tonu Farklılığı', severity: 'cosmetic', quantity: 3, status: 'open', category: 'Görsel' },
    ],
  },
  {
    id: 'i5', inspectionNumber: 'KM-2026-0045', type: 'incoming', status: 'pending',
    passCount: 0, failCount: 0, scheduledAt: '2026-05-28', productName: 'Çelik Levha 3mm',
    productCode: 'CEL-3MM-007', inspectorName: 'Dilek Yılmaz', sampleSize: 5,
    checkItems: [
      { id: 'c11', criterion: 'Kalınlık Ölçümü', checkType: 'measurement', expectedValue: '3±0.15mm' },
      { id: 'c12', criterion: 'Yüzey Kusuru', checkType: 'visual' },
    ],
    defects: [],
  },
  {
    id: 'i6', inspectionNumber: 'KM-2026-0046', type: 'final', status: 'passed',
    passCount: 15, failCount: 0, scheduledAt: '2026-05-26', productName: 'Hidrolik Silindir',
    productCode: 'HID-SIL-033', inspectorName: 'Murat Şahin', sampleSize: 15,
    checkItems: [
      { id: 'c13', criterion: 'Basınç Testi', checkType: 'measurement', expectedValue: '250 bar', actualValue: '248 bar', result: 'pass' },
      { id: 'c14', criterion: 'Sızıntı Testi', checkType: 'functional', result: 'pass' },
    ],
    defects: [],
  },
];

function NewInspectionModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Inspection) => void }) {
  const [form, setForm] = useState({ type: 'incoming', productName: '', productCode: '', inspectorName: '', sampleSize: '10', notes: '' });
  const [checkItems, setCheckItems] = useState([{ criterion: '', checkType: 'visual', expectedValue: '' }]);

  const addItem = () => setCheckItems([...checkItems, { criterion: '', checkType: 'visual', expectedValue: '' }]);
  const removeItem = (i: number) => setCheckItems(checkItems.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInspection: Inspection = {
      id: `i${Date.now()}`,
      inspectionNumber: `KM-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      type: form.type,
      status: 'pending',
      passCount: 0, failCount: 0,
      scheduledAt: new Date().toISOString().split('T')[0],
      productName: form.productName,
      productCode: form.productCode,
      inspectorName: form.inspectorName,
      sampleSize: +form.sampleSize,
      checkItems: checkItems.filter((c) => c.criterion).map((c, i) => ({ id: `nc${i}`, ...c })),
      defects: [],
    };
    onSave(newInspection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Yeni Kalite Muayenesi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Muayene Tipi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Numune Boyutu</label>
              <input type="number" min="1" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.sampleSize} onChange={(e) => setForm({ ...form, sampleSize: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Ürün Adı *</label>
              <input required className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Ürün Kodu</label>
              <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Muayene Eden</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.inspectorName} onChange={(e) => setForm({ ...form, inspectorName: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Kontrol Kriterleri</label>
              <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">+ Ekle</button>
            </div>
            <div className="space-y-2">
              {checkItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input className="col-span-5 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Kriter" required value={item.criterion} onChange={(e) => setCheckItems(checkItems.map((c, idx) => idx === i ? { ...c, criterion: e.target.value } : c))} />
                  <select className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-sm" value={item.checkType} onChange={(e) => setCheckItems(checkItems.map((c, idx) => idx === i ? { ...c, checkType: e.target.value } : c))}>
                    <option value="visual">Görsel</option>
                    <option value="measurement">Ölçüm</option>
                    <option value="functional">Fonksiyonel</option>
                    <option value="document">Doküman</option>
                  </select>
                  <input className="col-span-3 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Beklenen" value={item.expectedValue} onChange={(e) => setCheckItems(checkItems.map((c, idx) => idx === i ? { ...c, expectedValue: e.target.value } : c))} />
                  <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-muted-foreground hover:text-destructive text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InspectionDetailModal({ inspection, onClose, onUpdate }: { inspection: Inspection; onClose: () => void; onUpdate: (updated: Inspection) => void }) {
  const [activeTab, setActiveTab] = useState<'checks' | 'defects'>('checks');
  const [local, setLocal] = useState(inspection);
  const [defectForm, setDefectForm] = useState({ title: '', severity: 'minor', quantity: '1', category: '' });

  const setResult = (itemId: string, result: 'pass' | 'fail' | 'na') => {
    const updated = {
      ...local,
      checkItems: local.checkItems.map((c) => c.id === itemId ? { ...c, result } : c),
    };
    const passCount = updated.checkItems.filter((c) => c.result === 'pass').length;
    const failCount = updated.checkItems.filter((c) => c.result === 'fail').length;
    const newStatus = failCount > 0 ? (passCount > 0 ? 'conditional' : 'failed') : passCount === updated.checkItems.length ? 'passed' : 'in_progress';
    const final = { ...updated, passCount, failCount, status: newStatus };
    setLocal(final);
    onUpdate(final);
  };

  const addDefect = () => {
    if (!defectForm.title) return;
    const updated = {
      ...local,
      defects: [...local.defects, { id: `d${Date.now()}`, ...defectForm, quantity: +defectForm.quantity, status: 'open' as const }],
    };
    setLocal(updated);
    onUpdate(updated);
    setDefectForm({ title: '', severity: 'minor', quantity: '1', category: '' });
  };

  const setStatus = (status: string) => {
    const updated = { ...local, status };
    setLocal(updated);
    onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{local.inspectionNumber}</h2>
            <p className="text-sm text-muted-foreground">{TYPE_LABELS[local.type]} · {local.productName}</p>
          </div>
          <div className="flex items-center gap-2">
            {(['passed', 'failed', 'conditional'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn('text-xs px-3 py-1.5 rounded-lg border',
                  local.status === s ? STATUS_CONFIG[s].bg + ' border-transparent ' + STATUS_CONFIG[s].color : 'border-border hover:bg-muted')}>
                {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 border-b border-border">
          {([['checks', `Kontroller (${local.checkItems.length})`], ['defects', `Hatalar (${local.defects.length})`]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('pb-2 text-sm font-medium', activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'checks' && (
          <div className="space-y-2">
            {local.checkItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.criterion}</p>
                  <p className="text-xs text-muted-foreground">{item.checkType}{item.expectedValue && ` · Beklenen: ${item.expectedValue}`}</p>
                </div>
                {item.actualValue && <span className="text-xs text-muted-foreground">{item.actualValue}</span>}
                <div className="flex gap-1">
                  {(['pass', 'fail', 'na'] as const).map((r) => (
                    <button key={r} onClick={() => setResult(item.id, r)}
                      className={cn('text-xs px-2 py-1 rounded',
                        item.result === r
                          ? r === 'pass' ? 'bg-green-100 text-green-700' : r === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          : 'border border-border hover:bg-muted')}>
                      {r === 'pass' ? '✓' : r === 'fail' ? '✗' : 'N/A'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'defects' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <input className="col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Hata başlığı" value={defectForm.title} onChange={(e) => setDefectForm({ ...defectForm, title: e.target.value })} />
              <select className="rounded border border-border bg-background px-2 py-1.5 text-sm" value={defectForm.severity} onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value })}>
                {Object.entries(SEVERITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
              <button onClick={addDefect} className="text-xs px-3 rounded bg-primary text-primary-foreground hover:bg-primary/90">Ekle</button>
            </div>
            {local.defects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Hata kaydı yok</p>
            ) : (
              local.defects.map((d) => {
                const sev = SEVERITY_CONFIG[d.severity];
                return (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <span className={cn('text-xs font-medium', sev?.color)}>[{sev?.label}]</span>
                    <div className="flex-1">
                      <p className="text-sm">{d.title}</p>
                      {d.category && <p className="text-xs text-muted-foreground">{d.category}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">x{d.quantity}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', d.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {d.status === 'resolved' ? 'Çözüldü' : 'Açık'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QualityControlPage() {
  const [inspections, setInspections] = useState<Inspection[]>(MOCK_INSPECTIONS);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = inspections.length;
    const passed = inspections.filter((i) => i.status === 'passed').length;
    const failed = inspections.filter((i) => i.status === 'failed').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, passRate };
  }, [inspections]);

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (typeFilter && i.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.inspectionNumber.toLowerCase().includes(q) &&
            !i.productName.toLowerCase().includes(q) &&
            !i.productCode.toLowerCase().includes(q) &&
            !i.inspectorName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [inspections, statusFilter, typeFilter, search]);

  const detailInspection = inspections.find((i) => i.id === detailId);

  const handleCreate = (newInspection: Inspection) => {
    setInspections((prev) => [newInspection, ...prev]);
    setShowForm(false);
  };

  const handleUpdate = (updated: Inspection) => {
    setInspections((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kalite Kontrol</h1>
          <p className="text-muted-foreground mt-1">Ürün ve süreç kalite muayeneleri</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              filtered.map((i) => ({
                no: i.inspectionNumber, tip: TYPE_LABELS[i.type], durum: STATUS_CONFIG[i.status]?.label,
                urun: i.productName, kod: i.productCode, muayeneci: i.inspectorName,
                gecen: i.passCount, basarisiz: i.failCount, tarih: i.scheduledAt,
              })),
              [
                { key: 'no', header: 'Muayene No', width: 14 },
                { key: 'tip', header: 'Tip', width: 16 },
                { key: 'durum', header: 'Durum', width: 14 },
                { key: 'urun', header: 'Ürün', width: 26 },
                { key: 'kod', header: 'Kod', width: 14 },
                { key: 'muayeneci', header: 'Muayeneci', width: 20 },
                { key: 'gecen', header: 'Geçen', width: 10 },
                { key: 'basarisiz', header: 'Başarısız', width: 10 },
                { key: 'tarih', header: 'Tarih', width: 12 },
              ],
              'kalite-kontrol', 'Kalite Kontrol'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <PlusCircle className="h-4 w-4" /> Yeni Muayene
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Muayene', value: stats.total, icon: ClipboardList, color: 'text-blue-600' },
          { label: 'Geçti', value: stats.passed, icon: CheckSquare, color: 'text-green-600' },
          { label: 'Başarısız', value: stats.failed, icon: XCircle, color: 'text-red-600' },
          { label: 'Geçiş Oranı', value: `%${stats.passRate}`, icon: CheckCircle2, color: stats.passRate >= 80 ? 'text-green-600' : 'text-yellow-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={cn('h-4 w-4', card.color)} />
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
            <p className={cn('text-2xl font-bold', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Muayene no, ürün veya muayeneci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[{ v: '', l: 'Tüm Durumlar' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', statusFilter === f.v ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {[{ v: '', l: 'Tüm Tipler' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ v, l }))].map((f) => (
            <button key={f.v} onClick={() => setTypeFilter(f.v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', typeFilter === f.v ? 'bg-secondary text-secondary-foreground' : 'border border-border hover:bg-muted')}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Muayene bulunamadı</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">Muayeneler ({filtered.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Numara', 'Tip', 'Durum', 'Ürün', 'Muayeneci', 'Geçen/Başarısız', 'Hata Sayısı', 'Tarih', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((ins) => {
                const sc = STATUS_CONFIG[ins.status];
                return (
                  <tr key={ins.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{ins.inspectionNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{TYPE_LABELS[ins.type]}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc?.bg, sc?.color)}>{sc?.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{ins.productName}</p>
                      <p className="text-xs text-muted-foreground">{ins.productCode}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ins.inspectorName}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-green-600">{ins.passCount}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-red-600">{ins.failCount}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{ins.defects.length}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ins.scheduledAt}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailId(ins.id)} className="p-1 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <NewInspectionModal onClose={() => setShowForm(false)} onSave={handleCreate} />}
      {detailId && detailInspection && (
        <InspectionDetailModal
          inspection={detailInspection}
          onClose={() => setDetailId(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
