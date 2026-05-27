'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  Users,
  Key,
  ChevronDown,
  ChevronUp,
  X,
  FileDown,
} from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { useRoles, useDeleteRole } from '@/lib/api/hooks/use-roles';
import { RoleModal } from '@/components/modals/role-modal';

type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
  permissions: string[];
  _count?: { users?: number };
};

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function PermissionChip({ perm, active }: { perm: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${
        active
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {perm}
    </span>
  );
}

const MODULE_COLORS: Record<string, string> = {
  dashboard: 'text-blue-600 dark:text-blue-400',
  sales: 'text-emerald-600 dark:text-emerald-400',
  inventory: 'text-amber-600 dark:text-amber-400',
  finance: 'text-purple-600 dark:text-purple-400',
  hr: 'text-rose-600 dark:text-rose-400',
  admin: 'text-red-600 dark:text-red-400',
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Gösterge Paneli',
  sales: 'Satış & CRM',
  inventory: 'Stok & Depo',
  finance: 'Finans',
  hr: 'İnsan Kaynakları',
  admin: 'Yönetici',
};

function groupPermissions(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const perm of permissions) {
    const module = perm.split('.')[0];
    if (!groups[module]) groups[module] = [];
    groups[module].push(perm);
  }
  return groups;
}

function PermissionsPanel({ role, onClose }: { role: Role; onClose: () => void }) {
  const groups = groupPermissions(role.permissions);
  const moduleKeys = Object.keys(groups);

  return (
    <div className="col-span-2 rounded-xl border border-primary/30 bg-card shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            {role.name} — İzinler Matrisi
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {role.permissions.length} izin
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">
        {moduleKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Bu rol için izin tanımlanmamış</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {moduleKeys.map((module) => (
              <div key={module} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      MODULE_COLORS[module] ?? 'text-muted-foreground'
                    }`}
                  >
                    {MODULE_LABELS[module] ?? module}
                  </span>
                  <span className="text-xs text-muted-foreground">({groups[module].length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {groups[module].map((perm) => (
                    <PermissionChip key={perm} perm={perm} active />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleCard({
  role,
  expanded,
  onExpand,
  onEdit,
  onDelete,
}: {
  role: Role;
  expanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const userCount = role._count?.users ?? 0;
  const permCount = role.permissions.length;
  const visiblePerms = role.permissions.slice(0, 8);
  const extraPerms = permCount - 8;

  return (
    <div
      className={`rounded-xl border bg-card shadow-sm transition-all ${
        expanded ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border hover:border-primary/20'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`mt-0.5 shrink-0 p-2 rounded-lg ${
                role.isSystem
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {role.isSystem ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{role.name}</span>
                {role.isSystem && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                    Sistem
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{role.slug}</p>
              {role.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{role.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              title="Düzenle"
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              title={role.isSystem ? 'Sistem rolleri silinemez' : 'Sil'}
              disabled={!!role.isSystem}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{userCount} kullanıcı</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{permCount} izin</span>
          </div>
        </div>

        {visiblePerms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {visiblePerms.map((p) => (
              <span
                key={p}
                className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground"
              >
                {p}
              </span>
            ))}
            {extraPerms > 0 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +{extraPerms} daha
              </span>
            )}
          </div>
        )}

        <button
          onClick={onExpand}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              İzinleri Gizle
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              İzinleri Görüntüle
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-24 bg-muted rounded-lg" />
        <div className="h-6 w-20 bg-muted rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-5 w-16 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}

export default function RolesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  const { data: rolesData, isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  const roles: Role[] = Array.isArray(rolesData)
    ? (rolesData as Role[])
    : [];

  const totalUsers = roles.reduce((acc, r) => acc + (r._count?.users ?? 0), 0);
  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      toast.error('Sistem rolleri silinemez');
      return;
    }
    if (!confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteRole.mutateAsync(role.id);
      toast.success('Rol silindi');
      if (expandedRoleId === role.id) setExpandedRoleId(null);
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleExpand = (roleId: string) => {
    setExpandedRoleId((prev) => (prev === roleId ? null : roleId));
  };

  const expandedRole = roles.find((r) => r.id === expandedRoleId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rol Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Kullanıcı rollerini ve izinlerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              roles.map((r) => ({
                name: r.name,
                slug: r.slug,
                description: r.description ?? '',
                isSystem: r.isSystem ? 'Evet' : 'Hayır',
                permissionCount: r.permissions.length,
                userCount: r._count?.users ?? 0,
              })),
              [
                { key: 'name', header: 'Rol Adı', width: 20 },
                { key: 'slug', header: 'Kod', width: 20 },
                { key: 'description', header: 'Açıklama', width: 30 },
                { key: 'isSystem', header: 'Sistem Rolü', width: 14 },
                { key: 'permissionCount', header: 'İzin Sayısı', width: 14 },
                { key: 'userCount', header: 'Kullanıcı Sayısı', width: 16 },
              ],
              'roller',
              'Roller'
            )}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => { setEditData(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Rol
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Toplam Rol" value={roles.length} sub="tanımlı rol" />
        <StatCard label="Sistem Rolleri" value={systemRoles.length} sub="değiştirilemez" />
        <StatCard label="Özel Roller" value={customRoles.length} sub="özelleştirilebilir" />
        <StatCard label="Toplam Kullanıcı" value={totalUsers} sub="rol atanmış" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-medium text-foreground">Henüz rol tanımlanmamış</p>
          <p className="text-sm text-muted-foreground mt-1">İlk rolü oluşturmak için "Yeni Rol" butonuna tıklayın</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              expanded={expandedRoleId === role.id}
              onExpand={() => handleExpand(role.id)}
              onEdit={() => { setEditData(role as unknown as Record<string, unknown>); setModalOpen(true); }}
              onDelete={() => handleDelete(role)}
            />
          ))}

          {expandedRole && (
            <PermissionsPanel
              role={expandedRole}
              onClose={() => setExpandedRoleId(null)}
            />
          )}
        </div>
      )}

      <RoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={editData as Record<string, unknown> & { permissions: string[] } | null}
      />
    </div>
  );
}
