'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, FileText,
  Download, Plus, Search, Calendar, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

type ComplianceStatus = 'compliant' | 'non_compliant' | 'in_progress' | 'not_applicable';
type ComplianceFramework = 'kvkk' | 'iso27001' | 'soc2' | 'iso9001' | 'gdpr';
type Tab = 'overview' | 'controls' | 'audits' | 'incidents';

interface ComplianceControl {
  id: string;
  controlId: string;
  framework: ComplianceFramework;
  category: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  owner: string;
  lastReviewed?: string;
  nextReview?: string;
  evidence?: string;
}

interface ComplianceAudit {
  id: string;
  framework: ComplianceFramework;
  auditDate: string;
  auditor: string;
  scope: string;
  result: 'passed' | 'failed' | 'conditional';
  findings: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  reportUrl?: string;
}

interface ComplianceIncident {
  id: string;
  incidentDate: string;
  title: string;
  framework: ComplianceFramework;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  description: string;
}

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  kvkk: 'KVKK',
  iso27001: 'ISO 27001',
  soc2: 'SOC 2',
  iso9001: 'ISO 9001',
  gdpr: 'GDPR',
};

const FRAMEWORK_COLORS: Record<ComplianceFramework, string> = {
  kvkk: 'bg-red-100 text-red-700',
  iso27001: 'bg-blue-100 text-blue-700',
  soc2: 'bg-purple-100 text-purple-700',
  iso9001: 'bg-green-100 text-green-700',
  gdpr: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  compliant: 'Uyumlu',
  non_compliant: 'Uyumsuz',
  in_progress: 'Devam Ediyor',
  not_applicable: 'Geçersiz',
};

