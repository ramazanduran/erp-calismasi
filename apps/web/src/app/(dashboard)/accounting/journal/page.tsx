'use client';

import { useState } from 'react';
import { Plus, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useJournalEntries, usePostJournalEntry } from '@/lib/api/hooks';
import { JournalEntryModal } from '@/components/modals/journal-entry-modal';

export default function JournalPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [postedFilter, setPostedFilter] = useState<string>('all');

  const params: Record<string, unknown> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (postedFilter === 'posted') params.isPosted = true;
  if (postedFilter === 'draft') params.isPosted = false;

  const { data: entries, isLoading } = useJournalEntries(params);
  const postEntry = usePostJournalEntry();

  const handlePost = async (id: string) => {
    try {
      await postEntry.mutateAsync(id);
      toast.success('Kayıt işlendi');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const list = Array.isArray(entries) ? entries : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Yevmiye Defteri</h1>
            <p className="text-muted-foreground text-sm">Muhasebe yevmiye kayıtları</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Kayıt
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Başlangıç:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Bitiş:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={postedFilter}
          onChange={(e) => setPostedFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Tümü</option>
          <option value="posted">İşlenmiş</option>
          <option value="draft">Taslak</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Kayıt bulunamadı</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Kayıt No</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Açıklama</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tutar</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Durum</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((entry: any) => {
                const totalDebit = (entry.lines || []).reduce((s: number, l: any) => s + Number(l.debit), 0);
                return (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{entry.entryNumber}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-sm">{entry.description}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.isPosted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          İşlenmiş
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="h-3 w-3" />
                          Taslak
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!entry.isPosted && (
                        <button
                          onClick={() => handlePost(entry.id)}
                          disabled={postEntry.isPending}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          İşle
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <JournalEntryModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
