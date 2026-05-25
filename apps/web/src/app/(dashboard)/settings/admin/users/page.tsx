import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Kullanıcı Yönetimi' };

export default function UsersAdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
      <p className="text-muted-foreground mt-1">Sisteme kayıtlı kullanıcıları yönetin</p>
    </div>
  );
}
