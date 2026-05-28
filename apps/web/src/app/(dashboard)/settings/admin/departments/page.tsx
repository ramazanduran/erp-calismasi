'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Building2, ChevronRight, Users, Layers, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/lib/api/hooks/use-departments';
import { Modal } from '@/components/modals/modal';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Departman adı gereklidir'),
  description: z.string().optional().or(z.literal('')),
  parentId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const MOCK_DEPARTMENTS: Record<string, unknown>[] = [
  { id: 'd1', name: 'Yönetim', description: 'Üst yönetim', parentId: null, children: [], _count: { users: 3 } },
  { id: 'd2', name: 'Satış', description: 'Satış ve pazarlama', parentId: null, children: [
    { id: 'd2a', name: 'Yurt İçi Satış', description: '', parentId: 'd2', children: [], _count: { users: 5 } },
  ], _count: { users: 10 } },
  { id: 'd3', name: 'Finans', description: 'Muhasebe ve finans', parentId: null, children: [], _count: { users: 6 } },
  { id: 'd4', name: 'İnsan Kaynakları', description: 'İK ve eğitim', parentId: null, children: [], _count: { users: 4 } },
  { id: 'd5', name: 'Lojistik', description: 'Depo ve dağıtım', parentId: null, children: [], _count: { users: 8 } },
];

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function DepartmentRow({
  dept,
  level,
  allDepts,
  onEdit,
  onDelete,
}: {
  dept: Record<string, unknown>;
  level: number;
  allDepts: Record<string, unknown>[];
  onEdit: (d: Record<string, unknown>) => void;
  onDelete: (d: Record<string, unknown>) => void;
}) {
  const children = Array.isArray(dept.children) ? dept.children as Record<string, unknown>[] : [];
  const count = (dept._count as Record<string, unknown>)?.users ?? 0;

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{dept.name as string}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground text-sm">
          {(dept.description as string) ?? '-'}
        </td>
        <td className="px-4 py-3 text-center text-sm text-muted-foreground">
          {count as number} kişi
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(dept)}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(dept)}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {children.map((child) => (
        <DepartmentRow
          key={child.id as string}
          dept={child}
          level={level + 1}
          allDepts={allDepts}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

export default function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState('');

  const { data: deptsData, isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const departments = Array.isArray(deptsData) ? deptsData as Record<string, unknown>[] : (!isLoading ? MOCK_DEPARTMENTS : []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', parentId: '' },
  });

  const openModal = (dept?: Record<string, unknown>) => {
    if (dept) {
      setEditData(dept);
      reset({ name: dept.name as string, description: (dept.description as string) ?? '', parentId: (dept.parentId as string) ?? '' });
    } else {
      setEditData(null);
      reset({ name: '', description: '', parentId: '' });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, parentId: data.parentId || undefined, description: data.description || undefined };
      if (editData?.id) {
        await updateDept.mutateAsync({ id: editData.id as string, data: payload });
        toast.success('Departman güncellendi');
      } else {
        await createDept.mutateAsync(payload);
        toast.success('Departman oluşturuldu');
      }
      setModalOpen(false);
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleDelete = async (dept: Record<string, unknown>) => {
    if (!confirm(`"${dept.name}" departmanını silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteDept.mutateAsync(dept.id as string);
      toast.success('Departman silindi');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'İşlem başarısız oldu');
    }
  };

  // Flatten all depts for parent select
  const allFlat: Record<string, unknown>[] = [];
  const flatten = (list: Record<string, unknown>[]) => {
    list.forEach((d) => {
      allFlat.push(d);
      const children = Array.isArray(d.children) ? d.children as Record<string, unknown>[] : [];
      flatten(children);
    });
  };
  flatten(departments);

  const deptStats = useMemo(() => {
    const total = allFlat.length;
    const topLevel = departments.length;
    const subDepts = total - topLevel;
    const totalEmployees = allFlat.reduce((s, d) => s + (Number((d._count as Record<string, unknown>)?.users ?? 0)), 0);
    return { total, topLevel, subDepts, totalEmployees };
  }, [allFlat, departments]);

  const searchedFlat = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    return allFlat.filter((d) => (d.name as string)?.toLowerCase().includes(q));
  }, [allFlat, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departman Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Organizasyon yapısını ve departmanları yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              departments.map((d) => ({
                name: d.name as string ?? '',
                description: d.description as string ?? '',
                parentName: (d.parent as Record<string, unknown> | undefined)?.name as string ?? '',
                employeeCount: (d._count as Record<string, unknown> | undefined)?.employees as number ?? 0,
              })),
              [
                { key: 'name', header: 'Departman Adı', width: 24 },
                { key: 'description', header: 'Açıklama', width: 30 },
                { key: 'parentName', header: 'Üst Departman', width: 22 },
                { key: 'employeeCount', header: 'Çalışan Sayısı', width: 14 },
              ],
              'departmanlar',
              'Departmanlar'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Departman
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Departman', value: deptStats.total, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Ana Departman', value: deptStats.topLevel, icon: Layers, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Alt Departman', value: deptStats.subDepts, icon: ChevronRight, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
          { label: 'Toplam Çalışan', value: deptStats.totalEmployees, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold mt-0.5">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Departman adı..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Departman</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Açıklama</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Çalışan</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="animate-pulse bg-muted rounded h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : searchedFlat !== null ? (
                searchedFlat.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      <p>Arama sonucu bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  searchedFlat.map((dept) => (
                    <DepartmentRow
                      key={dept.id as string}
                      dept={dept}
                      level={0}
                      allDepts={allFlat}
                      onEdit={openModal}
                      onDelete={handleDelete}
                    />
                  ))
                )
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Henüz departman oluşturulmamış</p>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <DepartmentRow
                    key={dept.id as string}
                    dept={dept}
                    level={0}
                    allDepts={allFlat}
                    onEdit={openModal}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Departman Düzenle' : 'Yeni Departman'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Departman Adı *" error={errors.name?.message}>
            <input {...register('name')} className={inputClass} placeholder="Yazılım Geliştirme" />
          </Field>

          <Field label="Açıklama" error={errors.description?.message}>
            <input {...register('description')} className={inputClass} placeholder="Departman açıklaması..." />
          </Field>

          <Field label="Üst Departman" error={errors.parentId?.message}>
            <select {...register('parentId')} className={inputClass}>
              <option value="">Ana Departman (Üst Yok)</option>
              {allFlat
                .filter((d) => d.id !== editData?.id)
                .map((d) => (
                  <option key={d.id as string} value={d.id as string}>
                    {d.name as string}
                  </option>
                ))}
            </select>
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Kaydediliyor...' : editData ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
