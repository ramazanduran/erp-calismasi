'use client';

import { useState } from 'react';
import { BarChart3, PlusCircle, Play, Save, Trash2, Table } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface DataSource { key: string; label: string; fields: Array<{ key: string; label: string; type: string }> }
interface SavedReport { id: string; name: string; dataSource: string; chartType?: string; createdAt: string }
interface ReportData { data: Record<string, unknown>[]; total: number; dataSource: string }

function ReportChart({ data, chartType, columns }: { data: Record<string, unknown>[]; chartType: string; columns: string[] }) {
  const numericCol = columns.find((c) => typeof data[0]?.[c] === 'number') ?? columns[1];
  const labelCol = columns[0];

  if (!data.length) return <div className="py-8 text-center text-muted-foreground">Veri bulunamadı</div>;

  if (chartType === 'bar') return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.slice(0, 20)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelCol} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={numericCol ?? labelCol} fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  if (chartType === 'line') return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.slice(0, 20)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelCol} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey={numericCol ?? labelCol} stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (chartType === 'pie') return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data.slice(0, 6)} dataKey={numericCol ?? labelCol} nameKey={labelCol} cx="50%" cy="50%" outerRadius={100}>
          {data.slice(0, 6).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Legend /><Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  return null;
}

export default function CustomReportsPage() {
  const qc = useQueryClient();
  const [selectedSource, setSelectedSource] = useState('orders');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['orderNumber', 'totalAmount', 'status']);
  const [chartType, setChartType] = useState('table');
  const [reportName, setReportName] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedSaved, setSelectedSaved] = useState<string | null>(null);

  const { data: sources = [] } = useQuery({
    queryKey: ['custom-reports', 'sources'],
    queryFn: () => api.get('/api/v1/custom-reports/data-sources'),
  });

  const { data: savedReports = [] } = useQuery({
    queryKey: ['custom-reports', 'saved'],
    queryFn: () => api.get('/api/v1/custom-reports'),
  });

  const runReport = useMutation({
    mutationFn: (config: Record<string, unknown>) => api.post('/api/v1/custom-reports/run', config),
    onSuccess: (data) => setReportData(data as ReportData),
  });

  const saveReport = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/v1/custom-reports', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-reports', 'saved'] }),
  });

  const deleteReport = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/custom-reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-reports', 'saved'] }),
  });

  const dataSources = sources as DataSource[];
  const currentSource = dataSources.find((s) => s.key === selectedSource);
  const reports = savedReports as SavedReport[];

  const handleRun = () => {
    runReport.mutate({
      dataSource: selectedSource,
      columns: selectedColumns,
      filters: [],
      sortDir: 'desc',
      limit: 100,
    });
  };

  const handleSave = () => {
    if (!reportName) return;
    saveReport.mutate({
      name: reportName,
      dataSource: selectedSource,
      columns: selectedColumns,
      filters: [],
      chartType,
    });
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Özel Rapor Oluşturucu</h1>
          <p className="text-muted-foreground mt-1">Esnek raporlar ve görselleştirmeler oluşturun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Saved Reports */}
        <div className="xl:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Kayıtlı Raporlar</h2>
            {reports.length === 0 ? (
              <p className="text-xs text-muted-foreground">Henüz kayıtlı rapor yok</p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id}
                    className={cn('flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted', selectedSaved === r.id ? 'bg-muted' : '')}
                    onClick={() => setSelectedSaved(r.id === selectedSaved ? null : r.id)}>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.dataSource}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteReport.mutate(r.id); }} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Report Builder */}
        <div className="xl:col-span-3 space-y-4">
          {/* Config Panel */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Rapor Yapılandırması</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data Source */}
              <div>
                <label className="text-sm font-medium mb-1 block">Veri Kaynağı</label>
                <div className="space-y-1.5">
                  {dataSources.map((source) => (
                    <button key={source.key} onClick={() => { setSelectedSource(source.key); setSelectedColumns(source.fields.slice(0, 3).map((f) => f.key)); }}
                      className={cn('w-full text-left px-3 py-2 rounded-lg text-sm', selectedSource === source.key ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted')}>
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div>
                <label className="text-sm font-medium mb-1 block">Alanlar</label>
                <div className="space-y-1.5">
                  {currentSource?.fields.map((field) => (
                    <label key={field.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-2 py-1">
                      <input type="checkbox" checked={selectedColumns.includes(field.key)} onChange={() => toggleColumn(field.key)} />
                      <span>{field.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{field.type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Chart Type & Actions */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Görünüm</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'table', label: 'Tablo', icon: Table },
                      { value: 'bar', label: 'Çubuk', icon: BarChart3 },
                      { value: 'line', label: 'Çizgi', icon: BarChart3 },
                      { value: 'pie', label: 'Pasta', icon: BarChart3 },
                    ].map((ct) => (
                      <button key={ct.value} onClick={() => setChartType(ct.value)}
                        className={cn('flex items-center gap-1.5 justify-center px-2 py-2 rounded-lg text-xs font-medium border', chartType === ct.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                        <ct.icon className="h-3.5 w-3.5" />
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleRun} disabled={runReport.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  <Play className="h-4 w-4" />{runReport.isPending ? 'Çalışıyor...' : 'Raporu Çalıştır'}
                </button>
                <div className="flex gap-2">
                  <input className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm" placeholder="Rapor adı" value={reportName} onChange={(e) => setReportName(e.target.value)} />
                  <button onClick={handleSave} disabled={!reportName || saveReport.isPending}
                    className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          {reportData && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Sonuçlar</h2>
                <span className="text-xs text-muted-foreground">{reportData.total} kayıt</span>
              </div>

              {chartType !== 'table' && <ReportChart data={reportData.data} chartType={chartType} columns={selectedColumns} />}

              {chartType === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>{selectedColumns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {currentSource?.fields.find((f) => f.key === col)?.label ?? col}
                        </th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.data.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          {selectedColumns.map((col) => (
                            <td key={col} className="px-3 py-2 text-muted-foreground">
                              {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.data.length > 50 && (
                    <p className="text-xs text-muted-foreground p-3 text-center">İlk 50 kayıt gösteriliyor</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
