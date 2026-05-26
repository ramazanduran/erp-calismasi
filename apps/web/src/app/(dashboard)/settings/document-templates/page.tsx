'use client';

import { useState } from 'react';
import { PlusCircle, FileText, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

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
interface Template { id: string; name: string; type: string; description?: string; variables: TemplateVariable[]; isActive: boolean; _count?: { documents: number } }

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
          {/* Variables */}
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
              className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm"
            >
              <Eye className="h-4 w-4" />Önizle
            </button>
          </div>
          {/* Preview Frame */}
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

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document-templates', typeFilter],
    queryFn: () => api.get('/api/v1/document-templates', typeFilter ? { type: typeFilter } : undefined),
  });

  const { data: defaults = [] } = useQuery({
    queryKey: ['document-templates', 'defaults'],
    queryFn: () => api.get('/api/v1/document-templates/defaults'),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/document-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
  });

  const importDefault = useMutation({
    mutationFn: (tmpl: Record<string, unknown>) => api.post('/api/v1/document-templates', tmpl),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doküman Şablonları</h1>
          <p className="text-muted-foreground mt-1">Fatura, sözleşme ve diğer belge şablonları</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle className="h-4 w-4" />Yeni Şablon
        </button>
      </div>

      {/* Default Templates */}
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
                  className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />İçe Aktar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Tümü' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))].map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', typeFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : (templates as Template[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">Şablon bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">Hazır şablonlardan içe aktarın veya yeni şablon oluşturun</p>
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
                  <button onClick={() => setPreviewing(tmpl)} className="p-1 text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></button>
                  <button className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteTemplate.mutate(tmpl.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold mb-1">{tmpl.name}</h3>
              {tmpl.description && <p className="text-xs text-muted-foreground mb-3">{tmpl.description}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{(tmpl.variables as TemplateVariable[]).length} değişken</span>
                <span>{tmpl._count?.documents ?? 0} belge</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewing && <PreviewModal template={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
}
