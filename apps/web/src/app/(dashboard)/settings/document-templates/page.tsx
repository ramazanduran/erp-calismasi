'use client';

import { useState } from 'react';
import { PlusCircle, FileText, Eye, Edit2, Trash2, Download, Plus, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Fatura', order: 'Sipariş', contract: 'Sözleşme',
  quote: 'Teklif', receipt: 'Makbuz', letter: 'Yazı',
};

const TYPE_COLORS: Record<string, string> = {
  invoice: 'bg-blue-100 text-blue-700',
  order: 'bg-green-100 text-green-700',
  contract: 'bg-purple-100 text-purple-700',
  quote: 'bg-yellow-100 text-yellow-700',
  receipt: 'bg-orange-100 text-orange-700',
  letter: 'bg-gray-100 text-gray-700',
};

interface TemplateVariable { key: string; label: string; type: string }
interface Template { id: string; name: string; type: string; description?: string; htmlContent?: string; variables: TemplateVariable[]; isActive: boolean; _count?: { documents: number } }

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

function TemplateFormModal({ template, onClose, onSave }: {
  template: Partial<Template> | null;
  onClose: () => void;
  onSave: (data: Omit<Template, 'id' | '_count' | 'isActive'>) => Promise<void>;
}) {
  const isEdit = !!template?.id;
  const [name, setName] = useState(template?.name ?? '');
  const [type, setType] = useState(template?.type ?? 'invoice');
  const [description, setDescription] = useState(template?.description ?? '');
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent ?? '');
  const [variables, setVariables] = useState<TemplateVariable[]>(template?.variables ?? []);
  const [saving, setSaving] = useState(false);

  const addVariable = () => setVariables((v) => [...v, { key: '', label: '', type: 'string' }]);
  const removeVariable = (i: number) => setVariables((v) => v.filter((_, idx) => idx !== i));
  const updateVariable = (i: number, field: keyof TemplateVariable, value: string) => {
    setVariables((v) => v.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Şablon adı gereklidir'); return; }
    setSaving(true);
    try {
      await onSave({ name, type, description, htmlContent, variables });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">{isEdit ? 'Şablonu Düzenle' : 'Yeni Şablon'}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Şablon Adı *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Standart Fatura Şablonu" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tür *</label>
              <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Açıklama</label>
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Şablon açıklaması..." />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">HTML İçeriği</label>
            <textarea
              className={cn(inputClass, 'min-h-[200px] font-mono text-xs')}
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="<!DOCTYPE html><html>...</html>"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">Değişkenler için {'{{key}}'} sözdizimini kullanın</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Değişkenler</label>
              <button type="button" onClick={addVariable} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Ekle
              </button>
            </div>
            {variables.length === 0 && (
              <p className="text-xs text-muted-foreground">Değişken eklenmedi</p>
            )}
            {variables.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={cn(inputClass, 'flex-1')} placeholder="key (örn: customer_name)" value={v.key} onChange={(e) => updateVariable(i, 'key', e.target.value)} />
                <input className={cn(inputClass, 'flex-1')} placeholder="Etiket" value={v.label} onChange={(e) => updateVariable(i, 'label', e.target.value)} />
                <select className={cn(inputClass, 'w-28 shrink-0')} value={v.type} onChange={(e) => updateVariable(i, 'type', e.target.value)}>
                  <option value="string">Metin</option>
                  <option value="number">Sayı</option>
                  <option value="date">Tarih</option>
                  <option value="currency">Para</option>
                </select>
                <button type="button" onClick={() => removeVariable(i)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </form>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            İptal
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [vars, setVars] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const previewMut = useMutation({
    mutationFn: (variables: Record<string, string>) => api.post(`/api/v1/document-templates/${template.id}/preview`, { variables }),
    onSuccess: (data) => setPreview((data as { html: string }).html),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{template.name} - Önizleme</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm px-3 py-1.5 border border-border rounded-lg">Kapat</button>
        </div>
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-64 shrink-0 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Değişkenler</p>
            <div className="space-y-2">
              {template.variables.map((v) => (
                <div key={v.key}>
                  <label className="text-xs text-muted-foreground">{v.label}</label>
                  <input
                    className="w-full mt-0.5 rounded border border-border bg-background px-2 py-1.5 text-sm"
                    placeholder={`{{${v.key}}}`}
                    value={vars[v.key] ?? ''}
                    onChange={(e) => setVars((prev) => ({ ...prev, [v.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => previewMut.mutate(vars)}
              disabled={previewMut.isPending}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {previewMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Önizle
            </button>
          </div>
          <div className="flex-1 border border-border rounded-lg overflow-hidden">
            {preview ? (
              <iframe srcDoc={preview} className="w-full h-full" title="preview" sandbox="allow-same-origin" />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Değişkenleri doldurup önizle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentTemplatesPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [previewing, setPreviewing] = useState<Template | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document-templates', typeFilter],
    queryFn: () => api.get('/api/v1/document-templates', typeFilter ? { type: typeFilter } : undefined),
  });

  const { data: defaults = [] } = useQuery({
    queryKey: ['document-templates', 'defaults'],
    queryFn: () => api.get('/api/v1/document-templates/defaults'),
  });

  const createTemplate = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/v1/document-templates', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['document-templates'] }); toast.success('Şablon oluşturuldu'); },
    onError: () => toast.error('Şablon oluşturulamadı'),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/api/v1/document-templates/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['document-templates'] }); toast.success('Şablon güncellendi'); },
    onError: () => toast.error('Şablon güncellenemedi'),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/document-templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['document-templates'] }); toast.success('Şablon silindi'); },
    onError: () => toast.error('Şablon silinemedi'),
  });

  const importDefault = useMutation({
    mutationFn: (tmpl: Record<string, unknown>) => api.post('/api/v1/document-templates', tmpl),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['document-templates'] }); toast.success('Şablon içe aktarıldı'); },
  });

  const handleOpenEdit = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setFormOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleSave = async (data: Omit<Template, 'id' | '_count' | 'isActive'>) => {
    if (editingTemplate?.id) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, data: data as Record<string, unknown> });
    } else {
      await createTemplate.mutateAsync(data as Record<string, unknown>);
    }
  };

  const handleDelete = (tmpl: Template) => {
    if (!confirm(`"${tmpl.name}" şablonunu silmek istediğinize emin misiniz?`)) return;
    deleteTemplate.mutate(tmpl.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doküman Şablonları</h1>
          <p className="text-muted-foreground mt-1">Fatura, sözleşme ve diğer belge şablonları</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />Yeni Şablon
        </button>
      </div>

      {(defaults as Array<{ type: string; name: string; description: string }>).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Hazır Şablonlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(defaults as Array<{ type: string; name: string; description: string; htmlContent: string; variables: TemplateVariable[] }>).map((d) => (
              <div key={d.type} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
                <button
                  onClick={() => importDefault.mutate({ name: d.name, type: d.type, description: d.description, htmlContent: d.htmlContent, variables: d.variables })}
                  disabled={importDefault.isPending}
                  className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />İçe Aktar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Tümü' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))].map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', typeFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : (templates as Template[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Şablon bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">Hazır şablonlardan içe aktarın veya yeni şablon oluşturun</p>
          <button
            onClick={handleOpenNew}
            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <PlusCircle className="h-4 w-4" /> Yeni Şablon Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates as Template[]).map((tmpl) => (
            <div key={tmpl.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[tmpl.type] ?? 'bg-gray-100')}>
                  {TYPE_LABELS[tmpl.type] ?? tmpl.type}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPreviewing(tmpl)} title="Önizle" className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleOpenEdit(tmpl)} title="Düzenle" className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(tmpl)} title="Sil" className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold mb-1">{tmpl.name}</h3>
              {tmpl.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{tmpl.description}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                <span>{tmpl.variables.length} değişken</span>
                <span>{tmpl._count?.documents ?? 0} belge</span>
                <span className={cn('font-medium', tmpl.isActive ? 'text-green-600' : 'text-gray-400')}>
                  {tmpl.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={() => { setFormOpen(false); setEditingTemplate(null); }}
          onSave={handleSave}
        />
      )}

      {previewing && <PreviewModal template={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
}
