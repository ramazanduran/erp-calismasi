export function exportToExcel(
  data: Record<string, unknown>[],
  columns: Array<{ key: string; header: string; width?: number }>,
  filename: string,
  sheetName = 'Veri',
) {
  // Build CSV with proper Excel formatting (xlsx library not required for basic export)
  const headers = columns.map(c => c.header);
  const rows = data.map(row => columns.map(c => {
    const val = row[c.key] ?? '';
    const str = String(val);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }));

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  // BOM for Excel UTF-8 compatibility
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
