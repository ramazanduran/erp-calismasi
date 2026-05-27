'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Search,
  Download,
  Share2,
  History,
  Trash2,
  LayoutGrid,
  List,
  Upload,
  FolderOpen,
  Folder,
  FolderPlus,
  ChevronRight,
  FileDown,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/utils/excel-export';

// ─── Types ────────────────────────────────────────────────────────────────────

type FileType = 'pdf' | 'excel' | 'word' | 'image' | 'other';
type ViewMode = 'grid' | 'list';

interface Document {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadedBy: string;
  date: string;
  version: string;
  tags: string[];
  folder: string;
}

interface FolderNode {
  id: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FOLDERS: FolderNode[] = [
  { id: '', label: 'Tüm Dosyalar' },
  { id: 'sozlesmeler', label: 'Sözleşmeler' },
  { id: 'faturalar', label: 'Faturalar' },
  { id: 'teklifler', label: 'Teklifler' },
  { id: 'hr-belgeleri', label: 'HR Belgeleri' },
  { id: 'urun-dosyalari', label: 'Ürün Dosyaları' },
  { id: 'genel', label: 'Genel' },
];

const FILE_TYPE_LABELS: Record<string, string> = {
  '': 'Tümü',
  pdf: 'PDF',
  excel: 'Excel',
  word: 'Word',
  image: 'Görsel',
  other: 'Diğer',
};

const FILE_TYPE_FILTERS = ['', 'pdf', 'excel', 'word', 'image', 'other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileIcon({ type, size = 'md' }: { type: FileType; size?: 'sm' | 'md' | 'lg' }) {
  const cls = cn(
    size === 'sm' && 'h-4 w-4',
    size === 'md' && 'h-6 w-6',
    size === 'lg' && 'h-10 w-10'
  );
  if (type === 'pdf') return <FileText className={cn(cls, 'text-red-500')} />;
  if (type === 'excel') return <FileSpreadsheet className={cn(cls, 'text-green-600')} />;
  if (type === 'word') return <FileText className={cn(cls, 'text-blue-600')} />;
  if (type === 'image') return <Image className={cn(cls, 'text-purple-500')} />;
  return <File className={cn(cls, 'text-muted-foreground')} />;
}

// ─── New Folder Modal ─────────────────────────────────────────────────────────

function NewFolderModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Klasör</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave(name.trim());
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Klasör Adı *</label>
            <input
              className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Klasör adını girin..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── File Actions ─────────────────────────────────────────────────────────────

function FileActions({ doc }: { doc: Document }) {
  return (
    <div className="flex items-center gap-1">
      <button
        title="İndir"
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <button
        title="Paylaş"
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        title="Versiyon Geçmişi"
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <History className="h-3.5 w-3.5" />
      </button>
      <button
        title="Sil"
        className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function FileCard({ doc }: { doc: Document }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <FileIcon type={doc.type} size="lg" />
        <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
          v{doc.version}
        </span>
      </div>
      <p className="text-sm font-semibold leading-tight mb-1 line-clamp-2">{doc.name}</p>
      <p className="text-xs text-muted-foreground mb-3">{doc.size}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {doc.tags?.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{doc.uploadedBy}</span>
        <span>{doc.date ? new Date(doc.date).toLocaleDateString('tr-TR') : '—'}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <FileActions doc={doc} />
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function FileRow({ doc }: { doc: Document }) {
  return (
    <tr className="hover:bg-muted/30 transition-colors group cursor-pointer">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileIcon type={doc.type} size="sm" />
          <span className="text-sm font-medium">{doc.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{doc.size}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{doc.uploadedBy}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {doc.date ? new Date(doc.date).toLocaleDateString('tr-TR') : '—'}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
          v{doc.version}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {doc.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <FileActions doc={doc} />
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [selectedFolder, setSelectedFolder] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [extraFolders, setExtraFolders] = useState<FolderNode[]>([]);

  const { data: docsData, isLoading } = useQuery({
    queryKey: ['documents', { folder: selectedFolder, search, type: typeFilter }],
    queryFn: () =>
      api.get('/api/v1/documents', {
        ...(selectedFolder ? { folder: selectedFolder } : {}),
        ...(search ? { search } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: () => api.get('/api/v1/documents/stats'),
  });

  const stats = statsData as any;
  const allDocs = (docsData as Document[] | undefined) ?? [];

  const filteredDocs = useMemo(() => {
    let list = allDocs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.uploadedBy?.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (typeFilter) list = list.filter((d) => d.type === typeFilter);
    if (selectedFolder) list = list.filter((d) => d.folder === selectedFolder);
    return list;
  }, [allDocs, search, typeFilter, selectedFolder]);

  const allFolders = useMemo(() => [...FOLDERS, ...extraFolders], [extraFolders]);

  const statCards = [
    {
      label: 'Toplam Doküman',
      value: stats?.total ?? '—',
    },
    {
      label: 'Bu Ay Yüklenen',
      value: stats?.uploadedThisMonth ?? '—',
    },
    {
      label: 'Paylaşılan',
      value: stats?.shared ?? '—',
    },
    {
      label: 'Versiyon Bekleyen',
      value: stats?.pendingVersion ?? '—',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doküman Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dosyalar, sözleşmeler ve belgeler</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToExcel(
                filteredDocs.map((d) => ({
                  name: d.name,
                  type: FILE_TYPE_LABELS[d.type] ?? d.type,
                  size: d.size,
                  uploadedBy: d.uploadedBy,
                  date: d.date ? new Date(d.date).toLocaleDateString('tr-TR') : '',
                  version: d.version,
                  tags: d.tags?.join(', ') ?? '',
                  folder: allFolders.find((f) => f.id === d.folder)?.label ?? d.folder,
                })),
                [
                  { key: 'name', header: 'Dosya Adı', width: 32 },
                  { key: 'type', header: 'Tür', width: 10 },
                  { key: 'size', header: 'Boyut', width: 10 },
                  { key: 'uploadedBy', header: 'Yükleyen', width: 18 },
                  { key: 'date', header: 'Tarih', width: 12 },
                  { key: 'version', header: 'Versiyon', width: 10 },
                  { key: 'tags', header: 'Etiketler', width: 20 },
                  { key: 'folder', header: 'Klasör', width: 16 },
                ],
                'dokuman-listesi',
                'Doküman Listesi'
              )
            }
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <label className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            Dosya Yükle
            <input type="file" multiple className="hidden" />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-0.5 text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Body: sidebar + main */}
      <div className="flex gap-4 items-start">
        {/* Folder Tree */}
        <aside className="w-52 shrink-0">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Klasörler
              </span>
              <button
                onClick={() => setShowNewFolder(true)}
                title="Yeni Klasör"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
            <nav className="py-1">
              {allFolders.map((folder) => {
                const isActive = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {isActive ? (
                      <FolderOpen className="h-4 w-4 shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate flex-1">{folder.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Dosya adı, yükleyen, etiket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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

            <div className="flex gap-1 flex-wrap">
              {FILE_TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    typeFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-muted'
                  )}
                >
                  {FILE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                title="Izgara görünümü"
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Liste görünümü"
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dropzone hint */}
          <label className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground hover:bg-muted/50 hover:border-primary/40 transition-colors cursor-pointer">
            <Upload className="h-5 w-5 shrink-0" />
            <span>Dosyaları buraya sürükleyin veya tıklayarak yükleyin</span>
            <input type="file" multiple className="hidden" />
          </label>

          {/* Document list/grid */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">Doküman bulunamadı</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || typeFilter || selectedFolder
                  ? 'Filtrelerinizi değiştirmeyi deneyin'
                  : 'İlk dosyanızı yükleyin'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <FileCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      {[
                        'Dosya',
                        'Boyut',
                        'Yükleyen',
                        'Tarih',
                        'Versiyon',
                        'Etiketler',
                        'İşlemler',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDocs.map((doc) => (
                      <FileRow key={doc.id} doc={doc} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">{filteredDocs.length} doküman</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onSave={(name) => {
            setExtraFolders((prev) => [
              ...prev,
              { id: name.toLowerCase().replace(/\s+/g, '-'), label: name },
            ]);
            setShowNewFolder(false);
          }}
        />
      )}
    </div>
  );
}
