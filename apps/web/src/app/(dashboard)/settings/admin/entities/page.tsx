'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Database,
  Layers,
  Info,
  Trash2,
  X,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Hash,
  Type,
  Calendar,
  List,
  CheckSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

type EntityField = {
  id: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  isSystem?: boolean;
};

type EntitySummary = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { fields?: number; records?: number };
};

type EntityDetail = EntitySummary & {
  fields: EntityField[];
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Metin',
  number: 'Sayı',
  date: 'Tarih',
  boolean: 'Evet/Hayır',
  select: 'Seçim Listesi',
};

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  boolean: <CheckSquare className="h-3.5 w-3.5" />,
  select: <List className="h-3.5 w-3.5" />,
};

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground';

const selectClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground';

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function NewEntityModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [slugTouched, setSlugTouched] = useState(false);

  const createEntity = useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/entities', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity oluşturuldu');
      onClose();
    },
    onError: () => toast.error('İşlem başarısız oldu'),
  });

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Ad ve slug zorunludur');
      return;
    }
    createEntity.mutate({ ...form, description: form.description || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg text-foreground">Yeni Entity</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Entity Adı *</label>
            <input
              className={inputClass}
              placeholder="Örn: Müşteri Başvurusu"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Slug *</label>
            <input
              className={`${inputClass} font-mono`}
              placeholder="musteri-basvurusu"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
              required
            />
            <p className="text-xs text-muted-foreground">Yalnızca küçük harf, rakam ve - kullanın</p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Açıklama</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Bu entity ne için kullanılacak?"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createEntity.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createEntity.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddFieldForm({
  onAdd,
  onCancel,
}: {
  onAdd: (field: Omit<EntityField, 'id' | 'isSystem'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    type: FieldType;
    required: boolean;
    defaultValue: string;
    options: string;
  }>({
    name: '',
    slug: '',
    type: 'text',
    required: false,
    defaultValue: '',
    options: '',
  });
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Alan adı ve slug zorunludur');
      return;
    }
    const opts =
      form.type === 'select' && form.options.trim()
        ? form.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    onAdd({
      name: form.name,
      slug: form.slug,
      type: form.type,
      required: form.required,
      defaultValue: form.defaultValue || undefined,
      options: opts,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 mt-3"
    >
      <p className="text-sm font-semibold text-foreground">Yeni Alan</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Alan Adı *</label>
          <input
            className={inputClass}
            placeholder="Telefon Numarası"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Slug *</label>
          <input
            className={`${inputClass} font-mono text-xs`}
            placeholder="telefon-numarasi"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
            }}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Tür *</label>
          <select
            className={selectClass}
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as FieldType }))}
          >
            {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Varsayılan Değer</label>
          <input
            className={inputClass}
            placeholder="Opsiyonel"
            value={form.defaultValue}
            onChange={(e) => setForm((prev) => ({ ...prev, defaultValue: e.target.value }))}
          />
        </div>
      </div>
      {form.type === 'select' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Seçenekler (virgülle ayırın)</label>
          <input
            className={inputClass}
            placeholder="Seçenek 1, Seçenek 2, Seçenek 3"
            value={form.options}
            onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Her seçeneği virgülle ayırın</p>
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, required: !prev.required }))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {form.required ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>
        <span className="text-xs font-medium text-foreground">Zorunlu Alan</span>
      </label>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Alan Ekle
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}

