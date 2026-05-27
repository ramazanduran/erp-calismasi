'use client';

import { useState, useMemo } from 'react';
import { PlusCircle, Shield, AlertTriangle, Heart, BookOpen, FileDown, Search, X, CheckCircle2 } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';

const RISK_LEVELS: Record<string, string> = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek', kritik: 'Kritik' };
const RISK_COLORS: Record<string, string> = { dusuk: 'bg-green-100 text-green-700', orta: 'bg-yellow-100 text-yellow-700', yuksek: 'bg-orange-100 text-orange-700', kritik: 'bg-red-100 text-red-700' };
const ACCIDENT_TYPES: Record<string, string> = { kaza: 'Kaza', ramak_kala: 'Ramak Kala', meslek_hastaligi: 'Meslek Hastalığı', tehlikeli_durum: 'Tehlikeli Durum' };
const STATUS_LABELS: Record<string, string> = { acik: 'Açık', inceleniyor: 'İnceleniyor', kapatildi: 'Kapatıldı', onaylandi: 'Onaylandı' };
const STATUS_COLORS: Record<string, string> = { acik: 'bg-blue-100 text-blue-700', inceleniyor: 'bg-yellow-100 text-yellow-700', kapatildi: 'bg-gray-100 text-gray-600', onaylandi: 'bg-green-100 text-green-700' };

type Tab = 'risks' | 'accidents' | 'health' | 'trainings';

interface Risk { id: string; department: string; description: string; riskLevel: string; likelihood?: number; impact?: number; actionPlan?: string; status: string; createdAt: string; }
interface Accident { id: string; accidentNo: string; type: string; department: string; summary: string; injuredPerson?: string; status: string; date: string; }
interface HealthCheck { id: string; employeeName: string; checkType: string; lastCheck?: string; nextCheck: string; result?: string; status: string; }
interface ISGTraining { id: string; title: string; participantCount: number; date: string; isMandatory: boolean; hasCertificate: boolean; }

function NewRiskModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ department: '', description: '', riskLevel: 'orta', likelihood: '', impact: '', actionPlan: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yeni Risk Kaydı</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, likelihood: form.likelihood ? +form.likelihood : undefined, impact: form.impact ? +form.impact : undefined }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Departman *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Risk Tanımı *</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Risk Seviyesi</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                {Object.entries(RISK_LEVELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Olasılık (1-5)</label>
              <input type="number" min="1" max="5" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Etki (1-5)</label>
              <input type="number" min="1" max="5" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Eylem Planı</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none" rows={2} value={form.actionPlan} onChange={(e) => setForm({ ...form, actionPlan: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewAccidentModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ date: '', type: 'kaza', department: '', summary: '', injuredPerson: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Kaza / Olay Bildirimi</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tarih *</label>
              <input type="date" className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Olay Türü</label>
              <select className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(ACCIDENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Departman *</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Olay Özeti *</label>
            <textarea className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Yaralı / Etkilenen Kişi</label>
            <input className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm" value={form.injuredPerson} onChange={(e) => setForm({ ...form, injuredPerson: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">İptal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Bildir</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HealthSafetyPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('risks');
  const [search, setSearch] = useState('');
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showAccidentModal, setShowAccidentModal] = useState(false);

  const { data: risks = [] } = useQuery<Risk[]>({ queryKey: ['isg-risks'], queryFn: () => api.get('/api/v1/hr/isg/risks') });
  const { data: accidents = [] } = useQuery<Accident[]>({ queryKey: ['isg-accidents'], queryFn: () => api.get('/api/v1/hr/isg/accidents') });
  const { data: healthChecks = [] } = useQuery<HealthCheck[]>({ queryKey: ['isg-health-checks'], queryFn: () => api.get('/api/v1/hr/isg/health-checks') });
  const { data: trainings = [] } = useQuery<ISGTraining[]>({ queryKey: ['isg-trainings'], queryFn: () => api.get('/api/v1/hr/isg/trainings') });

  const createRisk = useMutation({ mutationFn: (d: any) => api.post('/api/v1/hr/isg/risks', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['isg-risks'] }); setShowRiskModal(false); } });
  const createAccident = useMutation({ mutationFn: (d: any) => api.post('/api/v1/hr/isg/accidents', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['isg-accidents'] }); setShowAccidentModal(false); } });

  const filteredRisks = useMemo(() => {
    if (!search) return risks;
    const q = search.toLowerCase();
    return risks.filter((r) => r.department?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }, [risks, search]);

  const filteredAccidents = useMemo(() => {
    if (!search) return accidents;
    const q = search.toLowerCase();
    return accidents.filter((a) => a.accidentNo?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q) || a.department?.toLowerCase().includes(q));
  }, [accidents, search]);

  const filteredHealthChecks = useMemo(() => {
    if (!search) return healthChecks;
    const q = search.toLowerCase();
    return healthChecks.filter((h) => h.employeeName?.toLowerCase().includes(q) || h.checkType?.toLowerCase().includes(q));
  }, [healthChecks, search]);

  const filteredTrainings = useMemo(() => {
    if (!search) return trainings;
    const q = search.toLowerCase();
    return trainings.filter((t) => t.title?.toLowerCase().includes(q));
  }, [trainings, search]);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'risks', label: 'Risk Değerlendirme', icon: AlertTriangle },
    { key: 'accidents', label: 'Kaza / Olay Bildirimi', icon: Shield },
    { key: 'health', label: 'Sağlık Muayeneleri', icon: Heart },
    { key: 'trainings', label: 'İSG Eğitimleri', icon: BookOpen },
  ];

  const openRisks = risks.filter((r) => r.status === 'acik').length;
  const thisMonthAccidents = accidents.filter((a) => { const d = new Date(a.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const pendingHealth = healthChecks.filter((h) => h.status !== 'onaylandi').length;
  const activeActionPlans = risks.filter((r) => r.actionPlan && r.status !== 'kapatildi').length;

  return (
    <div className="space-y-6">
      {showRiskModal && <NewRiskModal onClose={() => setShowRiskModal(false)} onSave={(d) => createRisk.mutate(d)} />}
      {showAccidentModal && <NewAccidentModal onClose={() => setShowAccidentModal(false)} onSave={(d) => createAccident.mutate(d)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İş Sağlığı & Güvenliği</h1>
          <p className="text-muted-foreground mt-1">Risk değerlendirme, kaza bildirimi ve sağlık takibi</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'risks' && (
            <button onClick={() => setShowRiskModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              <PlusCircle className="h-4 w-4" /> Yeni Risk
            </button>
          )}
          {activeTab === 'accidents' && (
            <button onClick={() => setShowAccidentModal(true)} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium">
              <AlertTriangle className="h-4 w-4" /> Kaza Bildir
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Açık Risk Kayıtları',  value: openRisks,         icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950' },
          { label: 'Bu Ay Kazalar',         value: thisMonthAccidents, icon: Shield,        color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Bekleyen Muayeneler',   value: pendingHealth,      icon: Heart,         color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Aktif Eylem Planları',  value: activeActionPlans,  icon: BookOpen,      color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-950' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={cn('p-2 rounded-lg', card.bg)}><Icon className={cn('h-5 w-5', card.color)} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs + Search */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-52" />
            </div>
            <button
              onClick={() => {
                if (activeTab === 'risks') exportToExcel(
                  filteredRisks.map((r) => ({ departman: r.department, riskTanimi: r.description, riskSeviyesi: RISK_LEVELS[r.riskLevel] ?? r.riskLevel, olasilik: r.likelihood ?? '', etki: r.impact ?? '', eylemPlani: r.actionPlan ?? '', durum: STATUS_LABELS[r.status] ?? r.status, tarih: formatDate(r.createdAt) })),
                  [{ key: 'departman', header: 'Departman', width: 16 }, { key: 'riskTanimi', header: 'Risk Tanımı', width: 32 }, { key: 'riskSeviyesi', header: 'Risk Seviyesi', width: 14 }, { key: 'olasilik', header: 'Olasılık', width: 10 }, { key: 'etki', header: 'Etki', width: 10 }, { key: 'eylemPlani', header: 'Eylem Planı', width: 28 }, { key: 'durum', header: 'Durum', width: 12 }, { key: 'tarih', header: 'Tarih', width: 12 }],
                  'isg-riskler', 'Risk Değerlendirme'
                );
                if (activeTab === 'accidents') exportToExcel(
                  filteredAccidents.map((a) => ({ olayNo: a.accidentNo, tarih: a.date, tur: ACCIDENT_TYPES[a.type] ?? a.type, departman: a.department, ozet: a.summary, yaraliKisi: a.injuredPerson ?? '', durum: STATUS_LABELS[a.status] ?? a.status })),
                  [{ key: 'olayNo', header: 'Olay No', width: 14 }, { key: 'tarih', header: 'Tarih', width: 12 }, { key: 'tur', header: 'Tür', width: 18 }, { key: 'departman', header: 'Departman', width: 16 }, { key: 'ozet', header: 'Özet', width: 36 }, { key: 'yaraliKisi', header: 'Yaralı Kişi', width: 20 }, { key: 'durum', header: 'Durum', width: 14 }],
                  'isg-kazalar', 'Kaza/Olay Bildirimi'
                );
                if (activeTab === 'health') exportToExcel(
                  filteredHealthChecks.map((h) => ({ personel: h.employeeName, muayeneTuru: h.checkType, sonMuayene: h.lastCheck ? formatDate(h.lastCheck) : '', sonrakiMuayene: formatDate(h.nextCheck), sonuc: h.result ?? '', durum: STATUS_LABELS[h.status] ?? h.status })),
                  [{ key: 'personel', header: 'Personel', width: 22 }, { key: 'muayeneTuru', header: 'Muayene Türü', width: 18 }, { key: 'sonMuayene', header: 'Son Muayene', width: 14 }, { key: 'sonrakiMuayene', header: 'Sonraki Muayene', width: 14 }, { key: 'sonuc', header: 'Sonuç', width: 14 }, { key: 'durum', header: 'Durum', width: 12 }],
                  'isg-saglik-muayeneleri', 'Sağlık Muayeneleri'
                );
                if (activeTab === 'trainings') exportToExcel(
                  filteredTrainings.map((t) => ({ egitimAdi: t.title, katilimci: t.participantCount, tarih: formatDate(t.date), zorunlu: t.isMandatory ? 'Evet' : 'Hayır', sertifika: t.hasCertificate ? 'Var' : 'Yok' })),
                  [{ key: 'egitimAdi', header: 'Eğitim Adı', width: 30 }, { key: 'katilimci', header: 'Katılımcı', width: 12 }, { key: 'tarih', header: 'Tarih', width: 12 }, { key: 'zorunlu', header: 'Zorunlu mu', width: 12 }, { key: 'sertifika', header: 'Sertifika', width: 12 }],
                  'isg-egitimler', 'İSG Eğitimleri'
                );
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <FileDown className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {/* Risk Tab */}
          {activeTab === 'risks' && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Departman</th><th className="pb-3 font-medium">Risk Tanımı</th><th className="pb-3 font-medium">Risk Seviyesi</th><th className="pb-3 font-medium">Olasılık</th><th className="pb-3 font-medium">Etki</th><th className="pb-3 font-medium">Eylem Planı</th><th className="pb-3 font-medium">Durum</th>
              </tr></thead>
              <tbody>
                {filteredRisks.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Risk kaydı bulunamadı</td></tr>
                ) : filteredRisks.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3">{r.department}</td>
                    <td className="py-3 max-w-xs truncate">{r.description}</td>
                    <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', RISK_COLORS[r.riskLevel] ?? 'bg-gray-100 text-gray-600')}>{RISK_LEVELS[r.riskLevel] ?? r.riskLevel}</span></td>
                    <td className="py-3 text-center">{r.likelihood ?? '—'}</td>
                    <td className="py-3 text-center">{r.impact ?? '—'}</td>
                    <td className="py-3 max-w-xs truncate text-muted-foreground">{r.actionPlan ?? '—'}</td>
                    <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600')}>{STATUS_LABELS[r.status] ?? r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Accidents Tab */}
          {activeTab === 'accidents' && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Tarih</th><th className="pb-3 font-medium">Olay No</th><th className="pb-3 font-medium">Tür</th><th className="pb-3 font-medium">Departman</th><th className="pb-3 font-medium">Özet</th><th className="pb-3 font-medium">Yaralı Kişi</th><th className="pb-3 font-medium">Durum</th>
              </tr></thead>
              <tbody>
                {filteredAccidents.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Kaza / olay kaydı bulunamadı</td></tr>
                ) : filteredAccidents.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 text-muted-foreground">{a.date}</td>
                    <td className="py-3 font-medium text-primary">{a.accidentNo}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{ACCIDENT_TYPES[a.type] ?? a.type}</span></td>
                    <td className="py-3">{a.department}</td>
                    <td className="py-3 max-w-xs truncate">{a.summary}</td>
                    <td className="py-3 text-muted-foreground">{a.injuredPerson ?? '—'}</td>
                    <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600')}>{STATUS_LABELS[a.status] ?? a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Health Checks Tab */}
          {activeTab === 'health' && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Personel</th><th className="pb-3 font-medium">Muayene Türü</th><th className="pb-3 font-medium">Son Muayene</th><th className="pb-3 font-medium">Sonraki Muayene</th><th className="pb-3 font-medium">Sonuç</th><th className="pb-3 font-medium">Durum</th>
              </tr></thead>
              <tbody>
                {filteredHealthChecks.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Sağlık muayenesi kaydı bulunamadı</td></tr>
                ) : filteredHealthChecks.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-medium">{h.employeeName}</td>
                    <td className="py-3">{h.checkType}</td>
                    <td className="py-3 text-muted-foreground">{h.lastCheck ? formatDate(h.lastCheck) : '—'}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(h.nextCheck)}</td>
                    <td className="py-3">{h.result ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />{h.result}</span> : '—'}</td>
                    <td className="py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[h.status] ?? 'bg-gray-100 text-gray-600')}>{STATUS_LABELS[h.status] ?? h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Trainings Tab */}
          {activeTab === 'trainings' && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Eğitim Adı</th><th className="pb-3 font-medium">Katılımcı Sayısı</th><th className="pb-3 font-medium">Tarih</th><th className="pb-3 font-medium">Zorunlu mu</th><th className="pb-3 font-medium">Sertifika</th>
              </tr></thead>
              <tbody>
                {filteredTrainings.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">İSG eğitimi kaydı bulunamadı</td></tr>
                ) : filteredTrainings.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-medium">{t.title}</td>
                    <td className="py-3 text-center">{t.participantCount}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="py-3">{t.isMandatory ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Zorunlu</span> : <span className="text-xs text-muted-foreground">İsteğe Bağlı</span>}</td>
                    <td className="py-3">{t.hasCertificate ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
