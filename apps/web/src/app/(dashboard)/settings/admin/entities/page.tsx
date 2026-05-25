import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Entity Builder' };

export default function EntitiesAdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Entity Builder</h1>
      <p className="text-muted-foreground mt-1">Dinamik veri yapıları oluşturun ve yönetin</p>
    </div>
  );
}
