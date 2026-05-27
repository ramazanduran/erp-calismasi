'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, KeyRound, ToggleLeft, ToggleRight, Pencil, Trash2, UserCircle, Users, UserCheck, UserX, Clock, FileDown } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { useUsers, useSetUserStatus, useDeleteUser, useResetUserPassword } from '@/lib/api/hooks/use-users';
import { UserModal } from '@/components/modals/user-modal';
import { Modal } from '@/components/modals/modal';
import { cn } from '@/lib/utils';

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function UsersAdminPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState<{ id: string; name: string } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const { data: usersResp, isLoading } = useUsers({ search: search || undefined, status: statusFilter || undefined });
  const setStatus = useSetUserStatus();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();

  const usersData = (usersResp as Record<string, unknown>) ?? {};
  const users = Array.isArray(usersData?.data) ? usersData.data as Record<string, unknown>[] : [];

  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentLogin = users.filter((u) => u.lastLoginAt && new Date(u.lastLoginAt as string).getTime() > thirtyDaysAgo).length;
    return { total, active, inactive, recentLogin };
  }, [users]);

  const handleToggleStatus = async (user: Record<string, unknown>) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await setStatus.mutateAsync({ id: user.id as string, status: newStatus });
      toast.success(newStatus === 'active' ? 'Kullanıcı aktifleştirildi' : 'Kullanıcı pasifleştirildi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success('Kullanıcı silindi');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordData) return;
    try {
      const result = await resetPassword.mutateAsync(resetPasswordData.id);
      const tempPw = (result as Record<string, unknown>)?.data?.tempPassword as string | undefined;
      setGeneratedPassword(tempPw ?? 'Şifre oluşturuldu');
    } catch {
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Sisteme kayıtlı kullanıcıları yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              users.map((u) => ({
                name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
                email: u.email as string ?? '',
                status: u.status === 'active' ? 'Aktif' : 'Pasif',
                role: u.role as string ?? '',
                lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt as string).toLocaleDateString('tr-TR') : '',
                createdAt: u.createdAt ? new Date(u.createdAt as string).toLocaleDateString('tr-TR') : '',
              })),
              [
                { key: 'name', header: 'Ad Soyad', width: 22 },
                { key: 'email', header: 'E-posta', width: 28 },
                { key: 'status', header: 'Durum', width: 10 },
                { key: 'role', header: 'Rol', width: 14 },
                { key: 'lastLoginAt', header: 'Son Giriş', width: 14 },
                { key: 'createdAt', header: 'Kayıt Tarihi', width: 14 },
              ],
              'kullanicilar',
              'Kullanıcılar'
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
            Yeni Kullanıcı
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Kullanıcı', value: userStats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Aktif', value: userStats.active, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Pasif', value: userStats.inactive, icon: UserX, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900' },
          { label: 'Son 30 Gün Aktif', value: userStats.recentLogin, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ad, soyad veya e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kullanıcı</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-posta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Departman</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Son Giriş</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <UserCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Henüz kullanıcı yok</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const role = user.role as Record<string, unknown> | undefined;
                  const dept = user.department as Record<string, unknown> | undefined;
                  const isActive = user.status === 'active';
                  return (
                    <tr key={user.id as string} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {user.firstName as string} {user.lastName as string}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email as string}</td>
                      <td className="px-4 py-3">
                        {role ? (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {role.name as string}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {dept ? (dept.name as string) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt as string).toLocaleDateString('tr-TR')
                          : 'Hiç giriş yapmadı'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            title={isActive ? 'Pasifleştir' : 'Aktifleştir'}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => { setResetPasswordData({ id: user.id as string, name: `${user.firstName} ${user.lastName}` }); setGeneratedPassword(null); }}
                            title="Şifre Sıfırla"
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setEditData(user); setModalOpen(true); }}
                            title="Düzenle"
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id as string)}
                            title="Sil"
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            {users.length} kullanıcı gösteriliyor
          </div>
        )}
      </div>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={editData as Record<string, string> | null}
      />

      {/* Reset Password Dialog */}
      {resetPasswordData && (
        <Modal
          open={!!resetPasswordData}
          onClose={() => { setResetPasswordData(null); setGeneratedPassword(null); }}
          title="Şifre Sıfırla"
          size="sm"
        >
          {generatedPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{resetPasswordData.name}</span> için geçici şifre oluşturuldu:
              </p>
              <div className="rounded-lg border border-border bg-muted p-3 text-center">
                <code className="text-lg font-mono font-bold text-foreground">{generatedPassword}</code>
              </div>
              <p className="text-xs text-muted-foreground">Kullanıcı bu şifreyi ilk girişte değiştirmelidir.</p>
              <div className="flex justify-end">
                <button
                  onClick={() => { setResetPasswordData(null); setGeneratedPassword(null); }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Tamam
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{resetPasswordData.name}</span> kullanıcısının şifresi sıfırlanacak. Devam etmek istiyor musunuz?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setResetPasswordData(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  İptal
                </button>
                <button
                  onClick={handleResetPassword}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Sıfırla
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