function EntityDetailPanel({ entityId }: { entityId: string }) {
  const qc = useQueryClient();
  const [showAddField, setShowAddField] = useState(false);

  const { data: entity, isLoading } = useQuery<EntityDetail>({
    queryKey: ['entities', entityId],
    queryFn: () => api.get(`/api/v1/entities/${entityId}`),
    enabled: !!entityId,
  });

  const addField = useMutation({
    mutationFn: (data: unknown) => api.post(`/api/v1/entities/${entityId}/fields`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities', entityId] });
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Alan eklendi');
      setShowAddField(false);
    },
    onError: () => toast.error('İşlem başarısız oldu'),
  });

  const deleteField = useMutation({
    mutationFn: (fieldId: string) =>
      api.delete(`/api/v1/entities/${entityId}/fields/${fieldId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities', entityId] });
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Alan silindi');
    },
    onError: () => toast.error('İşlem başarısız oldu'),
  });

  const handleDeleteField = async (field: EntityField) => {
    if (field.isSystem) {
      toast.error('Sistem alanları silinemez');
      return;
    }
    if (!confirm(`"${field.name}" alanını silmek istediğinize emin misiniz?`)) return;
    await deleteField.mutateAsync(field.id);
  };

  const handleAddField = (fieldData: Omit<EntityField, 'id' | 'isSystem'>) => {
    addField.mutate(fieldData);
  };

  if (isLoading) {
    return (
      <div className="flex-1 rounded-xl border border-border bg-card p-6 animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!entity) return null;

  const fields = entity.fields ?? [];
  const recordCount = entity._count?.records ?? 0;

  return (
    <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-5 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{entity.name}</h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{entity.slug}</p>
            {entity.description && (
              <p className="text-sm text-muted-foreground mt-1">{entity.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 text-xs font-medium">
              {fields.length} alan
            </span>
            <span className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium">
              {recordCount} kayıt
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Alanlar</h3>
          <button
            onClick={() => setShowAddField((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Alan Ekle
          </button>
        </div>

        {showAddField && (
          <AddFieldForm
            onAdd={handleAddField}
            onCancel={() => setShowAddField(false)}
          />
        )}

        {fields.length === 0 && !showAddField ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Layers className="h-7 w-7 mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Henüz alan tanımlanmamış</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              "Alan Ekle" butonuna tıklayarak alan ekleyin
            </p>
          </div>
        ) : fields.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Alan Adı</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tür</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Zorunlu</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Varsayılan</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Seçenekler</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr
                    key={field.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">{field.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{field.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {FIELD_TYPE_ICONS[field.type]}
                        {FIELD_TYPE_LABELS[field.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {field.required ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
                          Evet
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Hayır</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {field.defaultValue ?? <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {field.options && field.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {field.options.slice(0, 3).map((opt) => (
                            <span
                              key={opt}
                              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                            >
                              {opt}
                            </span>
                          ))}
                          {field.options.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{field.options.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteField(field)}
                        title={field.isSystem ? 'Sistem alanları silinemez' : 'Sil'}
                        disabled={!!field.isSystem || deleteField.isPending}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EntityListItem({
  entity,
  selected,
  onClick,
}: {
  entity: EntitySummary;
  selected: boolean;
  onClick: () => void;
}) {
  const fieldCount = entity._count?.fields ?? 0;
  const recordCount = entity._count?.records ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-4 py-3.5 transition-all ${
        selected
          ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/20 hover:bg-muted/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm truncate">{entity.name}</p>
          <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{entity.slug}</p>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 ml-2 transition-colors ${
            selected ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">{fieldCount} alan</span>
        <span className="text-muted-foreground">·</span>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {recordCount} kayıt
        </span>
      </div>
    </button>
  );
}

export default function EntitiesAdminPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: entitiesData, isLoading } = useQuery<EntitySummary[]>({
    queryKey: ['entities'],
    queryFn: () => api.get('/api/v1/entities'),
  });

  const entities: EntitySummary[] = Array.isArray(entitiesData) ? entitiesData : [];

  const filtered = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entity Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Dinamik veri yapıları oluşturun ve yönetin</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Entity
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3.5">
        <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Entity Builder Nedir?</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
            Dinamik veri yapıları oluşturarak ERP&apos;nizi özelleştirin. Her entity, özel alanlar
            ve doğrulama kurallarıyla kendi veri modelini tanımlar. Oluşturduğunuz entityler,
            formlar ve raporlarda kullanılabilir.
          </p>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        <div className="w-72 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Entity ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="flex gap-2 mt-1">
                    <div className="h-4 w-12 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Database className="h-7 w-7 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Sonuç bulunamadı' : 'Henüz entity yok'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((entity) => (
                <EntityListItem
                  key={entity.id}
                  entity={entity}
                  selected={selectedId === entity.id}
                  onClick={() => setSelectedId(entity.id)}
                />
              ))}
              <p className="text-xs text-muted-foreground text-center pt-1">
                {filtered.length} entity
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {selectedId ? (
            <EntityDetailPanel key={selectedId} entityId={selectedId} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-medium text-foreground">Entity Seçin</p>
              <p className="text-sm text-muted-foreground mt-1">
                Detayları görüntülemek için sol taraftan bir entity seçin
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                İlk Entity&apos;yi Oluştur
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewModal && <NewEntityModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
