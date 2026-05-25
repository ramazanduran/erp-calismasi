'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRoles, useDeleteRole } from '@/lib/api/hooks/use-roles';
import { RoleModal } from '@/components/modals/role-modal';

export default function RolesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);

  const { data: rolesData, isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  const roles = Array.isArray(rolesData) ? rolesData as Record<string, unknown>[] : [];

  const handleDelete = async (role: Record<string, unknown>) => {
    if (role.isSystem) {
      toast.error('Sistem rolleri silinemez');
      return;
    }
    if (!confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteRole.mutateAsync(role.id as string);
      toast.success('Rol silindi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rol Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Kullanıcı rollerini ve izinlerini yönetin</p>
        </div>
        <button
          onClick={() => { setEditData(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Rol
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Henüz rol tanımlanmamış</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {roles.map((role) => {
              const permissions = Array.isArray(role.permissions) ? role.permissions as string[] : [];
              const userCount = (role._count as Record<string, unknown>)?.users ?? 0;
              return (
                <div key={role.id as string} className="flex items-center justify-between px-4 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {role.isSystem ? (
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{role.name as string}</span>
                        {role.isSystem && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Sistem
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{role.slug as string}</span>
                        <span className="text-xs text-muted-foreground">{permissions.length} izin</span>
                        <span className="text-xs text-muted-foreground">{userCount as number} kullanıcı</span>
                      </div>
                      {permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {permissions.slice(0, 6).map((p) => (
                            <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                              {p}
                            </span>
                          ))}
                          {permissions.length > 6 && (
                            <span className="text-xs text-muted-foreground">+{permissions.length - 6} daha</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditData(role); setModalOpen(true); }}
                      title="Düzenle"
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      title={role.isSystem ? 'Sistem rolleri silinemez' : 'Sil'}
                      disabled={!!role.isSystem}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={editData as Record<string, unknown> & { permissions: string[] } | null}
      />
    </div>
  );
}