const STATUS_COLORS: Record<ComplianceStatus, string> = {
  compliant: 'bg-green-100 text-green-700',
  non_compliant: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  not_applicable: 'bg-gray-100 text-gray-500',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const MOCK_CONTROLS: ComplianceControl[] = [
  { id: '1', controlId: 'KVKK-01', framework: 'kvkk', category: 'Veri İşleme', title: 'Açık Rıza Yönetimi', description: 'Kişisel verilerin işlenmesi için açık rıza alınması ve kayıt altına alınması.', status: 'compliant', owner: 'Hukuk', lastReviewed: '2026-04-01', nextReview: '2026-07-01', evidence: 'Rıza formu v3.2' },
  { id: '2', controlId: 'KVKK-02', framework: 'kvkk', category: 'Veri İşleme', title: 'Veri Minimizasyonu', description: 'Yalnızca gerekli minimum kişisel verinin toplanması ve işlenmesi.', status: 'compliant', owner: 'IT', lastReviewed: '2026-03-15', nextReview: '2026-06-15' },
  { id: '3', controlId: 'KVKK-03', framework: 'kvkk', category: 'Güvenlik', title: 'Teknik Güvenlik Önlemleri', description: 'Kişisel verilerin güvenliğini sağlamak için teknik önlemlerin alınması.', status: 'in_progress', owner: 'IT Güvenlik', lastReviewed: '2026-05-01', nextReview: '2026-08-01' },
  { id: '4', controlId: 'KVKK-04', framework: 'kvkk', category: 'Haklar', title: 'Veri Sahibi Başvuru Yönetimi', description: 'Kişisel veri sahiplerinin başvurularının 30 gün içinde yanıtlanması.', status: 'compliant', owner: 'Hukuk', lastReviewed: '2026-04-15' },
  { id: '5', controlId: 'KVKK-05', framework: 'kvkk', category: 'Aktarım', title: 'Yurt Dışı Veri Aktarımı', description: 'Kişisel verilerin yurt dışına aktarılması için gerekli şartların sağlanması.', status: 'not_applicable', owner: 'Hukuk' },
  { id: '6', controlId: 'ISO-A.9.1', framework: 'iso27001', category: 'Erişim Kontrolü', title: 'Erişim Kontrol Politikası', description: 'Bilgi sistemlerine erişim için politika ve prosedürlerin oluşturulması.', status: 'compliant', owner: 'IT Güvenlik', lastReviewed: '2026-03-01' },
  { id: '7', controlId: 'ISO-A.12.6', framework: 'iso27001', category: 'Açıklık Yönetimi', title: 'Teknik Açıklık Yönetimi', description: 'Sistemlerdeki teknik açıklıkların düzenli olarak taranması ve yamalanması.', status: 'in_progress', owner: 'IT Güvenlik', lastReviewed: '2026-05-10' },
  { id: '8', controlId: 'ISO-A.18.1', framework: 'iso27001', category: 'Uyumluluk', title: 'Yasal Gereklilikler', description: 'Geçerli yasal ve düzenleyici gereksinimlerin belirlenmesi ve uyum sağlanması.', status: 'compliant', owner: 'Hukuk' },
  { id: '9', controlId: 'SOC2-CC6', framework: 'soc2', category: 'Mantıksal Erişim', title: 'Mantıksal Erişim Kontrolleri', description: 'Sisteme yetkisiz erişimi önlemek için mantıksal erişim kontrollerinin uygulanması.', status: 'compliant', owner: 'IT Güvenlik' },
  { id: '10', controlId: 'SOC2-CC7', framework: 'soc2', category: 'İzleme', title: 'Sistem İzleme', description: 'Sistemlerin güvenlik olaylarına karşı sürekli izlenmesi.', status: 'in_progress', owner: 'IT' },
];

const MOCK_AUDITS: ComplianceAudit[] = [
  { id: '1', framework: 'kvkk', auditDate: '2026-03-15', auditor: 'Kurul Denetçisi', scope: 'Tüm Kişisel Veri İşleme Faaliyetleri', result: 'passed', findings: 2, status: 'completed' },
  { id: '2', framework: 'iso27001', auditDate: '2026-04-20', auditor: 'BSI Group', scope: 'Bilgi Güvenliği Yönetim Sistemi', result: 'conditional', findings: 5, status: 'completed' },
  { id: '3', framework: 'soc2', auditDate: '2026-06-10', auditor: 'Deloitte', scope: 'Güvenlik, Kullanılabilirlik, Gizlilik', result: 'passed', findings: 0, status: 'scheduled' },
  { id: '4', framework: 'iso9001', auditDate: '2026-05-30', auditor: 'TÜV Rheinland', scope: 'Kalite Yönetim Sistemi', result: 'passed', findings: 1, status: 'in_progress' },
];

const MOCK_INCIDENTS: ComplianceIncident[] = [
  { id: '1', incidentDate: '2026-05-12', title: 'Yetkisiz Veri Erişim Girişimi', framework: 'kvkk', severity: 'high', status: 'resolved', reportedBy: 'IT Güvenlik', description: 'Sistem loglarında yetkisiz erişim girişimi tespit edildi.' },
  { id: '2', incidentDate: '2026-04-28', title: 'E-posta Yanlış Yönlendirme', framework: 'kvkk', severity: 'medium', status: 'closed', reportedBy: 'Kullanıcı', description: 'Kişisel veri içeren e-posta yanlış alıcıya gönderildi.' },
  { id: '3', incidentDate: '2026-05-20', title: 'Güvenlik Yamacı Gecikme', framework: 'iso27001', severity: 'medium', status: 'investigating', reportedBy: 'IT', description: 'Kritik güvenlik yaması zamanında uygulanamadı.' },
];

interface NewIncidentModalProps { onClose: () => void; onSave: (data: Partial<ComplianceIncident>) => void; }
function NewIncidentModal({ onClose, onSave }: NewIncidentModalProps) {
  const [form, setForm] = useState({ title: '', framework: 'kvkk' as ComplianceFramework, severity: 'medium', description: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-5">Yeni Uyum Olayı</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Başlık</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Framework</label>
              <select value={form.framework} onChange={(e) => setForm({ ...form, framework: e.target.value as ComplianceFramework })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {(Object.keys(FRAMEWORK_LABELS) as ComplianceFramework[]).map((f) => (
                  <option key={f} value={f}>{FRAMEWORK_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Önem Seviyesi</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Açıklama</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">İptal</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Kaydet</button>
        </div>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState<ComplianceFramework | 'all'>('all');
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [expandedControls, setExpandedControls] = useState<string[]>([]);

  const { data: controls = MOCK_CONTROLS } = useQuery<ComplianceControl[]>({
    queryKey: ['compliance-controls'],
    queryFn: async () => {
      const res = await fetch('/api/v1/settings/compliance/controls');
      if (!res.ok) return MOCK_CONTROLS;
      return res.json();
    },
    initialData: MOCK_CONTROLS,
  });

  const { data: audits = MOCK_AUDITS } = useQuery<ComplianceAudit[]>({
    queryKey: ['compliance-audits'],
    queryFn: async () => {
      const res = await fetch('/api/v1/settings/compliance/audits');
      if (!res.ok) return MOCK_AUDITS;
      return res.json();
    },
    initialData: MOCK_AUDITS,
  });

  const { data: incidents = MOCK_INCIDENTS } = useQuery<ComplianceIncident[]>({
    queryKey: ['compliance-incidents'],
    queryFn: async () => {
      const res = await fetch('/api/v1/settings/compliance/incidents');
      if (!res.ok) return MOCK_INCIDENTS;
      return res.json();
    },
    initialData: MOCK_INCIDENTS,
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: Partial<ComplianceIncident>) => {
      const res = await fetch('/api/v1/settings/compliance/incidents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance-incidents'] }),
  });

  const filteredControls = useMemo(() => {
    let list = controls;
    if (frameworkFilter !== 'all') list = list.filter((c) => c.framework === frameworkFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.controlId.toLowerCase().includes(q));
    }
    return list;
  }, [controls, frameworkFilter, search]);

  const overview = useMemo(() => {
    const frameworks = Object.keys(FRAMEWORK_LABELS) as ComplianceFramework[];
    return frameworks.map((fw) => {
      const fwControls = controls.filter((c) => c.framework === fw);
      const compliant = fwControls.filter((c) => c.status === 'compliant').length;
      const total = fwControls.filter((c) => c.status !== 'not_applicable').length;
      const score = total > 0 ? Math.round((compliant / total) * 100) : 0;
      return { framework: fw, compliant, total, score };
    }).filter((f) => f.total > 0);
  }, [controls]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'controls', label: 'Kontroller' },
    { id: 'audits', label: 'Denetimler' },
    { id: 'incidents', label: 'Olaylar' },
  ];

  const toggleControl = (id: string) => setExpandedControls((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleExport = () => {
    const rows = filteredControls.map((c) => ({
      'Kontrol ID': c.controlId,
      'Framework': FRAMEWORK_LABELS[c.framework],
      'Kategori': c.category,
      'Başlık': c.title,
      'Durum': STATUS_LABELS[c.status],
      'Sorumlu': c.owner,
      'Son İnceleme': c.lastReviewed ?? '',
      'Sonraki İnceleme': c.nextReview ?? '',
    }));
    exportToExcel(rows, 'uyum-kontrolleri', 'Kontroller');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uyumluluk Yönetimi</h1>
          <p className="text-muted-foreground">KVKK, ISO 27001, SOC 2 ve diğer düzenleyici gereklilikler</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Excel
          </button>
          {activeTab === 'incidents' && (
            <button onClick={() => setShowNewIncident(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Yeni Olay
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Kontrol</p>
          <p className="mt-1 text-2xl font-bold">{controls.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Uyumlu</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{controls.filter((c) => c.status === 'compliant').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Devam Eden</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{controls.filter((c) => c.status === 'in_progress').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Açık Olay</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{incidents.filter((i) => i.status === 'open' || i.status === 'investigating').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overview.map(({ framework, compliant, total, score }) => (
            <div key={framework} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', FRAMEWORK_COLORS[framework])}>
                  {FRAMEWORK_LABELS[framework]}
                </span>
                <span className={cn('text-2xl font-bold', score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600')}>
                  {score}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div
                  className={cn('h-2 rounded-full transition-all', score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{compliant} / {total} kontrol uyumlu</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls Tab */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Kontrol ara..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex gap-2">
              {(['all', ...Object.keys(FRAMEWORK_LABELS)] as Array<ComplianceFramework | 'all'>).map((fw) => (
                <button key={fw} onClick={() => setFrameworkFilter(fw)}
                  className={cn('rounded-full px-3 py-1 text-sm font-medium transition-colors',
                    frameworkFilter === fw ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                  {fw === 'all' ? 'Tümü' : FRAMEWORK_LABELS[fw as ComplianceFramework]}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="w-8 p-3" />
                  <th className="px-4 py-3 text-left font-medium">Kontrol ID</th>
                  <th className="px-4 py-3 text-left font-medium">Framework</th>
                  <th className="px-4 py-3 text-left font-medium">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium">Başlık</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-left font-medium">Sorumlu</th>
                  <th className="px-4 py-3 text-left font-medium">Sonraki İnceleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredControls.map((control) => (
                  <>
                    <tr key={control.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleControl(control.id)}>
                      <td className="p-3 text-center text-muted-foreground">
                        {expandedControls.includes(control.id) ? <ChevronDown className="h-4 w-4 mx-auto" /> : <ChevronRight className="h-4 w-4 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{control.controlId}</td>
                      <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', FRAMEWORK_COLORS[control.framework])}>{FRAMEWORK_LABELS[control.framework]}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{control.category}</td>
                      <td className="px-4 py-3 font-medium">{control.title}</td>
                      <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[control.status])}>{STATUS_LABELS[control.status]}</span></td>
                      <td className="px-4 py-3">{control.owner}</td>
                      <td className="px-4 py-3 text-muted-foreground">{control.nextReview ? new Date(control.nextReview).toLocaleDateString('tr-TR') : '-'}</td>
                    </tr>
                    {expandedControls.includes(control.id) && (
                      <tr key={`${control.id}-expanded`}>
                        <td colSpan={8} className="px-8 py-4 bg-muted/20 text-sm">
                          <div className="space-y-2">
                            <p><span className="font-medium">Açıklama:</span> {control.description}</p>
                            {control.evidence && <p><span className="font-medium">Kanıt:</span> {control.evidence}</p>}
                            {control.lastReviewed && <p><span className="font-medium">Son İnceleme:</span> {new Date(control.lastReviewed).toLocaleDateString('tr-TR')}</p>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audits Tab */}
      {activeTab === 'audits' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Framework</th>
                <th className="px-4 py-3 text-left font-medium">Denetim Tarihi</th>
                <th className="px-4 py-3 text-left font-medium">Denetçi</th>
                <th className="px-4 py-3 text-left font-medium">Kapsam</th>
                <th className="px-4 py-3 text-left font-medium">Sonuç</th>
                <th className="px-4 py-3 text-left font-medium">Bulgular</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', FRAMEWORK_COLORS[audit.framework])}>{FRAMEWORK_LABELS[audit.framework]}</span></td>
                  <td className="px-4 py-3">{new Date(audit.auditDate).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3 font-medium">{audit.auditor}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{audit.scope}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                      audit.result === 'passed' ? 'bg-green-100 text-green-700' : audit.result === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                      {audit.result === 'passed' ? 'Geçti' : audit.result === 'failed' ? 'Başarısız' : 'Koşullu'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{audit.findings} bulgu</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                      audit.status === 'completed' ? 'bg-green-100 text-green-700' : audit.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                      {audit.status === 'completed' ? 'Tamamlandı' : audit.status === 'in_progress' ? 'Devam Ediyor' : 'Planlandı'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tarih</th>
                <th className="px-4 py-3 text-left font-medium">Başlık</th>
                <th className="px-4 py-3 text-left font-medium">Framework</th>
                <th className="px-4 py-3 text-left font-medium">Önem</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
                <th className="px-4 py-3 text-left font-medium">Bildiren</th>
                <th className="px-4 py-3 text-left font-medium">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(incident.incidentDate).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3 font-medium">{incident.title}</td>
                  <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', FRAMEWORK_COLORS[incident.framework])}>{FRAMEWORK_LABELS[incident.framework]}</span></td>
                  <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', SEVERITY_COLORS[incident.severity])}>{incident.severity === 'low' ? 'Düşük' : incident.severity === 'medium' ? 'Orta' : incident.severity === 'high' ? 'Yüksek' : 'Kritik'}</span></td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                      incident.status === 'closed' ? 'bg-gray-100 text-gray-600' : incident.status === 'resolved' ? 'bg-green-100 text-green-700' : incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
                      {incident.status === 'open' ? 'Açık' : incident.status === 'investigating' ? 'İnceleniyor' : incident.status === 'resolved' ? 'Çözüldü' : 'Kapatıldı'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{incident.reportedBy}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{incident.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewIncident && (
        <NewIncidentModal onClose={() => setShowNewIncident(false)} onSave={(data) => createIncidentMutation.mutate(data)} />
      )}
    </div>
  );
}
