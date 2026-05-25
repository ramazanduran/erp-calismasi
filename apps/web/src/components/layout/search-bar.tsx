'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, Package, ShoppingCart, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface SearchResult {
  customers: Array<{ id: string; name: string; code: string; email: string }>;
  products: Array<{ id: string; name: string; code: string; currentStock: number }>;
  orders: Array<{ id: string; orderNumber: string; status: string; totalAmount: number }>;
  employees: Array<{ id: string; firstName: string; lastName: string; position: string }>;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.get<SearchResult>('/api/v1/search', { q: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  const hasResults =
    results &&
    (results.customers.length > 0 ||
      results.products.length > 0 ||
      results.orders.length > 0 ||
      results.employees.length > 0);

  const openModal = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal]);

  function navigate(href: string) {
    closeModal();
    router.push(href);
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openModal}
        className="flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Ara... (Ctrl+K)</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-input bg-muted px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
          onClick={(e) => { if (!containerRef.current?.contains(e.target as Node)) closeModal(); }}
        >
          <div ref={containerRef} className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl mx-4">
            {/* Search Input */}
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Müşteri, ürün, sipariş veya personel ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeModal()}
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd
                className="text-xs text-muted-foreground cursor-pointer border border-input rounded px-1.5 py-0.5"
                onClick={closeModal}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {debouncedQuery.length < 2 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  En az 2 karakter girin
                </div>
              ) : !hasResults ? (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  "{debouncedQuery}" için sonuç bulunamadı
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* Customers */}
                  {(results?.customers ?? []).length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Müşteriler
                      </p>
                      {results!.customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/sales/customers/${c.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.code} · {c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {(results?.products ?? []).length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Ürünler
                      </p>
                      {results!.products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/inventory/products/${p.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center shrink-0">
                            <Package className="h-3.5 w-3.5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.code} · Stok: {p.currentStock}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Orders */}
                  {(results?.orders ?? []).length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5" /> Siparişler
                      </p>
                      {results!.orders.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => navigate(`/sales/orders/${o.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{o.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{o.status} · ₺{Number(o.totalAmount).toLocaleString('tr-TR')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Employees */}
                  {(results?.employees ?? []).length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Personeller
                      </p>
                      {results!.employees.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => navigate(`/hr/employees/${e.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{e.firstName} {e.lastName}</p>
                            <p className="text-xs text-muted-foreground">{e.position}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
